
var _0x={};
_0x.d=function(s){return atob(s)};
_0x.e=function(a){return a.map(function(c){return String.fromCharCode(c)}).join('')};

(function(){var _c=document.getElementsByTagName('script');for(var i=0;i<_c.length;i++){if(_c[i].src&&_c[i].src.indexOf('devtools')>-1){document.body.innerHTML='';}}})();
document.addEventListener('contextmenu',function(e){e.preventDefault();});
document.addEventListener('keydown',function(e){if(e.key==='F12'||e.keyCode===123){e.preventDefault();}if(e.ctrlKey&&e.shiftKey&&(e.key==='I'||e.key==='J'||e.key==='C')){e.preventDefault();}if(e.ctrlKey&&e.key==='u'){e.preventDefault();}});

// Correção global SweetAlert para evitar congelamento da UI
if (typeof Swal !== 'undefined') {
    const originalSwalFire = Swal.fire;
    Swal.fire = function(...args) {
        let options = args[0] || {};
        if (typeof options === 'string') {
            options = { title: args[0], html: args[1], icon: args[2] };
        }
        options.heightAuto = false; // Evita que o SweetAlert modifique a altura da página e cause "quedas" da UI
        return originalSwalFire.call(Swal, options);
    };
}

const GAME_VERSION = '3.1.0'; // Fix z-index e heightAuto freeze
const ADMOB_REWARDED_1 = 'ca-app-pub-1954059473041916/4424272498'; // 60segundos
const ADMOB_REWARDED_2 = 'ca-app-pub-1954059473041916/4232700800'; // revelar_resposta
const ADMOB_REWARDED_3 = 'ca-app-pub-1954059473041916/3384914106'; // moedas — anúncio premiado
let currentScreen = 'welcome';
let isAdMobInitialized = false;

// Sistema de 2 anúncios separados
let _adTime   = { instance: null, ready: false, pendingReward: null, pendingCancel: null };
let _adReveal = { instance: null, ready: false, pendingReward: null, pendingCancel: null };
let _adCoins  = { instance: null, ready: false, pendingReward: null, pendingCancel: null };
var _aguardarAdInterval = null; // intervalo global de espera de anúncio
var _fcoGlobalTimeout   = null; // timeout global da moeda flutuante
var _adLoadTimeouts = { time: null, reveal: null, coins: null }; // timeouts por tipo (evita empilhamento)

function isAdMobAvailable() {
return typeof admob !== 'undefined' && admob !== null;
}

function initAdMob() {
if (!isAdMobAvailable()) {
return;
}
admob.start().then(() => {
isAdMobInitialized = true;
loadAd('time');
setTimeout(() => loadAd('reveal'), 2000);
setTimeout(() => loadAd('coins'),  4000);
}).catch(e => console.log('❌ Erro AdMob start:', e));
}

function loadAd(type) {
if (!isAdMobAvailable() || !isAdMobInitialized) return;
// Cancelar qualquer reload pendente para este tipo (evita empilhamento)
if (_adLoadTimeouts[type]) { clearTimeout(_adLoadTimeouts[type]); _adLoadTimeouts[type] = null; }

var adObj = type === 'time' ? _adTime : (type === 'coins' ? _adCoins : _adReveal);
var adUnitId = type === 'time' ? ADMOB_REWARDED_1 : (type === 'coins' ? ADMOB_REWARDED_3 : ADMOB_REWARDED_2);
adObj.ready = false;

// Destruir instância antiga para evitar memory leaks e freezing
if (adObj.instance) {
try { adObj.instance.destroy(); } catch(_) {}
adObj.instance = null;
}

adObj.instance = new admob.RewardedAd({ adUnitId: adUnitId });

adObj.instance.on('load', () => {
adObj.ready = true;
});

adObj.instance.on('loadfail', (e) => {
console.log('❌ Falha ao carregar ' + type + ':', e);
adObj.ready = false;
(_adLoadTimeouts[type] = setTimeout(() => { _adLoadTimeouts[type] = null; loadAd(type); }, 30000));
});

adObj.instance.on('reward', (e) => {
if (adObj.pendingReward) {
var cb = adObj.pendingReward;
adObj.pendingReward = null;
adObj.pendingCancel = null;
try { cb(); } catch(err) { console.warn('Ad reward callback error:', err); }
}
});

adObj.instance.on('dismiss', () => {
(_adLoadTimeouts[type] = setTimeout(() => { _adLoadTimeouts[type] = null; loadAd(type); }, 1000));
if (adObj.pendingCancel) {
// Jogador fechou o anúncio sem ver até ao fim
var cb = adObj.pendingCancel;
adObj.pendingReward = null;
adObj.pendingCancel = null;
Swal.fire({
title: 'Anúncio não concluído',
text: 'Assiste ao vídeo completo para ganhar a recompensa.',
icon: 'info',
timer: 2000,
showConfirmButton: false
}).then(() => _resumeGameTimer());
cb();
} else {
// Reward já foi dado — retoma timer AGORA que o anúncio fechou mesmo
_resumeGameTimer();
// Anúncio dispensado com reward — timer retoma via _resumeGameTimer()
}
});

adObj.instance.load().catch(e => {
console.log('Erro ao carregar ' + type + ':', e);
(_adLoadTimeouts[type] = setTimeout(() => { _adLoadTimeouts[type] = null; loadAd(type); }, 30000));
});
}

// Mostra/oculta o botão flutuante de anúncio para moedas
function _hideCoinOverlay() {
var o = document.getElementById('floating-coin-overlay');
if (o) { o.style.display = 'none'; o.classList.remove('active'); o.onclick = null; }
if (_fcoGlobalTimeout) { clearTimeout(_fcoGlobalTimeout); _fcoGlobalTimeout = null; }
}
function _showAdFab(visible) {
var fab = document.getElementById('fab-watch-ad');
if (!fab) return;
if (visible) { fab.classList.add('visible'); }
else         { fab.classList.remove('visible'); }
}

function _clearAnimElements() {
// Remover todos os elementos de confetti/moeda/combo que possam estar no body
var classes = ['confetti','coin-fly','coin-fly-hud','coin-center','rank-confetti-piece',
               'combo-word','combo-streak-badge','energy-loss-float','energy-restore-badge',
               'energy-loss-flash'];
classes.forEach(function(cls) {
  document.querySelectorAll('.' + cls).forEach(function(el) {
    try { el.remove(); } catch(_) {}
  });
});
}
// Limpeza total ao sair do quiz — chama-se sempre que se navega para fora do jogo
function _cleanupQuiz() {
_clearAnimElements(); // limpar confetti/moedas/combos soltos
// 1) Esconder floating-coin-overlay
_hideCoinOverlay();
// 2) Parar timer e marcar como concluído para evitar Swals posteriores
if (gameState.currentQuiz) {
if (gameState.currentQuiz.timerInterval) {
clearInterval(gameState.currentQuiz.timerInterval);
gameState.currentQuiz.timerInterval = null;
}
gameState.currentQuiz.timerPaused = true;
gameState.currentQuiz.answerSelected = true;
gameState.currentQuiz.showingResult  = true;
}
// 3) Fechar qualquer Swal e remover containers presos (causa #2 de freeze)
try { Swal.close(); } catch(_) {}
// Forçar remoção do backdrop para evitar dead-locks onde a tela não é clicável
document.querySelectorAll('.swal2-container').forEach(el => el.remove());
document.body.classList.remove('swal2-shown', 'swal2-height-auto');
document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto');

// 4) Esconder botões de quiz
var tb = document.getElementById('timer-btn');
var ra = document.getElementById('reveal-answer');
var at = document.getElementById('add-time');
if (tb) tb.style.display = 'none';
if (ra) ra.style.display = 'none';
if (at) at.style.display = 'none';
// 5) Limpar interval de espera de anúncio e intervals de pagamento
if (_aguardarAdInterval) { clearInterval(_aguardarAdInterval); _aguardarAdInterval = null; }
if (typeof _clearPaymentIntervals === 'function') _clearPaymentIntervals();
}

function _pauseGameTimer() {
if (gameState.currentQuiz) {
gameState.currentQuiz.timerPaused = true;
// Para o interval mesmo — retomado em _resumeGameTimer
if (gameState.currentQuiz.timerInterval) {
clearInterval(gameState.currentQuiz.timerInterval);
gameState.currentQuiz.timerInterval = null;
}
}
}
function _resumeGameTimer() {
if (!gameState.currentQuiz) return;
if (gameState.currentQuiz.answerSelected || gameState.currentQuiz.showingResult) return;
gameState.currentQuiz.timerPaused = false;
if (!gameState.currentQuiz.timerInterval) startTimer();
}

function showRewardedAd(type, onRewardCallback, onCancelCallback) {
_pauseGameTimer();

if (!checkInternetConnection()) {
Swal.fire({
title: 'Sem Conexão',
text: 'Precisas estar online para ver anúncios.',
icon: 'warning',
confirmButtonColor: 'var(--primary)'
});
_resumeGameTimer();if (onCancelCallback) onCancelCallback();
return;
}

if (!isAdMobAvailable()) {
_resumeGameTimer();if (onRewardCallback) onRewardCallback();
return;
}

if (!isAdMobInitialized) {
Swal.fire({ title: '⏳ A inicializar...', text: 'Aguarda um momento.', showConfirmButton: false, timer: 3000 });
setTimeout(() => showRewardedAd(type, onRewardCallback, onCancelCallback), 3000);
return;
}

var adObj = type === 'time' ? _adTime : (type === 'coins' ? _adCoins : _adReveal);

// Prevenir chamada dupla: se já existe reward/cancel pendente, ignorar
if (adObj.pendingReward || adObj.pendingCancel) {
console.log('Anúncio ' + type + ' já está em curso — ignorar nova chamada');
if (onCancelCallback) onCancelCallback();
return;
}
if (adObj.ready && adObj.instance) {
// Mostrar anúncio diretamente (sem Swal de confirmação - reduz Swals por sessão)
adObj.ready = false;
adObj.pendingReward = onRewardCallback;
adObj.pendingCancel = onCancelCallback;
adObj.instance.show().catch(e => {
console.log('Erro ao mostrar ' + type + ':', e);
adObj.pendingReward = null;
adObj.pendingCancel = null;
(_adLoadTimeouts[type] = setTimeout(() => { _adLoadTimeouts[type] = null; loadAd(type); }, 1000));
_resumeGameTimer();
if (onCancelCallback) onCancelCallback();
});
} else {
// Tenta outro anúncio como fallback
var fallbackObj = type === 'time' ? _adReveal : (type === 'coins' ? _adReveal : _adTime);
var fallbackType = type === 'time' ? 'reveal' : (type === 'coins' ? 'reveal' : 'time');

if (fallbackObj.ready && fallbackObj.instance) {
showRewardedAd(fallbackType, onRewardCallback, onCancelCallback);
return;
}

// Nenhum anúncio disponível — aguarda (limpar interval anterior se existir)
if (_aguardarAdInterval) { clearInterval(_aguardarAdInterval); _aguardarAdInterval = null; }
var tentativas = 0;
Swal.fire({
title: '⏳ A carregar anúncio...',
html: '<p style="color:#666;">Aguarda um momento...</p>',
showConfirmButton: false,
allowOutsideClick: false,
timer: 10000
});
_aguardarAdInterval = setInterval(() => {
tentativas++;
if (adObj.ready || fallbackObj.ready) {
clearInterval(_aguardarAdInterval); _aguardarAdInterval = null;
Swal.close();
var useType = adObj.ready ? type : fallbackType;
showRewardedAd(useType, onRewardCallback, onCancelCallback);
} else if (tentativas >= 20) {
clearInterval(_aguardarAdInterval); _aguardarAdInterval = null;
_resumeGameTimer();
Swal.fire({
title: 'Sem anúncios',
text: 'Nenhum anúncio disponível agora. Tenta mais tarde ou compra moedas.',
icon: 'info',
confirmButtonColor: 'var(--primary)',
timer: 3000,
showConfirmButton: false
});
if (onCancelCallback) onCancelCallback();
}
}, 500);
}
}
function checkInternetConnection() {
return navigator.onLine;
}
function showNoInternetModal() {
const modal = document.getElementById('no-internet-modal');
if (modal) {
modal.style.display = 'flex';
const icon = modal.querySelector('.fa-wifi');
if (icon) {
icon.classList.add('wifi-offline');
}
}
}
function closeInternetModal() {
const modal = document.getElementById('no-internet-modal');
if (modal) {
modal.style.display = 'none';
}
}
let audioContext = null;
try {
audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch(e) {
console.log('AudioContext não disponível:', e);
}
let soundEnabled = true;
let audioInitialized = false;
function initAudio() {
if (audioInitialized) return;
if (audioContext.state === 'suspended') {
audioContext.resume();
}
audioInitialized = true;
}
function playBeep(frequency, duration, type = 'sine', volume = 0.3) {
if (!soundEnabled || !audioContext) return;
if (audioContext.state === 'suspended') {
audioContext.resume();
}
try {
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);
oscillator.type = type;
oscillator.frequency.value = frequency;
gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
oscillator.start();
oscillator.stop(audioContext.currentTime + duration);
// Libertar nós do AudioContext após o som terminar
const _disconnectDelay = (duration + 0.15) * 1000;
setTimeout(() => {
try { oscillator.disconnect(); gainNode.disconnect(); } catch(_) {}
}, _disconnectDelay);
} catch (e) {
console.log('Erro ao reproduzir som:', e);
}
}
function playCorrectSound() {
playBeep(659.25, 0.2, 'sine', 0.4);
setTimeout(() => playBeep(783.99, 0.3, 'sine', 0.4), 150);
}
function playWrongSound() {
playBeep(220, 0.3, 'sawtooth', 0.3);
setTimeout(() => playBeep(196, 0.3, 'sawtooth', 0.3), 200);
}
function playCoinSound() {
playBeep(1318.51, 0.1, 'sine', 0.3);
setTimeout(() => playBeep(2093.00, 0.15, 'sine', 0.3), 100);
}
function playTimerSound() {
playBeep(523.25, 0.1, 'sine', 0.2);
}
function playClickSound() {
playBeep(440, 0.05, 'sine', 0.1);
}
function playButtonSound() {
playBeep(523.25, 0.05, 'sine', 0.15);
}
function playUnlockSound() {
playBeep(659.25, 0.15, 'sine', 0.3);
setTimeout(() => playBeep(783.99, 0.15, 'sine', 0.3), 150);
setTimeout(() => playBeep(987.77, 0.3, 'sine', 0.3), 300);
}
function playWinSound() {
playBeep(523.25, 0.15, 'sine', 0.3);
setTimeout(() => playBeep(587.33, 0.15, 'sine', 0.3), 150);
setTimeout(() => playBeep(659.25, 0.15, 'sine', 0.3), 300);
setTimeout(() => playBeep(698.46, 0.15, 'sine', 0.3), 450);
setTimeout(() => playBeep(783.99, 0.3, 'sine', 0.4), 600);
setTimeout(() => playBeep(880.00, 0.5, 'sine', 0.4), 900);
}
function playWelcomeSound() {
playBeep(392.00, 0.2, 'sine', 0.3);
setTimeout(() => playBeep(493.88, 0.2, 'sine', 0.3), 200);
setTimeout(() => playBeep(523.25, 0.4, 'sine', 0.4), 400);
}
let gameState = {
version: GAME_VERSION,
playerName: '',
currentClass: '5',
level: 1,
exp: 0,
expToNextLevel: 100,
coins: 50,
qi: 70,
soundEnabled: true,
theme: 'light',
energy: 7,
energyLastRestoreDate: null,
unlockedClasses: ['1', '2', '3', '4', '5', '7', '8', '11'],
unlockedDisciplines: {},
answeredQuestions: {},
correctAnswersCount: {},
rankingPosition: 75,
tutorialCompleted: false,
classes: {
'1': { name: '1ª Classe', icon: 'fa-seedling', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
'2': { name: '2ª Classe', icon: 'fa-leaf', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
'3': { name: '3ª Classe', icon: 'fa-star', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
'4': { name: '4ª Classe', icon: 'fa-star-half-alt', description: 'Modo Iniciante', requiredLevel: 1, requiredCoins: 0, starter: true },
'5': { name: '5ª Classe', icon: 'fa-school', description: 'Fundamentos básicos', requiredLevel: 1, requiredCoins: 0 },
'6': { name: '6ª Classe', icon: 'fa-book', description: 'Conhecimentos intermediários', requiredLevel: 5, requiredCoins: 100 },
'7': { name: '7ª Classe', icon: 'fa-flask', description: 'Ciências e matemática', requiredLevel: 8, requiredCoins: 200 },
'8': { name: '8ª Classe', icon: 'fa-globe', description: 'Geografia e história', requiredLevel: 12, requiredCoins: 350 },
'9': { name: '9ª Classe', icon: 'fa-calculator', description: 'Álgebra e geometria', requiredLevel: 16, requiredCoins: 500 },
'10': { name: '10ª Classe', icon: 'fa-dna', description: 'Biologia avançada', requiredLevel: 20, requiredCoins: 700 },
'11': { name: '11ª Classe', icon: 'fa-atom', description: 'Física e química', requiredLevel: 25, requiredCoins: 1000 },
'12': { name: '12ª Classe', icon: 'fa-university', description: 'Preparação universitária', requiredLevel: 30, requiredCoins: 1500 },
'13': { name: 'Direitos', icon: 'fa-gavel', description: 'Direitos e cidadania', requiredLevel: 1, requiredCoins: 200, special: true },
'14': { name: 'Inglês', icon: 'fa-language', description: 'Língua inglesa', requiredLevel: 1, requiredCoins: 200, special: true },
'15': { name: 'QI Avançado', icon: 'fa-brain', description: 'Teste de inteligência', requiredLevel: 1, requiredCoins: 300, special: true },
'16': { name: 'Cultura Geral', icon: 'fa-globe-americas', description: 'Conhecimentos gerais', requiredLevel: 15, requiredCoins: 250, special: true },
'17': { name: 'Adivinhas', icon: 'fa-grape', description: 'Desafios e enigmas', requiredLevel: 10, requiredCoins: 200, special: true }
},
classDisciplines: {
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
},
disciplineIcons: {
"Português - Básico": "fa-book-open",
"Matemática - Básica": "fa-calculator",
"Ciências - Básico": "fa-leaf",
"Inglês - Básico": "fa-language",
"Português - Iniciante": "fa-book-open",
"Matemática - Iniciante": "fa-calculator",
"Ciências - Iniciante": "fa-leaf",
"História - Iniciante": "fa-landmark",
"Matemática": "fa-calculator",
"Português": "fa-book-open",
"Ciências Sociais": "fa-users",
"Ciências Naturais": "fa-leaf",
"Inglês": "fa-language",
"História": "fa-landmark",
"Biologia": "fa-dna",
"Geografia": "fa-globe-americas",
"Física": "fa-atom",
"Química": "fa-flask",
"Empreendedorismo": "fa-chart-line",
"Filosofia": "fa-brain",
"Direitos - 1ª Fase": "fa-gavel",
"Direitos - 2ª Fase": "fa-scale-balanced",
"Direitos - 3ª Fase": "fa-file-contract",
"Direitos - 4ª Fase": "fa-balance-scale",
"Inglês - 1ª Fase": "fa-language",
"Inglês - 2ª Fase": "fa-comment",
"Inglês - 3ª Fase": "fa-book",
"Inglês - 4ª Fase": "fa-graduation-cap",
"QI - 1ª Fase": "fa-puzzle-piece",
"QI - 2ª Fase": "fa-square-root-variable",
"QI - 3ª Fase": "fa-cube",
"QI - 4ª Fase": "fa-arrows-alt",
"QI - 5ª Fase": "fa-chart-bar",
"QI - 6ª Fase": "fa-brain",
"Cultura - 1ª Fase": "fa-globe",
"Cultura - 2ª Fase": "fa-music",
"Cultura - 3ª Fase": "fa-palette",
"Cultura - 4ª Fase": "fa-film",
"Cultura - 5ª Fase": "fa-utensils",
"Cultura - 6ª Fase": "fa-futbol",
"Cultura - 7ª Fase": "fa-flask",
"Cultura - 8ª Fase": "fa-microscope",
"Cultura - 9ª Fase": "fa-landmark",
"Cultura - 10ª Fase": "fa-mask",
"Adivinhas Populares": "fa-question-circle",
"Metalinguísticas": "fa-language",
"Enigmas de Parentesco": "fa-users",
"Raciocínio": "fa-brain"
},
disciplineUnlockCost: 50,
currentQuiz: {
classId: null,
disciplineId: null,
disciplineName: null,
allQuestions: [],
availableQuestions: [],
currentQuestion: null,
totalQuestions: 0,
remainingQuestions: 0,
correctAnswers: 0,
wrongAnswers: 0,
timeLeft: 30,
timerInterval: null,
answerSelected: false,
showingResult: false,
timerPaused: false
}
};
const rankingPlayers = []; // ranking fictício removido — usar apenas dados reais do Firestore
const rotatingPhrases = [
"Prepare-se para o desafio!",
"Muitos desistem no primeiro nível",
"Se não quer aprender, melhor sair"
];
let currentPhraseIndex = 0;
function createLoadingParticles() {
const particlesContainer = document.getElementById('loading-particles');
if (!particlesContainer) return;
particlesContainer.innerHTML = '';
for (let i = 0; i < 20; i++) {
const particle = document.createElement('div');
particle.className = 'particle';
particle.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
particle.style.setProperty('--y', (Math.random() - 0.5) * 100 + 'px');
particle.style.left = Math.random() * 100 + '%';
particle.style.top = Math.random() * 100 + '%';
particle.style.animationDelay = Math.random() * 2 + 's';
particlesContainer.appendChild(particle);
}
}
var _phraseRotationInterval = null;
function startPhraseRotation() {
if (_phraseRotationInterval) clearInterval(_phraseRotationInterval);
_phraseRotationInterval = setInterval(() => {
currentPhraseIndex = (currentPhraseIndex + 1) % rotatingPhrases.length;
const phraseElement = document.getElementById('rotating-phrase');
if (phraseElement) {
phraseElement.style.opacity = '0';
setTimeout(() => {
phraseElement.textContent = rotatingPhrases[currentPhraseIndex];
phraseElement.style.opacity = '1';
}, 500);
}
}, 4000);
}
function startLoading() {
const progressBar = document.getElementById('loading-progress');
const loadingScreen = document.getElementById('loading-screen');
const gameContainer = document.getElementById('game-container');
const particles = document.getElementById('particles');
const questionParticles = document.getElementById('question-particles');
let percentage = 0;
const interval = setInterval(function() {
try {
if (percentage >= 100) {
clearInterval(interval);
loadingScreen.classList.add('fade-out');
setTimeout(() => {
loadingScreen.style.display = 'none';
// Limpar recursos do loading para liberar memória
if (_phraseRotationInterval) { clearInterval(_phraseRotationInterval); _phraseRotationInterval = null; }
var lp = document.getElementById('loading-particles');
if (lp) lp.innerHTML = '';
gameContainer.style.display = 'block';
particles.style.display = 'block';
questionParticles.style.display = 'block';
createParticles();
createQuestionParticles();
initAudio();
loadGameState();
checkDailyEnergyRestore();
// Firebase trata o fluxo de navegação (login → welcome screen / class selection)
initFirebase();
setTimeout(() => playSound('welcome'), 500);
requestFullScreen();
setTimeout(() => checkForUpdates(), 3000);
}, 500);
} else {
percentage += Math.random() * 10;
if (percentage > 100) percentage = 100;
progressBar.style.width = percentage + '%';
}
} catch (e) {
clearInterval(interval);
console.error('Erro no loading:', e);
}
}, 300);
createLoadingParticles(); // Cria apenas uma vez
startPhraseRotation();
}
function requestFullScreen() {
const element = document.documentElement;
if (element.requestFullscreen) {
element.requestFullscreen();
} else if (element.webkitRequestFullscreen) {
element.webkitRequestFullscreen();
} else if (element.msRequestFullscreen) {
element.msRequestFullscreen();
}
}
const UPDATE_CHECK_URL = _0x.d('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0JydW5vTWF0aGVycnkvcXVpem1vei1kYXRhL21haW4vdmVyc2lvbi5qc29u');
const DOWNLOAD_URL = _0x.d('aHR0cHM6Ly9wbGF5YmxtLmNvbS9xdWl6bW96');
function checkForUpdates() {
if (!navigator.onLine) return;
fetch(UPDATE_CHECK_URL + '?t=' + Date.now())
.then(response => {
if (!response.ok) throw new Error('Sem resposta');
return response.json();
})
.then(data => {
if (!data || !data.latest_version) return;
const currentVersion = GAME_VERSION;
const latestVersion = data.latest_version;
if (isNewerVersion(latestVersion, currentVersion)) {
const dismissed = localStorage.getItem('quizmoz_update_dismissed');
var dismissedData = {};
try { dismissedData = dismissed ? JSON.parse(dismissed) : {}; } catch(_) {}
if (dismissedData.version === latestVersion && dismissedData.date === new Date().toDateString()) {
return; // Já ignorou esta versão hoje
}
const isForced = data.force_update || false;
const downloadUrl = data.download_url || DOWNLOAD_URL;
const changelog = data.changelog || 'Nova versão disponível!';
showUpdateAlert(latestVersion, changelog, downloadUrl, isForced);
}
})
.catch(err => {
console.log('Verificação de atualização falhou:', err.message);
});
}
function isNewerVersion(latest, current) {
const latestParts = latest.split('.').map(Number);
const currentParts = current.split('.').map(Number);
for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
const l = latestParts[i] || 0;
const c = currentParts[i] || 0;
if (l > c) return true;
if (l < c) return false;
}
return false;
}
function showUpdateAlert(version, changelog, downloadUrl, isForced) {
const changelogHtml = changelog.split('\n').map(line => {
line = line.trim();
if (!line) return '';
if (line.startsWith('-') || line.startsWith('•')) {
return `<div style="display:flex;align-items:flex-start;gap:8px;margin:4px 0;text-align:left;">
<span style="color:#4CAF50;font-size:16px;">✓</span>
<span style="font-size:13px;color:#555;">${line.replace(/^[-•]\s*/, '')}</span>
</div>`;
}
return `<p style="font-size:13px;color:#555;margin:4px 0;text-align:left;">${line}</p>`;
}).join('');
Swal.fire({
title: '🆕 Nova Atualização!',
html: `
<div style="text-align:center;">
<div style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;padding:10px 20px;border-radius:50px;display:inline-block;margin-bottom:15px;font-weight:bold;font-size:16px;">
v${version}
</div>
<div style="background:var(--light);border-radius:16px;padding:15px;margin:10px 0;max-height:200px;overflow-y:auto;">
<p style="font-weight:bold;font-size:14px;color:var(--dark);margin-bottom:10px;text-align:left;">
<i class="fas fa-gift" style="color:var(--warning);"></i> O que há de novo:
</p>
${changelogHtml}
</div>
<p style="font-size:12px;color:#999;margin-top:10px;">
Versão atual: v${GAME_VERSION}
</p>
</div>
`,
confirmButtonText: '<i class="fas fa-download"></i> Baixar Atualização',
confirmButtonColor: '#4CAF50',
showCancelButton: !isForced,
cancelButtonText: isForced ? '' : 'Depois',
cancelButtonColor: '#999',
allowOutsideClick: !isForced,
allowEscapeKey: !isForced,
width: '360px',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
}
}).then((result) => {
if (result.isConfirmed) {
if (typeof cordova !== 'undefined' && cordova.InAppBrowser) {
cordova.InAppBrowser.open(downloadUrl, '_system');
} else {
window.open(downloadUrl, '_blank');
}
} else {
localStorage.setItem('quizmoz_update_dismissed', JSON.stringify({
version: version,
date: new Date().toDateString()
}));
}
});
}
function confirmExit() {
Swal.fire({
title: 'Sair do Jogo?',
text: 'Tem certeza que deseja sair?',
icon: 'question',
showCancelButton: true,
confirmButtonColor: 'var(--danger)',
cancelButtonColor: 'var(--primary)',
confirmButtonText: 'Sim, sair',
cancelButtonText: 'Cancelar',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
}
}).then((result) => {
if (result.isConfirmed) {
if (document.exitFullscreen) {
document.exitFullscreen();
} else if (document.webkitExitFullscreen) {
document.webkitExitFullscreen();
} else if (document.msExitFullscreen) {
document.msExitFullscreen();
}
if (navigator.app && navigator.app.exitApp) {
navigator.app.exitApp();
} else if (navigator.device && navigator.device.exitApp) {
navigator.device.exitApp();
} else {
window.close();
}
Swal.fire({
title: 'Até logo!',
text: 'Obrigado por jogar QuizMoz!',
icon: 'success',
timer: 2000,
showConfirmButton: false
}).then(() => {
if (!window.closed) {
Swal.fire({
title: 'Jogo Fechado',
text: 'Você pode fechar esta aba.',
icon: 'info',
confirmButtonColor: 'var(--primary)'
});
}
});
}
});
}
function calculateStars(disciplineId) {
const discipline = gameState.unlockedDisciplines[disciplineId];
if (!discipline || !discipline.totalQuestions) return 0;
const correctCount = gameState.correctAnswersCount[disciplineId] || 0;
const totalQuestions = discipline.totalQuestions;
const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
if (percentage >= 80) return 3;
if (percentage >= 50) return 2;
if (percentage >= 25) return 1;
return 0;
}
function createParticles() {
const particlesContainer = document.getElementById('particles');
particlesContainer.innerHTML = '';
for (let i = 0; i < 5; i++) {
const particle = document.createElement('div');
particle.className = 'particle';
particle.style.left = Math.random() * 100 + '%';
particle.style.animationDelay = Math.random() * 10 + 's';
particle.style.animationDuration = 20 + Math.random() * 15 + 's';
particlesContainer.appendChild(particle);
}
}
function createQuestionParticles() {
const container = document.getElementById('question-particles');
container.innerHTML = '';
const symbols = ['?', '!', '?'];
for (let i = 0; i < 3; i++) {
const particle = document.createElement('div');
particle.className = 'question-particle';
particle.textContent = symbols[i % symbols.length];
particle.style.left = (20 + Math.random() * 60) + '%';
particle.style.fontSize = (20 + Math.random() * 20) + 'px';
particle.style.animationDelay = Math.random() * 8 + 's';
particle.style.animationDuration = 15 + Math.random() * 10 + 's';
particle.style.opacity = '0.4';
particle.style.fontWeight = 'bold';
container.appendChild(particle);
}
}
// Limpar partículas para poupar memória
function clearAllParticles() {
var p = document.getElementById('particles');
var qp = document.getElementById('question-particles');
if (p) p.innerHTML = '';
if (qp) qp.innerHTML = '';
}
function createWinnerConfetti() {
for (let i = 0; i < 8; i++) {
setTimeout(() => {
const confetti = document.createElement('div');
confetti.className = 'confetti winner';
confetti.style.left = Math.random() * 100 + 'vw';
confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
confetti.style.width = (Math.random() * 10 + 5) + 'px';
confetti.style.height = confetti.style.width;
confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
document.body.appendChild(confetti);
setTimeout(() => { confetti.remove(); }, 3000);
}, i * 80);
}
}

