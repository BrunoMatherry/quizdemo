// QuizMoz v3.1.0 — UI Module
import { gameState, classesData, classDisciplines, TIERS } from './game.js';

// ===== SCREEN MANAGEMENT =====
export function showScreen(screenId, render) {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = '';
    if (render) render(main);
    main.scrollTop = 0;
    if (window.triggerScreenTransitionAd) {
        window.triggerScreenTransitionAd(screenId);
    }
}

// ===== LOADING SCREEN =====
const PHRASES = [
    'Prepare-se para o desafio!', 'Muitos desistem no primeiro nível',
    'Se não quer aprender, melhor sair', 'O conhecimento é poder!',
    'Moçambique conta contigo!', 'Vamos testar o teu QI!',
    'Serás tu o próximo Lenda?', 'Quanto mais sabes, mais ganhas!'
];

export function runLoadingScreen(onComplete) {
    const bar = document.getElementById('loading-progress');
    const phraseEl = document.getElementById('loading-phrase');
    const screen = document.getElementById('loading-screen');
    const particlesEl = document.getElementById('loading-particles');
    
    // Spawn particles
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'loading-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 4 + 's';
        p.style.animationDuration = (3 + Math.random() * 3) + 's';
        particlesEl.appendChild(p);
    }
    
    let progress = 0;
    let phraseIdx = 0;
    const phraseInterval = setInterval(() => {
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        phraseEl.style.opacity = 0;
        setTimeout(() => { phraseEl.textContent = PHRASES[phraseIdx]; phraseEl.style.opacity = 1; }, 300);
    }, 2500);
    
    const loadInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress >= 100) {
            progress = 100;
            bar.style.width = '100%';
            clearInterval(loadInterval);
            clearInterval(phraseInterval);
            setTimeout(() => {
                screen.style.opacity = '0';
                screen.style.transition = 'opacity 0.5s ease';
                setTimeout(() => { screen.style.display = 'none'; onComplete(); }, 500);
            }, 600);
        } else {
            bar.style.width = progress + '%';
        }
    }, 150);
}

// ===== HEADER UPDATE =====
export function updateHUD() {
    const s = gameState;
    const el = (id) => document.getElementById(id);
    
    el('energy-value').textContent = s.energy;
    const energyDisplay = el('energy-display');
    if (energyDisplay) {
        if (s.energy <= 3) {
            energyDisplay.classList.add('energy-blink');
        } else {
            energyDisplay.classList.remove('energy-blink');
        }
    }
    el('coins-amount').textContent = s.coins;
    el('level-value').textContent = s.level;
    
    // QI with color
    const qiEl = el('qi-value');
    qiEl.textContent = s.qi;
    qiEl.className = 'qi-indicator ' + (s.qi < 90 ? 'qi-low' : s.qi < 120 ? 'qi-mid' : s.qi < 150 ? 'qi-high' : 'qi-genius');
    
    // Tier
    const tier = getTier(s.level);
    el('tier-icon').textContent = tier.icon;
    el('tier-name').textContent = tier.name;
    
    // XP Bar
    const xpNeeded = getXPForLevel(s.level);
    const pct = Math.min(100, (s.exp / xpNeeded) * 100);
    el('xp-bar-fill').style.width = pct + '%';
    el('xp-bar-label').textContent = `${s.exp} / ${xpNeeded} XP`;
    el('xp-bar-next').textContent = `Nv. ${s.level + 1}`;
}

export function getTier(level) {
    let t = TIERS[0];
    for (const tier of TIERS) { if (level >= tier.minLevel) t = tier; }
    return t;
}

export function getXPForLevel(level) {
    return 100 + (level - 1) * 50;
}

