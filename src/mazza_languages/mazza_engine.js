// Mazza Language State Engine & Advanced Gamification Manager
import { curriculumIngles } from './curriculum_ingles.js';
import { curriculumMandarim } from './curriculum_mandarim.js';

const STORAGE_KEY = 'quizmoz_mazza_language_v2';
const MAX_HEARTS = 5;

class MazzaEngine {
    constructor() {
        this.state = this.loadState();
    }

    loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                return {
                    activeLanguage: p.activeLanguage || null, // null = show 2 cards selector
                    unlockedLevels: p.unlockedLevels || { ingles: ['pre_a1'], mandarim: ['hsk1'] },
                    unlockedUnits: p.unlockedUnits || { ingles: ['u_en_0_1'], mandarim: ['u_zh_1_1'] },
                    completedLessons: p.completedLessons || { ingles: [], mandarim: [] },
                    lessonCrowns: p.lessonCrowns || {}, // { [lessonId]: 1..3 }
                    languageXP: p.languageXP || { ingles: 0, mandarim: 0 },
                    wordsLearned: p.wordsLearned || { ingles: {}, mandarim: {} }, // word dictionary
                    hearts: p.hearts !== undefined ? p.hearts : MAX_HEARTS,
                    lastHeartRestoreTime: p.lastHeartRestoreTime || Date.now(),
                    streakDays: p.streakDays || 1,
                    lastStudyDate: p.lastStudyDate || new Date().toISOString().slice(0, 10),
                    unitExamsPassed: p.unitExamsPassed || {}
                };
            }
        } catch (e) {
            console.warn('[MazzaEngine] Error loading state:', e);
        }

        return {
            activeLanguage: null,
            unlockedLevels: { ingles: ['pre_a1'], mandarim: ['hsk1'] },
            unlockedUnits: { ingles: ['u_en_0_1'], mandarim: ['u_zh_1_1'] },
            completedLessons: { ingles: [], mandarim: [] },
            lessonCrowns: {},
            languageXP: { ingles: 0, mandarim: 0 },
            wordsLearned: { ingles: {}, mandarim: {} },
            hearts: MAX_HEARTS,
            lastHeartRestoreTime: Date.now(),
            streakDays: 1,
            lastStudyDate: new Date().toISOString().slice(0, 10),
            unitExamsPassed: {}
        };
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn('[MazzaEngine] Failed to save state:', e);
        }
    }

    getCurriculum(langId) {
        const lang = langId || this.state.activeLanguage;
        return lang === 'mandarim' ? curriculumMandarim : curriculumIngles;
    }

    setActiveLanguage(langId) {
        this.state.activeLanguage = langId;
        this.saveState();
    }

    getHearts() {
        // Regenerate 1 heart every 30 minutes if below max
        const now = Date.now();
        const elapsed = now - (this.state.lastHeartRestoreTime || now);
        const heartsToAdd = Math.floor(elapsed / (30 * 60 * 1000));
        
        if (heartsToAdd > 0 && this.state.hearts < MAX_HEARTS) {
            this.state.hearts = Math.min(MAX_HEARTS, this.state.hearts + heartsToAdd);
            this.state.lastHeartRestoreTime = now;
            this.saveState();
        }
        return this.state.hearts;
    }

    loseHeart() {
        this.getHearts();
        if (this.state.hearts > 0) {
            this.state.hearts -= 1;
            this.state.lastHeartRestoreTime = Date.now();
            this.saveState();
        }
        return this.state.hearts;
    }

    refillHearts() {
        this.state.hearts = MAX_HEARTS;
        this.state.lastHeartRestoreTime = Date.now();
        this.saveState();
    }

    isLevelUnlocked(langId, levelCode, index) {
        if (index === 0) return true;
        const list = this.state.unlockedLevels[langId] || [];
        return list.includes(levelCode);
    }

    isUnitUnlocked(langId, unitId, unitIndex) {
        if (unitIndex === 0) return true;
        const list = this.state.unlockedUnits[langId] || [];
        return list.includes(unitId);
    }

    isLessonCompleted(langId, lessonId) {
        const list = this.state.completedLessons[langId] || [];
        return list.includes(lessonId);
    }

    getLessonCrowns(lessonId) {
        return this.state.lessonCrowns[lessonId] || 0;
    }

    recordLessonCompletion(langId, lessonId, flashcards = []) {
        if (!this.state.completedLessons[langId]) {
            this.state.completedLessons[langId] = [];
        }
        if (!this.state.completedLessons[langId].includes(lessonId)) {
            this.state.completedLessons[langId].push(lessonId);
        }

        // Increment crowns up to 3
        const currentCrowns = this.state.lessonCrowns[lessonId] || 0;
        this.state.lessonCrowns[lessonId] = Math.min(3, currentCrowns + 1);

        // Record vocabulary
        if (!this.state.wordsLearned[langId]) {
            this.state.wordsLearned[langId] = {};
        }
        flashcards.forEach(fc => {
            if (fc.palavra) {
                this.state.wordsLearned[langId][fc.palavra] = {
                    palavra: fc.palavra,
                    pinyin: fc.pinyin || '',
                    traducao: fc.traducao,
                    audio: fc.audio || fc.palavra,
                    level: (this.state.wordsLearned[langId][fc.palavra]?.level || 0) + 1,
                    lastStudied: new Date().toISOString()
                };
            }
        });

        // XP & streak
        const xpEarned = currentCrowns === 0 ? 60 : 25;
        this.state.languageXP[langId] = (this.state.languageXP[langId] || 0) + xpEarned;
        this.updateStreak();
        this.saveState();

        return { xpEarned, newCrowns: this.state.lessonCrowns[lessonId] };
    }

    unlockNextUnit(langId, currentLevelIdx, currentUnitIdx) {
        const curr = this.getCurriculum(langId);
        const level = curr.niveis[currentLevelIdx];
        if (!level) return null;

        // Next unit in same level
        const nextUnit = level.unidades[currentUnitIdx + 1];
        if (nextUnit) {
            if (!this.state.unlockedUnits[langId]) this.state.unlockedUnits[langId] = [];
            if (!this.state.unlockedUnits[langId].includes(nextUnit.id)) {
                this.state.unlockedUnits[langId].push(nextUnit.id);
                this.saveState();
                return { type: 'unit', data: nextUnit };
            }
        } else {
            // Next level
            const nextLevel = curr.niveis[currentLevelIdx + 1];
            if (nextLevel) {
                if (!this.state.unlockedLevels[langId]) this.state.unlockedLevels[langId] = [];
                if (!this.state.unlockedLevels[langId].includes(nextLevel.codigo)) {
                    this.state.unlockedLevels[langId].push(nextLevel.codigo);
                    if (nextLevel.unidades && nextLevel.unidades[0]) {
                        if (!this.state.unlockedUnits[langId]) this.state.unlockedUnits[langId] = [];
                        this.state.unlockedUnits[langId].push(nextLevel.unidades[0].id);
                    }
                    this.saveState();
                    return { type: 'level', data: nextLevel };
                }
            }
        }
        return null;
    }

    updateStreak() {
        const today = new Date().toISOString().slice(0, 10);
        const last = this.state.lastStudyDate;
        if (last !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (last === yesterday) {
                this.state.streakDays += 1;
            } else {
                this.state.streakDays = 1;
            }
            this.state.lastStudyDate = today;
            this.saveState();
        }
    }

    getLeague(xp) {
        if (xp >= 3000) return { name: 'Mestre Mazza', icon: '👑', color: '#FFD700' };
        if (xp >= 1500) return { name: 'Liga Safira', icon: '💎', color: '#00CEC9' };
        if (xp >= 700) return { name: 'Liga Ouro', icon: '🥇', color: '#F1C40F' };
        if (xp >= 250) return { name: 'Liga Prata', icon: '🥈', color: '#BDC3C7' };
        return { name: 'Liga Bronze', icon: '🥉', color: '#CD7F32' };
    }

    getStats(langId) {
        const lang = langId || this.state.activeLanguage || 'ingles';
        const completedCount = (this.state.completedLessons[lang] || []).length;
        const xp = this.state.languageXP[lang] || 0;
        const words = Object.keys(this.state.wordsLearned[lang] || {}).length;
        const streak = this.state.streakDays || 1;
        const hearts = this.getHearts();
        const league = this.getLeague(xp);
        
        let totalCrowns = 0;
        Object.values(this.state.lessonCrowns).forEach(c => { totalCrowns += c; });

        return { completedCount, xp, words, streak, hearts, league, totalCrowns };
    }
}

export const mazzaEngine = new MazzaEngine();