// ===== SISTEMA DE RANKING VISUAL =====
const rankingTiers = [
{ minLevel: 1, maxLevel: 3, title: 'Novato', icon: '🥚', color: '#9E9E9E', desc: 'Todos começam por aqui...' },
{ minLevel: 4, maxLevel: 6, title: 'Curioso', icon: '🔍', color: '#8BC34A', desc: 'A curiosidade é o primeiro passo!' },
{ minLevel: 7, maxLevel: 10, title: 'Aprendiz', icon: '📖', color: '#4CAF50', desc: 'O conhecimento começa a fluir!' },
{ minLevel: 11, maxLevel: 15, title: 'Estudante', icon: '🎓', color: '#2196F3', desc: 'Dedicação que se nota!' },
{ minLevel: 16, maxLevel: 20, title: 'Guerreiro', icon: '⚔️', color: '#FF9800', desc: 'Ninguém te para agora!' },
{ minLevel: 21, maxLevel: 25, title: 'Estrategista', icon: '🧩', color: '#E91E63', desc: 'Pensamento afiado!' },
{ minLevel: 26, maxLevel: 30, title: 'Sábio', icon: '🦉', color: '#9C27B0', desc: 'A sabedoria fala por ti!' },
{ minLevel: 31, maxLevel: 40, title: 'Mestre', icon: '👑', color: '#FFD700', desc: 'Os outros olham para cima!' },
{ minLevel: 41, maxLevel: 50, title: 'Grão-Mestre', icon: '🏆', color: '#FF6F00', desc: 'Elite do conhecimento!' },
{ minLevel: 51, maxLevel: 65, title: 'Lenda', icon: '🌟', color: '#FFD700', desc: 'O teu nome ecoa por todo lado!' },
{ minLevel: 66, maxLevel: 80, title: 'Imortal', icon: '🔥', color: '#FF1744', desc: 'Imbatível e imparável!' },
{ minLevel: 81, maxLevel: 999, title: 'Deus do Quiz', icon: '💎', color: '#00E5FF', desc: 'Nível supremo. Lendário!' }
];

function getRankTier(level) {
for (let i = rankingTiers.length - 1; i >= 0; i--) {
if (level >= rankingTiers[i].minLevel) return rankingTiers[i];
}
return rankingTiers[0];
}

function getNextRankTier(level) {
for (let i = 0; i < rankingTiers.length; i++) {
if (level < rankingTiers[i].maxLevel && level >= rankingTiers[i].minLevel) {
return rankingTiers[i + 1] || null;
}
}
return null;
}

function showRankingLevelUp(oldLevel, newLevel) {
const oldTier = getRankTier(oldLevel);
const newTier = getRankTier(newLevel);
const nextTier = getNextRankTier(newLevel);
const tierChanged = oldTier.title !== newTier.title;

const playerScore = gameState.level * 100 + gameState.qi * 2 + gameState.coins;
const effectiveRanking = (typeof getEffectiveRanking === 'function') ? getEffectiveRanking() : rankingPlayers;
let playerRank = effectiveRanking.length + 1;
for (let i = 0; i < effectiveRanking.length; i++) {
if (playerScore > effectiveRanking[i].score) { playerRank = i + 1; break; }
}

// Build ranking list with nearby players
let nearbyPlayers = [];
const startIdx = Math.max(0, playerRank - 4);
const endIdx = Math.min(effectiveRanking.length, playerRank + 3);

for (let i = startIdx; i < endIdx; i++) {
if (i + 1 === playerRank) {
nearbyPlayers.push({ pos: playerRank, name: gameState.playerName || 'Você', level: newLevel, score: playerScore, isPlayer: true });
}
nearbyPlayers.push({ pos: i + 1 >= playerRank ? i + 2 : i + 1, name: effectiveRanking[i].name, level: effectiveRanking[i].level, score: effectiveRanking[i].score, isPlayer: false });
}

if (!nearbyPlayers.find(p => p.isPlayer)) {
nearbyPlayers.push({ pos: playerRank, name: gameState.playerName || 'Você', level: newLevel, score: playerScore, isPlayer: true });
}

nearbyPlayers.sort((a, b) => a.pos - b.pos);
nearbyPlayers = nearbyPlayers.slice(0, 7);

let listHtml = nearbyPlayers.map(p => {
const posClass = p.pos === 1 ? 'top-1' : p.pos === 2 ? 'top-2' : p.pos === 3 ? 'top-3' : '';
return `<div class="rank-list-item ${p.isPlayer ? 'is-player' : ''}" ${p.isPlayer ? 'id="rank-player-row"' : ''}>
<div class="rank-pos ${posClass}">${p.pos <= 3 ? ['🥇','🥈','🥉'][p.pos-1] : '#' + p.pos}</div>
<div class="rank-player-name">${p.isPlayer ? '⭐ ' + p.name : p.name}</div>
<div class="rank-player-score">${p.score}</div>
<div class="rank-player-lvl">Nv.${p.level}</div>
</div>`;
}).join('');

const overlay = document.createElement('div');
overlay.className = 'rank-overlay';
overlay.id = 'rank-overlay';
overlay.innerHTML = `
<div class="rank-modal">
<div class="rank-trophy">${tierChanged ? newTier.icon : '🎉'}</div>
<div class="rank-title">${tierChanged ? 'Novo Título!' : 'Nível ' + newLevel + '!'}</div>
<div class="rank-subtitle">${tierChanged ? 'Subiste de rank!' : 'Continua assim, guerreiro!'}</div>
<div class="rank-tier-display">
<div class="rank-tier-icon">${newTier.icon}</div>
<div class="rank-tier-info">
<div class="rank-tier-name" style="color:${newTier.color}">${newTier.title}</div>
<div class="rank-tier-level">Nível ${newLevel} • ${newTier.desc}</div>
</div>
</div>
${nextTier ? `<div class="rank-next-tier">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
<span>${newTier.icon} ${newTier.title}</span>
<span style="color:rgba(255,255,255,0.3);font-size:10px;">Nv.${newLevel}</span>
<span>${nextTier.icon} ${nextTier.title}</span>
</div>
<div style="width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;position:relative;">
<div style="height:100%;width:${Math.round(((newLevel - newTier.minLevel) / (nextTier.minLevel - newTier.minLevel)) * 100)}%;background:linear-gradient(90deg,${newTier.color},${nextTier.color});border-radius:10px;transition:width 1s ease;box-shadow:0 0 8px ${newTier.color}40;"></div>
</div>
<div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.4);">Faltam <strong style="color:${nextTier.color};">${nextTier.minLevel - newLevel} níveis</strong> para <strong>${nextTier.title}</strong></div>
</div>` : '<div class="rank-next-tier" style="color:#FFD700;">🏆 Título máximo alcançado!</div>'}
<div class="rank-list">${listHtml}</div>
<button class="rank-close-btn" onclick="closeRankingModal()">
${tierChanged ? '🔥 Continuar a Dominar!' : '💪 Seguir em Frente!'}
</button>
</div>`;

document.body.appendChild(overlay);

// Confetti dentro do modal
setTimeout(() => {
const modal = overlay.querySelector('.rank-modal');
if (!modal) return;
const colors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96E6A1','#FF9FF3','#54A0FF'];
for (let i = 0; i < 6; i++) {
setTimeout(() => {
const piece = document.createElement('div');
piece.className = 'rank-confetti-piece';
piece.style.left = Math.random() * 100 + '%';
piece.style.top = '-10px';
piece.style.background = colors[Math.floor(Math.random() * colors.length)];
piece.style.width = (Math.random() * 8 + 4) + 'px';
piece.style.height = piece.style.width;
piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
piece.style.animationDuration = (Math.random() * 1.5 + 2) + 's';
piece.style.animationDelay = (Math.random() * 0.5) + 's';
modal.appendChild(piece);
setTimeout(() => { piece.remove(); }, 3000);
}, i * 40);
}
}, 300);

// Animar o player row
setTimeout(() => {
const playerRow = document.getElementById('rank-player-row');
if (playerRow) {
playerRow.classList.add('moving');
setTimeout(() => {
playerRow.classList.remove('moving');
playerRow.classList.add('glow');
}, 1200);
}
}, 600);
}

function closeRankingModal() {
playSound('button');
const overlay = document.getElementById('rank-overlay');
if (overlay) {
overlay.style.opacity = '0';
overlay.style.transition = 'opacity 0.3s';
setTimeout(() => overlay.remove(), 300);
}
}
function createConfetti() {
for (let i = 0; i < 6; i++) {
setTimeout(() => {
const confetti = document.createElement('div');
confetti.className = 'confetti';
confetti.style.left = Math.random() * 100 + 'vw';
confetti.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
confetti.style.width = (Math.random() * 8 + 4) + 'px';
confetti.style.height = confetti.style.width;
confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
document.body.appendChild(confetti);
setTimeout(() => { confetti.remove(); }, 3000);
}, i * 80);
}
}
function coinCenterAnimation() {
playSound('coin');
const coin = document.createElement('div');
coin.className = 'coin-center';
coin.innerHTML = '🪙';
document.body.appendChild(coin);
const coinsElement = document.getElementById('coins-display');
const rect = coinsElement.getBoundingClientRect();
setTimeout(() => {
coin.style.transform = `translate(${rect.left - window.innerWidth/2}px, ${rect.top - window.innerHeight/2}px) scale(0.3)`;
coin.style.opacity = '0';
}, 800);
setTimeout(() => coin.remove(), 1800);
}
function coinFlyAnimation(amount, x, y) {
playSound('coin');
for (let i = 0; i < Math.min(amount / 5, 8); i++) {
setTimeout(() => {
const coin = document.createElement('div');
coin.className = 'coin-fly';
coin.innerHTML = '🪙';
coin.style.left = (x || window.innerWidth / 2) + 'px';
coin.style.top = (y || window.innerHeight / 2) + 'px';
coin.style.animationDelay = Math.random() * 0.5 + 's';
document.body.appendChild(coin);
setTimeout(() => coin.remove(), 1500);
}, i * 80);
}
}