// ===== RENDER WELCOME =====
export function renderWelcome(container) {
    const s = gameState;
    
    // Create floating icons for background effect
    let floatingIcons = '';
    const icons = ['❓', '❗', '❓', '❗', '❓', '❗', '❓', '❗', '❓', '❗', '❓', '❗', '❓', '❗', '❓'];
    icons.forEach((icon, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const dur = 6 + Math.random() * 6;
        const size = 16 + Math.random() * 20;
        floatingIcons += `<div class="welcome-float-icon" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;font-size:${size}px;">${icon}</div>`;
    });
    
    container.innerHTML = `
        <div class="welcome-screen">
            <div class="welcome-floating-bg">${floatingIcons}</div>
            <div class="welcome-card">
                <div class="welcome-book-logo">
                    <div class="book-icon">
                        <div class="book-spine"></div>
                        <div class="book-cover">
                            <div class="book-title">QuizMoz</div>
                            <div class="book-subtitle">📚</div>
                        </div>
                    </div>
                </div>
                <div class="welcome-title">Bem-vindo ao QuizMoz!</div>
                <div class="welcome-subtitle">Jogo Educacional Moçambicano</div>
                <div class="welcome-nick-label">Escolhe o teu Nickname</div>
                <div class="welcome-nick-hint">Este nome aparecerá no Ranking Global</div>
                <div class="nickname-field">
                    <input type="text" id="nickname-input" placeholder="Ex: QuizMaster99" value="${s.playerName !== 'Jogador' ? s.playerName : ''}" maxlength="20">
                </div>
                <div class="nickname-char-hint">2 a 20 caracteres · sem símbolos especiais</div>
                <button class="btn-enter-game" id="btn-start-journey">🚀 Entrar no Jogo!</button>
            </div>
            <button class="btn-ad-coins" id="btn-ad-coins" style="border: 2px solid #FF9800; background: #FFF3E0; color: #E65100; font-weight: 800;">[ANÚNCIO] 📺 Ver Vídeo → Ganhar 🪙 +10 Moedas</button>
        </div>
    `;
}

