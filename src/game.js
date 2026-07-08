// QuizMoz v3.1.0 — Game Data & State
export const GAME_VERSION = 'v9';
export const BASE_URL = 'https://raw.githubusercontent.com/BrunoMatherry/quizmoz-data/main';

// ===== TIERS =====
export const TIERS = [
    { minLevel: 1, name: 'Novato', icon: '🥚', color: '#9e9e9e' },
    { minLevel: 4, name: 'Curioso', icon: '🔍', color: '#81c784' },
    { minLevel: 7, name: 'Aprendiz', icon: '📖', color: '#4CAF50' },
    { minLevel: 11, name: 'Estudante', icon: '🎓', color: '#42a5f5' },
    { minLevel: 16, name: 'Guerreiro', icon: '⚔️', color: '#FF9800' },
    { minLevel: 21, name: 'Estrategista', icon: '🧩', color: '#e91e63' },
    { minLevel: 26, name: 'Sábio', icon: '🦉', color: '#9c27b0' },
    { minLevel: 31, name: 'Mestre', icon: '👑', color: '#FFD700' },
    { minLevel: 41, name: 'Grão-Mestre', icon: '🏆', color: '#e65100' },
    { minLevel: 51, name: 'Lenda', icon: '🌟', color: '#FFD700' },
    { minLevel: 66, name: 'Imortal', icon: '🔥', color: '#d32f2f' },
    { minLevel: 81, name: 'Deus do Quiz', icon: '💎', color: '#00bcd4' }
];

// ===== COMBO WORDS =====
export const COMBO_WORDS = [
    { min: 1, text: 'Nice! 👍' }, { min: 2, text: 'Muito Bem! ✨' },
    { min: 3, text: 'Mazza! 🔥' }, { min: 4, text: 'Incrível! ⚡' },
    { min: 5, text: 'Espetacular! 🌟' }, { min: 6, text: 'LENDÁRIO! 👑' },
    { min: 7, text: 'DEUS DO QUIZ! 🏆' }
];

export const WRONG_WORDS = ['Mau! 😬', 'Muito Mau! 😱', 'Errado! ❌', 'Ai ai... 🤕'];