// ===== COMBO WORDS =====
const _COMBO_LEVELS = [
null,
{ text: 'Nice! 👍',          color: '#4CAF50', size: '30px' },
{ text: 'Muito Bem! ✨',     color: '#2196F3', size: '34px' },
{ text: 'Mazza! 🔥',         color: '#FF9800', size: '38px' },
{ text: 'Incrível! ⚡',     color: '#9C27B0', size: '42px' },
{ text: 'Espetacular! 🌟',   color: '#E91E63', size: '44px' },
{ text: 'LENDÁRIO! 👑',      color: '#FFD700', size: '46px' },
{ text: 'DEUS DO QUIZ! 🏆',  color: '#FFD700', size: '46px' },
];
const _WRONG_WORDS = ['Mau! 😬', 'Muito Mau! 😱', 'Errado! ❌', 'Ai ai... 🤕'];

function showComboWord(streak) {
if (!streak || streak < 1) return;
const level = _COMBO_LEVELS[Math.min(streak, _COMBO_LEVELS.length - 1)];
if (!level) return;
const el = document.createElement('div');
el.className = 'combo-word';
el.textContent = level.text;
el.style.color = level.color;
el.style.fontSize = level.size;
el.style.textShadow = `0 2px 12px ${level.color}88, 0 0 30px ${level.color}44`;
document.body.appendChild(el);
if (streak >= 2) {
const badge = document.createElement('div');
badge.className = 'combo-streak-badge';
badge.textContent = streak + '× Combo!';
document.body.appendChild(badge);
setTimeout(() => badge.remove(), 1450);
}
setTimeout(() => el.remove(), 1450);
}

function showWrongWord() {
const text = _WRONG_WORDS[Math.floor(Math.random() * _WRONG_WORDS.length)];
const el = document.createElement('div');
el.className = 'combo-word combo-wrong';
el.textContent = text;
el.style.color = '#F44336';
el.style.fontSize = '34px';
el.style.textShadow = '0 2px 12px rgba(244,67,54,0.6)';
document.body.appendChild(el);
setTimeout(() => el.remove(), 1450);
}

function showFloatingCoinReward(amount) {
const overlay = document.getElementById('floating-coin-overlay');
if (!overlay) return;
const amountEl = document.getElementById('floating-coin-amount');
if (amountEl) amountEl.textContent = '+' + amount;
overlay.classList.add('active');
overlay.style.display = 'flex';
playSound('coin');
// Vibrar dispositivo se disponível
if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
// Remover handler antigo e definir novo
// Failsafe: esconder overlay automaticamente após 30s se não for clicado
if (_fcoGlobalTimeout) { clearTimeout(_fcoGlobalTimeout); _fcoGlobalTimeout = null; }
_fcoGlobalTimeout = setTimeout(function() {
if (overlay.style.display !== 'none') {
overlay.style.display = 'none';
overlay.classList.remove('active');
}
}, 30000);
overlay.onclick = function() {
clearTimeout(_fcoGlobalTimeout); _fcoGlobalTimeout = null;
overlay.classList.remove('active');
overlay.style.display = 'none';
const coinsEl = document.getElementById('coins-display');
var rect = null;
try { rect = coinsEl ? coinsEl.getBoundingClientRect() : null; } catch(_) {}
const tx = (rect && rect.width > 0) ? rect.left + rect.width / 2 : window.innerWidth / 2;
const ty = (rect && rect.height > 0) ? rect.top + rect.height / 2 : 60;
// Lança moedas voando para o ícone HUD
const numCoins = Math.min(Math.max(Math.ceil(amount / 10), 6), 14);
for (let i = 0; i < numCoins; i++) {
setTimeout(() => {
const coin = document.createElement('div');
coin.className = 'coin-fly-hud';
coin.innerHTML = '🪙';
const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 80;
const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 80;
coin.style.left = startX + 'px';
coin.style.top  = startY + 'px';
coin.style.setProperty('--tx', (tx - startX) + 'px');
coin.style.setProperty('--ty', (ty - startY) + 'px');
coin.style.animationDelay = (i * 0.06) + 's';
document.body.appendChild(coin);
setTimeout(() => coin.remove(), 1400);
}, i * 60);
}
// Confetti após as moedas chegarem
setTimeout(() => {
createConfetti();
createWinnerConfetti();
}, numCoins * 60 + 400);
playSound('correct');
if (navigator.vibrate) navigator.vibrate(200);
};
}
function timeAddedEffect() {
playSound('timer');
const timerBtn = document.getElementById('timer-btn');
timerBtn.classList.add('time-added');
setTimeout(() => {
timerBtn.classList.remove('time-added');
}, 1000);
}
function toggleTheme() {
gameState.theme = gameState.theme === 'light' ? 'dark' : 'light';
document.body.className = gameState.theme === 'dark' ? 'theme-dark' : '';
const themeBtn = document.getElementById('theme-btn');
themeBtn.innerHTML = gameState.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
saveGameState();
playSound('button');
}
function loadGameState() {
const saved = localStorage.getItem(_0x.d('cXVpem1vel92Nw=='));
if (saved) {
try {
const parsed = JSON.parse(saved);
const preservedClasses = { ...gameState.classes };
const preservedClassDisciplines = { ...gameState.classDisciplines };
const preservedDisciplineIcons = { ...gameState.disciplineIcons };
gameState = { ...gameState, ...parsed };
gameState.classes = preservedClasses;
gameState.classDisciplines = preservedClassDisciplines;
gameState.disciplineIcons = preservedDisciplineIcons;
if (!gameState.answeredQuestions) gameState.answeredQuestions = {};
if (!gameState.correctAnswersCount) gameState.correctAnswersCount = {};
if (!gameState.rankingPosition) gameState.rankingPosition = 75;
if (gameState.tutorialCompleted === undefined) gameState.tutorialCompleted = false;
// Limites de segurança: impede manipulação do localStorage
gameState.coins = Math.min(Math.max(parseInt(gameState.coins) || 0, 0), 99999);
gameState.level = Math.min(Math.max(parseInt(gameState.level) || 1, 1), 100);
gameState.exp = Math.min(Math.max(parseInt(gameState.exp) || 0, 0), 999999);
gameState.qi = Math.min(Math.max(parseInt(gameState.qi) || 70, 0), 300);
// Verificação de integridade: se checksum falhar, repõe valores críticos
if (typeof _verifyChecksum === 'function') {
const valid = _verifyChecksum(gameState);
if (valid === false) {
// Checksum existia mas não bate — dados foram manipulados externamente
gameState.coins = 50;
gameState.level = 1;
gameState.exp = 0;
gameState.qi = 70;
console.warn('Estado corrompido detectado — valores repostos');
if (typeof _saveChecksum === 'function') _saveChecksum(gameState); // regravar checksum corrigido
}
}
['1', '2'].forEach(id => {
if (!gameState.unlockedClasses.includes(id)) {
gameState.unlockedClasses.push(id);
}
});
if (gameState.theme === 'dark') {
document.body.className = 'theme-dark';
document.getElementById('theme-btn').innerHTML = '<i class="fas fa-sun"></i>';
}
soundEnabled = gameState.soundEnabled;
updateSoundButton();
updateHeader();
} catch (e) {
console.error('Erro ao carregar estado:', e);
}
}
}
function updateSoundButton() {
const soundBtn = document.getElementById('toggle-sound');
if (!soundBtn) return;
soundBtn.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
soundBtn.classList.toggle('muted', !soundEnabled);
}
function saveGameState() {
gameState.version = GAME_VERSION;
localStorage.setItem(_0x.d('cXVpem1vel92Nw=='), JSON.stringify(gameState));
if (typeof _saveChecksum === 'function') _saveChecksum(gameState);
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
}
function updateHeader() {
const qiElement = document.querySelector('#qi-display .qi-indicator');
if (!qiElement) return; // guard: header pode não existir ainda
qiElement.textContent = gameState.qi;
qiElement.className = 'qi-indicator';
if (gameState.qi < 90) qiElement.classList.add('qi-low');
else if (gameState.qi < 120) qiElement.classList.add('qi-medium');
else if (gameState.qi < 150) qiElement.classList.add('qi-high');
else qiElement.classList.add('qi-genius');
document.getElementById('coins-amount').textContent = gameState.coins;
document.getElementById('level-value').textContent = gameState.level;
// Atualizar energia no HUD
const energyEl = document.getElementById('energy-display');
const energyVal = document.getElementById('energy-value');
if (energyVal) energyVal.textContent = gameState.energy || 0;
if (energyEl) {
energyEl.classList.remove('energy-low', 'energy-critical');
const e = gameState.energy || 0;
if (e <= 0) energyEl.classList.add('energy-critical');
else if (e <= 2) energyEl.classList.add('energy-low');
}
// Atualizar tier
var tier = getRankTier(gameState.level);
var tierIcon = document.getElementById('tier-icon');
var tierNameEl = document.getElementById('tier-name');
if (tierIcon) tierIcon.textContent = tier.icon;
if (tierNameEl) tierNameEl.textContent = tier.title;
// Atualizar barra de XP
var xpPercent = gameState.expToNextLevel > 0 ? Math.min(100, Math.round((gameState.exp / gameState.expToNextLevel) * 100)) : 0;
var xpFill = document.getElementById('xp-bar-fill');
var xpGlow = document.getElementById('xp-bar-glow');
var xpLabel = document.getElementById('xp-bar-label');
var xpNext = document.getElementById('xp-bar-next');
if (xpFill) xpFill.style.width = xpPercent + '%';
if (xpGlow) xpGlow.style.left = Math.max(0, xpPercent - 2) + '%';
if (xpLabel) xpLabel.textContent = gameState.exp + ' / ' + gameState.expToNextLevel + ' XP';
if (xpNext) {
var nextTier = getNextRankTier(gameState.level);
xpNext.textContent = 'Nv. ' + (gameState.level + 1) + (nextTier && gameState.level + 1 >= nextTier.minLevel ? ' ' + nextTier.icon : '');
}
}
function showWelcomeScreen() {
const content = document.getElementById('main-content');
currentScreen = 'welcome';
const isGuest = (typeof guestMode !== 'undefined' && guestMode) || !(typeof currentUser !== 'undefined' && currentUser);
const effectiveRanking = ((typeof getEffectiveRanking === 'function') ? getEffectiveRanking() : null) || [];
const playerScore = gameState.level * 100 + gameState.qi * 2 + gameState.coins;
let playerRank = effectiveRanking.length + 1;
for (let i = 0; i < effectiveRanking.length; i++) {
if (playerScore > effectiveRanking[i].score) { playerRank = i + 1; break; }
}
const totalPlayers = (realRankingPlayers && realRankingPlayers.length > 0)
? (realRankingPlayers.length >= 100 ? '100+' : realRankingPlayers.length)
: '—';

// Secção de ranking: bloqueada para convidados, real para utilizadores autenticados
let rankingSectionHtml = '';
if (isGuest) {
rankingSectionHtml = `
<div class="ranking-container">
  <div class="ranking-title" onclick="playSound('button'); typeof showAuthForRanking === 'function' && showAuthForRanking()" style="cursor:pointer;">
    <i class="fas fa-trophy"></i>
    <span>Ranking Global</span>
    <span style="font-size:11px;background:#FFB5A7;color:#2F4858;padding:2px 8px;border-radius:50px;margin-left:8px;font-weight:700;">LOGIN</span>
  </div>
  <div style="text-align:center;padding:28px 16px;">
    <div style="font-size:52px;margin-bottom:10px;filter:grayscale(0.3);">🔒</div>
    <p style="color:#555;font-size:14px;margin-bottom:6px;font-weight:600;">Entra para ver o Ranking Global</p>
    <p style="color:#888;font-size:12px;margin-bottom:16px;">Compara-te com jogadores de todo Moçambique!</p>
    <button onclick="playSound('button'); typeof showAuthForRanking === 'function' && showAuthForRanking()" style="
      background: linear-gradient(135deg,#5E9B9D,#4A7C7E); color:white; border:none;
      padding:12px 28px; border-radius:50px; font-size:14px; font-weight:700;
      cursor:pointer; font-family:'Quicksand',sans-serif; box-shadow:0 4px 12px rgba(94,155,157,0.4);">
      <i class="fas fa-sign-in-alt"></i> Entrar / Criar conta
    </button>
  </div>
</div>`;
} else {
let rankingHtml = '';
const displayPlayers = effectiveRanking.slice(0, 10);
displayPlayers.forEach((player, index) => {
const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
const isMe = player.isCurrentUser || playerRank === index + 1;
rankingHtml += `<div class="ranking-item ${isMe ? 'player-rank' : ''}">
<span class="ranking-position">${medal}</span>
<span class="ranking-name">${player.tierIcon || ''} ${player.name}</span>
<span class="ranking-level">Nv.${player.level}</span>
<span class="ranking-score">${player.score}</span>
</div>`;
});
if (playerRank > 10) {
rankingHtml += `<div class="ranking-item player-rank">
<span class="ranking-position">#${playerRank}</span>
<span class="ranking-name">⭐ ${gameState.playerName || 'Você'}</span>
<span class="ranking-level">Nv.${gameState.level}</span>
<span class="ranking-score">${playerScore}</span>
</div>`;
}
if (!rankingHtml) {
// Sem dados ainda — tentar buscar e mostrar botão de reload
if (typeof fetchRealRanking === 'function' && typeof db !== 'undefined' && db) {
fetchRealRanking(); // dispara nova tentativa em background
}
rankingHtml = `<div style="text-align:center;padding:22px 16px;">
  <div style="font-size:36px;margin-bottom:8px;">🏆</div>
  <p style="color:#666;font-size:14px;margin-bottom:12px;">A atualizar o Ranking Global...</p>
  <button onclick="playSound('button'); if(typeof fetchRealRanking==='function') fetchRealRanking(); showWelcomeScreen();"
    style="background:var(--primary);color:white;border:none;padding:10px 22px;border-radius:50px;font-size:13px;cursor:pointer;font-family:'Quicksand',sans-serif;font-weight:700;">
    <i class="fas fa-sync-alt"></i> Atualizar
  </button>
</div>`;
}
rankingSectionHtml = `
<div class="ranking-container">
  <div class="ranking-title">
    <i class="fas fa-trophy"></i>
    <span>Ranking Global</span>
  </div>
  ${rankingHtml}
  ${effectiveRanking.length > 0 ? `<div style="text-align:center;margin-top:15px;font-size:12px;color:var(--gray);">toca no livro👆 Tua posição: #${playerRank} de ${totalPlayers} jogadores</div>` : ''}
</div>`;
}

content.innerHTML = `
<div style="max-width: 500px; margin: 0 auto;">
<div class="quiz-logo">
<h1>QUIZ MOZ</h1>
</div>
<div style="text-align: center; margin-bottom: 20px;">
<div class="book-wrapper" id="welcomeBookWrapper">
<div class="book closed" id="welcomeBook">
<div class="cover"></div>
<div class="cover-title">QUIZ MOZ</div>
<div class="spine"></div>
<div class="detail detail-1"></div>
<div class="detail detail-2"></div>
<div class="detail detail-3"></div>
<div class="page-left"></div>
<div class="page-right"></div>
<div class="page-center" id="welcomePageText"></div>
<div class="question-mark" style="--x: 80px; --rot: 25deg; left: 35%; top: 25%;">?</div>
<div class="question-mark" style="--x: -70px; --rot: -20deg; left: 65%; top: 35%;">?</div>
<div class="question-mark" style="--x: 50px; --rot: 15deg; left: 45%; top: 60%;">?</div>
<div class="question-mark" style="--x: -90px; --rot: -30deg; left: 55%; top: 45%;">?</div>
<div class="question-mark" style="--x: 40px; --rot: 22deg; left: 30%; top: 70%;">?</div>
<div class="question-mark" style="--x: -60px; --rot: -12deg; left: 70%; top: 55%;">?</div>
</div>
<div class="ripple-container">
<div class="ripple"></div>
<div class="ripple"></div>
<div class="ripple"></div>
<div class="ripple"></div>
<div class="ripple"></div>
<div class="ripple"></div>
</div>
</div>
</div>
<div style="background: white; padding: 20px; border-radius: 25px; box-shadow: var(--soft-shadow); margin-bottom: 16px;">
<div style="margin-bottom: 6px; font-size: 12px; color: var(--gray); font-family: 'Quicksand', sans-serif; padding-left: 8px;">
  <i class="fas fa-user-tag" style="color:var(--primary);"></i> Nickname <span style="color:var(--primary);font-weight:700;">(aparece no Ranking)</span>
</div>
<div style="margin-bottom: 15px; position: relative;">
<input type="text" id="player-name" placeholder="Ex: QuizMaster99" value="${gameState.playerName}"
  maxlength="20"
  style="width: 100%; padding: 15px 50px 15px 20px; border: 2px solid var(--secondary); border-radius: 50px; font-size: 16px; font-family: 'Quicksand', sans-serif; font-weight: 700; box-sizing: border-box;">
<i class="fas fa-pencil-alt" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);color:var(--gray);pointer-events:none;"></i>
</div>
<button onclick="playSound('button'); startGame()" style="background: var(--primary); color: white; border: none; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s; width: 100%;">
<i class="fas fa-play"></i> Começar Jornada
</button>
</div>
<button onclick="playSound('button'); watchAdForCoins()" style="
  width:100%; padding:16px; border:none; border-radius:20px; cursor:pointer;
  background: linear-gradient(135deg, #FF6B35 0%, #F7C948 100%);
  color:white; font-size:16px; font-weight:700;
  font-family:'Quicksand',sans-serif; margin-bottom:16px;
  display:flex; align-items:center; justify-content:center; gap:10px;
  box-shadow: 0 6px 20px rgba(255,107,53,0.45);
  transition: transform 0.15s; animation: adBtnPulse 3s ease-in-out infinite;">
  <i class="fas fa-play-circle" style="font-size:22px;"></i>
  <span>Ver Anúncio → Ganhar <strong>🪙 +10 Moedas</strong></span>
</button>
${rankingSectionHtml}
</div>
`;
initWelcomeBook();
_showAdFab(false); // ocultar FAB na welcome screen
document.getElementById('floating-controls').style.display = 'none';
document.getElementById('home-btn').style.display = 'none';
document.getElementById('exit-btn').style.display = 'flex';
}
function initWelcomeBook() {
const book = document.getElementById('welcomeBook');
const pageText = document.getElementById('welcomePageText');
if (!book || !pageText) return;
const rippleContainer = document.querySelector('.ripple-container');
if (rippleContainer) {
rippleContainer.classList.remove('ripple-active');
void rippleContainer.offsetWidth; // force reflow
rippleContainer.classList.add('ripple-active');
setTimeout(() => {
rippleContainer.classList.remove('ripple-active');
}, 3500);
}
let isOpen = false;
let timeoutId = null;
let currentPhraseIndex = 0;
const phrases = [
"📚 QUIZ MOZ - O CONHECIMENTO ESPERA POR TI!",
"⚡ TESTA O TEU SABER!",
"🇲🇿 VAMOS APRENDER!",
"🎯 CADA PERGUNTA É UMA OPORTUNIDADE DE CRESCER!",
"💡 SABER NÃO OCUPA LUGAR... Djo!",
"🌟 DESBLOQUEIA NOVAS CLASSES E DISCIPLINAS!",
"🧠 TESTA O TEU QI E SOBE NO RANKING!",
"🏆 CONQUISTA ESTRELAS E MOSTRA O TEU VALOR!",
"⏰ O TEMPO NÃO ESPERA... RESPONDE RÁPIDO!",
"📖 CADA LIVRO É UMA NOVA AVENTURA!"
];
function showTextOnPage(text) {
pageText.textContent = text;
}
function animateQuestionMarks() {
const marks = book.querySelectorAll('.question-mark');
marks.forEach(mark => {
mark.classList.remove('floating');
void mark.offsetWidth;
mark.classList.add('floating');
});
}
function getRandomPhrase() {
let newIndex;
do {
newIndex = Math.floor(Math.random() * phrases.length);
} while (newIndex === currentPhraseIndex && phrases.length > 1);
currentPhraseIndex = newIndex;
return phrases[currentPhraseIndex];
}
function openBook() {
if (isOpen) return;
isOpen = true;
book.classList.remove('closed');
book.classList.add('open');
const phrase = getRandomPhrase();
showTextOnPage(phrase);
animateQuestionMarks();
if (timeoutId) clearTimeout(timeoutId);
timeoutId = setTimeout(() => {
closeBook();
setTimeout(() => {
if (!isOpen) {
book.classList.add('pulsing');
setTimeout(() => {
book.classList.remove('pulsing');
}, 3000);
}
}, 2000);
}, 4000);
}
function closeBook() {
if (!isOpen) return;
isOpen = false;
book.classList.remove('open');
book.classList.add('closed');
book.classList.remove('pulsing');
pageText.textContent = '';
const marks = book.querySelectorAll('.question-mark');
marks.forEach(mark => {
mark.style.animation = 'none';
});
if (timeoutId) {
clearTimeout(timeoutId);
timeoutId = null;
}
}
function toggleBook() {
if (isOpen) {
closeBook();
} else {
openBook();
}
}
book.addEventListener('click', toggleBook);
}
function openAbout() {
playSound('button');
Swal.fire({
title: 'Sobre o QuizMoz',
html: `
<div style="text-align: left;">
<p style="margin-bottom: 15px;"><i class="fas fa-gamepad" style="color: var(--primary);"></i> <strong>QuizMoz</strong> é um jogo educacional interativo desenvolvido para testar e expandir seus conhecimentos em diversas disciplinas.</p>
<p style="margin-bottom: 15px;"><i class="fas fa-star" style="color: var(--warning);"></i> <strong>Características:</strong><br>
• Múltiplas classes e disciplinas<br>
• Sistema de progressão com níveis<br>
• Ranking competitivo<br>
• Moedas e recompensas<br>
• Temas claro/escuro</p>
<p style="margin-bottom: 15px;"><i class="fas fa-envelope" style="color: var(--primary);"></i> <strong>Contato:</strong><br>
<a href="mailto:jogosdequiz.pt@gmail.com" style="color: var(--primary); text-decoration: none;">jogosdequiz.pt@gmail.com</a></p>
<p style="margin-bottom: 5px;"><i class="fas fa-shield-alt" style="color: var(--success);"></i> <strong>Política de Privacidade:</strong></p>
<p style="font-size: 13px; background: var(--light); padding: 10px; border-radius: 10px; margin-bottom: 10px;">
Seus dados são armazenados localmente no seu dispositivo. Não coletamos informações pessoais sem seu consentimento. Para mais informações, entre em contato pelo e-mail acima.
</p>
<p style="font-size: 12px; color: var(--gray); text-align: center; margin-top: 15px;">
Versão ${GAME_VERSION} &copy; 2025 QuizMoz
</p>
</div>
`,
icon: 'info',
confirmButtonText: 'Fechar',
confirmButtonColor: 'var(--primary)',
width: '400px',
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
});
}
function startGame() {
const nameInput = document.getElementById('player-name');
const rawName = nameInput ? nameInput.value.trim() : '';
// Sanitizar: remover caracteres especiais, limitar a 20 chars
const sanitized = rawName.replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().substring(0, 20);

if (sanitized && sanitized.length >= 2) {
gameState.playerName = sanitized;
saveGameState();
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
} else if (!gameState.playerName) {
// Sem nickname — pedir antes de continuar
Swal.fire({
title: '✏️ Nickname obrigatório',
html: `<p style="color:#666;margin-bottom:12px;">Escolhe um nickname para aparecer no Ranking!</p>
       <input type="text" id="swal-pname2" class="swal2-input"
              placeholder="Ex: QuizMaster99" maxlength="20"
              style="text-align:center;font-size:17px;font-weight:700;">`,
confirmButtonText: '🚀 Jogar!',
confirmButtonColor: 'var(--primary)',
allowOutsideClick: false,
didOpen: () => {
const inp = document.getElementById('swal-pname2');
if (inp) setTimeout(() => inp.focus(), 100);
},
preConfirm: () => {
const v = document.getElementById('swal-pname2').value.replace(/[<>&"'`\\]/g,'').trim();
if (!v || v.length < 2) { Swal.showValidationMessage('Mínimo 2 caracteres'); return false; }
return v.substring(0, 20);
}
}).then(r => {
if (r.isConfirmed) {
gameState.playerName = r.value;
saveGameState();
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
showClassSelection();
document.getElementById('floating-controls').style.display = 'flex';
document.getElementById('home-btn').style.display = 'flex';
document.getElementById('exit-btn').style.display = 'flex';
}
});
return;
}