// ===== RENDER CLASSES =====
export function renderClasses(container) {
    const groups = {
        '🌱 Modo Iniciante': ['1','2','3','4'],
        '🏫 Classes Regulares': ['5','6','7','8','9','10','11','12'],
        '⭐ Classes Especiais': ['13','14','15','16','17']
    };
    
    // Gradient colors for each class
    const classGradients = {
        '1':  { gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '2':  { gradient: 'linear-gradient(135deg, #96E6A1 0%, #D4FC79 100%)', iconColor: '#2d6a2d', textColor: '#1a3a1a', dimColor: 'rgba(0,0,0,0.45)' },
        '3':  { gradient: 'linear-gradient(135deg, #FDCB6E 0%, #F9CA24 100%)', iconColor: '#5d4037', textColor: '#3d2a17', dimColor: 'rgba(0,0,0,0.45)' },
        '4':  { gradient: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)', iconColor: '#fff', textColor: '#5d3a1a', dimColor: 'rgba(0,0,0,0.45)' },
        '5':  { gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '6':  { gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.7)' },
        '7':  { gradient: 'linear-gradient(135deg, #0BA360 0%, #3CBA92 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '8':  { gradient: 'linear-gradient(135deg, #89F7FE 0%, #66A6FF 100%)', iconColor: '#fff', textColor: '#1a2a4a', dimColor: 'rgba(0,0,0,0.45)' },
        '9':  { gradient: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)', iconColor: '#fff', textColor: '#333', dimColor: 'rgba(0,0,0,0.45)' },
        '10': { gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)', iconColor: '#fff', textColor: '#333', dimColor: 'rgba(0,0,0,0.45)' },
        '11': { gradient: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '12': { gradient: 'linear-gradient(135deg, #E2B0FF 0%, #9F44D3 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.7)' },
        '13': { gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '14': { gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '15': { gradient: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.7)' },
        '16': { gradient: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' },
        '17': { gradient: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.75)' }
    };
    
    let html = '<div class="section-title">Escolhe a tua Classe</div>';
    
    for (const [groupName, ids] of Object.entries(groups)) {
        const groupClass = groupName.includes('Iniciante') ? 'group-beginner' : groupName.includes('Especiais') ? 'group-special' : 'group-regular';
        html += `<div class="group-title ${groupClass}">${groupName}</div><div class="card-grid">`;
        ids.forEach(id => {
            const cls = classesData[id];
            if (!cls) return;
            const isLocked = !gameState.allLevelsPurchased && gameState.level < cls.requiredLevel;
            const needsCoins = !gameState.allLevelsPurchased && !cls.starter && cls.requiredCoins > 0 && !gameState.unlockedClasses?.includes(id);
            const discCount = (classDisciplines[id] || []).length;
            const colors = classGradients[id] || { gradient: 'linear-gradient(135deg, #5E9B9D, #4A7C7E)', iconColor: '#fff', textColor: '#fff', dimColor: 'rgba(255,255,255,0.7)' };
            
            // Calculate stats for this class
            const discs = classDisciplines[id] || [];
            let totalCorrect = 0, totalQuestions = 0;
            discs.forEach(d => {
                const p = gameState.disciplineProgress?.[`${id}_${d}`];
                if (p) { totalCorrect += p.correct || 0; totalQuestions += p.total || 0; }
            });
            const totalPossible = discCount * 3;
            const starsHtml = getStarsHTML(totalCorrect, totalQuestions);
            
            // Lock badge
            let lockBadge = '';
            if (isLocked || needsCoins) {
                let lockText = '';
                if (cls.requiredLevel > 1 && cls.requiredCoins > 0) {
                    lockText = `Nv. ${cls.requiredLevel} • ${cls.requiredCoins}`;
                } else if (cls.requiredCoins > 0) {
                    lockText = `${cls.requiredCoins}`;
                } else {
                    lockText = `Nv. ${cls.requiredLevel}`;
                }
                lockBadge = `<div class="card-lock-badge"><i class="fas fa-lock"></i> ${lockText} 🪙</div>`;
            }
            
            html += `
                <div class="card-btn ${isLocked ? 'locked' : ''}" data-class-id="${id}" style="background:${colors.gradient};border-color:transparent;">
                    <div class="card-fa-icon" style="color:${colors.iconColor};"><i class="fas ${cls.icon}"></i></div>
                    <div class="card-name" style="color:${colors.textColor};">${cls.name}</div>
                    <div class="card-desc" style="color:${colors.dimColor};">${cls.description}</div>
                    ${discCount > 0 ? `<div class="card-disc-count" style="color:${colors.dimColor};"><i class="fas fa-layer-group"></i> ${discCount} disciplinas</div>` : ''}
                    <div class="card-stats-row">
                        <span class="card-stars">${starsHtml}</span>
                        ${totalQuestions > 0 ? `<span class="card-progress-text" style="color:${colors.dimColor};">${totalCorrect}/${totalQuestions}</span>` : `<span class="card-progress-text" style="color:${colors.dimColor};">0/${discCount * 3}</span>`}
                    </div>
                    ${lockBadge}
                </div>
            `;
        });
        html += '</div>';
    }
    
    // V/S Mode entry — after all classes
    html += `
        <div class="group-title group-vs" style="background:linear-gradient(90deg,#6C5CE7,#00B894);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:1.1em;">⚔️ Modo Multijogador</div>
        <div class="vs-mode-entry" id="vs-mode-entry-btn">
            <div class="vs-entry-glow"></div>
            <div class="vs-entry-content">
                <div class="vs-entry-icon"><img src="/roleta_icon.png" alt="QuizRoleta"></div>
                <div class="vs-entry-text">
                    <strong>QuizRoleta (Modo V/S) — Desafie um Amigo!</strong>
                    <span>Batalha de Quiz em tempo real · Melhor de 3</span>
                </div>
                <div class="vs-entry-arrow"><i class="fas fa-chevron-right"></i></div>
            </div>
        </div>
        <div class="vs-mode-entry-nt" id="vs-mode-entry-nt">
            <div class="nt-entry-glow"></div>
            <div class="nt-entry-content">
                <div class="nt-entry-icon"><img src="/nome_terra_icon.png" alt="Nome Terra"></div>
                <div class="nt-entry-text">
                    <strong>Nome Terra - Stop</strong>
                    <span>Sorteie uma letra e responda o mais rápido possível · jogue com seus amigos</span>
                </div>
                <div class="nt-entry-arrow"><i class="fas fa-chevron-right"></i></div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== RENDER DISCIPLINES =====
export function renderDisciplines(container, classId, className) {
    const discs = classDisciplines[classId] || [];
    
    // Map discipline names to icons
    const discIcons = {
        'Português': 'fa-book', 'Matemática': 'fa-calculator', 'Ciências': 'fa-flask',
        'Inglês': 'fa-language', 'História': 'fa-landmark', 'Geografia': 'fa-globe-africa',
        'Biologia': 'fa-dna', 'Física': 'fa-atom', 'Química': 'fa-vial',
        'Educação': 'fa-graduation-cap', 'Direitos': 'fa-gavel', 'Cultura': 'fa-globe-americas',
        'QI': 'fa-brain', 'Adivinhas': 'fa-puzzle-piece', 'Empreendedorismo': 'fa-lightbulb',
        'Filosofia': 'fa-yin-yang', 'Raciocínio': 'fa-cogs', 'Metalinguísticas': 'fa-spell-check',
        'Enigmas': 'fa-puzzle-piece', 'default': 'fa-book-open'
    };
    
    // Beautiful gradient colors per discipline type
    const discGradients = {
        'Português': { gradient: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)', iconColor: '#fff', textColor: '#fff' },
        'Matemática': { gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)', iconColor: '#fff', textColor: '#fff' },
        'Ciências Sociais': { gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)', iconColor: '#fff', textColor: '#333' },
        'Ciências Naturais': { gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)', iconColor: '#fff', textColor: '#1a3a2a' },
        'Ciências': { gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)', iconColor: '#fff', textColor: '#1a3a2a' },
        'Inglês': { gradient: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)', iconColor: '#fff', textColor: '#333' },
        'História': { gradient: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)', iconColor: '#fff', textColor: '#5d3a1a' },
        'Biologia': { gradient: 'linear-gradient(135deg, #0BA360 0%, #3CBA92 100%)', iconColor: '#fff', textColor: '#fff' },
        'Geografia': { gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', iconColor: '#fff', textColor: '#fff' },
        'Física': { gradient: 'linear-gradient(135deg, #89F7FE 0%, #66A6FF 100%)', iconColor: '#fff', textColor: '#1a2a4a' },
        'Química': { gradient: 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)', iconColor: '#5E9B9D', textColor: '#333' },
        'Empreendedorismo': { gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', iconColor: '#fff', textColor: '#5d3a00' },
        'Filosofia': { gradient: 'linear-gradient(135deg, #E2B0FF 0%, #9F44D3 100%)', iconColor: '#fff', textColor: '#fff' },
        'Direitos': { gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)', iconColor: '#fff', textColor: '#fff' },
        'QI': { gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)', iconColor: '#fff', textColor: '#fff' },
        'Cultura': { gradient: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)', iconColor: '#fff', textColor: '#fff' },
        'Adivinhas': { gradient: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)', iconColor: '#fff', textColor: '#fff' },
        'Metalinguísticas': { gradient: 'linear-gradient(135deg, #FD79A8 0%, #E84393 100%)', iconColor: '#fff', textColor: '#fff' },
        'Enigmas': { gradient: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)', iconColor: '#fff', textColor: '#fff' },
        'Raciocínio': { gradient: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)', iconColor: '#fff', textColor: '#fff' }
    };
    
    // Fallback gradient palette for unmatched disciplines
    const fallbackGradients = [
        { gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', iconColor: '#fff', textColor: '#fff' },
        { gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)', iconColor: '#fff', textColor: '#fff' },
        { gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)', iconColor: '#fff', textColor: '#fff' },
        { gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)', iconColor: '#fff', textColor: '#1a3a2a' },
        { gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)', iconColor: '#fff', textColor: '#333' },
        { gradient: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)', iconColor: '#fff', textColor: '#333' }
    ];
    
    function getDiscIcon(name) {
        for (const [key, icon] of Object.entries(discIcons)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return icon;
        }
        return discIcons.default;
    }
    
    function getDiscGradient(name, idx) {
        for (const [key, colors] of Object.entries(discGradients)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return colors;
        }
        return fallbackGradients[idx % fallbackGradients.length];
    }
    
    let html = `<div class="section-title">${className}</div><div class="disc-grid">`;
    
    discs.forEach((disc, idx) => {
        const key = `${classId}_${disc}`;
        const progress = gameState.disciplineProgress?.[key] || { answered: 0, total: 0, correct: 0 };
        const isFirst = idx === 0;
        const isUnlocked = isFirst || gameState.allLevelsPurchased || gameState.unlockedDisciplines?.includes(key);
        const starsHtml = getStarsHTML(progress.correct, progress.total);
        const icon = getDiscIcon(disc);
        const colors = getDiscGradient(disc, idx);
        
        // Progress bar calculation
        const progressPct = progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;
        const isComplete = progress.total > 0 && progress.answered >= progress.total;
        
        let actionBtn = '';
        if (!isUnlocked) {
            actionBtn = `<button class="disc-action-btn locked-btn"><i class="fas fa-lock"></i> 70 🪙</button>`;
        } else if (isComplete) {
            actionBtn = `<button class="disc-action-btn complete-btn"><i class="fas fa-redo"></i> Jogar Novamente</button>`;
        } else if (progress.answered > 0) {
            actionBtn = `<button class="disc-action-btn progress-btn"><i class="fas fa-play"></i> Continuar</button>`;
        } else {
            actionBtn = `<button class="disc-action-btn start"><i class="fas fa-play"></i> Iniciar</button>`;
        }
        
        html += `
            <div class="disc-card ${!isUnlocked ? 'locked' : ''} ${isComplete ? 'disc-complete' : ''}" data-class-id="${classId}" data-disc="${disc}" style="background:${colors.gradient};border-color:transparent;">
                <div class="disc-fa-icon" style="color:${colors.iconColor};"><i class="fas ${icon}"></i></div>
                <div class="disc-name" style="color:${colors.textColor};">${disc}</div>
                <div class="disc-stars">${starsHtml}</div>
                ${progress.total > 0 ? `
                    <div class="disc-progress-bar" style="background:rgba(255,255,255,0.3);">
                        <div class="disc-progress-fill" style="width:${progressPct}%;background:rgba(255,255,255,0.85);"></div>
                    </div>
                    <div class="disc-progress-text" style="color:${colors.textColor};opacity:0.9;">${progress.answered}/${progress.total} perguntas ${isComplete ? '✅' : ''}</div>
                ` : ''}
                ${actionBtn}
            </div>
        `;
    });
    
    html += '</div>';
    html += `<div style="text-align:center;"><button class="disc-voltar-btn" id="btn-back-classes"><i class="fas fa-arrow-left"></i> ← Voltar</button></div>`;
    container.innerHTML = html;
}

function getStarsHTML(correct, total) {
    let filledCount = 0;
    if (total > 0) {
        const ratio = correct / total;
        if (ratio >= 0.8) filledCount = 3;
        else if (ratio >= 0.5) filledCount = 2;
        else if (ratio >= 0.25) filledCount = 1;
    }
    let stars = '';
    for (let i = 0; i < 3; i++) {
        stars += `<i class="fas fa-star ${i < filledCount ? 'filled' : ''}"></i>`;
    }
    return stars;
}

// ===== LEVEL UP MODAL =====
export function showLevelUp(level, tier, nextTier, score) {
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.id = 'levelup-overlay';
    
    const levelsToNext = nextTier ? nextTier.minLevel - level : 0;
    const progressPct = nextTier ? Math.min(100, ((level - tier.minLevel) / (nextTier.minLevel - tier.minLevel)) * 100) : 100;
    
    overlay.innerHTML = `
        <div class="levelup-box">
            <div class="levelup-confetti">🎉</div>
            <div class="levelup-title">Nível ${level}!</div>
            <div class="levelup-sub">Continua assim, guerreiro!</div>
            <div class="levelup-tier-card">
                <div class="levelup-tier-icon">${tier.icon}</div>
                <div class="levelup-tier-info">
                    <div class="levelup-tier-name">${tier.name}</div>
                    <div class="levelup-tier-desc">Nível ${level} • ${tier.desc || 'Todos começam por aqui...'}</div>
                </div>
            </div>
            ${nextTier ? `
            <div class="levelup-progress">
                <div class="levelup-progress-text">
                    <span>${tier.name}</span>
                    <span style="float:right;">Nv.${level}</span>
                    <span style="float:right;margin-right:10px;">${nextTier.name}</span>
                </div>
                <div class="levelup-progress-bar">
                    <div class="levelup-progress-fill" style="width:${progressPct}%;"></div>
                </div>
                <div class="levelup-progress-text">Faltam <strong>${levelsToNext} níveis</strong> para <strong>${nextTier.name}</strong></div>
            </div>` : ''}
            <div class="levelup-rank">
                <div class="levelup-rank-icon">${tier.icon}</div>
                <div class="levelup-rank-info">
                    <div class="levelup-rank-name">⭐ Super Bock</div>
                    <div class="levelup-rank-score">${score || gameState.qi * 2 + gameState.level * 10} <span style="background:#5E9B9D;color:white;padding:2px 8px;border-radius:10px;font-size:0.8em;margin-left:6px;">Nv.${level}</span></div>
                </div>
            </div>
            <button class="levelup-btn" id="levelup-continue">💪 Seguir em Frente!</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('levelup-continue').onclick = () => overlay.remove();
}

// ===== SETTINGS MODAL =====
export function openSettings(callbacks) {
    const { showModal, hideModal } = callbacks.modalFns;
    const isDark = document.body.classList.contains('theme-dark');
    const isMuted = gameState.soundEnabled === false;
    const isMusicMuted = gameState.musicEnabled === false;
    
    showModal({
        icon: '⚙️', title: 'Definições', centered: true,
        html: `<div class="settings-items">
            <div class="settings-item">
                <div class="settings-item-left"><i class="fas fa-moon"></i> Tema Escuro</div>
                <button class="settings-toggle ${isDark ? 'active' : ''}" id="settings-theme-toggle"></button>
            </div>
            <div class="settings-item">
                <div class="settings-item-left"><i class="fas fa-volume-up"></i> Som</div>
                <button class="settings-toggle ${!isMuted ? 'active' : ''}" id="settings-sound-toggle"></button>
            </div>
            <div class="settings-item">
                <div class="settings-item-left"><i class="fas fa-music"></i> Música</div>
                <button class="settings-toggle ${!isMusicMuted ? 'active' : ''}" id="settings-music-toggle"></button>
            </div>
        </div>`,
        actions: [
            {label: '🏠 Menu Principal', class: 'modal-btn-success', onClick: () => { hideModal(); if (callbacks.onHomeClick) callbacks.onHomeClick(); }},
            {label: 'Fechar', class: 'modal-btn-gray', onClick: () => { hideModal(); if (callbacks.onClose) callbacks.onClose(); }}
        ]
    });
    
    setTimeout(() => {
        document.getElementById('settings-theme-toggle')?.addEventListener('click', function() {
            this.classList.toggle('active');
            callbacks.onThemeToggle();
        });
        document.getElementById('settings-sound-toggle')?.addEventListener('click', function() {
            this.classList.toggle('active');
            callbacks.onSoundToggle();
        });
        document.getElementById('settings-music-toggle')?.addEventListener('click', function() {
            this.classList.toggle('active');
            callbacks.onMusicToggle();
        });
    }, 50);
}

// ===== MODAL SYSTEM =====
let modalEl = null;

export function showModal({ icon, circleIcon, circleType, title, desc, html, energy, actions, centered, closeable }) {
    hideModal();
    const div = document.createElement('div');
    div.className = 'modal-overlay' + (centered ? ' modal-centered' : '');
    div.id = 'game-modal';
    
    let iconHtml = '';
    if (circleIcon) {
        iconHtml = `<div class="modal-circle-icon ${circleType || 'info'}">${circleIcon}</div>`;
    } else if (icon) {
        iconHtml = `<div class="modal-icon">${icon}</div>`;
    }
    
    div.innerHTML = `
        <div class="modal-box">
            ${closeable === true ? '<button class="modal-close" id="modal-close-btn">&times;</button>' : ''}
            ${iconHtml}
            <div class="modal-title">${title}</div>
            ${desc ? `<div class="modal-desc" style="text-align:center;">${desc}</div>` : ''}
            ${html ? `<div class="modal-html">${html}</div>` : ''}
            ${energy !== undefined ? `<div class="modal-energy">⚡ Energia restante: ${energy}</div>` : ''}
            <div class="modal-actions" id="modal-actions"></div>
        </div>
    `;
    document.body.appendChild(div);
    modalEl = div;
    
    // Prevent clicks on modal-box from propagating to overlay
    div.querySelector('.modal-box').onclick = (e) => e.stopPropagation();
    
    // Close button
    const closeBtn = div.querySelector('#modal-close-btn');
    if (closeBtn) closeBtn.onclick = hideModal;
    
    const actionsEl = div.querySelector('#modal-actions');
    if (actions) {
        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.className = 'modal-btn ' + (a.class || 'modal-btn-primary');
            if (a.id) btn.id = a.id;
            btn.innerHTML = a.label;
            btn.onclick = () => { if (a.onClick) a.onClick(); };
            actionsEl.appendChild(btn);
        });
    }
    return div;
}

export function hideModal() {
    const el = document.getElementById('game-modal');
    if (el) el.remove();
    modalEl = null;
}

// ===== LOADING OVERLAY =====
export function showLoading(show, msg = 'A carregar...') {
    let el = document.getElementById('global-loader');
    if (!el && show) {
        el = document.createElement('div');
        el.id = 'global-loader';
        el.style.cssText = 'position:fixed;inset:0;background:rgba(18,20,24,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:99999;display:flex;justify-content:center;align-items:center;flex-direction:column;color:white;';
        el.innerHTML = `<div class="loading-bulb">💡</div><p class="loading-text">${msg}</p>`;
        document.body.appendChild(el);
    }
    if (el) {
        const txtEl = el.querySelector('.loading-text') || el.querySelector('p');
        if (txtEl) {
            txtEl.className = 'loading-text';
            txtEl.textContent = msg;
        }
        el.style.display = show ? 'flex' : 'none';
    }
}

// ===== CONFETTI =====
export function spawnConfetti() {
    const colors = ['#FF5252','#FFD740','#69F0AE','#40C4FF','#FF4081','#B388FF'];
    for (let i = 0; i < 30; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.top = '-10px';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = Math.random() * 0.5 + 's';
        c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        c.style.width = (6 + Math.random() * 8) + 'px';
        c.style.height = (6 + Math.random() * 8) + 'px';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 2000);
    }
}

// ===== COMBO POPUP =====
export function showCombo(text) {
    const el = document.createElement('div');
    el.className = 'combo-popup';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
}

// ===== COIN SHOP RENDER =====
export function renderCoinShop() {
    const coinIcons = (count) => {
        let html = '';
        for (let i = 0; i < Math.min(count, 6); i++) html += '<span class="coin-bag">💰</span>';
        return html;
    };
    
    return `
        <div class="coin-shop">
            <div class="coin-shop-ad" id="coin-buy-ad" style="border: 2px solid #FF9800; background: #FFF3E0; color: #E65100;">
                <div class="coin-ad-icon">📺</div>
                <div class="coin-ad-text">
                    <strong>[ANÚNCIO] Ver Vídeo Publicitário</strong>
                    <span>Ganhar 🪙 +10 Moedas · Grátis!</span>
                </div>
            </div>
            ${gameState.allLevelsPurchased ? `
            <div class="coin-shop-unlock-all coin-shop-unlock-done">
                <div class="coin-unlock-icon">✅</div>
                <div class="coin-unlock-text">
                    <strong>⭐ Todos os Modos & Classes Desbloqueados</strong>
                    <span style="font-size:0.8em;color:#4CAF50;font-weight:700;">Compra realizada com sucesso!</span>
                </div>
            </div>
            ` : `
            <div class="coin-shop-unlock-all" id="coin-unlock-all" style="border: 2px dashed #9c27b0;">
                <div class="promo-sticker">🔥 PROMOÇÃO LIMITADA</div>
                <div class="coin-unlock-icon">🔓</div>
                <div class="coin-unlock-text">
                    <strong>[COMPRA NO JOGO] ⭐ Desbloquear Tudo (Modos & Classes)</strong>
                    <span>Todas as classes offline + Modo V/S + Nome Terra · 150 MT</span>
                    <span style="font-size:0.75em;color:#c62828;font-weight:800;margin-top:2px;display:block;">🔥 Promoção Especial — Poupe mais de 5000 🪙!</span>
                </div>
            </div>
            `}
            <p class="coin-shop-hint">Ou escolha um pacote e o método de pagamento</p>
            <div class="coin-package" id="coin-buy-100">
                <div class="coin-pkg-icons">${coinIcons(1)}</div>
                <div class="coin-pkg-info">100 Moedas <span style="font-size:0.7em; background:#e74c3c; color:white; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:800;">[COMPRA]</span></div>
                <div class="coin-pkg-price">10 MT</div>
            </div>
            <div class="coin-package" id="coin-buy-200">
                <div class="coin-pkg-icons">${coinIcons(2)}</div>
                <div class="coin-pkg-info">200 Moedas <span style="font-size:0.7em; background:#e74c3c; color:white; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:800;">[COMPRA]</span></div>
                <div class="coin-pkg-price">15 MT</div>
            </div>
            <div class="coin-package" id="coin-buy-500">
                <div class="coin-pkg-icons">${coinIcons(3)}</div>
                <div class="coin-pkg-info">500 Moedas <span style="font-size:0.7em; background:#e74c3c; color:white; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:800;">[COMPRA]</span></div>
                <div class="coin-pkg-price">30 MT</div>
            </div>
            <div class="coin-package" id="coin-buy-1000">
                <div class="coin-pkg-icons">${coinIcons(4)}</div>
                <div class="coin-pkg-info">1000 Moedas <span style="font-size:0.7em; background:#e74c3c; color:white; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:800;">[COMPRA]</span></div>
                <div class="coin-pkg-price">50 MT</div>
            </div>
            <div class="coin-package" id="coin-buy-5000">
                <div class="coin-pkg-icons">${coinIcons(6)}</div>
                <div class="coin-pkg-info">5000 Moedas <span style="font-size:0.7em; background:#e74c3c; color:white; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:800;">[COMPRA]</span></div>
                <div class="coin-pkg-price">120 MT</div>
            </div>
            <div class="payment-methods" id="payment-methods" style="display:none;">
                <div class="pay-title">Método de Pagamento:</div>
                <span class="pay-amount"></span>
                <div class="pay-buttons">
                    <button class="pay-btn pay-emola" id="pay-emola">
                        <span class="pay-icon">📱</span> e-Mola
                    </button>
                    <button class="pay-btn pay-mpesa" id="pay-mpesa">
                        <span class="pay-icon">📱</span> M-Pesa
                    </button>
                </div>
            </div>
        </div>
    `;
}