// ===== CLASSES DATA =====
export const classesData = {
    '1': { name: '1ª Classe', emoji: '🌱', icon: 'fa-seedling', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
    '2': { name: '2ª Classe', emoji: '🍃', icon: 'fa-leaf', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
    '3': { name: '3ª Classe', emoji: '⭐', icon: 'fa-star', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
    '4': { name: '4ª Classe', emoji: '⭐½', icon: 'fa-star-half-alt', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
    '5': { name: '5ª Classe', emoji: '🏫', icon: 'fa-school', description: 'Fundamentos', requiredLevel: 1, requiredCoins: 0, starter: true },
    '6': { name: '6ª Classe', emoji: '📖', icon: 'fa-book', description: 'Intermediário', requiredLevel: 5, requiredCoins: 100 },
    '7': { name: '7ª Classe', emoji: '🧪', icon: 'fa-flask', description: 'Ciências', requiredLevel: 1, requiredCoins: 0, starter: true },
    '8': { name: '8ª Classe', emoji: '🌍', icon: 'fa-globe', description: 'Avançado', requiredLevel: 1, requiredCoins: 0, starter: true },
    '9': { name: '9ª Classe', emoji: '🔢', icon: 'fa-calculator', description: 'Álgebra e geometria', requiredLevel: 16, requiredCoins: 500 },
    '10': { name: '10ª Classe', emoji: '🧬', icon: 'fa-dna', description: 'Biologia avançada', requiredLevel: 20, requiredCoins: 700 },
    '11': { name: '11ª Classe', emoji: '⚛️', icon: 'fa-atom', description: 'Física e química', requiredLevel: 1, requiredCoins: 0, starter: true },
    '12': { name: '12ª Classe', emoji: '🏛️', icon: 'fa-university', description: 'Preparação universitária', requiredLevel: 30, requiredCoins: 1500 },
    '13': { name: 'Direitos', emoji: '⚖️', icon: 'fa-gavel', description: 'Cidadania', requiredLevel: 1, requiredCoins: 500, special: true },
    '14': { name: 'Inglês', emoji: '🗣️', icon: 'fa-language', description: 'Língua inglesa', requiredLevel: 1, requiredCoins: 500, special: true },
    '15': { name: 'QI Avançado', emoji: '🧠', icon: 'fa-brain', description: 'Inteligência', requiredLevel: 1, requiredCoins: 1000, special: true },
    '16': { name: 'Cultura Geral', emoji: '🌎', icon: 'fa-globe-americas', description: 'Conhecimentos', requiredLevel: 15, requiredCoins: 1500, special: true },
    '17': { name: 'Adivinhas', emoji: '🍇', icon: 'fa-puzzle-piece', description: 'Enigmas', requiredLevel: 10, requiredCoins: 2000, special: true }
};

export const classDisciplines = {
    "1": ["Português - Básico", "Matemática - Básica"],
    "2": ["Ciências - Básico", "Inglês - Básico"],
    "3": ["Português - Iniciante", "Matemática - Iniciante"],
    "4": ["Ciências - Iniciante", "História - Iniciante"],
    "5": ["Matemática", "Português", "Ciências Sociais", "Ciências Naturais", "Inglês"],
    "6": ["Matemática", "Português", "Ciências Sociais", "Ciências Naturais", "Inglês"],
    "7": ["Matemática", "Português", "História", "Biologia", "Geografia", "Inglês"],
    "8": ["Matemática", "Português", "História", "Biologia", "Geografia", "Física", "Química", "Inglês"],
    "9": ["Matemática", "Português", "História", "Biologia", "Geografia", "Física", "Química", "Inglês", "Empreendedorismo"],
    "10": ["Matemática", "Português", "História", "Biologia", "Geografia", "Física", "Química", "Inglês", "Empreendedorismo"],
    "11": ["Matemática", "Português", "História", "Biologia", "Geografia", "Física", "Química", "Inglês", "Empreendedorismo", "Filosofia"],
    "12": ["Matemática", "Português", "História", "Biologia", "Geografia", "Física", "Química", "Inglês", "Empreendedorismo", "Filosofia"],
    "13": ["Direitos - 1ª Fase", "Direitos - 2ª Fase", "Direitos - 3ª Fase", "Direitos - 4ª Fase"],
    "14": ["Inglês - 1ª Fase", "Inglês - 2ª Fase", "Inglês - 3ª Fase", "Inglês - 4ª Fase"],
    "15": ["QI - 1ª Fase", "QI - 2ª Fase", "QI - 3ª Fase", "QI - 4ª Fase", "QI - 5ª Fase", "QI - 6ª Fase"],
    "16": ["Cultura - 1ª Fase", "Cultura - 2ª Fase", "Cultura - 3ª Fase", "Cultura - 4ª Fase", "Cultura - 5ª Fase", "Cultura - 6ª Fase", "Cultura - 7ª Fase", "Cultura - 8ª Fase", "Cultura - 9ª Fase", "Cultura - 10ª Fase"],
    "17": ["Adivinhas Populares", "Metalinguísticas", "Enigmas de Parentesco", "Matemática", "Raciocínio"]
};

// ===== GAME STATE =====
export const gameState = {
    level: 1, exp: 0, coins: 0, qi: 70, energy: 7, bonusEnergy: 0,
    playerName: 'Jogador', isGuest: true, streak: 0,
    soundEnabled: true, musicEnabled: true, theme: 'light',
    unlockedClasses: [], unlockedDisciplines: [],
    disciplineProgress: {},
    answeredQuestions: {},
    currentQuiz: null,
    lastEnergyRestore: null,
    authCompleted: false,
    nicknameSet: false,
    vsUnlocked: false,
    allLevelsPurchased: false
};

// ===== PERSISTENCE =====
export function saveState() {
    const s = { ...gameState, currentQuiz: null };
    const json = JSON.stringify(s);
    const checksum = simpleHash(json);
    localStorage.setItem('quizmoz_state', json);
    localStorage.setItem('quizmoz_checksum', checksum);
}

export function loadState() {
    try {
        const json = localStorage.getItem('quizmoz_state');
        if (!json) return;
        const checksum = localStorage.getItem('quizmoz_checksum');
        if (checksum && simpleHash(json) !== checksum) {
            console.warn('Checksum mismatch — resetting state');
            localStorage.removeItem('quizmoz_state');
            return;
        }
        const s = JSON.parse(json);
        Object.assign(gameState, s);
        // Clamp values
        gameState.level = Math.min(100, Math.max(1, gameState.level));
        gameState.exp = Math.min(999999, Math.max(0, gameState.exp));
        gameState.coins = Math.min(99999, Math.max(0, gameState.coins));
        gameState.qi = Math.min(200, Math.max(70, gameState.qi));
    } catch (e) { console.error('Load state error:', e); }
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash |= 0;
    }
    return hash.toString(36);
}

// ===== ENERGY RESTORE =====
export function checkDailyEnergy() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (gameState.lastEnergyRestore !== today) {
        // Reset daily energy to 7 — don't stack across days
        // Only preserve energy above 7 (purchased/ad bonus energy)
        const bonusEnergy = Math.max(0, (gameState.bonusEnergy || 0));
        gameState.energy = 7 + bonusEnergy;
        gameState.bonusEnergy = bonusEnergy; // track purchased/ad energy separately
        gameState.lastEnergyRestore = today;
        saveState();
    }
}

// ===== FETCH QUESTIONS =====
export function getDisciplineUrl(classId, disciplineName) {
    let filePath = null;
    if (classId === '1') {
        const map = { "Português - Básico": "portugues_basico.json", "Matemática - Básica": "matematica_basica.json" };
        filePath = map[disciplineName] ? `classe1/${map[disciplineName]}` : null;
    } else if (classId === '2') {
        const map = { "Ciências - Básico": "ciencias_basico.json", "Inglês - Básico": "ingles_basico.json" };
        filePath = map[disciplineName] ? `classe2/${map[disciplineName]}` : null;
    } else if (classId === '3') {
        const map = { "Português - Iniciante": "portugues_iniciante.json", "Matemática - Iniciante": "matematica_iniciante.json" };
        filePath = map[disciplineName] ? `classe3/${map[disciplineName]}` : null;
    } else if (classId === '4') {
        const map = { "Ciências - Iniciante": "ciencias_iniciante.json", "História - Iniciante": "historia_iniciante.json" };
        filePath = map[disciplineName] ? `classe4/${map[disciplineName]}` : null;
    } else if (classId === '13') {
        const map = { "Direitos - 1ª Fase":"1_fase.json","Direitos - 2ª Fase":"2_fase.json","Direitos - 3ª Fase":"3_fase.json","Direitos - 4ª Fase":"4_fase.json" };
        filePath = map[disciplineName] ? `classe13/${map[disciplineName]}` : null;
    } else if (classId === '14') {
        const map = { "Inglês - 1ª Fase":"1_fase.json","Inglês - 2ª Fase":"2_fase.json","Inglês - 3ª Fase":"3_fase.json","Inglês - 4ª Fase":"4_fase.json" };
        filePath = map[disciplineName] ? `classe14/${map[disciplineName]}` : null;
    } else if (classId === '15') {
        const map = { "QI - 1ª Fase":"1_fase.json","QI - 2ª Fase":"2_fase.json","QI - 3ª Fase":"3_fase.json","QI - 4ª Fase":"4_fase.json","QI - 5ª Fase":"5_fase.json","QI - 6ª Fase":"6_fase.json" };
        filePath = map[disciplineName] ? `classe15/${map[disciplineName]}` : null;
    } else if (classId === '16') {
        const map = {};
        for (let i = 1; i <= 10; i++) map[`Cultura - ${i}ª Fase`] = `${i}_fase.json`;
        filePath = map[disciplineName] ? `classe16/${map[disciplineName]}` : null;
    } else if (classId === '17') {
        const map = { "Adivinhas Populares":"adivinhas.json","Metalinguísticas":"metalinguisticas.json","Enigmas de Parentesco":"enigmas_parentesco.json","Matemática":"matematica.json","Raciocínio":"raciocinio.json" };
        filePath = map[disciplineName] ? `classe17/${map[disciplineName]}` : null;
    } else {
        const map = { "Matemática":"matematica.json","Português":"portugues.json","Ciências Sociais":"ciencias_sociais.json","Ciências Naturais":"ciencias_naturais.json","Inglês":"ingles.json","História":"historia.json","Biologia":"biologia.json","Geografia":"geografia.json","Física":"fisica.json","Química":"quimica.json","Empreendedorismo":"empreendedorismo.json","Filosofia":"filosofia.json" };
        filePath = map[disciplineName] ? `classe${classId}/${map[disciplineName]}` : null;
    }
    return filePath ? `${BASE_URL}/${filePath}?v=${GAME_VERSION}` : null;
}

export async function fetchQuestions(classId, disciplineName) {
    const url = getDisciplineUrl(classId, disciplineName);
    if (!url) throw new Error('Disciplina não encontrada');
    
    // Check cache (48h)
    const cacheKey = `quizmoz_cache_${classId}_${disciplineName}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 48 * 60 * 60 * 1000) return data;
        } catch(e) {}
    }
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao carregar disciplina');
    const json = await res.json();
    
    let questions = [];
    if (json.data) {
        for (let key in json.data) {
            if (key.startsWith('Q_ID')) {
                const idx = key.replace('Q_ID', '');
                questions.push({
                    id: `q_${idx}`, text: json.data[key],
                    options: { 'A': json.data[`A0_ID${idx}`]||'', 'B': json.data[`A1_ID${idx}`]||'', 'C': json.data[`A2_ID${idx}`]||'', 'D': json.data[`A3_ID${idx}`]||'' },
                    correct: String.fromCharCode(65 + (json.data[`S_ID${idx}`] || 0)),
                    justification: json.data[`txtS_ID${idx}`] || ''
                });
            }
        }
    }
    
    // Cache
    try { localStorage.setItem(cacheKey, JSON.stringify({ data: questions, ts: Date.now() })); } catch(e) {}
    
    return questions;
}