showClassSelection();
document.getElementById('floating-controls').style.display = 'flex';
document.getElementById('home-btn').style.display = 'flex';
document.getElementById('exit-btn').style.display = 'flex';
}
function goToWelcomeScreen() {
_showAdFab(false);
_cleanupQuiz(); // limpeza total: timer, overlay, Swal containers
const p = document.getElementById('particles');
const qp = document.getElementById('question-particles');
if (p) p.innerHTML = '';
if (qp) qp.innerHTML = '';
showWelcomeScreen();
}
function showClassSelection() {
currentScreen = 'classes';
const homeBtn = document.getElementById('home-btn');
if (homeBtn) {
homeBtn.innerHTML = '<i class="fas fa-home"></i>';
homeBtn.title = 'Início';
homeBtn.onclick = function() { playSound('button'); goToWelcomeScreen(); };
}
const content = document.getElementById('main-content');
const regularClasses = [];
const specialClasses = [];
Object.entries(gameState.classes).forEach(([classId, classData]) => {
if (classData.special) {
specialClasses.push([classId, classData]);
} else {
regularClasses.push([classId, classData]);
}
});
regularClasses.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
specialClasses.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
let html = '<h2 style="margin-bottom: 15px; color: var(--dark); font-size: 22px;">Selecione sua Classe</h2>';
const starterClasses = regularClasses.filter(([id]) => gameState.classes[id].starter);
const normalClasses = regularClasses.filter(([id]) => !gameState.classes[id].starter);
if (starterClasses.length > 0) {
html += '<div style="margin-bottom:8px;"><span style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#333;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;">⭐ MODO INICIANTE</span></div>';
html += '<div class="cards-grid" style="margin-bottom:18px;">';
for (const [classId, classData] of starterClasses) {
const isUnlocked = gameState.unlockedClasses.includes(classId);
const disciplinesCount = gameState.classDisciplines[classId]?.length || 0;
let totalStars = 0;
let disciplinesWithStars = 0;
if (gameState.classDisciplines[classId]) {
gameState.classDisciplines[classId].forEach(disciplineName => {
const disciplineId = `${classId}_${disciplineName.toLowerCase().replace(/\s+/g, '_')}`;
const stars = calculateStars(disciplineId);
totalStars += stars;
if (gameState.unlockedDisciplines[disciplineId]?.totalQuestions > 0) disciplinesWithStars++;
});
}
const avgStars = disciplinesWithStars > 0 ? Math.round(totalStars / disciplinesWithStars) : 0;
const classStars = Math.min(3, avgStars);
html += `
<div class="game-card" onclick="playSound('button'); showDisciplines('${classId}')" style="border:2px solid #FFD700; background:linear-gradient(145deg,#FFF9E6,#FFF3CC); border-radius:20px; padding:15px 12px; cursor:pointer; transition:all 0.2s;">
<div class="card-icon" style="color:#FFA500;font-size:32px;margin-bottom:10px;"><i class="fas ${classData.icon}"></i></div>
<div class="card-title">${classData.name}</div>
<div class="card-description">${classData.description}</div>
<div style="font-size:11px;color:#666;margin-top:4px;">📚 ${disciplinesCount} disciplinas</div>
${disciplinesCount > 0 ? `
<div class="stars" style="margin-top:5px;">
${'<i class="fas fa-star" style="color: #FFD700;"></i>'.repeat(classStars)}${'<i class="far fa-star" style="color: #ccc;"></i>'.repeat(3 - classStars)}
</div>
` : ''}
</div>`;
}
html += '</div>';
html += '<div style="margin-bottom:8px;"><span style="background:linear-gradient(135deg,#5E9B9D,#4A7C7E);color:white;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;">📚 CLASSES REGULARES</span></div>';
}
if (normalClasses.length > 0) {
regularClasses.length = 0;
normalClasses.forEach(c => regularClasses.push(c));
}
if (regularClasses.filter(([id]) => !gameState.classes[id].starter).length > 0) {
html += '<div class="cards-grid">';
for (const [classId, classData] of regularClasses) {
const isUnlocked = gameState.unlockedClasses.includes(classId);
const disciplinesCount = gameState.classDisciplines[classId]?.length || 0;
let totalStars = 0;
let disciplinesWithStars = 0;
if (gameState.classDisciplines[classId]) {
gameState.classDisciplines[classId].forEach(disciplineName => {
const disciplineId = `${classId}_${disciplineName.toLowerCase().replace(/\s+/g, '_')}`;
const stars = calculateStars(disciplineId);
totalStars += stars;
if (gameState.unlockedDisciplines[disciplineId]?.totalQuestions > 0) disciplinesWithStars++;
if (gameState.unlockedDisciplines[disciplineId]) {
gameState.unlockedDisciplines[disciplineId].stars = stars;
}
});
}
const avgStars = disciplinesWithStars > 0 ? Math.round(totalStars / disciplinesWithStars) : 0;
const classStars = Math.min(3, avgStars);
html += `
<div class="card ${!isUnlocked ? 'locked' : ''}" onclick="playSound('button'); ${isUnlocked ? `selectClass('${classId}')` : `tryUnlockClass('${classId}')`}">
<div class="card-icon"><i class="fas ${classData.icon}"></i></div>
<div class="card-title">${classData.name}</div>
<div class="card-description">${classData.description}</div>
<div style="font-size: 12px; color: var(--primary); margin-bottom: 5px;">
<i class="fas fa-book"></i> ${disciplinesCount} disciplinas
</div>
${disciplinesCount > 0 ? `
<div class="stars">
${'<i class="fas fa-star" style="color: #FFD700;"></i>'.repeat(classStars)}${'<i class="far fa-star" style="color: #ccc;"></i>'.repeat(3 - classStars)}
<span style="font-size: 11px; margin-left: 5px;">${totalStars}/${disciplinesCount * 3}</span>
</div>
` : ''}
${!isUnlocked ? `
<div class="card-requirements">
<i class="fas fa-lock"></i> Nv. ${classData.requiredLevel} • ${classData.requiredCoins} 🪙
</div>
` : ''}
</div>
`;
}
html += '</div>';
}
if (specialClasses.length > 0) {
html += `
<div class="section-divider special">
<span><i class="fas fa-star"></i> CLASSES ESPECIAIS <i class="fas fa-star"></i></span>
</div>
<div class="cards-grid">
`;
for (const [classId, classData] of specialClasses) {
const isUnlocked = gameState.unlockedClasses.includes(classId);
const disciplinesCount = gameState.classDisciplines[classId]?.length || 0;
let totalStars = 0;
let disciplinesWithStars = 0;
if (gameState.classDisciplines[classId]) {
gameState.classDisciplines[classId].forEach(disciplineName => {
const disciplineId = `${classId}_${disciplineName.toLowerCase().replace(/\s+/g, '_')}`;
const stars = calculateStars(disciplineId);
totalStars += stars;
if (gameState.unlockedDisciplines[disciplineId]?.totalQuestions > 0) disciplinesWithStars++;
if (gameState.unlockedDisciplines[disciplineId]) {
gameState.unlockedDisciplines[disciplineId].stars = stars;
}
});
}
const avgStars = disciplinesWithStars > 0 ? Math.round(totalStars / disciplinesWithStars) : 0;
const classStars = Math.min(3, avgStars);
html += `
<div class="card special ${!isUnlocked ? 'locked' : ''}" onclick="playSound('button'); ${isUnlocked ? `selectClass('${classId}')` : `tryUnlockClass('${classId}')`}">
<div class="card-icon"><i class="fas ${classData.icon}"></i></div>
<div class="card-title">${classData.name}</div>
<div class="card-description">${classData.description}</div>
<span class="badge special-badge">ESPECIAL</span>
<div style="font-size: 12px; color: #FFD700; margin: 8px 0 5px;">
<i class="fas fa-book"></i> ${disciplinesCount} disciplinas
</div>
${disciplinesCount > 0 ? `
<div class="stars">
${'<i class="fas fa-star" style="color: #FFD700;"></i>'.repeat(classStars)}${'<i class="far fa-star" style="color: rgba(255,255,255,0.4);"></i>'.repeat(3 - classStars)}
<span style="font-size: 11px; margin-left: 5px;">${totalStars}/${disciplinesCount * 3}</span>
</div>
` : ''}
${!isUnlocked ? `
<div class="card-requirements">
<i class="fas fa-lock"></i> ${classData.requiredLevel > 1 ? 'Nv.' + classData.requiredLevel + ' • ' : ''}${classData.requiredCoins} 🪙
</div>
` : ''}
</div>
`;
}
html += '</div>';
}
content.innerHTML = html;
updateHeader();
saveGameState();
_hideCoinOverlay(); _clearAnimElements();
_showAdFab(true); // mostrar FAB nas classes
}
function tryUnlockClass(classId) {
const classData = gameState.classes[classId];
let canUnlock = false;
let requirementsMessage = '';
if (classData.special) {
if (classData.requiredLevel > 1) {
canUnlock = gameState.level >= classData.requiredLevel && gameState.coins >= classData.requiredCoins;
requirementsMessage = `Nível ${classData.requiredLevel} e ${classData.requiredCoins} 🪙`;
} else {
canUnlock = gameState.coins >= classData.requiredCoins;
requirementsMessage = `${classData.requiredCoins} 🪙`;
}
} else {
canUnlock = gameState.level >= classData.requiredLevel && gameState.coins >= classData.requiredCoins;
requirementsMessage = `Nível ${classData.requiredLevel} e ${classData.requiredCoins} 🪙`;
}
if (canUnlock) {
Swal.fire({
title: 'Desbloquear Classe?',
text: `Você usará ${classData.requiredCoins} moedas para desbloquear ${classData.name}`,
icon: 'question',
showCancelButton: true,
confirmButtonColor: 'var(--success)',
cancelButtonColor: 'var(--danger)',
confirmButtonText: 'Sim!',
cancelButtonText: 'Cancelar',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
}
}).then((result) => {
if (result.isConfirmed) {
gameState.coins -= classData.requiredCoins;
gameState.unlockedClasses.push(classId);
saveGameState();
playSound('unlock');
coinFlyAnimation(-classData.requiredCoins);
Swal.fire({
title: 'Desbloqueado!',
text: `Parabéns! Você desbloqueou ${classData.name}!`,
icon: 'success',
timer: 2000,
showConfirmButton: false
});
showClassSelection();
}
});
} else {
Swal.fire({
title: 'Classe Bloqueada',
html: `
<p>Você precisa de:</p>
<p><strong>${requirementsMessage}</strong></p>
<button onclick="playSound('button'); openShop()" style="margin-top: 15px; background: var(--warning); color: var(--dark); border: none; padding: 10px 20px; border-radius: 50px; font-size: 14px; cursor: pointer;">
<i class="fas fa-shopping-cart"></i> Comprar Moedas
</button>
`,
icon: 'warning',
confirmButtonColor: 'var(--primary)',
showCancelButton: true,
cancelButtonText: 'Fechar',
confirmButtonText: 'Bem vindo ✨',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
},
willClose: (result) => {
if (result.isConfirmed) {
openShop();
}
}
});
}
}
function selectClass(classId) {
gameState.currentClass = classId;
saveGameState();
showDisciplines(classId);
}
function showDisciplines(classId) {
currentScreen = 'disciplines';
const homeBtn = document.getElementById('home-btn');
if (homeBtn) {
homeBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
homeBtn.title = 'Voltar às Classes';
homeBtn.onclick = function() { playSound('button'); showClassSelection(); };
}
const content = document.getElementById('main-content');
const disciplines = gameState.classDisciplines[classId] || [];
let html = `<h2 style="margin-bottom: 15px; color: var(--dark);">${gameState.classes[classId].name}</h2>`;
html += '<div class="cards-grid">';
disciplines.forEach((disciplineName, index) => {
const disciplineId = `${classId}_${disciplineName.toLowerCase().replace(/\s+/g, '_')}`;
const icon = gameState.disciplineIcons[disciplineName] || 'fa-book';
const isFirst = index === 0;
const isUnlocked = gameState.unlockedDisciplines[disciplineId]?.unlocked || isFirst;
const totalQuestions = gameState.unlockedDisciplines[disciplineId]?.totalQuestions || 0;
const answeredCount = gameState.answeredQuestions[disciplineId]?.length || 0;
const isCompleted = totalQuestions > 0 && answeredCount >= totalQuestions;
const hasProgress = answeredCount > 0 && !isCompleted;
const stars = calculateStars(disciplineId);
const progressPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
html += `
<div class="card ${!isUnlocked ? 'locked' : ''}" onclick="playSound('button'); ${isUnlocked ? `handleDisciplineClick('${classId}', '${disciplineId}', '${disciplineName}', ${isCompleted})` : `tryUnlockDiscipline('${classId}', '${disciplineId}', '${disciplineName}')`}">
<div class="card-icon"><i class="fas ${icon}"></i></div>
<div class="card-title">${disciplineName}</div>
${isUnlocked && totalQuestions > 0 ? `
<div class="progress-container">
<div class="progress-bar" style="width: ${progressPercentage}%;"></div>
</div>
<div class="progress-text">
${answeredCount}/${totalQuestions} perguntas (${progressPercentage}%)
</div>
` : ''}
<div class="stars">
${'<i class="fas fa-star" style="color: #FFD700; text-shadow: 0 0 4px rgba(255,215,0,0.4);"></i>'.repeat(stars)}
${'<i class="far fa-star" style="color: #ccc;"></i>'.repeat(3 - stars)}
</div>
${!isUnlocked ?
`<span class="badge pending"><i class="fas fa-lock"></i> ${gameState.disciplineUnlockCost} 🪙</span>` :
isCompleted ?
`<span class="badge completed"><i class="fas fa-check-circle"></i> Concluído</span>` :
hasProgress ?
`<span class="badge pending"><i class="fas fa-clock"></i> Em andamento</span>` :
`<span class="badge start"><i class="fas fa-play"></i> Iniciar</span>`
}
</div>
`;
});
html += '</div>';
html += `
<div style="text-align: center; margin-top: 20px;">
<button onclick="playSound('button'); showClassSelection()" style="background: var(--primary); color: white; border: none; padding: 12px 25px; border-radius: 50px; font-size: 15px; font-weight: 600; cursor: pointer;">
<i class="fas fa-arrow-left"></i> Voltar
</button>
</div>
`;
content.innerHTML = html;
saveGameState();
_hideCoinOverlay(); _clearAnimElements();
_showAdFab(true); // mostrar FAB nas disciplinas
}
function handleDisciplineClick(classId, disciplineId, disciplineName, isCompleted) {
if (isCompleted) {
Swal.fire({
title: disciplineName,
html: `
<p>O que você deseja fazer?</p>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
<button onclick="playSound('button'); restartDiscipline('${classId}', '${disciplineId}', '${disciplineName}')" style="background: var(--primary); color: white; border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer;">
<i class="fas fa-redo"></i> Recomeçar Disciplina
</button>
<button onclick="playSound('button'); reviewDiscipline('${classId}', '${disciplineId}', '${disciplineName}')" style="background: var(--warning); color: var(--dark); border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer;">
<i class="fas fa-eye"></i> Revisar Disciplina
</button>
<button onclick="Swal.close()" style="background: var(--gray); color: white; border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer;">
<i class="fas fa-times"></i> Cancelar
</button>
</div>
`,
showConfirmButton: false,
showCloseButton: true,
background: 'white',
didOpen: () => {
const _sx = document.querySelector('.swal2-close'); if (_sx) _sx.addEventListener('click', () => playSound('button'), {once:true});
}
});
} else {
startQuiz(classId, disciplineId, disciplineName);
}
}
function restartDiscipline(classId, disciplineId, disciplineName) {
Swal.close();
Swal.fire({
title: 'Recomeçar Disciplina?',
text: 'Todo o seu progresso nesta disciplina será resetado. Deseja continuar?',
icon: 'warning',
showCancelButton: true,
confirmButtonColor: 'var(--success)',
cancelButtonColor: 'var(--danger)',
confirmButtonText: 'Sim, recomeçar',
cancelButtonText: 'Cancelar',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
}
}).then((result) => {
if (result.isConfirmed) {
gameState.answeredQuestions[disciplineId] = [];
gameState.correctAnswersCount[disciplineId] = 0;
if (gameState.unlockedDisciplines[disciplineId]) {
gameState.unlockedDisciplines[disciplineId].stars = 0;
gameState.unlockedDisciplines[disciplineId].completed = false;
}
saveGameState();
playSound('unlock');
Swal.fire({
title: 'Disciplina Resetada!',
text: 'Agora você pode recomeçar do início.',
icon: 'success',
timer: 2000,
showConfirmButton: false
});
showDisciplines(classId);
}
});
}
function reviewDiscipline(classId, disciplineId, disciplineName) {
Swal.close();
Swal.fire({
title: 'Revisar Disciplina',
text: 'Você poderá responder todas as perguntas novamente. O progresso será mantido?',
icon: 'question',
showCancelButton: true,
confirmButtonColor: 'var(--success)',
confirmButtonText: 'Sim, revisar',
cancelButtonText: 'Cancelar',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
}
}).then((result) => {
if (result.isConfirmed) {
startQuiz(classId, disciplineId, disciplineName);
}
});
}
function tryUnlockDiscipline(classId, disciplineId, disciplineName) {
if (gameState.coins >= gameState.disciplineUnlockCost) {
Swal.fire({
title: 'Desbloquear Disciplina?',
text: `Você usará ${gameState.disciplineUnlockCost} moedas para desbloquear ${disciplineName}`,
icon: 'question',
showCancelButton: true,
confirmButtonColor: 'var(--success)',
cancelButtonColor: 'var(--danger)',
confirmButtonText: 'Sim!',
cancelButtonText: 'Cancelar',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
}
}).then((result) => {
if (result.isConfirmed) {
gameState.coins -= gameState.disciplineUnlockCost;
if (!gameState.unlockedDisciplines[disciplineId]) {
gameState.unlockedDisciplines[disciplineId] = { unlocked: true };
} else {
gameState.unlockedDisciplines[disciplineId].unlocked = true;
}
saveGameState();
playSound('unlock');
coinFlyAnimation(-gameState.disciplineUnlockCost);
Swal.fire({
title: 'Disciplina Desbloqueada!',
text: `Agora você pode jogar ${disciplineName}!`,
icon: 'success',
timer: 2000,
showConfirmButton: false
});
showDisciplines(classId);
}
});
} else {
Swal.fire({
title: 'Moedas Insuficientes',
html: `
<p>Você precisa de ${gameState.disciplineUnlockCost} moedas.</p>
<button onclick="playSound('button'); openShop()" style="margin-top: 15px; background: var(--warning); color: var(--dark); border: none; padding: 10px 20px; border-radius: 50px; font-size: 14px; cursor: pointer;">
<i class="fas fa-shopping-cart"></i> Comprar Moedas
</button>
`,
icon: 'warning',
confirmButtonColor: 'var(--primary)',
showCancelButton: true,
cancelButtonText: 'Fechar',
confirmButtonText: 'Bem vindo ✨',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
},
willClose: (result) => {
if (result.isConfirmed) {
openShop();
}
}
});
}
}
function mapDisciplineToFileName(classId, disciplineName) {
if (classId === '1') {
const map = {
"Português - Básico": "portugues_basico.json",
"Matemática - Básica": "matematica_basica.json"
};
return map[disciplineName] ? `classe1/${map[disciplineName]}` : null;
}
else if (classId === '2') {
const map = {
"Ciências - Básico": "ciencias_basico.json",
"Inglês - Básico": "ingles_basico.json"
};
return map[disciplineName] ? `classe2/${map[disciplineName]}` : null;
}
else if (classId === '3') {
const map = {
"Português - Iniciante": "portugues_iniciante.json",
"Matemática - Iniciante": "matematica_iniciante.json"
};
return map[disciplineName] ? `classe3/${map[disciplineName]}` : null;
}
else if (classId === '4') {
const map = {
"Ciências - Iniciante": "ciencias_iniciante.json",
"História - Iniciante": "historia_iniciante.json"
};
return map[disciplineName] ? `classe4/${map[disciplineName]}` : null;
}
else if (classId === '13') {
const phaseMap = {
"Direitos - 1ª Fase": "1_fase.json",
"Direitos - 2ª Fase": "2_fase.json",
"Direitos - 3ª Fase": "3_fase.json",
"Direitos - 4ª Fase": "4_fase.json"
};
return phaseMap[disciplineName] ? `classe13/${phaseMap[disciplineName]}` : null;
}
else if (classId === '14') {
const phaseMap = {
"Inglês - 1ª Fase": "1_fase.json",
"Inglês - 2ª Fase": "2_fase.json",
"Inglês - 3ª Fase": "3_fase.json",
"Inglês - 4ª Fase": "4_fase.json"
};
return phaseMap[disciplineName] ? `classe14/${phaseMap[disciplineName]}` : null;
}
else if (classId === '15') {
const phaseMap = {
"QI - 1ª Fase": "1_fase.json",
"QI - 2ª Fase": "2_fase.json",
"QI - 3ª Fase": "3_fase.json",
"QI - 4ª Fase": "4_fase.json",
"QI - 5ª Fase": "5_fase.json",
"QI - 6ª Fase": "6_fase.json"
};
return phaseMap[disciplineName] ? `classe15/${phaseMap[disciplineName]}` : null;
}
else if (classId === '16') {
const phaseMap = {
"Cultura - 1ª Fase": "1_fase.json",
"Cultura - 2ª Fase": "2_fase.json",
"Cultura - 3ª Fase": "3_fase.json",
"Cultura - 4ª Fase": "4_fase.json",
"Cultura - 5ª Fase": "5_fase.json",
"Cultura - 6ª Fase": "6_fase.json",
"Cultura - 7ª Fase": "7_fase.json",
"Cultura - 8ª Fase": "8_fase.json",
"Cultura - 9ª Fase": "9_fase.json",
"Cultura - 10ª Fase": "10_fase.json"
};
return phaseMap[disciplineName] ? `classe16/${phaseMap[disciplineName]}` : null;
}
else if (classId === '17') {
const map = {
"Adivinhas Populares": "adivinhas.json",
"Metalinguísticas": "metalinguisticas.json",
"Enigmas de Parentesco": "enigmas_parentesco.json",
"Matemática": "matematica.json",
"Raciocínio": "raciocinio.json"
};
return map[disciplineName] ? `classe17/${map[disciplineName]}` : null;
}
const map = {
"Matemática": "matematica.json",
"Português": "portugues.json",
"Ciências Sociais": "ciencias_sociais.json",
"Ciências Naturais": "ciencias_naturais.json",
"Inglês": "ingles.json",
"História": "historia.json",
"Biologia": "biologia.json",
"Geografia": "geografia.json",
"Física": "fisica.json",
"Química": "quimica.json",
"Empreendedorismo": "empreendedorismo.json",
"Filosofia": "filosofia.json"
};
return map[disciplineName] ? `classe${classId}/${map[disciplineName]}` : null;
}
async function startQuiz(classId, disciplineId, disciplineName) {
// Verificar energia antes de iniciar
if ((gameState.energy || 0) <= 0) {
openEnergyShop();
return;
}
currentScreen = 'game';
_showAdFab(false); // ocultar FAB no jogo
clearAllParticles();
const homeBtn = document.getElementById('home-btn');
if (homeBtn) {
homeBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
homeBtn.title = 'Voltar';
homeBtn.onclick = function() {
playSound('button');
if (currentScreen === 'game' && gameState.currentQuiz && !gameState.currentQuiz.showingResult) {
// Pausar timer enquanto o jogador decide
if (gameState.currentQuiz.timerInterval) gameState.currentQuiz.timerPaused = true;
Swal.fire({
title: 'Sair do quiz?',

text: 'O progresso desta sessão será perdido.',
icon: 'question',
confirmButtonText: '<i class="fas fa-door-open"></i> Sair',
confirmButtonColor: '#e74c3c',
showCancelButton: true,
cancelButtonText: 'Continuar a jogar',
cancelButtonColor: 'var(--primary)',
allowOutsideClick: false
}).then(function(r) {
if (r.isConfirmed) {
_cleanupQuiz();
_showAdFab(true);
showDisciplines(classId);
} else {
// Retomar timer
if (gameState.currentQuiz) gameState.currentQuiz.timerPaused = false;
if (gameState.currentQuiz && !gameState.currentQuiz.timerInterval) startTimer();
}
});
} else {
_cleanupQuiz();
_showAdFab(true);
showDisciplines(classId);
}
};
}
if (!checkInternetConnection()) {
showNoInternetModal();
return;
}
const filePath = mapDisciplineToFileName(classId, disciplineName);
if (!filePath) {
Swal.fire({
title: 'Indisponível',
text: 'Esta disciplina não está disponível no momento.',
icon: 'error',
confirmButtonColor: 'var(--primary)',
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
});
return;
}
document.getElementById('main-content').innerHTML = '<div class="spinner"></div><p style="text-align: center;">Carregando...</p>';
try {
// Sistema de cache: guarda perguntas por 48h para modo offline
const _cacheKey = 'qmz_qs_' + filePath.replace(/[^a-z0-9]/gi,'_');
const _cacheRaw = localStorage.getItem(_cacheKey);
let data = null;
let _fromCache = false;
if (_cacheRaw) {
try {
const _parsed = JSON.parse(_cacheRaw);
if (_parsed.ts && (Date.now() - _parsed.ts) < 48 * 3600 * 1000) {
data = _parsed.d; _fromCache = true;
} else { localStorage.removeItem(_cacheKey); }
} catch(_) { localStorage.removeItem(_cacheKey); }
}
if (!data || !_fromCache) {
if (!navigator.onLine) {
showNoInternetModal();
if (!data) throw new Error('offline_no_cache');
} else {
// Mostrar banner offline subtil se usou cache
const ctrl = new AbortController();
const _tid = setTimeout(() => ctrl.abort(), 12000);
const response = await fetch(`https://raw.githubusercontent.com/BrunoMatherry/quizmoz-data/main/${filePath}?v=${GAME_VERSION}`, { signal: ctrl.signal });
clearTimeout(_tid);
if (!response.ok) throw new Error('Não disponível');
data = await response.json();
// Guardar em cache
try { localStorage.setItem(_cacheKey, JSON.stringify({ d: data, ts: Date.now() })); } catch(_) {}
}
} else if (!navigator.onLine) {
// Tem cache mas está offline — avisa subtilmente e continua
showNoInternetModal();
}
let allQuestions = [];
if (data && data.c2dictionary && data.data && typeof data.data === 'object') {
const questionData = data.data;
for (let key in questionData) {
if (key.startsWith('Q_ID')) {
const index = key.replace('Q_ID', '');
const questionId = `q_${index}`;
allQuestions.push({
id: questionId,
pergunta: questionData[`Q_ID${index}`],
alternativas: {
'A': questionData[`A0_ID${index}`] || '',
'B': questionData[`A1_ID${index}`] || '',
'C': questionData[`A2_ID${index}`] || '',
'D': questionData[`A3_ID${index}`] || ''
},
correta: String.fromCharCode(65 + (questionData[`S_ID${index}`] || 0)),
justificativa: questionData[`txtS_ID${index}`] || ''
});
}
}
}
if (allQuestions.length === 0) throw new Error('Sem perguntas');
if (!gameState.unlockedDisciplines[disciplineId]) {
gameState.unlockedDisciplines[disciplineId] = {};
}
gameState.unlockedDisciplines[disciplineId].totalQuestions = allQuestions.length;
if (!gameState.answeredQuestions[disciplineId]) {
gameState.answeredQuestions[disciplineId] = [];
}
const answeredIds = gameState.answeredQuestions[disciplineId] || [];
let availableQuestions = allQuestions.filter(q => !answeredIds.includes(q.id));
if (availableQuestions.length === 0) {
gameState.answeredQuestions[disciplineId] = [];
availableQuestions = allQuestions;
}
gameState.currentQuiz = {
classId,
disciplineId,
disciplineName,
allQuestions: allQuestions,
availableQuestions: shuffleArray([...availableQuestions]),
currentQuestion: null,
totalQuestions: allQuestions.length,
remainingQuestions: availableQuestions.length,
correctAnswers: 0,
wrongAnswers: 0,
streak: 0,
timeLeft: 30,
timerInterval: null,
answerSelected: false,
showingResult: false,
timerPaused: false
};
loadNextQuestion();
document.getElementById('timer-btn').style.display = 'flex';
document.getElementById('reveal-answer').style.display = 'flex';
document.getElementById('add-time').style.display = 'flex';
} catch (error) {
if (error.message === 'offline_no_cache' || !navigator.onLine) {
showNoInternetModal();
} else {
Swal.fire({
title: 'Erro',
text: 'Disciplina indisponível. Verifica a tua ligação.',
icon: 'error',
confirmButtonColor: 'var(--primary)',
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
});
}
showDisciplines(classId);
}
}
function shuffleArray(array) {
const newArray = [...array];
for (let i = newArray.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
}
return newArray;
}
function loadNextQuestion() {
const quiz = gameState.currentQuiz;
if (!quiz) return; // guard
if (quiz.availableQuestions.length === 0) {
finishQuiz();
return;
}
quiz.currentQuestion = quiz.availableQuestions[0];
quiz.remainingQuestions = quiz.availableQuestions.length;
quiz.timeLeft = 30;
quiz.answerSelected = false;
quiz.showingResult = false;
quiz.timerPaused = false;
showQuizScreen();
startTimer();
}
function showQuizScreen() {
const quiz = gameState.currentQuiz;
const currentQuestion = quiz.currentQuestion;
if (!currentQuestion) return;
let alternatives = Object.entries(currentQuestion.alternativas).map(([key, value]) => ({
letter: key, text: value
}));
alternatives = shuffleArray(alternatives);
document.getElementById('main-content').innerHTML = `
<div class="quiz-container">
<div class="quiz-header">
<div class="discipline-info">
<i class="fas ${gameState.disciplineIcons[quiz.disciplineName] || 'fa-book'}"></i>
${quiz.disciplineName}
</div>
<div class="question-counter">
${quiz.remainingQuestions}/${quiz.totalQuestions}
</div>
</div>
<div class="question-text">${currentQuestion.pergunta}</div>
<div class="options-grid" id="options-container">
${alternatives.map(alt => `
<div class="option" onclick="playSound('click'); selectAnswer('${alt.letter}')" data-letter="${alt.letter}">
<span class="option-prefix">${alt.letter}</span>
<span class="option-text">${alt.text}</span>
</div>
`).join('')}
</div>
</div>
`;
updateTimerDisplay();
}
function startTimer() {
if (!gameState.currentQuiz) return; // guard: quiz pode ser null
// Garantir que nunca existem dois intervals ao mesmo tempo
if (gameState.currentQuiz.timerInterval) {
clearInterval(gameState.currentQuiz.timerInterval);
gameState.currentQuiz.timerInterval = null;
}
if (gameState.currentQuiz.timerPaused) return; // não arrancar se estiver pausado
gameState.currentQuiz.timerInterval = setInterval(() => {
var _q = gameState.currentQuiz;
if (!_q) return; // guard: quiz limpo durante intervalo
if (_q.answerSelected || _q.showingResult || _q.timerPaused) return;
_q.timeLeft--;
updateTimerDisplay();
if (_q.timeLeft <= 5 && _q.timeLeft > 0) playBeep(440, 0.1, 'sine', 0.1);
if (_q.timeLeft <= 0) { clearInterval(_q.timerInterval); _q.timerInterval = null; timeOut(); }
}, 1000);
}
function updateTimerDisplay() {
if (!gameState.currentQuiz) return; // guard
const timerValue = document.getElementById('timer-value');
const timerBtn = document.getElementById('timer-btn');
if (timerValue) timerValue.textContent = gameState.currentQuiz.timeLeft;
if (!timerBtn) return;
if (gameState.currentQuiz.timeLeft <= 10) timerBtn.classList.add('warning');
else timerBtn.classList.remove('warning');
}
function startTutorial() {
const timerBtn = document.getElementById('timer-btn');
const revealBtn = document.getElementById('reveal-answer');
if (!timerBtn || !revealBtn) return;
setTimeout(() => {
timerBtn.classList.add('tutorial-highlight');
const hand1 = document.createElement('div');
hand1.className = 'tutorial-hand';
hand1.style.position = 'fixed';
hand1.style.right = '100px';
hand1.style.bottom = '120px';
hand1.innerHTML = `<svg viewBox="0 0 100 100"><path d="M50 10 L50 40 L30 60 L70 60 L50 40" fill="#FFD700" stroke="#FFA500" stroke-width="3"/><circle cx="50" cy="30" r="10" fill="#FFD700" stroke="#FFA500" stroke-width="3"/></svg>`;
document.body.appendChild(hand1);
setTimeout(() => {
timerBtn.classList.remove('tutorial-highlight');
if (hand1.parentNode) hand1.parentNode.removeChild(hand1);
revealBtn.classList.add('tutorial-highlight');
const hand2 = document.createElement('div');
hand2.className = 'tutorial-hand';
hand2.style.position = 'fixed';
hand2.style.right = '100px';
hand2.style.bottom = '190px';
hand2.innerHTML = `<svg viewBox="0 0 100 100"><path d="M50 10 L50 40 L30 60 L70 60 L50 40" fill="#FFD700" stroke="#FFA500" stroke-width="3"/><circle cx="50" cy="30" r="10" fill="#FFD700" stroke="#FFA500" stroke-width="3"/></svg>`;
document.body.appendChild(hand2);
setTimeout(() => {
revealBtn.classList.remove('tutorial-highlight');
if (hand2.parentNode) hand2.parentNode.removeChild(hand2);
gameState.tutorialCompleted = true;
saveGameState();
}, 4000);
}, 4000);
}, 1000);
}
function selectAnswer(letter) {
playSound('click');
const quiz = gameState.currentQuiz;
if (!quiz) return; // guard: quiz pode ser null se navegou
if (quiz.answerSelected || quiz.showingResult) return;
quiz.answerSelected = true;
clearInterval(quiz.timerInterval);
const currentQuestion = quiz.currentQuestion;
if (!currentQuestion) return; // guard: pergunta não carregada
const isCorrect = letter === currentQuestion.correta;
document.querySelectorAll('.option').forEach(opt => {
opt.classList.add('disabled');
if (opt.dataset.letter === currentQuestion.correta) {
opt.classList.add('correct');
}
if (opt.dataset.letter === letter && !isCorrect) {
opt.classList.add('incorrect');
}
});
if (!gameState.answeredQuestions[quiz.disciplineId]) {
gameState.answeredQuestions[quiz.disciplineId] = [];
}
gameState.answeredQuestions[quiz.disciplineId].push(currentQuestion.id);
quiz.availableQuestions = quiz.availableQuestions.filter(q => q.id !== currentQuestion.id);
quiz.remainingQuestions = quiz.availableQuestions.length;
if (isCorrect) {
playSound('correct');
coinCenterAnimation();
createConfetti();
if (!gameState.correctAnswersCount[quiz.disciplineId]) {
gameState.correctAnswersCount[quiz.disciplineId] = 0;
}
gameState.correctAnswersCount[quiz.disciplineId]++;
setTimeout(() => {
if (currentScreen !== 'game') return; // jogador já saiu do quiz
quiz.correctAnswers++;
gameState.exp += 10;
quiz.streak = (quiz.streak || 0) + 1;
showComboWord(quiz.streak);
var _coinGain = 2;
if (quiz.streak >= 5) _coinGain += 5;
else if (quiz.streak >= 3) _coinGain += 3;
gameState.coins += _coinGain;
gameState.qi = Math.min(200, gameState.qi + 1);
quiz.timeLeft += 20;
updateTimerDisplay();
updateRankingPosition();
if (gameState.exp >= gameState.expToNextLevel) {
var _oldLvl = gameState.level;
gameState.level++;
gameState.exp -= gameState.expToNextLevel;
gameState.expToNextLevel += 50;
playSound('win');
createWinnerConfetti();
showRankingLevelUp(_oldLvl, gameState.level);
}
updateHeader();
Swal.fire({
title: '✅ Correto!',
text: currentQuestion.justificativa || 'Muito bem! Continue assim!',
icon: 'success',
confirmButtonText: 'Próxima Pergunta',
confirmButtonColor: 'var(--success)',
allowOutsideClick: false,
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
}).then(() => {
if (quiz.availableQuestions.length > 0) { loadNextQuestion(); } else { finishQuiz(); }
});
}, 2000);
} else {
playSound('wrong');
showWrongWord();
setTimeout(() => {
if (currentScreen !== 'game') return; // jogador já saiu do quiz
quiz.wrongAnswers++;
quiz.streak = 0;
gameState.qi = Math.max(70, gameState.qi - 1);
quiz.timeLeft = 30;
updateTimerDisplay();
updateRankingPosition();
loseEnergy(); // loseEnergy já trata do fim de energia via _endQuizNoEnergy()
updateHeader();
// Se ficou sem energia, loseEnergy() já iniciou o fluxo de saída
if ((gameState.energy || 0) <= 0) return;
Swal.fire({
title: '❌ Incorreto!',
html: '<div style="text-align:center;"><p style="color:#555;margin-bottom:10px;">' + (currentQuestion.justificativa || 'Não foi desta vez!') + '</p>' +
'<div style="display:inline-flex;align-items:center;gap:6px;background:#fff3e0;padding:6px 14px;border-radius:50px;font-size:13px;color:#e65100;"><span>⚡</span><span>Energia restante: <strong>' + gameState.energy + '</strong></span></div></div>',
icon: 'error',
confirmButtonText: 'Finalizar',
confirmButtonColor: 'var(--warning)',
allowOutsideClick: false,
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
}).then(() => finishQuiz());
}, 2000);
}
}
function updateRankingPosition() {
const playerScore = gameState.level * 100 + gameState.qi * 2 + gameState.coins;
const effective = ((typeof getEffectiveRanking === 'function') ? getEffectiveRanking() : null) || [];
let newPosition = effective.length + 1;
for (let i = 0; i < effective.length; i++) {
if (playerScore > effective[i].score) { newPosition = i + 1; break; }
}
if (newPosition < gameState.rankingPosition) {
gameState.rankingPosition = newPosition;
}
}
function timeOut() {
const quiz = gameState.currentQuiz;
if (!quiz) return; // guard
if (quiz.answerSelected || quiz.showingResult) return;
quiz.answerSelected = true;
quiz.showingResult = true;
const currentQuestion = quiz.currentQuestion;
if (!currentQuestion) { finishQuiz(); return; } // guard: pergunta não carregada
document.querySelectorAll('.option').forEach(opt => {
opt.classList.add('disabled');
if (opt.dataset.letter === currentQuestion.correta) {
opt.classList.add('correct');
}
});
if (!gameState.answeredQuestions[quiz.disciplineId]) {
gameState.answeredQuestions[quiz.disciplineId] = [];
}
gameState.answeredQuestions[quiz.disciplineId].push(currentQuestion.id);
quiz.availableQuestions = quiz.availableQuestions.filter(q => q.id !== currentQuestion.id);
quiz.remainingQuestions = quiz.availableQuestions.length;
quiz.wrongAnswers++;
quiz.streak = 0;
gameState.qi = Math.max(70, gameState.qi - 2);
updateRankingPosition();
loseEnergy(); // tempo esgotado também reduz 1 energia
updateHeader();
// Se ficou sem energia, loseEnergy() já trata do fluxo via _endQuizNoEnergy()
if ((gameState.energy || 0) <= 0) return;
setTimeout(() => {
if (currentScreen !== 'game') return; // jogador já saiu do quiz
Swal.fire({
title: '⏰ Tempo Esgotado!',
html: '<div style="text-align:center;"><p style="color:#555;margin-bottom:10px;">' + (currentQuestion.justificativa || 'O tempo acabou!') + '</p>' +
'<div style="display:inline-flex;align-items:center;gap:6px;background:#fff3e0;padding:6px 14px;border-radius:50px;font-size:13px;color:#e65100;"><span>⚡</span><span>Energia restante: <strong>' + gameState.energy + '</strong></span></div></div>',
icon: 'warning',
confirmButtonText: 'Finalizar',
confirmButtonColor: 'var(--warning)',
allowOutsideClick: false,
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
}).then(() => finishQuiz());
}, 2000);
}
function finishQuiz() {
const quiz = gameState.currentQuiz;
if (!quiz) return; // guard: previne chamada dupla ou quiz nulo
if (quiz._finishing) return; // guard: finishQuiz já em execução
quiz._finishing = true; // marcar como em execução
// Capturar tudo do quiz ANTES de o limpar
const classId      = quiz.classId;
const disciplineId = quiz.disciplineId;
const correctAns   = quiz.correctAnswers;
const wrongAns     = quiz.wrongAnswers;
// Marcar imediatamente para evitar re-entrada
quiz.answerSelected = true;
quiz.showingResult  = true;
const total = correctAns + wrongAns;
const percentage = total > 0 ? Math.round((correctAns / total) * 100) : 0;
const starsEarned = percentage >= 80 ? 3 : percentage >= 60 ? 2 : percentage >= 40 ? 1 : 0;
if (!gameState.unlockedDisciplines[disciplineId]) {
gameState.unlockedDisciplines[disciplineId] = {};
}
const totalQuestions = gameState.unlockedDisciplines[disciplineId].totalQuestions || (quiz.totalQuestions || 0);
const answeredCount = gameState.answeredQuestions[disciplineId]?.length || 0;
const isFullyCompleted = answeredCount >= totalQuestions;
if (isFullyCompleted) {
gameState.unlockedDisciplines[disciplineId].completed = true;
gameState.unlockedDisciplines[disciplineId].stars = calculateStars(disciplineId);
}
saveGameState();
var _tb=document.getElementById('timer-btn'); if(_tb)_tb.style.display='none';
var _ra=document.getElementById('reveal-answer'); if(_ra)_ra.style.display='none';
var _at=document.getElementById('add-time'); if(_at)_at.style.display='none';
Swal.fire({
title: 'Quiz Concluído!',

html: `
<div style="text-align: center;">
<div style="font-size: 40px; color: var(--primary); margin-bottom: 10px;">🏆</div>
<p><strong>Acertos:</strong> ${correctAns}</p>
<p><strong>Erros:</strong> ${wrongAns}</p>
<p><strong>Aproveitamento:</strong> ${percentage}%</p>
<div style="margin: 15px 0;">
${'<i class="fas fa-star" style="color: #FFD700;"></i>'.repeat(starsEarned)}
${'<i class="far fa-star"></i>'.repeat(3 - starsEarned)}
</div>
<p><strong>Moedas:</strong> +${correctAns * 5}</p>
<p><strong>Perguntas Restantes:</strong> ${quiz.remainingQuestions}</p>
${isFullyCompleted ? '<p style="color: var(--success);"><i class="fas fa-check-circle"></i> Disciplina Concluída!</p>' : ''}
</div>
`,
icon: 'success',
confirmButtonText: 'Continuar',
confirmButtonColor: 'var(--primary)',
allowOutsideClick: false,
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
},
}).then(() => showDisciplines(classId));
}
function openRevealOptions() {
if (!gameState.currentQuiz || gameState.currentQuiz.answerSelected || gameState.currentQuiz.showingResult) return;
gameState.currentQuiz.timerPaused = true;
Swal.fire({
title: '🔍 Revelar Resposta',

html: `
<p>Escolha uma opção para revelar a resposta correta:</p>
<div style="display: flex; flex-direction: column; gap-10px; margin-top: 20px;">
<button onclick="playSound('button'); revealWithCoins()" style="background: var(--warning); color: var(--dark); border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer; margin: 5px 0;">
🪙 30 Moedas
</button>
<button onclick="playSound('button'); revealWithAd()" style="background: var(--primary); color: white; border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer; margin: 5px 0;">
📺 Assistir Anúncio
</button>
</div>
`,
showConfirmButton: false,
showCloseButton: true,
allowOutsideClick: false,
background: 'white',
didOpen: () => {
const _sx = document.querySelector('.swal2-close'); if (_sx) _sx.addEventListener('click', () => playSound('button'), {once:true});
},
willClose: () => {
if (!gameState.currentQuiz.answerSelected && !gameState.currentQuiz.showingResult) {
_resumeGameTimer();
}
}
});
}
function revealWithCoins() {
Swal.close();
if (!gameState.currentQuiz || !gameState.currentQuiz.currentQuestion) { _resumeGameTimer(); return; }
if (gameState.coins >= 30) {
gameState.coins -= 30;
updateHeader();
const currentQuestion = gameState.currentQuiz.currentQuestion;
document.querySelectorAll('.option').forEach(opt => {
if (opt.dataset.letter === currentQuestion.correta) {
opt.style.border = '3px solid gold';
opt.style.transform = 'scale(1.02)';
opt.style.boxShadow = '0 0 20px gold';
opt.style.animation = 'pulse 1s';
}
});
coinFlyAnimation(-30);
playSound('coin');
_resumeGameTimer();
Swal.fire({
title: 'Resposta Revelada!',
text: 'A resposta correta está destacada!',
icon: 'success',
timer: 2000,
showConfirmButton: false,
didOpen: () => {
setTimeout(() => {
_resumeGameTimer();
}, 500);
}
});
} else {
_resumeGameTimer();
Swal.fire({
title: 'Moedas Insuficientes',
html: `
<p>Você precisa de 30 moedas.</p>
<button onclick="playSound('button'); openShop()" style="margin-top: 15px; background: var(--warning); color: var(--dark); border: none; padding: 10px 20px; border-radius: 50px; font-size: 14px; cursor: pointer;">
<i class="fas fa-shopping-cart"></i> Comprar Moedas
</button>
`,
icon: 'warning',
confirmButtonColor: 'var(--primary)',
showCancelButton: true,
cancelButtonText: 'Fechar',
confirmButtonText: 'Bem vindo ✨',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
},
willClose: (result) => {
if (result.isConfirmed) {
openShop();
}
}
});
}
}
function revealWithAd() {
Swal.close();
showRewardedAd('reveal',
() => {
if (currentScreen !== 'game' || !gameState.currentQuiz || !gameState.currentQuiz.currentQuestion) { _resumeGameTimer(); return; }
const currentQuestion = gameState.currentQuiz.currentQuestion;
document.querySelectorAll('.option').forEach(opt => {
if (opt.dataset.letter === currentQuestion.correta) {
opt.style.border = '3px solid gold';
opt.style.transform = 'scale(1.02)';
opt.style.boxShadow = '0 0 20px gold';
opt.style.animation = 'pulse 1s';
}
});
playSound('unlock');
},
() => {
_resumeGameTimer();
}
);
}
function openTimerOptions() {
if (!gameState.currentQuiz || gameState.currentQuiz.answerSelected || gameState.currentQuiz.showingResult) return;
gameState.currentQuiz.timerPaused = true;
Swal.fire({
title: '⏰ Tempo Extra',

html: `
<p>Escolha uma opção para ganhar +60 segundos:</p>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
<button onclick="playSound('button'); buyTimeWithCoins()" style="background: var(--warning); color: var(--dark); border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer; margin: 5px 0;">
🪙 25 Moedas
</button>
<button onclick="playSound('button'); buyTimeWithAd()" style="background: var(--primary); color: white; border: none; padding: 15px; border-radius: 50px; font-size: 16px; cursor: pointer; margin: 5px 0;">
📺 Assistir Anúncio
</button>
</div>
`,
showConfirmButton: false,
showCloseButton: true,
background: 'white',
didOpen: () => {
const _sx = document.querySelector('.swal2-close'); if (_sx) _sx.addEventListener('click', () => playSound('button'), {once:true});
},
willClose: () => {
if (!gameState.currentQuiz.answerSelected && !gameState.currentQuiz.showingResult) {
_resumeGameTimer();
}
}
});
}
function buyTimeWithCoins() {
Swal.close();
if (!gameState.currentQuiz) { _resumeGameTimer(); return; }
if (gameState.coins >= 25) {
gameState.coins -= 25;
gameState.currentQuiz.timeLeft = Math.min((gameState.currentQuiz.timeLeft || 0) + 60, 999);
updateTimerDisplay();
updateHeader();
timeAddedEffect();
coinFlyAnimation(-25);
playSound('timer');
_resumeGameTimer();
Swal.fire({
title: 'Tempo Adicionado!',
text: '+60 segundos',
icon: 'success',
timer: 1500,
showConfirmButton: false
});
} else {
_resumeGameTimer();
Swal.fire({
title: 'Moedas Insuficientes',
html: `
<p>Você precisa de 25 moedas.</p>
<button onclick="playSound('button'); openShop()" style="margin-top: 15px; background: var(--warning); color: var(--dark); border: none; padding: 10px 20px; border-radius: 50px; font-size: 14px; cursor: pointer;">
<i class="fas fa-shopping-cart"></i> Comprar Moedas
</button>
`,
icon: 'warning',
confirmButtonColor: 'var(--primary)',
showCancelButton: true,
cancelButtonText: 'Fechar',
confirmButtonText: 'Bem vindo ✨',
didOpen: () => {
document.querySelectorAll('.swal2-confirm, .swal2-cancel').forEach(btn => {
btn.addEventListener('click', () => playSound('button'));
});
},
willClose: (result) => {
if (result.isConfirmed) {
openShop();
}
}
});
}
}
function buyTimeWithAd() {
Swal.close();
showRewardedAd('time',
() => {
// Reward recebido — anúncio ainda pode estar visível, NÃO retomar timer aqui
// O timer retoma no evento 'dismiss' do anúncio
if (!gameState.currentQuiz) return;
gameState.currentQuiz.timeLeft += 60;
updateTimerDisplay();
timeAddedEffect();
playSound('timer');
},
() => {
_resumeGameTimer();
}
);
}
const API_URL = _0x.d('aHR0cHM6Ly93d3cucGxheWJsbS5jb20vYXBp');
var cordovaHTTP = null;
var _paymentInFlight = false; // previne duplo-clique
var _payCheckInterval  = null;  // intervalo de polling de pagamento
var _payCountInterval  = null;  // intervalo de contagem de tempo de pagamento
function httpPost(url, data, successCb, errorCb) {
const _TIMEOUT = 18000;
if (cordovaHTTP) {
cordovaHTTP.setDataSerializer('json');
cordovaHTTP.setConnectTimeout(_TIMEOUT / 1000);
cordovaHTTP.setReadTimeout(_TIMEOUT / 1000);
cordovaHTTP.post(url, data, {
'Content-Type': 'application/json',
'Accept': 'application/json'
}, function(r) {
try { successCb(typeof r.data === 'string' ? JSON.parse(r.data) : r.data); }
catch(e) { errorCb(e); }
}, function(r) { errorCb(new Error(r.error || 'Erro ' + r.status)); });
} else {
const ctrl = new AbortController();
const tid = setTimeout(() => ctrl.abort(), _TIMEOUT);
fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
body: JSON.stringify(data),
signal: ctrl.signal
}).then(r => { clearTimeout(tid); return r.json(); }).then(successCb).catch(e => { clearTimeout(tid); errorCb(e); });
}
}
function httpGet(url, successCb, errorCb) {
const _TIMEOUT = 15000;
if (cordovaHTTP) {
cordovaHTTP.setConnectTimeout(_TIMEOUT / 1000);
cordovaHTTP.setReadTimeout(_TIMEOUT / 1000);
cordovaHTTP.get(url, {}, {
'Accept': 'application/json'
}, function(r) {
try { successCb(typeof r.data === 'string' ? JSON.parse(r.data) : r.data); }
catch(e) { errorCb(e); }
}, function(r) { errorCb(new Error(r.error || 'Erro ' + r.status)); });
} else {
const ctrl = new AbortController();
const tid = setTimeout(() => ctrl.abort(), _TIMEOUT);
fetch(url, {
headers: { 'Accept': 'application/json' },
signal: ctrl.signal
}).then(r => { clearTimeout(tid); return r.json(); }).then(successCb).catch(e => { clearTimeout(tid); errorCb(e); });
}
}
const COIN_PACKAGES = [
{ coins: 100,  price: 10,  label: '10 MT',  emoji: '💰' },
{ coins: 200,  price: 15,  label: '15 MT',  emoji: '💰💰' },
{ coins: 500,  price: 30,  label: '30 MT',  emoji: '💰💰💰' },
{ coins: 1000, price: 50,  label: '50 MT',  emoji: '💰💰💰💰' },
{ coins: 5000, price: 120, label: '120 MT', emoji: '💰💰💰💰💰' }
];
function openShop() {
playSound('button');
const packagesHtml = COIN_PACKAGES.map((pkg, i) => `
<div onclick="selectPackage(${i})" id="pkg-${i}" style="
background: linear-gradient(145deg, ${['#FFD793,#FFB5A7','#A4C9A4,#B6D7A8','#C5A9D6,#A9D6E5','#F9A68B,#FFD793','#5E9B9D,#4A7C7E'][i]});
color: ${i === 4 ? 'white' : 'inherit'};
padding: 14px; border-radius: 16px; cursor: pointer;
display: flex; justify-content: space-between; align-items: center;
border: 3px solid transparent; transition: all 0.2s;">
<div style="font-size: 26px;">${pkg.emoji}</div>
<div style="text-align:center; flex:1;">
<div style="font-weight:bold; font-size:16px;">${pkg.coins} Moedas</div>
</div>
<div style="font-weight:bold; font-size:18px;">${pkg.label}</div>
</div>
`).join('');
Swal.fire({
title: '🪙 Comprar Moedas',
html: `
<div onclick="Swal.close(); setTimeout(watchAdForCoins, 350)" style="
  background: linear-gradient(135deg,#FF6B35 0%,#F7C948 100%);
  border-radius:18px; padding:18px 16px; margin-bottom:16px;
  text-align:center; cursor:pointer;
  box-shadow: 0 6px 18px rgba(255,107,53,0.4);
  display:flex; align-items:center; justify-content:center; gap:14px;">
  <span style="font-size:32px;">📺</span>
  <div style="text-align:left;">
    <div style="font-weight:800;color:white;font-size:16px;font-family:'Quicksand',sans-serif;">Ver Anúncio Gratuito</div>
    <div style="color:rgba(255,255,255,0.9);font-size:13px;font-family:'Quicksand',sans-serif;">Ganhar 🪙 +10 Moedas · Grátis!</div>
  </div>
</div>
<p style="margin-bottom:15px; color:#666; font-size:13px;">Ou escolha um pacote e o método de pagamento</p>
<div style="display:grid; gap:10px; margin-bottom:20px;">
${packagesHtml}
</div>
<div id="pkg-selected" style="display:none; margin-top:10px; padding:10px; background:#f8f9fa; border-radius:12px; font-size:14px; color:#333;">
✅ Pacote selecionado: <span id="pkg-selected-label"></span>
</div>
<div style="margin-top:15px;">
<p style="font-weight:bold; margin-bottom:10px;">Método de Pagamento:</p>
<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
<button onclick="processPayment('emola')" style="
background: linear-gradient(145deg, #E91E8C, #C2185B);
color:white; border:none; padding:14px; border-radius:14px;
font-size:15px; font-weight:bold; cursor:pointer;">
📱 e-Mola
</button>
<button onclick="processPayment('mpesa')" style="
background: linear-gradient(145deg, #4CAF50, #2E7D32);
color:white; border:none; padding:14px; border-radius:14px;
font-size:15px; font-weight:bold; cursor:pointer;">
📱 M-Pesa
</button>
</div>
</div>
`,
showConfirmButton: false,
showCloseButton: true,
allowOutsideClick: false,
width: '370px',
didOpen: () => {
const _sx = document.querySelector('.swal2-close'); if (_sx) _sx.addEventListener('click', () => playSound('button'), {once:true});
}
});
}
let selectedPackageIndex = null;
function selectPackage(index) {
playSound('button');
selectedPackageIndex = index;
COIN_PACKAGES.forEach((_, i) => {
const el = document.getElementById(`pkg-${i}`);
if (el) el.style.border = i === index ? '3px solid #5E9B9D' : '3px solid transparent';
});
const selectedDiv = document.getElementById('pkg-selected');
const selectedLabel = document.getElementById('pkg-selected-label');
if (selectedDiv && selectedLabel) {
selectedDiv.style.display = 'block';
selectedLabel.textContent = `${COIN_PACKAGES[index].coins} moedas por ${COIN_PACKAGES[index].label}`;
}
}
function processPayment(method) {
playSound('button');
if (selectedPackageIndex === null) {
Swal.fire({
title: 'Selecione um pacote!',
text: 'Por favor escolha um pacote de moedas antes de pagar.',
icon: 'warning',
confirmButtonColor: 'var(--primary)',
timer: 2500,
showConfirmButton: false
});
return;
}
const pkg = COIN_PACKAGES[selectedPackageIndex];
const methodName = method === 'emola' ? 'e-Mola' : 'M-Pesa';
Swal.fire({
title: `💳 Pagamento via ${methodName}`,
html: `
<p style="margin-bottom:15px;">Valor: <strong>${pkg.label}</strong> por <strong>${pkg.coins} moedas</strong></p>
<input id="phone-input" type="tel" placeholder="${method === 'emola' ? 'Ex: 86XXXXXXX ou 87XXXXXXX' : 'Ex: 84XXXXXXX ou 85XXXXXXX'}"
style="width:100%; padding:12px; border:2px solid #ddd; border-radius:10px;
font-size:16px; text-align:center; outline:none;"
maxlength="9" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
<p style="font-size:12px; color:#999; margin-top:8px;">Introduza o número ${methodName}</p>
`,
showCancelButton: true,
confirmButtonColor: method === 'emola' ? '#E91E8C' : '#4CAF50',
confirmButtonText: `Pagar ${pkg.label}`,
cancelButtonText: 'Cancelar',
preConfirm: () => {
const phone = document.getElementById('phone-input').value.trim();
if (!phone || phone.length < 9) {
Swal.showValidationMessage('Introduza um número válido com 9 dígitos');
return false;
}
if (method === 'emola' && !phone.startsWith('86') && !phone.startsWith('87')) {
Swal.showValidationMessage('e-Mola: número deve começar com 86 ou 87');
return false;
}
if (method === 'mpesa' && !phone.startsWith('84') && !phone.startsWith('85')) {
Swal.showValidationMessage('M-Pesa: número deve começar com 84 ou 85');
return false;
}
return phone;
}
}).then((result) => {
if (result.isConfirmed) {
initiatePayment(method, result.value, pkg);
}
});
}
function initiatePayment(method, phone, pkg, _retry) {
if (_paymentInFlight) return; // bloqueia SEMPRE se já em voo, incluindo retry
_paymentInFlight = true;
Swal.fire({
title: _retry ? '🔄 A tentar novamente...' : '⏳ Processando...',
html: '<p>A criar pedido de pagamento de <strong>' + pkg.label + '</strong>...</p>',
showConfirmButton: false,
allowOutsideClick: false
});
const reference = 'QMZ' + Date.now();
const payload = {
amount: pkg.price,
reference: reference,
description: 'QuizMoz - ' + pkg.coins + ' Moedas',
return_url: 'https://paysuite.tech/success',
callback_url: 'https://paysuite.tech/callback'
};
httpPost(API_URL + '/payment', payload, function(data) {
_paymentInFlight = false;
if (data && data.data && data.data.id) {
const paymentId = data.data.id;
const checkoutUrl = data.data.checkout_url || data.data.url;
if (checkoutUrl) {
Swal.fire({
title: '📲 Pagar agora',
html: '<p>Clique em <strong>Abrir Pagamento</strong> para pagar via ' + (method === 'emola' ? 'e-Mola' : 'M-Pesa') + '.</p>' + '<p style="font-size:13px;color:#666;margin-top:8px;">Após pagar, volte ao jogo e clique em <strong>Já Paguei</strong>.</p>' + '<div style="margin-top:12px;background:#fff3cd;border-radius:10px;padding:10px 12px;font-size:12px;color:#856404;text-align:left;">⚠️ <strong>Se aparecer "Server Error"</strong> na página de pagamento: feche o navegador e toca em <strong>Tentar Novamente</strong>.</div>',
showCancelButton: true,
confirmButtonText: '🌐 Abrir Pagamento',
cancelButtonText: 'Cancelar',
confirmButtonColor: 'var(--primary)'
}).then(function(result) {
if (result.isConfirmed) {
if (typeof cordova !== 'undefined' && cordova.InAppBrowser) {
cordova.InAppBrowser.open(checkoutUrl, '_system');
} else {
window.open(checkoutUrl, '_blank');
}
showPaymentPending(method, phone, pkg, paymentId);
}
});
} else {
showPaymentPending(method, phone, pkg, paymentId);
}
} else {
_paymentInFlight = false;
var msg = (data && data.message) ? data.message : 'Resposta inválida';
Swal.fire({ title: 'Erro', text: msg, icon: 'error', confirmButtonColor: 'var(--primary)' });
}
}, function(err) {
_paymentInFlight = false;
console.warn('Pagamento erro:', err.message);
var isTimeout = err.name === 'AbortError' || ((err.message||'').indexOf('abort') > -1);
Swal.fire({
title: 'Problema de Ligação',
html: '<p>' + (isTimeout ? 'O servidor demorou a responder.' : 'Não foi possível contactar o servidor.') + '</p><p style="font-size:12px;color:#999;margin-top:8px;">Verifica a tua ligação.</p>',
icon: 'warning',
confirmButtonText: '🔄 Tentar Novamente',
confirmButtonColor: 'var(--primary)',
showCancelButton: true,
cancelButtonText: 'Cancelar'
}).then(function(r) {
if (r.isConfirmed) initiatePayment(method, phone, pkg, true);
});
});
}

function _clearPaymentIntervals() {
if (_payCheckInterval)  { clearInterval(_payCheckInterval);  _payCheckInterval  = null; }
if (_payCountInterval)  { clearInterval(_payCountInterval);  _payCountInterval  = null; }
}
function showPaymentPending(method, phone, pkg, paymentId) {
_clearPaymentIntervals(); // limpar intervals de pagamento anteriores
const methodName = method === 'emola' ? 'e-Mola' : 'M-Pesa';
let checkCount = 0;
const maxChecks = 24; // 2 minutos
Swal.fire({
title: '⏳ A aguardar pagamento',
html: `
<div style="text-align:center;">
<p>Método: <strong>${methodName}</strong></p>
<p>Valor: <strong>${pkg.label}</strong></p>
<hr style="margin:12px 0;">
<p style="font-size:13px; color:#666;">Complete o pagamento e clique em <strong>Já Paguei</strong>.</p>
<p style="font-size:11px; color:#999; margin-top:8px;">A verificar automaticamente... <span id="check-count">0</span>s</p>
</div>
`,
showCancelButton: true,
confirmButtonText: '✅ Já Paguei',
cancelButtonText: 'Cancelar',
confirmButtonColor: '#4CAF50',
allowOutsideClick: false
}).then(result => {
clearInterval(_payCheckInterval); _payCheckInterval = null;
clearInterval(_payCountInterval); _payCountInterval = null;
if (result.isConfirmed) {
verifyPaymentNow(paymentId, pkg);
}
});
_payCountInterval = setInterval(() => {
checkCount++;
const el = document.getElementById('check-count');
if (el) el.textContent = checkCount * 5;
if (checkCount >= maxChecks) {
clearInterval(_payCountInterval); _payCountInterval = null;
clearInterval(_payCheckInterval); _payCheckInterval = null;
}
}, 5000);
_payCheckInterval = setInterval(() => {
httpGet(API_URL + '/payment-status?id=' + paymentId, function(data) {
const status = (data.data && data.data.transaction) ? data.data.transaction.status : (data.data ? data.data.status : data.status);
if (status === 'paid' || status === 'completed' || status === 'success' || status === 'approved') {
clearInterval(_payCheckInterval); _payCheckInterval = null;
clearInterval(_payCountInterval); _payCountInterval = null;
Swal.close();
onPaymentSuccess(pkg);
} else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
clearInterval(_payCheckInterval); _payCheckInterval = null;
clearInterval(_payCountInterval); _payCountInterval = null;
Swal.fire({ title: 'Pagamento Falhou', text: 'O pagamento foi cancelado ou falhou. Tente novamente.', icon: 'error', confirmButtonColor: 'var(--primary)' });
}
}, function(err) { console.log('Erro poll:', err); });
}, 5000);
}
var _verifyRetries = 0;
function verifyPaymentNow(paymentId, pkg) {
if (_verifyRetries >= 5) {
_verifyRetries = 0;
Swal.fire({ title: 'Verificação Falhou', text: 'Não foi possível confirmar o pagamento. Contacta o suporte.', icon: 'error', confirmButtonColor: 'var(--primary)' });
return;
}
_verifyRetries++;
Swal.fire({
title: '🔍 Verificando...',
showConfirmButton: false,
allowOutsideClick: false,
timer: 5000
});
httpGet(API_URL + '/payment-status?id=' + paymentId, function(data) {
const status = (data.data && data.data.transaction) ? data.data.transaction.status : (data.data ? data.data.status : data.status);
if (status === 'paid' || status === 'completed' || status === 'success' || status === 'approved') {
onPaymentSuccess(pkg);
} else {
Swal.fire({
title: 'Resposta de Pagamento',
html: '<p style="font-size:14px;color:#555;">O pagamento ainda não foi confirmado.</p>' +
'<p style="font-size:12px;color:#999;margin-top:10px;">Se já pagou, aguarde uns segundos e tente novamente.</p>',
icon: 'warning',
confirmButtonColor: 'var(--primary)',
confirmButtonText: 'Verificar novamente',
showCancelButton: true,
cancelButtonText: 'Fechar'
}).then(r => {
if (r.isConfirmed) verifyPaymentNow(paymentId, pkg); else _verifyRetries = 0;
});
}
}, function(err) {
Swal.fire({
title: 'Erro de ligação',
html: '<p>Não foi possível verificar o pagamento.</p><p style="font-size:12px;color:#999;">' + (err.message||'') + '</p>',
icon: 'error',
confirmButtonColor: 'var(--primary)'
});
});
}
function launchConfetti(count) {
const colors = ['#FFD700','#4CAF50','#E91E8C','#00BCD4','#FF5722','#9C27B0','#FFEB3B'];
var total = Math.min(count || 30, 30);
for (let i = 0; i < total; i++) {
setTimeout(function() {
const c = document.createElement('div');
c.className = 'confetti winner';
c.style.left = Math.random() * 100 + 'vw';
c.style.background = colors[Math.floor(Math.random() * colors.length)];
c.style.width = (Math.random() * 10 + 5) + 'px';
c.style.height = c.style.width;
c.style.animationDuration = (Math.random() * 2 + 2) + 's';
c.style.zIndex = 99999;
document.body.appendChild(c);
setTimeout(() => c.remove(), 3500);
}, i * 40);
}
}
function onPaymentSuccess(pkg) {
_paymentInFlight = false;
gameState.coins += pkg.coins;
saveGameState();
updateHeader();
selectedPackageIndex = null;
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
Swal.close();
showFloatingCoinReward(pkg.coins);
}
// ===== SISTEMA DE ENERGIA =====
const MAX_ENERGY = 7;
const ENERGY_PACKAGES = [
{ energy: 7,  coins: 100, label: '7 ⚡',  desc: '100 Moedas' },
{ energy: 12, coins: 200, label: '12 ⚡', desc: '200 Moedas' },
{ energy: 30, coins: 400, label: '30 ⚡', desc: '400 Moedas' }
];

function checkDailyEnergyRestore() {
const today = new Date().toISOString().split('T')[0];
if (gameState.energyLastRestoreDate !== today) {
const isFirstTime = (gameState.energyLastRestoreDate == null); // null ou undefined = primeira vez
// SOMA +7 ao total existente — energia de compras/anuncios nao e resetada
gameState.energy = (gameState.energy || 0) + MAX_ENERGY;
gameState.energyLastRestoreDate = today;
saveGameState();
updateHeader();
if (!isFirstTime) showEnergyRestoredEffect();
}
}

function showEnergyRestoredEffect() {
// Flash verde + badge + confetti
const badge = document.createElement('div');
badge.className = 'energy-restore-badge';
badge.innerHTML = `
<div style="background:linear-gradient(135deg,#2ECC71,#27AE60);padding:24px 32px;border-radius:24px;box-shadow:0 8px 32px rgba(46,204,113,0.5);">
  <div style="font-size:52px;margin-bottom:8px;">⚡</div>
  <div style="font-size:22px;font-weight:900;color:white;font-family:'Righteous',cursive;">Energia Renovada!</div>
  <div style="font-size:16px;color:rgba(255,255,255,0.9);margin-top:4px;">+${MAX_ENERGY} ⚡ para hoje!</div>
</div>`;
document.body.appendChild(badge);
setTimeout(() => badge.remove(), 2600);
setTimeout(() => { createConfetti(); createWinnerConfetti(); }, 200);
playSound('unlock');
}

function loseEnergy() {
if ((gameState.energy || 0) <= 0) return;
gameState.energy = (gameState.energy || 0) - 1;
saveGameState();
updateHeader();
showEnergyLossEffect();
if ((gameState.energy || 0) <= 0) {
// Energia esgotada — terminar quiz e ir para seleção de classes
_endQuizNoEnergy();
}
}

function _endQuizNoEnergy() {
// Guardar classId antes de limpar o quiz
var _quizClassId = (gameState.currentQuiz && gameState.currentQuiz.classId)
? gameState.currentQuiz.classId
: gameState.currentClass;
// Para o timer imediatamente
if (gameState.currentQuiz && gameState.currentQuiz.timerInterval) {
clearInterval(gameState.currentQuiz.timerInterval);
gameState.currentQuiz.timerInterval = null;
}
if (gameState.currentQuiz) gameState.currentQuiz.timerPaused = true;
playSound('wrong');
if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
Swal.close();

// Helper para ir para disciplinas da classe onde estava a jogar
function _goToDisciplines() {
if (gameState.currentQuiz) {
gameState.currentQuiz.answerSelected = true;
gameState.currentQuiz.showingResult = true;
}
document.getElementById('floating-controls').style.display = 'flex';
document.getElementById('home-btn').style.display = 'flex';
document.getElementById('exit-btn').style.display = 'flex';
if (_quizClassId) {
selectClass(_quizClassId); // vai para as disciplinas da classe onde estava
} else {
showClassSelection();
}
}

setTimeout(() => {
if (currentScreen !== 'game') return; // guard: jogador já saiu
Swal.close();
Swal.fire({
title: '⚡ Sem Energia!',

html: `<div style="text-align:center;">
  <div style="font-size:56px;margin-bottom:10px;">⚡</div>
  <p style="color:#555;font-size:15px;font-weight:700;margin-bottom:6px;">Ficaste sem energia!</p>
  <p style="color:#888;font-size:13px;">Compra ou repõe energia para continuar a jogar.</p>
</div>`,
showConfirmButton: true,
confirmButtonText: '⚡ Repor Energia',
confirmButtonColor: '#5E9B9D',
showCancelButton: true,
cancelButtonText: 'Ver Disciplinas',
allowOutsideClick: false,
timer: 6000,
timerProgressBar: true
}).then(r => {
if (r.isConfirmed) {
openEnergyShop();
} else {
_goToDisciplines();
}
});
}, 600);
}

function showEnergyLossEffect() {
// Vinheta vermelha
const flash = document.createElement('div');
flash.className = 'energy-loss-flash';
document.body.appendChild(flash);
setTimeout(() => flash.remove(), 700);
// Texto flutuante "-1 ⚡"
const energyEl = document.getElementById('energy-display');
const rect = energyEl ? energyEl.getBoundingClientRect() : null;
const float = document.createElement('div');
float.className = 'energy-loss-float';
float.textContent = '-1 ⚡';
float.style.left = (rect ? rect.left + rect.width / 2 : window.innerWidth / 2) + 'px';
float.style.top  = (rect ? rect.bottom + 10 : 80) + 'px';
document.body.appendChild(float);
setTimeout(() => float.remove(), 1300);
// Fazer o ícone tremer
if (energyEl) {
energyEl.style.animation = 'none';
energyEl.style.transform = 'scale(1.3)';
setTimeout(() => { energyEl.style.transform = ''; energyEl.style.animation = ''; }, 300);
}
if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
playSound('wrong');
}

function openEnergyShop() {
playSound('button');
const current = gameState.energy || 0;
const pkgsHtml = ENERGY_PACKAGES.map((pkg, i) => `
<div onclick="buyEnergy(${i})" style="
  background: linear-gradient(145deg,${['#A8E6CF,#56AB2F','#FFD700,#FFA500','#667eea,#764ba2'][i]});
  padding:14px; border-radius:16px; cursor:pointer; margin-bottom:10px;
  display:flex; justify-content:space-between; align-items:center;
  border:3px solid transparent; transition:all 0.2s;"
  onmouseover="this.style.borderColor='white'" onmouseout="this.style.borderColor='transparent'">
  <div style="font-size:28px;">⚡</div>
  <div style="text-align:center;flex:1;">
    <div style="font-weight:900;font-size:18px;color:white;">${pkg.label}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.85);">de energia</div>
  </div>
  <div style="font-weight:700;font-size:16px;color:white;">🪙 ${pkg.coins}</div>
</div>`).join('');

Swal.fire({
title: '⚡ Energia',
html: `
<div style="text-align:center;margin-bottom:14px;">
  <div style="display:inline-flex;align-items:center;gap:8px;background:#f0f0f0;padding:10px 20px;border-radius:50px;">
    <span style="font-size:20px;">⚡</span>
    <span style="font-size:18px;font-weight:700;color:#333;">${current}</span>
    <span style="font-size:13px;color:#888;">⚡ energia disponível</span>
  </div>
  <p style="margin:10px 0 4px;color:#666;font-size:13px;">Repõe a tua energia para continuar a jogar!</p>
</div>
<div onclick="Swal.close(); setTimeout(watchAdForEnergy, 350)" style="
  background:linear-gradient(135deg,#FF6B35,#F7C948); border-radius:16px; padding:16px;
  margin-bottom:14px; cursor:pointer; text-align:center;
  box-shadow:0 4px 14px rgba(255,107,53,0.4);
  display:flex;align-items:center;justify-content:center;gap:12px;">
  <span style="font-size:28px;">📺</span>
  <div style="text-align:left;">
    <div style="font-weight:800;color:white;font-size:15px;font-family:'Quicksand',sans-serif;">Ver Anúncio Grátis</div>
    <div style="color:rgba(255,255,255,0.9);font-size:13px;font-family:'Quicksand',sans-serif;">Ganhar ⚡ +1 Energia · Grátis!</div>
  </div>
</div>
${pkgsHtml}
<p style="font-size:11px;color:#aaa;margin-top:8px;">Energia reposta diariamente às 00:00</p>`,
showConfirmButton: false,
showCloseButton: true,
width: '370px'
});
}

function buyEnergy(pkgIndex) {
const pkg = ENERGY_PACKAGES[pkgIndex];
if (!pkg) return;
if (gameState.coins < pkg.coins) {
Swal.fire({
title: '🪙 Moedas insuficientes',
html: `Precisas de <strong>${pkg.coins} moedas</strong>. Tens ${gameState.coins}.`,
icon: 'warning',
confirmButtonText: 'Comprar Moedas',
confirmButtonColor: 'var(--primary)',
showCancelButton: true, cancelButtonText: 'Cancelar'
}).then(r => { if (r.isConfirmed) { Swal.close(); setTimeout(openShop, 300); } });
return;
}
gameState.coins -= pkg.coins;
gameState.energy = Math.min((gameState.energy || 0) + pkg.energy, 9999);
saveGameState();
updateHeader();
Swal.close();
const badge = document.createElement('div');
badge.className = 'energy-restore-badge';
badge.innerHTML = `<div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:24px 32px;border-radius:24px;box-shadow:0 8px 32px rgba(102,126,234,0.5);">
  <div style="font-size:52px;margin-bottom:8px;">⚡</div>
  <div style="font-size:22px;font-weight:900;color:white;font-family:'Righteous',cursive;">+${pkg.energy} Energia!</div>
  <div style="font-size:14px;color:rgba(255,255,255,0.9);margin-top:4px;">-${pkg.coins} 🪙 moedas</div>
</div>`;
document.body.appendChild(badge);
setTimeout(() => badge.remove(), 2600);
setTimeout(() => createConfetti(), 200);
playSound('unlock');
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
// Ir para seleção de classes após compra de energia
setTimeout(() => {
Swal.close();
var _cid2 = gameState.currentClass;
if (_cid2) { selectClass(_cid2); } else { showClassSelection(); }
document.getElementById('floating-controls').style.display = 'flex';
document.getElementById('home-btn').style.display = 'flex';
document.getElementById('exit-btn').style.display = 'flex';
}, 2700);
}

function watchAdForEnergy() {
if (!checkInternetConnection()) {
Swal.fire({ title: '🌐 Sem Conexão', text: 'Precisas de internet para ver anúncios.', icon: 'warning', timer: 2500, showConfirmButton: false });
return;
}
showRewardedAd('coins', function() {
gameState.energy = Math.min((gameState.energy || 0) + 1, 9999);
saveGameState();
updateHeader();
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
const flash = document.createElement('div');
flash.className = 'energy-restore-badge';
flash.innerHTML = `<div style="background:linear-gradient(135deg,#FF6B35,#F7C948);padding:20px 28px;border-radius:20px;box-shadow:0 8px 24px rgba(255,107,53,0.4);">
  <div style="font-size:44px;margin-bottom:6px;">⚡</div>
  <div style="font-size:20px;font-weight:900;color:white;font-family:'Righteous',cursive;">+1 Energia!</div>
</div>`;
document.body.appendChild(flash);
setTimeout(() => flash.remove(), 2500);
playSound('unlock');
// Navegar para seleção de classes após ganhar energia
setTimeout(() => {
Swal.close();
var _cid = gameState.currentClass;
if (_cid) { selectClass(_cid); } else { showClassSelection(); }
document.getElementById('floating-controls').style.display = 'flex';
document.getElementById('home-btn').style.display = 'flex';
document.getElementById('exit-btn').style.display = 'flex';
}, 2600);
}, function() {
var _cid = gameState.currentClass;
if (_cid) { selectClass(_cid); } else { showClassSelection(); }
document.getElementById('floating-controls').style.display = 'flex';
document.getElementById('home-btn').style.display = 'flex';
document.getElementById('exit-btn').style.display = 'flex';
});
}

function showNoEnergyModal() {
playSound('wrong');
if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
Swal.fire({
title: '⚡ Sem Energia!',
html: `
<div style="text-align:center;padding:10px 0;">
  <div style="font-size:64px;margin-bottom:10px;filter:grayscale(1) opacity(0.5);">⚡</div>
  <p style="color:#555;font-size:15px;font-weight:600;margin-bottom:4px;">Ficaste sem energia!</p>
  <p style="color:#888;font-size:13px;margin-bottom:16px;">A energia renova-se diariamente às 00:00</p>
  <div style="background:#fff3cd;border-radius:12px;padding:12px;font-size:13px;color:#856404;">
    💡 Vê um anúncio ou compra energia para continuar já!
  </div>
</div>`,
showConfirmButton: true,
confirmButtonText: '⚡ Repor Energia',
confirmButtonColor: '#5E9B9D',
showCancelButton: true,
cancelButtonText: 'Sair do Quiz',
allowOutsideClick: false
}).then(r => {
if (r.isConfirmed) {
openEnergyShop();
} else {
if (typeof goToWelcomeScreen === 'function') goToWelcomeScreen();
}
});
}

function watchAdForCoins() {
playSound('button');
if (!checkInternetConnection()) {
Swal.fire({
title: '🌐 Sem Conexão',
text: 'Precisas de internet para ver anúncios.',
icon: 'warning', timer: 2500, showConfirmButton: false,
confirmButtonColor: 'var(--primary)'
});
return;
}
showRewardedAd('coins', function() {
// Recompensa: +10 moedas via moeda flutuante
gameState.coins += 10;
saveGameState();
updateHeader();
if (typeof scheduleSyncToFirestore === 'function') scheduleSyncToFirestore();
showFloatingCoinReward(10);
}, null);
}
function buyCoins(amount, price) {
openShop();
}
function openProfile() {
playSound('button');
const totalDisciplines = Object.values(gameState.classDisciplines).flat().length;
const completedDisciplines = Object.values(gameState.unlockedDisciplines).filter(d => d.completed).length;
const playerScore = gameState.level * 100 + gameState.qi * 2 + gameState.coins;
const tier = getRankTier(gameState.level);
const nextTier = getNextRankTier(gameState.level);
const xpPercent = gameState.expToNextLevel > 0 ? Math.round((gameState.exp / gameState.expToNextLevel) * 100) : 0;
const tierPercent = nextTier ? Math.round(((gameState.level - tier.minLevel) / (nextTier.minLevel - tier.minLevel)) * 100) : 100;
Swal.fire({
title: 'Meu Perfil',
html: `
<div style="text-align: center;">
<div style="font-size: 50px; margin-bottom: 5px;">${tier.icon}</div>
<div style="font-size: 18px; font-weight: 700; color: ${tier.color}; margin-bottom: 3px;">${tier.title}</div>
<h3 style="margin-bottom: 10px;">${gameState.playerName}</h3>
<div style="background:#f5f5f5;border-radius:14px;padding:14px;margin:10px 0;text-align:left;">
<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
<span style="font-weight:700;">Nível ${gameState.level}</span>
<span style="color:#999;">${gameState.exp} / ${gameState.expToNextLevel} XP</span>
</div>
<div style="width:100%;height:10px;background:#e0e0e0;border-radius:10px;overflow:hidden;">
<div style="height:100%;width:${xpPercent}%;background:linear-gradient(90deg,#FFD700,#FF6B6B);border-radius:10px;transition:width 0.5s;"></div>
</div>
<div style="text-align:right;font-size:10px;color:#aaa;margin-top:3px;">Próximo: Nv. ${gameState.level + 1}</div>
</div>
${nextTier ? `
<div style="background:#f5f5f5;border-radius:14px;padding:14px;margin:10px 0;text-align:left;">
<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:6px;">
<span>${tier.icon} ${tier.title}</span>
<span style="color:#999;">${tierPercent}%</span>
<span>${nextTier.icon} ${nextTier.title}</span>
</div>
<div style="width:100%;height:8px;background:#e0e0e0;border-radius:10px;overflow:hidden;">
<div style="height:100%;width:${tierPercent}%;background:linear-gradient(90deg,${tier.color},${nextTier.color});border-radius:10px;"></div>
</div>
<div style="text-align:center;font-size:10px;color:#aaa;margin-top:3px;">Faltam ${nextTier.minLevel - gameState.level} níveis para ${nextTier.title}</div>
</div>` : '<div style="background:#f5f5f5;border-radius:14px;padding:10px;margin:10px 0;color:#FFD700;font-size:13px;font-weight:700;">🏆 Título máximo alcançado!</div>'}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;">
<div style="background:#f5f5f5;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:var(--primary);">${gameState.qi}</div><div style="font-size:10px;color:#999;">QI</div></div>
<div style="background:#f5f5f5;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:#FFD700;">${gameState.coins}</div><div style="font-size:10px;color:#999;">Moedas</div></div>
<div style="background:#f5f5f5;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:var(--success);">${completedDisciplines}/${totalDisciplines}</div><div style="font-size:10px;color:#999;">Disciplinas</div></div>
<div style="background:#f5f5f5;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:var(--primary);">#${gameState.rankingPosition}</div><div style="font-size:10px;color:#999;">Ranking</div></div>
</div>
</div>
`,
confirmButtonText: 'Fechar',
confirmButtonColor: 'var(--primary)',
footer: (typeof currentUser !== 'undefined' && currentUser)
? `<button onclick="Swal.close(); doLogout()" style="border:none;background:none;color:#e74c3c;font-size:13px;cursor:pointer;font-family:'Quicksand',sans-serif;"><i class="fas fa-sign-out-alt"></i> Sair da conta (${currentUser.email})</button>`
: `<button onclick="Swal.close(); setTimeout(()=>_showAuthScreen(),300)" style="border:none;background:linear-gradient(135deg,#5E9B9D,#4A7C7E);color:white;padding:10px 20px;border-radius:50px;font-size:13px;cursor:pointer;font-family:'Quicksand',sans-serif;font-weight:700;"><i class="fas fa-sign-in-alt"></i> Entrar para ver o Ranking</button>`,
didOpen: () => {
const _sc = document.querySelector('.swal2-confirm'); if (_sc) _sc.addEventListener('click', () => playSound('button'), {once:true});
}
});
}
function shareProgress() {
playSound('button');
const gameUrl = _0x.d('aHR0cHM6Ly9wbGF5YmxtLmNvbS9xdWl6bW96');
const text = `🎮 QuizMoz - O jogo educacional moçambicano!\n📊 Nível ${gameState.level} — ${getRankTier(gameState.level).icon} ${getRankTier(gameState.level).title}\n🧠 QI: ${gameState.qi}\n🪙 ${gameState.coins} moedas\n🏆 Posição #${gameState.rankingPosition}\n\nDescarrega e joga também! ${gameUrl}`;
if (typeof window.plugins !== 'undefined' && window.plugins.socialsharing) {
window.plugins.socialsharing.share(
text,           // mensagem
'QuizMoz',      // título
null,           // imagem (null = sem imagem)
gameUrl,        // url
function() { console.log('Partilhado com sucesso'); },
function(e) {
console.log('Erro ao partilhar:', e);
fallbackShare(text);
}
);
} else {
fallbackShare(text);
}
}
function fallbackShare(text) {
if (navigator.share) {
navigator.share({
title: 'QuizMoz',
text: text
}).catch(() => showShareModal(text));
} else {
showShareModal(text);
}
}
function showShareModal(text) {
const encoded = encodeURIComponent(text);
Swal.fire({
title: '📤 Partilhar QuizMoz',
html: `
<div style="display:grid; gap:12px; margin:15px 0;">
<a href="whatsapp://send?text=${encoded}" style="
display:flex; align-items:center; gap:12px;
background:#25D366; color:white; text-decoration:none;
padding:14px 18px; border-radius:14px; font-weight:bold; font-size:15px;">
<i class="fab fa-whatsapp" style="font-size:22px;"></i> Partilhar no WhatsApp
</a>
<a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(_0x.d('aHR0cHM6Ly9wbGF5YmxtLmNvbS9xdWl6bW96'))}" target="_blank" style="
display:flex; align-items:center; gap:12px;
background:#1877F2; color:white; text-decoration:none;
padding:14px 18px; border-radius:14px; font-weight:bold; font-size:15px;">
<i class="fab fa-facebook" style="font-size:22px;"></i> Partilhar no Facebook
</a>
<a href="https://t.me/share/url?url=${encodeURIComponent(_0x.d('aHR0cHM6Ly9wbGF5YmxtLmNvbS9xdWl6bW96'))}&text=${encoded}" target="_blank" style="
display:flex; align-items:center; gap:12px;
background:#0088CC; color:white; text-decoration:none;
padding:14px 18px; border-radius:14px; font-weight:bold; font-size:15px;">
<i class="fab fa-telegram" style="font-size:22px;"></i> Partilhar no Telegram
</a>
<button onclick="
var ta = document.getElementById('share-text');
ta.select();
document.execCommand('copy');
Swal.fire({title:'✅ Copiado!', timer:1500, showConfirmButton:false});
" style="
display:flex; align-items:center; justify-content:center; gap:12px;
background:var(--primary); color:white; border:none;
padding:14px 18px; border-radius:14px; font-weight:bold; font-size:15px; cursor:pointer; width:100%;">
<i class="fas fa-copy" style="font-size:18px;"></i> Copiar texto
</button>
<textarea id="share-text" style="
width:100%; padding:10px; border-radius:10px;
border:1px solid #ddd; font-size:13px; color:#555;
resize:none;" rows="3" readonly>${text}</textarea>
</div>
`,
showConfirmButton: false,
showCloseButton: true,
width: '360px'
});
}
function toggleSound() {
soundEnabled = !soundEnabled;
gameState.soundEnabled = soundEnabled;
const soundBtn = document.getElementById('toggle-sound');
soundBtn.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
soundBtn.classList.toggle('muted', !soundEnabled);
saveGameState();
if (soundEnabled) {
playSound('button');
}
}
function playSound(type) {
if (!soundEnabled) return;
if (audioContext.state === 'suspended') {
audioContext.resume();
}
switch(type) {
case 'correct':
playCorrectSound();
break;
case 'wrong':
playWrongSound();
break;
case 'unlock':
playUnlockSound();
break;
case 'click':
playClickSound();
break;
case 'button':
playButtonSound();
break;
case 'coin':
playCoinSound();
break;
case 'timer':
playTimerSound();
break;
case 'win':
playWinSound();
break;
case 'welcome':
playWelcomeSound();
break;
}
}
// ===== SISTEMA DE NOTIFICAÇÕES LOCAIS =====
var notificationMessages = {
// Após 8 horas
h8: [
{ title: '🧠 Pergunta Rápida!', text: 'Qual é o rio mais longo de Moçambique? Abre o QuizMoz para descobrir!' },
{ title: '⏰ Hora do Quiz!', text: 'Tens 5 minutos? É o suficiente para subir de nível!' },
{ title: '🔥 Desafio do Dia!', text: 'Consegues acertar 5 perguntas seguidas? Tenta agora!' },
{ title: '💡 Sabias que...?', text: 'Moçambique tem 11 províncias! Quantas consegues nomear no QuizMoz?' },
{ title: '🎯 Missão Rápida!', text: 'Uma pergunta nova te espera. Será que sabes a resposta?' }
],
// Após 24 horas
h24: [
{ title: '⚔️ O teu ranking está a cair!', text: 'Os outros jogadores estão a subir. Volta ao QuizMoz e defende a tua posição!' },
{ title: '📚 Já estudaste hoje?', text: 'O QuizMoz tem perguntas novas à tua espera!' },
{ title: '🏆 Falta pouco!', text: 'Estás quase a desbloquear um novo título. Não desistas agora!' },
{ title: '🧩 Desafio Pendente!', text: 'Ainda tens perguntas por responder. Volta e conquista mais estrelas!' },
{ title: '⭐ Alguém te ultrapassou!', text: 'Volta ao QuizMoz e recupera a tua posição no ranking!' }
],
// Após 48 horas
h48: [
{ title: '😴 Saudades tuas!', text: 'Já passaram 2 dias! As tuas moedas estão a acumular poeira...' },
{ title: '🔥 Streak em risco!', text: 'Não percas o teu progresso. Uma partida rápida e voltas ao topo!' },
{ title: '🎓 Os teus colegas estão a avançar!', text: '3 jogadores ultrapassaram-te no ranking. Volta e mostra quem manda!' },
{ title: '💎 Recompensa à espera!', text: 'Tens moedas bónus à tua espera no QuizMoz. Vem buscar!' }
],
// Após 72 horas
h72: [
{ title: '🚨 Última Chamada!', text: 'Já passaram 3 dias. O teu título vai ser rebaixado se não voltares!' },
{ title: '👑 Um Mestre nunca desiste!', text: 'Volta ao QuizMoz e prova que és o melhor!' },
{ title: '💔 Sentimos a tua falta!', text: 'O QuizMoz não é o mesmo sem ti. Volta e continua a tua jornada!' }
]
};

function getRandomNotification(timeSlot) {
var msgs = notificationMessages[timeSlot];
return msgs[Math.floor(Math.random() * msgs.length)];
}

function scheduleNotifications() {
if (typeof cordova === 'undefined' || !cordova.plugins || !cordova.plugins.notification || !cordova.plugins.notification.local) {
console.log('Plugin de notificações não disponível');
return;
}
var notif = cordova.plugins.notification.local;
// Cancela todas as notificações anteriores
notif.cancelAll(function() {
console.log('✅ Notificações anteriores canceladas');
var now = new Date();
var playerTier = typeof getRankTier === 'function' ? getRankTier(gameState.level) : { icon: '🎮', title: 'Jogador' };
// Notificação 8 horas
var msg8 = getRandomNotification('h8');
notif.schedule({
id: 1,
title: msg8.title,
text: msg8.text,
trigger: { at: new Date(now.getTime() + 8 * 60 * 60 * 1000) },
foreground: true,
smallIcon: 'res://ic_stat_notification',
icon: 'res://icon',
sound: true,
vibrate: true
});
// Notificação 24 horas
var msg24 = getRandomNotification('h24');
// Personaliza com o tier do jogador
var text24 = msg24.text;
if (gameState.playerName) {
text24 = text24.replace('Os outros jogadores', gameState.playerName + ', os outros');
}
notif.schedule({
id: 2,
title: msg24.title,
text: text24,
trigger: { at: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
foreground: true,
smallIcon: 'res://ic_stat_notification',
icon: 'res://icon',
sound: true,
vibrate: true
});
// Notificação 48 horas
var msg48 = getRandomNotification('h48');
notif.schedule({
id: 3,
title: msg48.title,
text: msg48.text,
trigger: { at: new Date(now.getTime() + 48 * 60 * 60 * 1000) },
foreground: true,
smallIcon: 'res://ic_stat_notification',
icon: 'res://icon',
sound: true,
vibrate: true
});
// Notificação 72 horas
var msg72 = getRandomNotification('h72');
notif.schedule({
id: 4,
title: msg72.title,
text: msg72.text,
trigger: { at: new Date(now.getTime() + 72 * 60 * 60 * 1000) },
foreground: true,
smallIcon: 'res://ic_stat_notification',
icon: 'res://icon',
sound: true,
vibrate: true
});
// Notificações semanais recorrentes (dia 5 e 7)
var msg5d = { title: '🌟 Desafio Semanal!', text: playerTier.icon + ' ' + playerTier.title + ', tens um novo desafio semanal no QuizMoz!' };
notif.schedule({
id: 5,
title: msg5d.title,
text: msg5d.text,
trigger: { at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) },
foreground: true,
smallIcon: 'res://ic_stat_notification',
icon: 'res://icon',
sound: true,
vibrate: true
});
var msg7d = { title: '🏆 Uma semana sem jogar!', text: 'Volta ao QuizMoz! O teu ranking caiu e tens recompensas à espera.' };
notif.schedule({
id: 6,
title: msg7d.title,
text: msg7d.text,
trigger: { at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
foreground: true,
smallIcon: 'res://ic_stat_notification',
icon: 'res://icon',
sound: true,
vibrate: true
});
console.log('✅ 6 notificações agendadas!');
});
}


// ══ ANTI-FREEZE: Limpeza automática de backdrops SweetAlert2 presos ══
// (Removido o interval agressivo que apagava os modals a meio da animação e causava encravamento do jogo)

document.addEventListener('DOMContentLoaded', () => {
createLoadingParticles();
startLoading();
document.addEventListener('deviceready', function() {
console.log('✅ Cordova deviceready disparado!');

// Configurar a Barra de Status nativa
if (typeof StatusBar !== 'undefined') {
    StatusBar.backgroundColorByHexString("#1e3343"); // Cor de fundo do jogo
    StatusBar.styleLightContent(); // Ícones brancos
    StatusBar.overlaysWebView(false); // Evitar que o conteúdo fique atrás da barra
}

// Configurar botão físico de Voltar do Android
document.addEventListener("backbutton", function (e) {
    e.preventDefault();
    
    if (typeof Swal !== 'undefined' && Swal.isVisible()) {
        Swal.close();
        return;
    }
    
    var rankOverlay = document.getElementById('rank-overlay');
    if (rankOverlay && rankOverlay.style.opacity !== '0' && rankOverlay.parentNode) {
        if (typeof closeRankingModal === 'function') closeRankingModal();
        return;
    }

    if (currentScreen === 'game') {
        if (typeof confirmExit === 'function') confirmExit();
        return;
    }

    if (currentScreen === 'class-selection') {
        if (typeof goToWelcomeScreen === 'function') goToWelcomeScreen();
        return;
    }

    if (currentScreen === 'welcome') {
        Swal.fire({
            title: 'Sair do QuizMoz?',
            text: 'Deseja mesmo sair da aplicação?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--danger)',
            cancelButtonColor: 'var(--gray)',
            confirmButtonText: 'Sair',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed && navigator.app) {
                navigator.app.exitApp();
            }
        });
        return;
    }
}, false);

if (typeof cordova !== 'undefined' && cordova.plugin && cordova.plugin.http) {
cordovaHTTP = cordova.plugin.http;
console.log('✅ Plugin HTTP nativo pronto');
}
setTimeout(initAdMob, 1000); // pequeno delay para garantir que tudo carregou
setTimeout(scheduleNotifications, 2000); // agendar notificações
}, false);
document.addEventListener('click', function initAudioOnFirstClick() {
if (audioContext) audioContext.resume();
document.removeEventListener('click', initAudioOnFirstClick);
}, { once: true });
document.getElementById('toggle-sound').addEventListener('click', toggleSound);
document.getElementById('profile-btn').addEventListener('click', openProfile);
document.getElementById('about-btn').addEventListener('click', openAbout);
document.getElementById('share-btn').addEventListener('click', shareProgress);
document.getElementById('exit-btn').addEventListener('click', confirmExit);
window.addEventListener('offline', function() {
showNoInternetModal();
if (gameState.currentQuiz && gameState.currentQuiz.timerInterval) {
gameState.currentQuiz.timerPaused = true;
}
});
window.addEventListener('online', function() {
closeInternetModal();
Swal.fire({
title: 'Conectado!',
text: 'Conexão restabelecida.',
icon: 'success',
timer: 1500,
showConfirmButton: false
});
if (gameState.currentQuiz && gameState.currentQuiz.timerPaused) {
_resumeGameTimer();
}
});
if (!checkInternetConnection()) {
showNoInternetModal();
}
});
