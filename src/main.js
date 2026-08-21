import './style.css';
import { gameState, classesData, classDisciplines, COMBO_WORDS, WRONG_WORDS, TIERS, BASE_URL, GAME_VERSION, GAME_DISPLAY_VERSION, fetchQuestions, saveState, loadState, checkDailyEnergy } from './game.js';
import { showScreen, renderWelcome, renderClasses, renderDisciplines, updateHUD, showModal, hideModal, showLoading, runLoadingScreen, spawnConfetti, showCombo, getXPForLevel, getTier, showLevelUp, openSettings, renderCoinShop } from './ui.js';
import { playSound, toggleMute, isMuted, setMuted, isMusicEnabled, setMusicEnabled } from './audio.js';
import { auth, db, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCredential, onAuthStateChanged, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, onSnapshot, updateDoc, deleteDoc, serverTimestamp, runTransaction, arrayUnion } from './firebase.js';

let timerInterval = null;
let currentClassId = null;
let currentScreen = 'welcome'; // track for back navigation
let ntSinglePlayerUsedLetters = [];
const PAYMENT_API = 'https://quizdemo-six.vercel.app/api/netshop';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawRandomLetter(usedLetters = []) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVZ';
    let available = letters.split('').filter(l => !usedLetters.includes(l));
    if (available.length === 0) {
        usedLetters.length = 0;
        available = letters.split('');
    }
    return available[Math.floor(Math.random() * available.length)];
}



// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkDailyEnergy();
    setMuted(!gameState.soundEnabled);
    setMusicEnabled(gameState.musicEnabled !== false);
    scheduleNotifications();
    setupConnectivityCheck();
    preloadInterstitial();

    const versionDisplay = document.getElementById('game-version-display');
    if (versionDisplay) {
        versionDisplay.textContent = `v${GAME_DISPLAY_VERSION}`;
        
        let versionClicks = 0;
        versionDisplay.addEventListener('click', () => {
            versionClicks++;
            if (versionClicks >= 5) {
                versionClicks = 0;
                const currentMode = localStorage.getItem('test_ads_mode') === 'true';
                const newMode = !currentMode;
                localStorage.setItem('test_ads_mode', newMode ? 'true' : 'false');
                showModal({
                    circleIcon: '📺', circleType: newMode ? 'success' : 'info',
                    title: newMode ? 'Modo Teste Ativo' : 'Modo Teste Desativado',
                    centered: true,
                    desc: newMode 
                        ? 'Os anúncios de teste da AdMob foram ativados com sucesso! Agora verás anúncios fictícios (Google Test Ads).' 
                        : 'Os anúncios reais foram reativados. Os utilizadores verão anúncios de produção.'
                });
            }
        });
    }

    runLoadingScreen(async () => {
        playSound('welcome');
        finalizeAuthRestoration();
    });
});

async function finalizeAuthRestoration() {
    if (gameState.authCompleted) {
        if (!gameState.isGuest) {
            try {
                await Promise.race([
                    new Promise((resolve) => {
                        const unsubscribe = onAuthStateChanged(auth, (user) => {
                            unsubscribe();
                            resolve(user);
                        });
                    }),
                    new Promise((resolve) => setTimeout(() => resolve(null), 1500))
                ]);
            } catch (e) {
                console.warn('Firebase Auth restoration failed:', e);
            }
        }
        enterGame();
    } else {
        showAuthScreen();
    }
}


// ===== AUTH =====
function showAuthScreen() {
    const authScreen = document.getElementById('auth-screen');
    authScreen.style.display = 'flex';
    // Reset error messages
    document.getElementById('auth-login-error').textContent = '';
    const regErr = document.getElementById('auth-register-error');
    if (regErr) regErr.textContent = '';
    // Reset email section
    document.getElementById('auth-email-section').style.display = 'none';
    switchTab('login');
    bindAuthEvents();
}

function bindAuthEvents() {
    // Google
    document.getElementById('btn-google-login').onclick = async () => {
        try {
            let user;
            if (window.Capacitor?.isNativePlatform()) {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                const result = await FirebaseAuthentication.signInWithGoogle();
                user = result.user;
                if (result.credential && result.credential.idToken) {
                    const credential = GoogleAuthProvider.credential(result.credential.idToken);
                    const webResult = await signInWithCredential(auth, credential);
                    user = webResult.user;
                }
            } else {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                user = result.user;
            }
            gameState.isGuest = false;
            gameState.playerName = user.displayName || 'Jogador';
            gameState.authCompleted = true;
            await loadFirestoreData(user.uid);
            saveState(); enterGame();
        } catch(e) { document.getElementById('auth-login-error').textContent = 'Erro: ' + e.message; }
    };
    // Guest
    document.getElementById('btn-guest-login').onclick = () => {
        gameState.isGuest = true;
        gameState.authCompleted = true;
        saveState(); enterGame();
    };
    // Email toggle
    document.getElementById('btn-email-toggle').onclick = () => {
        const s = document.getElementById('auth-email-section');
        s.style.display = s.style.display === 'none' ? 'block' : 'none';
    };
    // Tabs
    document.getElementById('auth-login-tab').onclick = () => switchTab('login');
    document.getElementById('auth-register-tab').onclick = () => switchTab('register');
    // Login
    document.getElementById('btn-do-login').onclick = async () => {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        try {
            const r = await signInWithEmailAndPassword(auth, email, pass);
            gameState.isGuest = false;
            gameState.authCompleted = true;
            await loadFirestoreData(r.user.uid); saveState(); enterGame();
        } catch(e) { document.getElementById('auth-login-error').textContent = 'Erro: ' + e.message; }
    };
    // Register
    document.getElementById('btn-do-register').onclick = async () => {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value;
        const pass = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        const errEl = document.getElementById('auth-register-error');
        if (name.length < 2 || name.length > 20) { errEl.textContent = 'Nome: 2-20 caracteres'; return; }
        if (pass.length < 6) { errEl.textContent = 'Senha mínima: 6 caracteres'; return; }
        if (pass !== confirm) { errEl.textContent = 'Senhas não coincidem'; return; }
        try {
            const r = await createUserWithEmailAndPassword(auth, email, pass);
            gameState.isGuest = false;
            gameState.playerName = name;
            gameState.authCompleted = true;
            saveState(); enterGame();
        } catch(e) { errEl.textContent = 'Erro: ' + e.message; }
    };
    // Reset
    document.getElementById('btn-reset-pass').onclick = () => {
        showModal({ icon:'📧', title:'Recuperar Senha', desc:'Funcionalidade disponível em breve.', closeable: false, actions:[{label:'OK', onClick: hideModal}] });
    };
}

function switchTab(tab) {
    document.getElementById('auth-login-tab').classList.toggle('auth-tab-active', tab === 'login');
    document.getElementById('auth-register-tab').classList.toggle('auth-tab-active', tab === 'register');
    document.getElementById('auth-login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('auth-register-form').style.display = tab === 'register' ? 'block' : 'none';
}

async function loadFirestoreData(uid) {
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
            const d = snap.data();
            gameState.level = Math.max(gameState.level, d.level || 1);
            gameState.coins = Math.max(gameState.coins, d.coins || 0);
            gameState.qi = Math.max(gameState.qi, d.qi || 70);
            gameState.exp = Math.max(gameState.exp, d.exp || 0);
            if (d.playerName) gameState.playerName = d.playerName;
            if (d.vsUnlocked) gameState.vsUnlocked = true;
            gameState.freeMatchesLeft = d.freeMatchesLeft !== undefined ? d.freeMatchesLeft : 3;
        }
    } catch(e) { console.warn('Firestore load error:', e); }
}

// ===== ENTER GAME =====
function enterGame() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('floating-controls').style.display = 'flex';
    updateHUD();
    bindGlobalControls();
    goHome();
}

function bindGlobalControls() {
    // Sound toggle only in settings, no sidebar btn-sound anymore
    
    // Back button — navigates back or confirms exit during quiz
    document.getElementById('back-btn').onclick = () => {
        playSound('button');
        if (currentScreen === 'quiz') {
            if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Quiz?', centered: true,
                desc: 'Se saíres agora, perdes o progresso desta ronda.',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => {
                        hideModal(); clearInterval(timerInterval);
                        const cId = gameState.currentQuiz?.classId;
                        gameState.currentQuiz = null; saveState();
                        if (cId) goDisciplines(cId, classesData[cId]?.name || '');
                        else goClasses();
                    }},
                    {label:'Continuar', class:'modal-btn-primary', onClick:() => {
                        hideModal();
                        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                    }}
                ]
            });
        } else if (currentScreen === 'vs-lobby') {
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Lobby V/S?', centered: true,
                desc: 'Tens a certeza que queres sair do lobby?',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); goClasses(); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'vs-waiting' || currentScreen === 'vs-game') {
            // Confirm leaving VS match
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Modo V/S?', centered: true,
                desc: 'Se saíres agora, perdes a partida!',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); leaveVSRoom('Desististe do jogo.'); }},
                    {label:'Continuar', class:'modal-btn-success', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'nt-lobby') {
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Nome Terra?', centered: true,
                desc: 'Tens a certeza que queres sair do modo Nome Terra?',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); goClasses(); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'nt-waiting' || currentScreen === 'nt-game') {
            // Confirm leaving Nome Terra match
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Nome Terra?', centered: true,
                desc: 'Se saíres agora, perdes a partida!',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); leaveNTRoom('Desististe do jogo.'); }},
                    {label:'Continuar', class:'modal-btn-success', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'disciplines') {
            goClasses();
        } else if (currentScreen === 'classes') {
            // Go back to home/welcome screen
            gameState.nicknameSet = false; // Allow welcome to show
            goHome();
        }
    };
    
    // FAB Watch Ad button
    document.getElementById('fab-watch-ad').onclick = () => {
        playSound('button');
        showRewardedAd('coins');
    };
    
    // FAB V/S Mode button
    document.getElementById('fab-vs-mode').onclick = () => {
        playSound('button');
        goClasses();
        setTimeout(() => {
            const el = document.querySelector('.group-vs');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const entries = document.querySelectorAll('.vs-mode-entry, .vs-mode-entry-nt');
                entries.forEach(entry => {
                    entry.style.transition = 'transform 0.3s ease';
                    entry.style.transform = 'scale(1.03)';
                    setTimeout(() => {
                        entry.style.transform = '';
                    }, 500);
                });
            }
        }, 150);
    };
    
    // FAB Feedback button
    document.getElementById('fab-feedback').onclick = () => {
        playSound('button');
        openFeedbackModal();
    };
    
    // Settings gear — opens theme/sound toggles
    document.getElementById('settings-btn').onclick = () => {
        playSound('button');
        // Pause timer during settings
        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
        openSettings({
            modalFns: { showModal, hideModal },
            onThemeToggle: () => {
                document.body.classList.toggle('theme-dark');
                const isDark = document.body.classList.contains('theme-dark');
                gameState.theme = isDark ? 'dark' : 'light'; saveState();
            },
            onSoundToggle: () => {
                const m = toggleMute();
                gameState.soundEnabled = !m; saveState();
            },
            onMusicToggle: () => {
                const enabled = !isMusicEnabled();
                setMusicEnabled(enabled);
                gameState.musicEnabled = enabled; saveState();
            },
            onHomeClick: () => {
                if (ntRoomState) {
                    showModal({
                        circleIcon: '!', circleType: 'warn', title: 'Sair do Nome Terra?', centered: true,
                        desc: 'Se saíres agora, abandonas a partida em curso!',
                        actions: [
                            {label: 'Sim, sair', class: 'modal-btn-danger', onClick: () => { hideModal(); leaveNTRoom('Desististe do jogo.'); goHome(); }},
                            {label: 'Continuar', class: 'modal-btn-success', onClick: hideModal}
                        ]
                    });
                    return;
                }
                if (vsState) {
                    showModal({
                        circleIcon: '!', circleType: 'warn', title: 'Sair do Modo V/S?', centered: true,
                        desc: 'Se saíres agora, abandonas a partida em curso!',
                        actions: [
                            {label: 'Sim, sair', class: 'modal-btn-danger', onClick: () => { hideModal(); leaveVSRoom('Desististe do jogo.'); goHome(); }},
                            {label: 'Continuar', class: 'modal-btn-success', onClick: hideModal}
                        ]
                    });
                    return;
                }
                if (gameState.currentQuiz) {
                    showModal({
                        circleIcon: '!', circleType: 'warn', title: 'Sair do Quiz?', centered: true,
                        desc: 'Se saíres agora, perdes o progresso desta ronda.',
                        actions: [
                            {label: 'Sim, sair', class: 'modal-btn-danger', onClick: () => {
                                hideModal(); clearInterval(timerInterval);
                                gameState.currentQuiz = null; saveState();
                                goHome();
                            }},
                            {label: 'Continuar', class: 'modal-btn-primary', onClick: () => {
                                hideModal();
                                if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                            }}
                        ]
                    });
                    return;
                }
                goHome();
            },
            onClose: () => {
                if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
            }
        });
    };
    
    document.getElementById('profile-btn').onclick = () => {
        playSound('button');
        // Pause timer during profile
        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
        openProfile();
    };
    document.getElementById('btn-share').onclick = () => { playSound('button'); shareProgress(); };
    document.getElementById('btn-pause').onclick = () => { pauseGame(); };
    
    // Mascot click handler to jump/sway
    const mascot = document.getElementById('mascot-container');
    if (mascot) {
        mascot.onclick = () => {
            playSound('click');
            if (mascot.classList.contains('mascot-right')) {
                mascot.classList.remove('mascot-right');
                mascot.classList.add('mascot-left');
            } else {
                mascot.classList.remove('mascot-left');
                mascot.classList.add('mascot-right');
            }
        };
    }
    
    // About — Updated for release
    document.getElementById('about-btn').onclick = () => {
        playSound('button');
        // Pause timer during about
        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
        showModal({ circleIcon:'<i class="fas fa-info"></i>', circleType:'info', title:'Sobre o QuizMoz', centered: true,
            html: `<div class="about-content">
                <p>🎮 <strong>QuizMoz</strong> é um jogo educacional interativo desenvolvido para testar e expandir seus conhecimentos em diversas disciplinas do ensino moçambicano.</p>
                <h3>⭐ Características:</h3>
                <ul>
                    <li>17 Classes (1ª à 12ª + Especiais)</li>
                    <li>Sistema de progressão com níveis e QI</li>
                    <li>Ranking competitivo global</li>
                    <li>Moedas, energia e recompensas</li>
                    <li>⚔️ Modo V/S — Desafie um Amigo!</li>
                    <li>📝 Nome Terra - Stop — Jogue com vários amigos em tempo real!</li>
                    <li>Compra via e-Mola e M-Pesa</li>
                    <li>Temas claro/escuro</li>
                </ul>
                <h3>✉️ Contato:</h3>
                <p><a href="mailto:jogosdequiz.pt@gmail.com" class="about-email">jogosdequiz.pt@gmail.com</a></p>
                <h3>🔒 Política de Privacidade:</h3>
                <div class="about-privacy">
                    <p>Seus dados são tratados com segurança e transparência. Recolhemos apenas informações necessárias para o funcionamento do jogo.</p>
                    <a href="https://privacidade.playblm.com/" target="_blank" rel="noopener" class="about-privacy-link">📄 Ver Política de Privacidade Completa</a>
                </div>
                <p class="about-version">Versão ${GAME_DISPLAY_VERSION} © 2026 QuizMoz por PlayBLM</p>
            </div>`,
            actions:[
                {label:'Fechar', class:'modal-btn-primary', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
            ]
        });
    };
    
    // Feedback Modal
    function openFeedbackModal() {
        showModal({
            icon: '📝', title: 'Feedback & Suporte', centered: true,
            html: `
                <div class="feedback-form">
                    <p class="feedback-intro">A tua opinião é muito importante para nós!</p>
                    <div class="feedback-type-selector">
                        <button class="feedback-type-btn active" data-type="sugestao">💡 Sugestão</button>
                        <button class="feedback-type-btn" data-type="bug">🐛 Bug</button>
                        <button class="feedback-type-btn" data-type="elogio">⭐ Elogio</button>
                    </div>
                    <textarea id="feedback-message" class="feedback-textarea" placeholder="Escreve a tua mensagem aqui..." rows="4" maxlength="500"></textarea>
                    <div class="feedback-char-count"><span id="feedback-chars">0</span>/500</div>
                </div>
            `,
            actions: [
                { label: '📧 Enviar por Gmail', class: 'modal-btn-success', onClick: () => {
                    const typeBtn = document.querySelector('.feedback-type-btn.active');
                    const type = typeBtn ? typeBtn.dataset.type : 'sugestao';
                    const typeLabels = { sugestao: 'Sugestão', bug: 'Bug Report', elogio: 'Elogio' };
                    const msg = document.getElementById('feedback-message')?.value.trim();
                    if (!msg) { showCombo('Escreve uma mensagem! ✏️'); return; }
                    const subject = encodeURIComponent(`QuizMoz Feedback — ${typeLabels[type] || 'Geral'}`);
                    const body = encodeURIComponent(`Tipo: ${typeLabels[type] || 'Geral'}\n\nMensagem:\n${msg}\n\n---\nJogador: ${gameState.playerName}\nNível: ${gameState.level}\nQI: ${gameState.qi}\nVersão: ${GAME_DISPLAY_VERSION}`);
                    const mailUrl = `mailto:jogosdequiz.pt@gmail.com?subject=${subject}&body=${body}`;
                    if (window.Capacitor?.Plugins?.Browser) {
                        window.Capacitor.Plugins.Browser.open({ url: mailUrl });
                    } else {
                        window.open(mailUrl, '_blank');
                    }
                    hideModal();
                    showCombo('Obrigado pelo feedback! 🙏');
                }},
                { label: 'Cancelar', class: 'modal-btn-gray', onClick: () => hideModal() }
            ]
        });
        // Bind type selector buttons
        setTimeout(() => {
            document.querySelectorAll('.feedback-type-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.feedback-type-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });
            // Character counter
            document.getElementById('feedback-message')?.addEventListener('input', (e) => {
                const count = e.target.value.length;
                const el = document.getElementById('feedback-chars');
                if (el) el.textContent = count;
            });
        }, 100);
    }
    
    // Exit
    document.getElementById('exit-btn').onclick = () => {
        playSound('button');
        if (currentScreen === 'vs-waiting' || currentScreen === 'vs-game') {
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Modo V/S?', centered: true,
                desc: 'Se saíres agora, perdes a partida!',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); leaveVSRoom('Desististe do jogo.'); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'vs-lobby') {
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Lobby V/S?', centered: true,
                desc: 'Tens a certeza que queres sair do lobby?',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); goClasses(); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'nt-waiting' || currentScreen === 'nt-game') {
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Nome Terra?', centered: true,
                desc: 'Se saíres agora, perdes a partida!',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); leaveNTRoom('Desististe do jogo.'); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        } else if (currentScreen === 'nt-lobby') {
            showModal({ circleIcon:'!', circleType:'warn', title:'Sair do Nome Terra?', centered: true,
                desc: 'Tens a certeza que queres sair do modo Nome Terra?',
                actions:[
                    {label:'Sim, sair', class:'modal-btn-danger', onClick:() => { hideModal(); goClasses(); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        } else {
            showModal({ circleIcon:'!', circleType:'danger', title:'Sair do Jogo?', centered: true,
                desc:'Tens a certeza que queres sair?',
                actions:[
                    {label:'Sim', class:'modal-btn-danger', onClick:() => { hideModal(); if(window.Capacitor?.Plugins?.App) window.Capacitor.Plugins.App.exitApp(); }},
                    {label:'Não', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        }
    };
    
    // Apply saved theme
    if (gameState.theme === 'dark') { document.body.classList.add('theme-dark'); }
    
    // Energy/coins click — pause timer when opening shops
    document.getElementById('energy-display').onclick = () => { playSound('button'); openEnergyShop(); };
    document.getElementById('coins-display').onclick = () => { playSound('button'); openCoinShop(); };
}

// ===== NAVIGATION =====
// ===== 100 HOME PHRASES =====
const HOME_PHRASES = [
    'Pronto para desistir? Ou ainda tem combustível?','Quantas perguntas vais responder hoje?','Qual é o teu QI? Vamos descobrir juntos!','Quantas adivinhas acertaste hoje?','Já partilhaste o jogo com os teus manos?','O teu cérebro já tomou chá hoje?','Cuidado, o cérebro está a aquecer!','Eish, essa foi por pouco!','Estás a jogar ou estás a adivinhar?','Sem espreitar no Google, hein!',
    'Calma, ainda não é hora de chamar a mãe!','Tu consegues, vai em frente!','Cada pergunta é um degrau a mais!','Conhecimento é riqueza que ninguém te rouba!','Acredita em ti, és capaz!','Mais uma resposta certa, mais uma vitória!','Quem persiste, conquista!','O saber não ocupa espaço, ocupa o coração!','Hoje aprendes algo novo!','Cada erro é uma lição disfarçada!',
    'Não desistas, o melhor está por vir!','Acertou? Pode comemorar com uma xima quentinha!','Essa pergunta foi mais difícil que apanhar chapa às 5 da manhã!','Quem precisa de ChatGPT quando te tem a ti?','Eish, o cérebro está a suar!','Errou? Não chora, tenta de novo!','Já bebeste água? O cérebro também tem sede!','Estás a competir com quem? Contigo mesmo!','Mais perguntas que troco de mercado!','Vamos aprender brincando!',
    'O moçambicano é inteligente, prova isso aqui!','De Maputo a Pemba, és tu o campeão!','Mostra a tua sabedoria ao mundo!','O cérebro é como músculo: treina-o todos os dias!','Joga, partilha e ganha!','Eish, foste rápido!','Tás a ver? Sabias mais do que pensavas!','Não tenhas vergonha de saber, tem orgulho!','Cada acerto vale uma vitória!','O sucesso começa com um clique!',
    'Mais um quiz, mais um campeão!','Quem joga hoje, sabe mais amanhã!','Pensa, respira, responde!','Não tem pressa, tem precisão!','Moçambique tem talento, e tu és a prova!','Atenção: pode causar dependência saudável!','Joga em família, aprende em comunidade!','Cuidado, os teus amigos já estão à frente!','Estás no topo? Mantém-te lá!','Errar é humano, insistir é de sábios!',
    'Tu és mais inteligente do que pensas!','Pergunta a pergunta, chegas longe!','Não tens rede? O conhecimento já está dentro de ti!','Mostra à malta de que terra és!','A escola da vida começa por aqui!','Tás a transpirar? É o cérebro a malhar!','Cada certo aproxima-te do prémio!','Essa foi canja, próxima!','Não fugiste da pergunta, hein!','Já chamaste os manos para jogar?',
    'O jogo está aceso, bora lá!','Mais uma vitória para a coleção!','Sem desistir, sem vacilar!','Joga como se fosse a final do Mundial!','O conhecimento abre portas que a chave não abre!','Mais difícil que pescar no Índico!','Foste à escola? Mostra agora!','Quem disse que aprender é chato?','O cérebro está a dançar marrabenta!','Aqui não há chapa parado, o jogo continua!',
    'Já estás na liderança? Defende o lugar!','A próxima pergunta pode ser a tua de ouro!','Pensa duas vezes, responde uma!','Quem arrisca, petisca!','Vai com calma, mas vai!','Eish mano, essa foi cabeluda!','O cérebro pediu férias? Manda-o voltar!','Quem aprende nunca envelhece!','Cada quiz é uma viagem ao saber!','De norte a sul, és tu o melhor!',
    'Mostra que sabes mais que o GPS!','Não te zangues com a pergunta, abraça-a!','O segredo é tentar sempre!','A vitória é de quem não desiste!','Hoje é dia de brilhar!','Sabias que estás cada vez melhor?','Não foi sorte, foi cabeça!','Quem perde hoje, ganha amanhã!','Foco, atenção e... resposta certa!','O moçambicano nunca desiste!',
    'Mais um nível, mais um sorriso!','Estás a fazer história, continua!','Cada certo vale ouro de Manica!','Joga, partilha e convida a malta toda!','Tu és o campeão de hoje!','Sabedoria não se compra no mercado, conquista-se!','Mais uma e ficas Mazza!','Não desligues, a melhor pergunta vem a seguir!','O teu nome merece o topo do ranking!','Bora lá, Moçambique a jogar é Moçambique a aprender!'
];

function getRandomPhrase() {
    return HOME_PHRASES[Math.floor(Math.random() * HOME_PHRASES.length)];
}

function goWelcome() {
    currentScreen = 'welcome';
    hideQuizControls();
    document.getElementById('fab-watch-ad').style.display = 'none';
    document.getElementById('fab-vs-mode').style.display = 'none';
    document.getElementById('fab-feedback').style.display = 'none';
    
    // If player already has a name set (not default), go to home
    if (gameState.nicknameSet) {
        goHome();
        return;
    }
    
    showScreen('welcome', (c) => {
        renderWelcome(c);
        document.getElementById('btn-start-journey')?.addEventListener('click', () => {
            const nick = document.getElementById('nickname-input')?.value.trim();
            if (nick && nick.length >= 2) {
                gameState.playerName = nick;
                gameState.nicknameSet = true;
                saveState(); updateHUD();
                playSound('button');
                const nickCard = document.querySelector('.welcome-card');
                if (nickCard) {
                    nickCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    nickCard.style.opacity = '0';
                    nickCard.style.transform = 'translateY(-30px) scale(0.95)';
                    setTimeout(() => {
                        nickCard.style.display = 'none';
                        const welcomeScreen = document.querySelector('.welcome-screen');
                        if (welcomeScreen) {
                            const readyMsg = document.createElement('div');
                            readyMsg.className = 'welcome-ready-msg';
                            readyMsg.innerHTML = `<div class="welcome-ready-icon">👋</div><div class="welcome-ready-text">Olá, <strong>${nick}</strong>!</div><div class="welcome-ready-sub">A preparar o jogo...</div>`;
                            welcomeScreen.appendChild(readyMsg);
                        }
                        setTimeout(() => goClasses(), 1500);
                    }, 400);
                } else {
                    goClasses();
                }
            } else {
                showCombo('Nickname: 2-20 caracteres ❌');
            }
        });
        document.getElementById('btn-ad-coins')?.addEventListener('click', () => { playSound('coin'); showRewardedAd('coins'); });
    });
}

function goClasses() {
    currentScreen = 'classes';
    hideQuizControls();
    document.getElementById('floating-controls').style.display = 'flex';
    document.getElementById('fab-watch-ad').style.display = 'flex';
    document.getElementById('fab-vs-mode').style.display = 'flex';
    document.getElementById('fab-feedback').style.display = 'none';
    showScreen('classes', (c) => {
        renderClasses(c);
        c.querySelectorAll('.card-btn').forEach(btn => {
            btn.onclick = () => { playSound('click'); handleClassClick(btn.dataset.classId); };
        });
        // V/S Mode entry button
        document.getElementById('vs-mode-entry-btn')?.addEventListener('click', () => { playSound('button'); openVSLobby(); });
        document.getElementById('vs-mode-entry-nt')?.addEventListener('click', () => { playSound('button'); openNomeTerraLobby(); });
    });
}

// Go to home/welcome screen (after nickname is already set)
const PHRASE_COLORS = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #f6d365, #fda085)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #ff9a9e, #fecfef)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #ffecd2, #fcb69f)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #6c5ce7, #a29bfe)'
];
function goHome() {
    currentScreen = 'welcome';
    hideQuizControls();
    document.getElementById('floating-controls').style.display = 'flex';
    document.getElementById('fab-watch-ad').style.display = 'none';
    document.getElementById('fab-vs-mode').style.display = 'flex';
    document.getElementById('fab-feedback').style.display = 'flex';
    
    showScreen('welcome', (c) => {
        renderWelcome(c);
        const nickCard = document.querySelector('.welcome-card');
        if (nickCard && gameState.playerName && gameState.playerName !== 'Jogador') {
            const phrase = getRandomPhrase();
            const phraseColor = PHRASE_COLORS[Math.floor(Math.random() * PHRASE_COLORS.length)];
            nickCard.innerHTML = `
                <div class="welcome-book-logo">
                    <div class="book-icon">
                        <div class="book-spine"></div>
                        <div class="book-cover">
                            <div class="book-title">QuizMoz</div>
                            <div class="book-subtitle">📚</div>
                        </div>
                    </div>
                </div>
                <div class="welcome-title">Olá, ${gameState.playerName}! 👋</div>
                <div class="phrase-carousel">
                    <div class="phrase-card" style="background:${phraseColor}">${phrase}</div>
                </div>
                <button class="btn-enter-game" id="btn-play-again">🚀 Jogar!</button>
            `;
            document.getElementById('btn-play-again')?.addEventListener('click', () => {
                playSound('button');
                gameState.nicknameSet = true; saveState();
                goClasses();
            });
        } else {
            document.getElementById('btn-start-journey')?.addEventListener('click', () => {
                const nick = document.getElementById('nickname-input')?.value.trim();
                if (nick && nick.length >= 2) {
                    gameState.playerName = nick;
                    gameState.nicknameSet = true;
                    saveState(); updateHUD();
                    playSound('button');
                    goClasses();
                } else {
                    showCombo('Nickname: 2-20 caracteres ❌');
                }
            });
        }
        document.getElementById('btn-ad-coins')?.addEventListener('click', () => { playSound('coin'); showRewardedAd('coins'); });
    });
}

// ===== INTERNET CONNECTIVITY =====
function setupConnectivityCheck() {
    if (!navigator.onLine) {
        showNoInternetModal();
    }
    window.addEventListener('offline', () => {
        showNoInternetModal();
    });
    window.addEventListener('online', () => {
        // If the no-internet modal is showing, close it
        hideModal();
        showCombo('Conexão restaurada! ✅');
    });
}

function showNoInternetModal() {
    showModal({
        circleIcon:'<i class="fas fa-wifi"></i>', circleType:'danger',
        title:'Sem Internet', centered: true,
        html: `
            <div style="text-align:center;">
                <div style="font-size:3em;margin:10px 0;">📡</div>
                <p>Parece que estás <strong>sem conexão à internet</strong>.</p>
                <p style="font-size:0.85em;color:var(--text-dim);margin-top:8px;">Verifica o teu Wi-Fi ou dados móveis e tenta novamente.</p>
            </div>
        `,
        actions:[
            {label:'🔄 Tentar Novamente', class:'modal-btn-primary', onClick:() => {
                if (navigator.onLine) {
                    hideModal();
                    showCombo('Conexão restaurada! ✅');
                } else {
                    showCombo('Ainda sem internet ❌');
                }
            }},
            {label:'Continuar Offline', class:'modal-btn-gray', onClick: hideModal}
        ]
    });
}

function handleClassClick(id) {
    const cls = classesData[id];
    if (!cls) return;
    // If all levels purchased, bypass level and coin checks
    if (gameState.allLevelsPurchased) {
        goDisciplines(id, cls.name);
        return;
    }
    if (gameState.level < cls.requiredLevel) {
        const needLevel = cls.requiredLevel;
        const needCoins = cls.requiredCoins || 0;
        showModal({ circleIcon:'!', circleType:'warn', title:'Classe Bloqueada', centered: true,
            desc: `Você precisa de:<br><strong>Nível ${needLevel} e ${needCoins} 🪙</strong>`,
            actions:[
                {label:'🛒 Comprar Moedas', class:'modal-btn-outline', onClick:() => { hideModal(); openCoinShop(); }},
                {label:'Bem vindo ✨', class:'modal-btn-success', onClick: hideModal},
                {label:'Fechar', class:'modal-btn-danger', onClick: hideModal}
            ]
        });
        return;
    }
    if (!cls.starter && cls.requiredCoins > 0 && !gameState.unlockedClasses?.includes(id)) {
        if (gameState.coins < cls.requiredCoins) {
            showModal({ circleIcon:'!', circleType:'warn', title:'Classe Bloqueada', centered: true,
                desc: `Você precisa de:<br><strong>Nível ${cls.requiredLevel} e ${cls.requiredCoins} 🪙</strong>`,
                actions:[
                    {label:'🛒 Comprar Moedas', class:'modal-btn-outline', onClick:() => { hideModal(); openCoinShop(); }},
                    {label:'Bem vindo ✨', class:'modal-btn-success', onClick: hideModal},
                    {label:'Fechar', class:'modal-btn-danger', onClick: hideModal}
                ]
            });
            return;
        }
        showModal({ circleIcon:'?', circleType:'info', title:`Desbloquear ${cls.name}?`, centered: true,
            desc: `Você usará ${cls.requiredCoins} moedas para desbloquear ${cls.name}`,
            actions:[
                {label:'Sim!', class:'modal-btn-success', onClick:() => {
                    gameState.coins -= cls.requiredCoins;
                    if(!gameState.unlockedClasses) gameState.unlockedClasses = [];
                    gameState.unlockedClasses.push(id);
                    playSound('unlock'); spawnConfetti(); spawnConfetti(); updateHUD(); saveState(); hideModal(); goDisciplines(id, cls.name);
                }},
                {label:'Cancelar', class:'modal-btn-danger', onClick: hideModal}
            ]
        });
        return;
    }
    goDisciplines(id, cls.name);
}

function goDisciplines(classId, className) {
    currentScreen = 'disciplines';
    currentClassId = classId;
    document.getElementById('floating-controls').style.display = 'flex';
    document.getElementById('fab-watch-ad').style.display = 'flex';
    document.getElementById('fab-vs-mode').style.display = 'flex';
    showScreen('disciplines', (c) => {
        renderDisciplines(c, classId, className);
        document.getElementById('btn-back-classes')?.addEventListener('click', () => { playSound('button'); goClasses(); });
        c.querySelectorAll('.disc-card').forEach(btn => {
            btn.onclick = () => { playSound('click'); handleDiscClick(btn.dataset.classId, btn.dataset.disc); };
        });
    });
}

function handleDiscClick(classId, disc) {
    const key = `${classId}_${disc}`;
    const discs = classDisciplines[classId] || [];
    const idx = discs.indexOf(disc);
    const isFirst = idx === 0;
    const isUnlocked = isFirst || gameState.allLevelsPurchased || gameState.unlockedDisciplines?.includes(key);
    if (!isUnlocked) {
        if (gameState.coins < 70) {
            showModal({ circleIcon:'!', circleType:'warn', title:'Moedas Insuficientes', centered: true,
                desc: 'Precisa de 🪙 70 moedas para desbloquear.',
                actions:[{label:'🛒 Comprar Moedas', class:'modal-btn-outline', onClick:() => { hideModal(); openCoinShop(); }}, {label:'Fechar', class:'modal-btn-gray', onClick: hideModal}]
            });
            return;
        }
        showModal({ circleIcon:'?', circleType:'info', title:'Desbloquear Disciplina?', centered: true,
            desc: `Você usará 70 moedas para desbloquear ${disc}`,
            actions:[
            {label:'Sim!', class:'modal-btn-success', onClick:() => {
                gameState.coins -= 70;
                if(!gameState.unlockedDisciplines) gameState.unlockedDisciplines = [];
                gameState.unlockedDisciplines.push(key);
                playSound('unlock'); spawnConfetti(); spawnConfetti(); updateHUD(); saveState(); hideModal(); startQuiz(classId, disc);
            }},
            {label:'Cancelar', class:'modal-btn-danger', onClick: hideModal}
            ]
        });
        return;
    }
    startQuiz(classId, disc);
}

// ===== QUIZ =====
async function startQuiz(classId, disc) {
    if (gameState.energy <= 0) {
        showOutOfEnergyModal();
        return;
    }
    // Block quiz if offline — ads require internet
    if (!navigator.onLine) {
        showModal({
            circleIcon:'<i class="fas fa-wifi"></i>', circleType:'danger',
            title:'Sem Internet', centered: true,
            html: `
                <div style="text-align:center;">
                    <div style="font-size:3em;margin:10px 0;">📡</div>
                    <p>Precisas de <strong>conexão à internet</strong> para jogar.</p>
                    <p style="font-size:0.85em;color:var(--text-dim);margin-top:8px;">Verifica o teu Wi-Fi ou dados móveis e tenta novamente.</p>
                </div>
            `,
            actions:[
                {label:'🔄 Tentar Novamente', class:'modal-btn-primary', onClick:() => {
                    hideModal();
                    if (navigator.onLine) startQuiz(classId, disc);
                    else showCombo('Ainda sem internet ❌');
                }},
                {label:'Voltar', class:'modal-btn-gray', onClick: hideModal}
            ]
        });
        return;
    }
    showLoading(true, `A carregar ${disc}...`);
    try {
        const allQuestions = await fetchQuestions(classId, disc);
        
        // Filter out already answered questions
        const key = `${classId}_${disc}`;
        const answered = gameState.answeredQuestions?.[key] || [];
        let questions = allQuestions.filter(q => !answered.includes(q.id));
        
        // If all questions answered, allow replay
        if (questions.length === 0) {
            showModal({ icon:'🎉', title:'Todas respondidas!', centered: true,
                desc: `Já respondeste a todas as ${allQuestions.length} perguntas desta disciplina.<br><br>Queres jogar novamente?`,
                actions:[
                    {label:'🔄 Jogar Novamente', class:'modal-btn-success', onClick:() => {
                        hideModal();
                        // Reset answered for this discipline
                        if (gameState.answeredQuestions) gameState.answeredQuestions[key] = [];
                        saveState();
                        startQuiz(classId, disc);
                    }},
                    {label:'Voltar', class:'modal-btn-gray', onClick:() => { hideModal(); goDisciplines(classId, classesData[classId]?.name || ''); }}
                ]
            });
            showLoading(false);
            return;
        }
        
        shuffleArray(questions);
        gameState.currentQuiz = { classId, disc, questions, totalInFile: allQuestions.length, currentIndex: 0, score: 0, wrong: 0, timeLeft: 30, isPaused: false };
        gameState.streak = 0;
        currentScreen = 'quiz';
        document.getElementById('fab-watch-ad').style.display = 'none';
        document.getElementById('fab-vs-mode').style.display = 'none';
        document.getElementById('fab-feedback').style.display = 'none';
        showQuizControls();
        showScreen('quiz', (c) => { c.innerHTML = '<div id="quiz-area"></div>'; loadQuestion(); });
    } catch(e) {
        showModal({ icon:'❌', title:'Erro', desc: e.message, actions:[{label:'OK', onClick: hideModal}] });
    }
    showLoading(false);
}

function createQuizFloatingIcons() {
    const icons = ['❓', '❗', '❓', '❗', '❓', '❗', '❓', '❗', '❓', '❗'];
    return icons.map((icon, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const dur = 8 + Math.random() * 8;
        const size = 14 + Math.random() * 16;
        return `<div class="quiz-float-icon" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;font-size:${size}px;">${icon}</div>`;
    }).join('');
}
function showQuizControls() {
    document.getElementById('timer-btn').style.display = 'flex';
    document.getElementById('btn-reveal').style.display = 'flex';
    document.getElementById('btn-add-time').style.display = 'flex';
    document.getElementById('btn-pause').style.display = 'flex';
    showMascot();
}
function hideQuizControls() {
    document.getElementById('timer-btn').style.display = 'none';
    document.getElementById('btn-reveal').style.display = 'none';
    document.getElementById('btn-add-time').style.display = 'none';
    document.getElementById('btn-pause').style.display = 'none';
    hideMascot();
}

function loadQuestion() {
    const q = gameState.currentQuiz;
    const question = q.questions[q.currentIndex];
    q.timeLeft = 30; q.isPaused = false;
    updateTimerUI();
    const area = document.getElementById('quiz-area');
    const keys = ['A','B','C','D'].filter(k => question.options[k]);
    shuffleArray(keys);
    area.innerHTML = `
        <div class="quiz-floating-bg">${createQuizFloatingIcons()}</div>
        <div class="quiz-card">
            <div class="quiz-header-row">
                <span class="quiz-discipline"><i class="fas fa-book-open"></i> ${q.disc}</span>
                <span class="quiz-counter">${q.currentIndex+1}/${q.questions.length}</span>
            </div>
            <div class="quiz-remaining">Restam: ${q.questions.length - q.currentIndex - 1} perguntas</div>
            <div class="quiz-question"><h3>${question.text}</h3></div>
            <div class="answers-grid" id="answers-grid">
                ${keys.map(k => `<button class="answer-btn" data-key="${k}"><span class="letter">${k}</span><span>${question.options[k]}</span></button>`).join('')}
            </div>
        </div>`;
    area.querySelectorAll('.answer-btn').forEach(btn => {
        btn.onclick = () => { playSound('click'); selectAnswer(btn, btn.dataset.key, question.correct); };
    });
    startTimer();
    mascotTrigger('question');
}

// ===== TIMER =====
let _hintShownTimer = false;
let _hintShownReveal = false;

function updateTimerUI() {
    const t = gameState.currentQuiz?.timeLeft ?? 30;
    document.getElementById('timer-value').textContent = t;
    const tb = document.getElementById('timer-btn');
    tb.classList.toggle('danger', t <= 10);
    if (t <= 5 && t > 0) playSound('tick');
}

function showHandHint(targetBtnId) {
    const btn = document.getElementById(targetBtnId);
    if (!btn) return;
    // Remove any existing hint
    document.querySelectorAll('.hand-hint-indicator').forEach(h => h.remove());
    const hint = document.createElement('div');
    hint.className = 'hand-hint-indicator';
    // Use right-pointing hand since buttons are on the right side
    hint.innerHTML = '👉';
    btn.style.position = 'relative';
    btn.appendChild(hint);
    // Also flash the button to attract attention
    btn.classList.add('hint-flash');
    setTimeout(() => { hint.remove(); btn.classList.remove('hint-flash'); }, 3000);
}

function startTimer() {
    clearInterval(timerInterval);
    _hintShownTimer = false;
    _hintShownReveal = false;
    timerInterval = setInterval(() => {
        if (!gameState.currentQuiz || gameState.currentQuiz.isPaused) return;
        gameState.currentQuiz.timeLeft--;
        updateTimerUI();
        // Hand hint at 20s: point to REVEAL ANSWER button (💡)
        if (gameState.currentQuiz.timeLeft === 20 && !_hintShownReveal) {
            _hintShownReveal = true;
            showHandHint('btn-reveal');
        }
        // Hand hint at 10s: point to ADD TIME button (⏰)
        if (gameState.currentQuiz.timeLeft === 10 && !_hintShownTimer) {
            _hintShownTimer = true;
            showHandHint('btn-add-time');
        }
        if (gameState.currentQuiz.timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); }
    }, 1000);
}

// ===== ANSWER HANDLING =====
function selectAnswer(btn, selected, correct) {
    clearInterval(timerInterval);
    document.querySelectorAll('.answer-btn').forEach(b => { b.onclick = null; b.style.pointerEvents = 'none'; });
    if (selected === correct) { handleCorrect(btn); }
    else { handleWrong(btn, correct); }
}

function handleCorrect(btn) {
    playSound('correct'); btn.classList.add('correct');
    gameState.currentQuiz.score++;
    gameState.streak++;
    spawnConfetti();
    // Combo
    let comboText = COMBO_WORDS[0].text;
    for (const c of COMBO_WORDS) { if (gameState.streak >= c.min) comboText = c.text; }
    showCombo(comboText);
    if (gameState.streak >= 2) showCombo(`${gameState.streak}× Combo!`);
    // Rewards
    const baseCoins = 3;
    const comboBonus = gameState.streak >= 5 ? 5 : gameState.streak >= 3 ? 3 : 0;
    const coinsEarned = baseCoins + comboBonus;
    gameState.coins += coinsEarned;
    if (gameState.currentQuiz) {
        gameState.currentQuiz.lastCoinsEarned = coinsEarned;
    }
    gameState.exp += 10;
    gameState.qi = Math.min(200, gameState.qi + 1);
    gameState.currentQuiz.timeLeft += 20;
    // Coins fly to HUD effect
    spawnCoinFlyEffect(coinsEarned);
    // Track answered question
    const answKey = `${gameState.currentQuiz.classId}_${gameState.currentQuiz.disc}`;
    if (!gameState.answeredQuestions) gameState.answeredQuestions = {};
    if (!gameState.answeredQuestions[answKey]) gameState.answeredQuestions[answKey] = [];
    const qId = gameState.currentQuiz.questions[gameState.currentQuiz.currentIndex].id;
    if (!gameState.answeredQuestions[answKey].includes(qId)) gameState.answeredQuestions[answKey].push(qId);
    // Update discipline progress
    if (!gameState.disciplineProgress) gameState.disciplineProgress = {};
    if (!gameState.disciplineProgress[answKey]) gameState.disciplineProgress[answKey] = { answered: 0, total: gameState.currentQuiz.totalInFile || 0, correct: 0 };
    gameState.disciplineProgress[answKey].correct++;
    gameState.disciplineProgress[answKey].answered = gameState.answeredQuestions[answKey].length;
    gameState.disciplineProgress[answKey].total = gameState.currentQuiz.totalInFile || gameState.disciplineProgress[answKey].total;
    // Level up check
    const needed = getXPForLevel(gameState.level);
    if (gameState.exp >= needed) {
        gameState.exp -= needed; gameState.level++;
        gameState._pendingLevelUp = true;
        playSound('victory'); spawnConfetti(); spawnConfetti();
    }
    updateHUD(); saveState();
    mascotTrigger('correct');
    setTimeout(() => showJustification('correct'), 1500);
}

function handleWrong(btn, correct) {
    playSound('wrong'); btn.classList.add('wrong');
    document.querySelectorAll('.answer-btn').forEach(b => { if (b.dataset.key === correct) b.classList.add('correct'); });
    gameState.currentQuiz.wrong++;
    gameState.streak = 0;
    gameState.qi = Math.max(70, gameState.qi - 1);
    gameState.energy = Math.max(0, gameState.energy - 1);
    if (gameState.bonusEnergy > 0) gameState.bonusEnergy--;
    // Track answered question (wrong)
    const answKeyW = `${gameState.currentQuiz.classId}_${gameState.currentQuiz.disc}`;
    if (!gameState.answeredQuestions) gameState.answeredQuestions = {};
    if (!gameState.answeredQuestions[answKeyW]) gameState.answeredQuestions[answKeyW] = [];
    const qIdW = gameState.currentQuiz.questions[gameState.currentQuiz.currentIndex].id;
    if (!gameState.answeredQuestions[answKeyW].includes(qIdW)) gameState.answeredQuestions[answKeyW].push(qIdW);
    // Update progress
    if (!gameState.disciplineProgress) gameState.disciplineProgress = {};
    if (!gameState.disciplineProgress[answKeyW]) gameState.disciplineProgress[answKeyW] = { answered: 0, total: gameState.currentQuiz.totalInFile || 0, correct: 0 };
    gameState.disciplineProgress[answKeyW].answered = gameState.answeredQuestions[answKeyW].length;
    updateHUD(); saveState();
    const word = WRONG_WORDS[Math.floor(Math.random() * WRONG_WORDS.length)];
    showCombo(word);
    mascotTrigger('wrong');
    setTimeout(() => showJustification('wrong'), 1500);
}

function handleTimeout() {
    playSound('wrong');
    const q = gameState.currentQuiz;
    const question = q.questions[q.currentIndex];
    document.querySelectorAll('.answer-btn').forEach(b => { b.onclick = null; b.style.pointerEvents = 'none'; if (b.dataset.key === question.correct) b.classList.add('correct'); });
    q.wrong++;
    gameState.streak = 0;
    gameState.qi = Math.max(70, gameState.qi - 2);
    gameState.energy = Math.max(0, gameState.energy - 1);
    if (gameState.bonusEnergy > 0) gameState.bonusEnergy--;
    updateHUD(); saveState();
    showCombo('Tempo Esgotado! ⏰');
    mascotTrigger('timeout');
    setTimeout(() => showJustification('timeout'), 1500);
}

function showJustification(type) {
    const q = gameState.currentQuiz;
    const question = q.questions[q.currentIndex];
    const just = question.justification ? `<br><br><strong>Justificação:</strong> ${question.justification}` : '';
    const icons = { correct: '✅', wrong: '❌', timeout: '⏰' };
    const titles = { correct: 'Correto!', wrong: 'Incorreto!', timeout: 'Tempo Esgotado!' };
    const endQuiz = type !== 'correct';
    
    // Check if energy ran out — redirect to disciplines
    if (gameState.energy <= 0 && type !== 'correct') {
        showModal({
            icon: '⚡', title: 'Sem Energia!',
            desc: `Resposta: ${question.correct}` + just + '<br><br><strong>⚡ A tua energia acabou!</strong>',
            energy: 0,
            actions: [{ label: '⬅️ Voltar às Disciplinas', class: 'modal-btn-primary', onClick: () => {
                hideModal(); clearInterval(timerInterval);
                const cId = q.classId;
                gameState.currentQuiz = null; saveState();
                goDisciplines(cId, classesData[cId]?.name || '');
            }}]
        });
        return;
    }
    
    const lastCoins = q.lastCoinsEarned || 3;
    showModal({
        icon: icons[type], title: titles[type],
        desc: (type === 'correct' ? `+10 XP · +${lastCoins} 🪙 · +1 QI` : `Resposta: ${question.correct}`) + just,
        energy: type !== 'correct' ? gameState.energy : undefined,
        actions: [{ label: endQuiz ? 'Ver Resultados' : 'Próxima', class: 'modal-btn-primary', onClick: () => { hideModal(); if (endQuiz) showResults(); else nextQuestion(); } }]
    });
}

function nextQuestion() {
    // Check for pending level up first
    if (gameState._pendingLevelUp) {
        gameState._pendingLevelUp = false;
        showLevelUpCelebration(() => {
            gameState.currentQuiz.currentIndex++;
            if (gameState.currentQuiz.currentIndex < gameState.currentQuiz.questions.length) loadQuestion();
            else showResults();
        });
        return;
    }
    gameState.currentQuiz.currentIndex++;
    if (gameState.currentQuiz.currentIndex < gameState.currentQuiz.questions.length) loadQuestion();
    else showResults();
}

function showResults() {
    clearInterval(timerInterval); hideQuizControls();
    const q = gameState.currentQuiz;
    const total = q.currentIndex + 1;
    const pct = Math.round((q.score / total) * 100);
    const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;
    const starsHtml = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const coinsWon = q.score * 2;
    const answKey = `${q.classId}_${q.disc}`;
    const totalAnswered = gameState.answeredQuestions?.[answKey]?.length || 0;
    const totalInFile = q.totalInFile || q.questions.length;
    const isComplete = totalAnswered >= totalInFile;
    
    // If discipline fully completed, show celebration
    if (isComplete) {
        showDisciplineComplete(q, total, pct, starsHtml, coinsWon, totalAnswered, totalInFile, answKey);
        return;
    }
    
    // Normal results
    showModal({
        icon: pct >= 50 ? '🏆' : '👍', title: 'Resultados',
        html: `
            <div class="results-stats">
                <div class="results-row"><span>✅ Acertos</span><span class="results-val good">${q.score}</span></div>
                <div class="results-row"><span>❌ Erros</span><span class="results-val bad">${q.wrong}</span></div>
                <div class="results-row"><span>🎯 Aproveitamento</span><span class="results-val">${pct}%</span></div>
                <div class="results-row"><span>🪙 Moedas ganhas</span><span class="results-val gold">${coinsWon}</span></div>
                <div class="results-row"><span>📊 Progresso</span><span class="results-val">${totalAnswered}/${totalInFile}</span></div>
                <div class="results-stars">${starsHtml}</div>
            </div>
        `,
        actions: [
            { label: '▶️ Continuar a Jogar', class: 'modal-btn-success', onClick: async () => { 
                hideModal(); 
                if (q.wrong > 0) {
                    gameState.lossAdCounter = (gameState.lossAdCounter || 0) + 1;
                    saveState();
                }
                if (gameState.lossAdCounter && gameState.lossAdCounter % 4 === 0 && q.wrong > 0) {
                    await showInterstitialAd(); 
                }
                startQuiz(q.classId, q.disc); 
            } },
            { label: '⬅️ Voltar', class: 'modal-btn-gray', onClick: () => { hideModal(); syncFirestore(); goDisciplines(q.classId, classesData[q.classId]?.name || ''); } }
        ]
    });
}

// ===== MOTIVATIONAL PHRASES BY PERFORMANCE =====
const COMPLETION_PHRASES = {
    genius: [ // ≥90%
        'Mazza absoluto! O teu cérebro é de outro nível! 🧠🔥',
        'Perfeição! Nasceste para isto! 💎👑',
        'Eish, és de Marte ou de Moçambique? 🚀🌟',
        'Que máquina! Não há quem te pare! ⚡💪',
        'Resultado de dar orgulho à família toda! 🏆🎉',
        'O professor teria vergonha ao teu lado! 📖✨',
        'QI em modo turbo! Parabéns, lenda! 🌟🔥',
        'Mestre supremo desta disciplina! 👑💯',
        'Impressionante! Ninguém faz melhor! 🎯🏅',
        'Se houvesse medalha de ouro, era tua! 🥇🔥'
    ],
    great: [ // ≥70%
        'Muito bom, guerreiro! Quase perfeito! 💪🎯',
        'Resultado de campeão! Orgulho de Moçambique! 🇲🇿🏆',
        'Estás a brilhar! Continua assim! ✨💎',
        'Mandaste bem! O ranking que se cuide! 📊🔥',
        'Excelente desempenho, és craque! ⚡👏',
        'Quase perfeito! Da próxima chegas lá! 🎯💪',
        'Esse resultado merece um aplauso! 👏🌟',
        'Forte como baobá! Resultado sólido! 🌳💪',
        'Guerreiro do conhecimento! Bem jogado! ⚔️📚',
        'Tás no caminho certo, não pares! 🚀🎉'
    ],
    good: [ // ≥50%
        'Nada mau! A prática leva à perfeição! 📚💪',
        'Bom esforço! Cada vez melhor! 🌱✨',
        'Metade certa! Imagina na próxima vez! 🎯📈',
        'Estás a evoluir! Não desistas! 🌟💪',
        'Boa tentativa! O conhecimento está a crescer! 🌱📖',
        'Resultado equilibrado! Melhora na próxima! 📊🎯',
        'Nem mal, nem bom — mas vais melhorar! 💡🔥',
        'A aprendizagem é uma jornada, continua! 🚶‍♂️📚',
        'Bom começo! O melhor está por vir! ⭐💪',
        'O importante é não desistir! Força! 💥🌟'
    ],
    needs_work: [ // <50%
        'A persistência é a mãe do sucesso! 🌟💪',
        'Não desistas! Os Mazza também erraram! 🧠✨',
        'Cada erro é uma lição! Tenta de novo! 📖🔥',
        'O caminho é difícil, mas tu consegues! 💪🌟',
        'Roma não foi construída num dia! Continua! 🏛️📚',
        'Errar é humano, insistir é de campeão! 🏆💪',
        'O teu cérebro só precisa de mais treino! 🧠⚡',
        'Não te preocupes! A próxima vez será melhor! 🌈✨',
        'Quem cai e levanta é guerreiro de verdade! ⚔️💪',
        'O conhecimento leva tempo, mas vale a pena! 📚🌟'
    ]
};

function getCompletionPhrase(pct) {
    let pool;
    if (pct >= 90) pool = COMPLETION_PHRASES.genius;
    else if (pct >= 70) pool = COMPLETION_PHRASES.great;
    else if (pct >= 50) pool = COMPLETION_PHRASES.good;
    else pool = COMPLETION_PHRASES.needs_work;
    return pool[Math.floor(Math.random() * pool.length)];
}

function showDisciplineComplete(q, total, pct, starsHtml, coinsWon, totalAnswered, totalInFile, answKey) {
    // Intense celebration
    spawnConfetti(); spawnConfetti(); spawnConfetti();
    playSound('victory');
    setTimeout(() => { spawnConfetti(); spawnConfetti(); }, 500);
    setTimeout(() => spawnConfetti(), 1000);
    
    // No bonus coins — just celebration
    updateHUD(); saveState();
    
    // Calculate total errors for the entire discipline
    const totalCorrectDisc = gameState.disciplineProgress?.[`${q.classId}_${q.disc}`]?.correct || q.score;
    const totalErrorsDisc = totalInFile - totalCorrectDisc;
    const overallPct = totalInFile > 0 ? Math.round((totalCorrectDisc / totalInFile) * 100) : pct;
    const motivationalPhrase = getCompletionPhrase(overallPct);
    
    showModal({
        icon: '', title: '',
        html: `
            <div class="completion-celebration">
                <div class="completion-fireworks">🎆🎇🎆</div>
                <div class="completion-trophy">🏆</div>
                <div class="completion-title">Disciplina Concluída!</div>
                <div class="completion-disc">${q.disc}</div>
                <div class="completion-stars-big">${starsHtml}</div>
                
                <div class="completion-stats">
                    <div class="comp-stat">
                        <div class="comp-stat-val good">${totalCorrectDisc}</div>
                        <div class="comp-stat-label">✅ Corretas</div>
                    </div>
                    <div class="comp-stat">
                        <div class="comp-stat-val bad">${totalErrorsDisc}</div>
                        <div class="comp-stat-label">❌ Erradas</div>
                    </div>
                    <div class="comp-stat">
                        <div class="comp-stat-val">${overallPct}%</div>
                        <div class="comp-stat-label">🎯 Taxa</div>
                    </div>
                    <div class="comp-stat">
                        <div class="comp-stat-val" style="color:#AB47BC;">${gameState.qi}</div>
                        <div class="comp-stat-label">🧠 Nível QI</div>
                    </div>
                </div>
                
                <div class="completion-bonus">${motivationalPhrase}</div>
                <div class="completion-progress">📊 ${totalAnswered}/${totalInFile} perguntas respondidas</div>
            </div>
        `,
        actions: [
            { label: '🔄 Jogar Novamente', class: 'modal-btn-outline', onClick: async () => {
                hideModal();
                // Removed showInterstitialAd per user request for "ads only when losing"
                if (gameState.answeredQuestions) gameState.answeredQuestions[answKey] = [];
                saveState();
                startQuiz(q.classId, q.disc);
            }},
            { label: '➡️ Próxima Disciplina', class: 'modal-btn-success', onClick: () => { hideModal(); syncFirestore(); goDisciplines(q.classId, classesData[q.classId]?.name || ''); } }
        ]
    });
}

function showLevelUpCelebration(callback) {
    const tier = getTier(gameState.level);
    const nextTierIdx = TIERS.findIndex(t => t.minLevel > gameState.level);
    const nextTier = nextTierIdx >= 0 ? TIERS[nextTierIdx] : null;
    const levelsToNext = nextTier ? nextTier.minLevel - gameState.level : 0;
    
    spawnConfetti(); spawnConfetti();
    
    showModal({
        icon: '', title: '',
        html: `
            <div class="levelup-celebration">
                <div class="levelup-glow">✨</div>
                <div class="levelup-big-level">Nível ${gameState.level}</div>
                <div class="levelup-tier-icon-big">${tier.icon}</div>
                <div class="levelup-tier-name-big">${tier.name}</div>
                ${nextTier ? `<div class="levelup-next-info">🏁 Faltam <strong>${levelsToNext} níveis</strong> para <strong>${nextTier.icon} ${nextTier.name}</strong></div>` : '<div class="levelup-next-info">👑 Nível máximo!</div>'}
            </div>
        `,
        actions: [{ label: '▶️ Continuar', class: 'modal-btn-success', onClick: () => { hideModal(); if (callback) callback(); } }]
    });
}

// ===== LIFELINES =====
document.getElementById('btn-reveal')?.addEventListener('click', () => {
    if (!gameState.currentQuiz) return;
    playSound('button'); gameState.currentQuiz.isPaused = true;
    showModal({ icon:'💡', title:'Revelar Resposta', desc:'30 moedas ou ver anúncio?', actions:[
        {label:'🪙 30 Moedas', class:'modal-btn-warning', onClick:() => {
            if (gameState.coins < 30) {
                hideModal(); gameState.currentQuiz.isPaused = false;
                showModal({ circleIcon:'!', circleType:'warn', title:'Moedas Insuficientes', centered: true,
                    desc: `Precisas de <strong>30 moedas</strong>. Tens ${gameState.coins}.`,
                    actions:[
                        {label:'🛒 Comprar Moedas', class:'modal-btn-success', onClick:() => { hideModal(); openCoinShop(); }},
                        {label:'Fechar', class:'modal-btn-gray', onClick:() => { hideModal(); }}
                    ]
                });
                return;
            }
            gameState.coins -= 30; updateHUD(); saveState(); hideModal(); gameState.currentQuiz.isPaused = false;
            const correct = gameState.currentQuiz.questions[gameState.currentQuiz.currentIndex].correct;
            document.querySelectorAll('.answer-btn').forEach(b => { if (b.dataset.key === correct) b.classList.add('revealed'); });
        }},
        {label:'📺 Ver Anúncio', onClick:() => { hideModal(); showRewardedAd('reveal'); }},
        {label:'✕', class:'modal-btn-gray', onClick:() => { hideModal(); gameState.currentQuiz.isPaused = false; }}
    ]});
});

document.getElementById('btn-add-time')?.addEventListener('click', () => {
    if (!gameState.currentQuiz) return;
    playSound('button'); gameState.currentQuiz.isPaused = true;
    showModal({ icon:'⏰', title:'+60 Segundos', desc:'25 moedas ou ver anúncio?', actions:[
        {label:'🪙 25 Moedas', class:'modal-btn-warning', onClick:() => {
            if (gameState.coins < 25) {
                hideModal(); gameState.currentQuiz.isPaused = false;
                showModal({ circleIcon:'!', circleType:'warn', title:'Moedas Insuficientes', centered: true,
                    desc: `Precisas de <strong>25 moedas</strong>. Tens ${gameState.coins}.`,
                    actions:[
                        {label:'🛒 Comprar Moedas', class:'modal-btn-success', onClick:() => { hideModal(); openCoinShop(); }},
                        {label:'Fechar', class:'modal-btn-gray', onClick:() => { hideModal(); }}
                    ]
                });
                return;
            }
            gameState.coins -= 25; gameState.currentQuiz.timeLeft += 60; updateHUD(); saveState(); hideModal(); gameState.currentQuiz.isPaused = false; updateTimerUI();
        }},
        {label:'📺 Ver Anúncio', onClick:() => { hideModal(); showRewardedAd('time'); }},
        {label:'✕', class:'modal-btn-gray', onClick:() => { hideModal(); gameState.currentQuiz.isPaused = false; }}
    ]});
});

// ===== SHOPS =====
function openEnergyShop() {
    // Pause timer when energy shop opens
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
    showModal({ icon:'⚡', title:'⚡ Energia',
        html: `
            <div class="energy-shop-current">⚡ ${gameState.energy} ⚡ energia disponível</div>
            <p class="energy-shop-hint">Repõe a tua energia para continuar a jogar!</p>
            <div class="energy-card energy-card-ad" id="energy-buy-ad" style="border: 2px solid #FF9800; background: #FFF3E0; color: #E65100;">
                <div class="energy-left">📺 <strong>[ANÚNCIO] Ver Vídeo</strong></div>
                <div>Ganhar ⚡ +1 Energia · Grátis!</div>
            </div>
            <div class="energy-card energy-card-7" id="energy-buy-7">
                <div class="energy-left">⚡ <strong>7 ⚡</strong><br><small>de energia</small></div>
                <div class="energy-right">🪙 100</div>
            </div>
            <div class="energy-card energy-card-12" id="energy-buy-12">
                <div class="energy-left">⚡ <strong>12 ⚡</strong><br><small>de energia</small></div>
                <div class="energy-right">🪙 200</div>
            </div>
            <div class="energy-card energy-card-30" id="energy-buy-30">
                <div class="energy-left">⚡ <strong>30 ⚡</strong><br><small>de energia</small></div>
                <div class="energy-right">🪙 400</div>
            </div>
            <p class="energy-footer">Energia reposta diariamente às 00:00</p>
        `,
        actions: [{label:'⬅️ Voltar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}]
    });
    // Bind energy cards with confirmation
    document.getElementById('energy-buy-ad')?.addEventListener('click', () => { showRewardedAd('energy'); });
    document.getElementById('energy-buy-7')?.addEventListener('click', () => buyEnergy(7, 100));
    document.getElementById('energy-buy-12')?.addEventListener('click', () => buyEnergy(12, 200));
    document.getElementById('energy-buy-30')?.addEventListener('click', () => buyEnergy(30, 400));
}

function buyEnergy(amount, cost) {
    if (gameState.coins < cost) {
        hideModal();
        showModal({ circleIcon:'!', circleType:'warn', title:'Moedas Insuficientes', centered: true,
            desc: `Precisas de <strong>${cost} moedas</strong> para ${amount} ⚡ de energia.<br>Tens apenas <strong>${gameState.coins} moedas</strong>.`,
            actions:[
                {label:'🛒 Comprar Moedas Agora', class:'modal-btn-success', onClick:() => { hideModal(); openCoinShop(); }},
                {label:'Voltar', class:'modal-btn-gray', onClick:() => { hideModal(); openEnergyShop(); }}
            ]
        });
        return;
    }
    // Show confirmation dialog
    hideModal();
    showModal({ circleIcon:'<i class="fas fa-bolt"></i>', circleType:'info', title:'Confirmar Compra', centered: true,
        desc: `Comprar <strong>${amount} ⚡ energia</strong> por <strong>${cost} 🪙 moedas</strong>?`,
        actions:[
            {label:`✅ Comprar ${amount} ⚡`, class:'modal-btn-success', onClick:() => {
                gameState.coins -= cost;
                gameState.energy += amount;
                gameState.bonusEnergy = (gameState.bonusEnergy || 0) + amount;
                updateHUD(); saveState(); hideModal();
                playSound('unlock');
                // Visual effect: floating energy icon flying to HUD
                spawnEnergyFlyEffect(amount);
                syncFirestore();
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick:() => { hideModal(); openEnergyShop(); }}
        ]
    });
}

function spawnEnergyFlyEffect(amount) {
    const hudEl = document.getElementById('energy-display');
    const rect = hudEl ? hudEl.getBoundingClientRect() : { left: 60, top: 30 };
    const count = Math.min(amount, 12);
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'energy-fly-particle';
            el.textContent = '⚡';
            // Start from center of screen
            const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 120;
            const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 120;
            el.style.left = startX + 'px';
            el.style.top = startY + 'px';
            el.style.setProperty('--target-x', (rect.left + rect.width / 2 - startX) + 'px');
            el.style.setProperty('--target-y', (rect.top + rect.height / 2 - startY) + 'px');
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1000);
        }, i * 80);
    }
    // Flash the HUD energy after all particles arrive
    setTimeout(() => {
        if (hudEl) {
            hudEl.style.transform = 'scale(1.4)';
            hudEl.style.transition = 'transform 0.3s';
            setTimeout(() => { hudEl.style.transform = ''; }, 300);
        }
        // Show floating badge
        const badge = document.createElement('div');
        badge.className = 'energy-restore-badge';
        badge.innerHTML = `<div style="background:linear-gradient(135deg,#2ECC71,#27AE60);padding:20px 28px;border-radius:20px;box-shadow:0 8px 32px rgba(46,204,113,0.5);text-align:center;">
            <div style="font-size:42px;margin-bottom:6px;">⚡</div>
            <div style="font-size:18px;font-weight:900;color:white;">+${amount} Energia!</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">Boa sorte, guerreiro!</div>
        </div>`;
        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 2500);
        spawnConfetti();
    }, count * 80 + 400);
}

function showOutOfEnergyModal() {
    showModal({
        icon: '⚡',
        title: 'Sem Energia!',
        desc: 'Ficaste sem energia para jogar! Queres comprar mais na Loja de Energia ou esperar pelo bónus diário?',
        actions: [
            {
                label: '⚡ Ir para a Loja',
                class: 'modal-btn-warning',
                onClick: () => {
                    hideModal();
                    openEnergyShop();
                }
            },
            {
                label: 'Fechar',
                class: 'modal-btn-gray',
                onClick: hideModal
            }
        ]
    });
}

function animatePointsTicker(elementId, targetPoints) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let current = 0;
    const duration = 1200; // 1.2 seconds
    const intervalTime = 30; // 30ms
    const steps = duration / intervalTime;
    const increment = Math.max(1, Math.ceil(targetPoints / steps));
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetPoints) {
            current = targetPoints;
            clearInterval(timer);
        }
        el.textContent = current;
        playSound('tick');
    }, intervalTime);
}

function spawnCoinFlyEffect(amount, targetCoinsVal = gameState.coins) {
    const hudEl = document.getElementById('coins-display');
    const coinsAmtEl = document.getElementById('coins-amount');
    const rect = hudEl ? hudEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: 30, width: 40, height: 30 };
    const count = Math.min(amount, 10);
    
    // Set initial display to target minus earned coins so it starts from old value
    const startVal = Math.max(0, targetCoinsVal - amount);
    if (coinsAmtEl) coinsAmtEl.textContent = startVal;
    
    const incrementStep = count > 0 ? (amount / count) : 0;
    let currentDisplayVal = startVal;
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'coin-fly-particle';
            el.textContent = '🪙';
            const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 150;
            const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 100;
            el.style.left = startX + 'px';
            el.style.top = startY + 'px';
            el.style.setProperty('--target-x', (rect.left + rect.width / 2 - startX) + 'px');
            el.style.setProperty('--target-y', (rect.top + rect.height / 2 - startY) + 'px');
            document.body.appendChild(el);
            
            setTimeout(() => {
                el.remove();
                playSound('coin');
                currentDisplayVal = Math.min(targetCoinsVal, Math.round(currentDisplayVal + incrementStep));
                if (coinsAmtEl) coinsAmtEl.textContent = currentDisplayVal;
                
                // Shake the HUD element slightly
                if (hudEl) {
                    hudEl.classList.add('hud-shake');
                    setTimeout(() => hudEl.classList.remove('hud-shake'), 150);
                }
            }, 700);
        }, i * 100);
    }
    
    // Ensure final value is set
    setTimeout(() => {
        if (coinsAmtEl) coinsAmtEl.textContent = targetCoinsVal;
    }, count * 100 + 750);
}
function openCoinShop() {
    if (!navigator.onLine) {
        showNoInternetModal(() => openCoinShop());
        return;
    }
    // Pause timer when coin shop opens
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
    showModal({ icon:'🪙', title:'Comprar Moedas',
        html: renderCoinShop(),
        actions: [{label:'Fechar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}]
    });
    // Bind coin shop events
    setTimeout(() => {
        // Ad button — show actual rewarded ad
        document.getElementById('coin-buy-ad')?.addEventListener('click', () => {
            hideModal();
            showRewardedAd('coins');
        });
        // Unlock all levels button
        document.getElementById('coin-unlock-all')?.addEventListener('click', () => {
            hideModal();
            processUnlockAllLevels();
        });
        // Package buttons
        const packages = [
            { id: 'coin-buy-100', coins: 100, price: 10 },
            { id: 'coin-buy-200', coins: 200, price: 15 },
            { id: 'coin-buy-500', coins: 500, price: 30 },
            { id: 'coin-buy-1000', coins: 1000, price: 50 },
            { id: 'coin-buy-5000', coins: 5000, price: 120 }
        ];
        packages.forEach(pkg => {
            document.getElementById(pkg.id)?.addEventListener('click', () => {
                selectCoinPackage(pkg.coins, pkg.price);
            });
        });
        // Payment method buttons
        document.getElementById('pay-emola')?.addEventListener('click', () => {
            processPaySuitePayment('emola');
        });
        document.getElementById('pay-mpesa')?.addEventListener('click', () => {
            processPaySuitePayment('mpesa');
        });
    }, 100);
}

// ===== UNLOCK ALL LEVELS =====
function processUnlockAllLevels() {
    if (!navigator.onLine) {
        showNoInternetModal(() => processUnlockAllLevels());
        return;
    }
    // Check if already all unlocked
    const allClassIds = Object.keys(classesData);
    const nonStarterIds = allClassIds.filter(id => !classesData[id].starter);
    const allUnlocked = nonStarterIds.every(id => gameState.unlockedClasses?.includes(id)) && gameState.vsUnlocked;
    if (allUnlocked) {
        showModal({ icon:'✅', title:'Já Desbloqueado!', centered: true,
            desc: 'Todos os níveis e modos já estão desbloqueados!',
            actions: [{label:'OK', class:'modal-btn-primary', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}]
        });
        return;
    }
    // Show payment method selection for 150 MT
    showModal({
        circleIcon:'<i class="fas fa-unlock"></i>', circleType:'info',
        title:'Desbloquear Todos os Modos & Classes', centered: true,
        desc: 'Desbloqueie <strong>todas as classes offline</strong>, o <strong>Modo V/S</strong> e o <strong>Modo Nome Terra</strong> por <strong>150 MT</strong>.',
        html: `
            <div class="pay-buttons" style="margin-top:12px;">
                <button class="pay-btn pay-emola" id="unlock-pay-emola">
                    <span class="pay-icon">📱</span> e-Mola
                </button>
                <button class="pay-btn pay-mpesa" id="unlock-pay-mpesa">
                    <span class="pay-icon">📱</span> M-Pesa
                </button>
            </div>
        `,
        actions: [{label:'Cancelar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}]
    });
    setTimeout(() => {
        document.getElementById('unlock-pay-emola')?.addEventListener('click', () => {
            hideModal();
            processUnlockAllPayment('emola');
        });
        document.getElementById('unlock-pay-mpesa')?.addEventListener('click', () => {
            hideModal();
            processUnlockAllPayment('mpesa');
        });
    }, 100);
}

async function processUnlockAllPayment(method) {
    const price = 150;

    const methodName = method === 'emola' ? 'e-Mola' : 'M-Pesa';
    const phonePlaceholder = method === 'emola' ? '86 123 4567' : '84 123 4567';
    const phoneHintNums = method === 'emola' ? '86 ou 87' : '84 ou 85';
    
    showModal({
        circleIcon:'<i class="fas fa-mobile-alt"></i>', circleType:'info',
        title:`Pagar com ${methodName}`, centered: true,
        html: `
            <div class="pay-phone-section">
                <p class="pay-summary">Desbloquear Todos os Modos e Classes — <strong>${price} MT</strong></p>
                <div class="pay-phone-field">
                    <span class="pay-phone-prefix">+258</span>
                    <input type="tel" id="unlock-phone-input" class="pay-phone-input" placeholder="${phonePlaceholder}" maxlength="12" inputmode="numeric">
                </div>
                <p class="pay-phone-hint">Insira o número ${methodName} (${phoneHintNums}) para receber o pedido de pagamento</p>
            </div>
        `,
        actions:[
            {label:`💳 Pagar ${price} MT`, class:'modal-btn-success', onClick: async () => {
                const phone = document.getElementById('unlock-phone-input')?.value.trim().replace(/\s/g, '');
                if (!phone || phone.length < 9) { showCombo('Número inválido! ❌'); return; }
                const firstTwo = phone.substring(0, 2);
                if (method === 'emola' && !['86','87'].includes(firstTwo)) { showCombo('Número e-Mola: 86 ou 87 ❌'); return; }
                if (method === 'mpesa' && !['84','85'].includes(firstTwo)) { showCombo('Número M-Pesa: 84 ou 85 ❌'); return; }
                
                hideModal();
                showLoading(true, `A criar pedido de pagamento de ${price} MT...`);
                try {
                    const reference = `QMZALL${Date.now()}`;
                    const response = await fetch(PAYMENT_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            amount: price,
                            reference: reference,
                            description: 'QuizMoz - Desbloquear Todos os Modos e Classes',
                            phone: phone,
                            method: method
                        })
                    });
                    const data = await response.json();
                    showLoading(false);
                    console.log('Unlock payment response:', JSON.stringify(data));
                    const paymentId = data?.data?.id || data?.id || data?.transaction_id || data?.payment_id;
                    const checkoutUrl = data?.data?.checkout_url || data?.data?.url || data?.checkout_url || data?.url;
                    if (paymentId) {
                        if (checkoutUrl) {
                            showUnlockAllPayNow(method, methodName, paymentId, checkoutUrl);
                        } else {
                            showUnlockAllPending(method, methodName, paymentId);
                        }
                    } else {
                        const errMsg = data?.message || data?.error || data?.data?.message || 'Resposta inválida';
                        const errDetail = JSON.stringify(data).substring(0, 200);
                        if (method === 'emola') {
                            showEmolaLinkFallbackModal('unlock_all', null, price, phone);
                        } else {
                            showPaymentError(`${errMsg}\n\nDetalhes: ${errDetail}`, method);
                        }
                    }
                } catch (e) {
                    showLoading(false);
                    if (method === 'emola') {
                        showEmolaLinkFallbackModal('unlock_all', null, price, phone);
                    } else {
                        showPaymentError('Não foi possível contactar o servidor: ' + e.message, method);
                    }
                }
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
        ]
    });
}

function showUnlockAllPayNow(method, methodName, paymentId, checkoutUrl) {
    showModal({
        icon:'📲', title:'Pagar agora', centered: true,
        html: `
            <div class="pay-now-section">
                <p>Clique em <strong>Abrir Pagamento</strong> para pagar via ${methodName}.</p>
                <p class="pay-now-hint">Após pagar, volte e clique em <strong>Já Paguei</strong>.</p>
                <div class="pay-server-error-alert">
                    <span>⚠️</span>
                    <span>Se der erro de rede ou <strong>"Server Error"</strong> no PaySuite após pôr o contacto, arraste a página de pagamento para baixo para atualizá-la e tente novamente.</span>
                </div>
            </div>
        `,
        actions:[
            {label:'💚 Abrir Pagamento', class:'modal-btn-success', onClick:() => {
                if (checkoutUrl) {
                    if (window.Capacitor?.Plugins?.Browser) window.Capacitor.Plugins.Browser.open({ url: checkoutUrl });
                    else window.open(checkoutUrl, '_blank');
                }
                hideModal();
                showUnlockAllPending(method, methodName, paymentId);
            }},
            {label:'Já Paguei ✅', class:'modal-btn-primary', onClick:() => {
                hideModal();
                verifyUnlockAllPayment(paymentId);
            }},
            {label:'Cancelar', class:'modal-btn-danger', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
        ]
    });
}

let _unlockCheckInterval = null;
function showUnlockAllPending(method, methodName, paymentId) {
    if (_unlockCheckInterval) { clearInterval(_unlockCheckInterval); _unlockCheckInterval = null; }
    showModal({
        circleIcon:'<i class="fas fa-hourglass-half"></i>', circleType:'info',
        title:'⏳ A aguardar pagamento', centered: true,
        desc: `Método: <strong>${methodName}</strong><br>Valor: <strong>150 MT</strong> → Desbloquear Todos<br><br><small style="color:var(--text-dim);">Confirme o USSD Push introduzindo o PIN no telemóvel.</small>`,
        actions:[
            {label:'✅ Já Paguei', class:'modal-btn-success', onClick:() => { if (_unlockCheckInterval) { clearInterval(_unlockCheckInterval); _unlockCheckInterval = null; } hideModal(); verifyUnlockAllPayment(paymentId); }},
            {label:'Cancelar', class:'modal-btn-gray', onClick:() => { if (_unlockCheckInterval) { clearInterval(_unlockCheckInterval); _unlockCheckInterval = null; } hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
        ]
    });
    _unlockCheckInterval = setInterval(async () => {
        try {
            const res = await fetch(`${PAYMENT_API}?id=${paymentId}`, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            const status = (data.data && data.data.transaction) ? data.data.transaction.status : (data.data ? data.data.status : data.status);
            if (['paid','completed','success','approved'].includes(status)) {
                clearInterval(_unlockCheckInterval); _unlockCheckInterval = null;
                hideModal();
                onUnlockAllSuccess();
            }
        } catch (e) { console.log('Poll unlock error:', e); }
    }, 5000);
}

async function verifyUnlockAllPayment(paymentId) {
    showLoading(true, '🔍 Verificando pagamento...');
    try {
        const res = await fetch(`${PAYMENT_API}?id=${paymentId}`, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        showLoading(false);
        const status = (data.data && data.data.transaction) ? data.data.transaction.status : (data.data ? data.data.status : data.status);
        if (['paid','completed','success','approved'].includes(status)) {
            onUnlockAllSuccess();
        } else {
            showModal({ circleIcon:'<i class="fas fa-clock"></i>', circleType:'warn', title:'Pagamento Pendente', centered: true,
                desc: 'O pagamento ainda não foi confirmado.',
                actions:[
                    {label:'🔄 Verificar novamente', class:'modal-btn-primary', onClick:() => { hideModal(); verifyUnlockAllPayment(paymentId); }},
                    {label:'Fechar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
                ]
            });
        }
    } catch (e) {
        showLoading(false);
        showModal({ circleIcon:'!', circleType:'danger', title:'Erro de ligação', centered: true,
            desc: 'Não foi possível verificar.',
            actions:[{label:'OK', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}]
        });
    }
}

function onUnlockAllSuccess() {
    // Set permanent flag
    gameState.allLevelsPurchased = true;
    gameState.vsUnlocked = true;
    // Unlock all non-starter classes
    const allClassIds = Object.keys(classesData);
    if (!gameState.unlockedClasses) gameState.unlockedClasses = [];
    allClassIds.forEach(id => {
        if (!gameState.unlockedClasses.includes(id)) {
            gameState.unlockedClasses.push(id);
        }
    });
    // Unlock all disciplines
    if (!gameState.unlockedDisciplines) gameState.unlockedDisciplines = [];
    allClassIds.forEach(id => {
        const discs = classDisciplines[id] || [];
        discs.forEach(disc => {
            const key = `${id}_${disc}`;
            if (!gameState.unlockedDisciplines.includes(key)) {
                gameState.unlockedDisciplines.push(key);
            }
        });
    });
    updateHUD(); saveState(); syncFirestore();
    spawnConfetti(); spawnConfetti(); spawnConfetti();
    playSound('victory');
    showModal({ icon:'🎉', title:'Todos os Modos & Classes Desbloqueados!', centered: true,
        desc: 'Parabéns! Todas as classes offline, o Modo V/S e o Modo Nome Terra foram desbloqueados permanentemente na tua conta!',
        actions: [{label:'🚀 Jogar!', class:'modal-btn-success', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; goClasses(); }}]
    });
}

let selectedCoinPackage = null;

function selectCoinPackage(coins, price) {
    selectedCoinPackage = { coins, price };
    // Highlight selected
    document.querySelectorAll('.coin-package').forEach(p => p.classList.remove('selected'));
    document.getElementById(`coin-buy-${coins}`)?.classList.add('selected');
    // Show payment methods
    const paySection = document.getElementById('payment-methods');
    if (paySection) {
        paySection.style.display = 'block';
        paySection.querySelector('.pay-amount')?.replaceWith(Object.assign(document.createElement('span'), {
            className: 'pay-amount',
            textContent: `${coins} Moedas — ${price} MT`
        }));
        
        // Scroll modal content down slightly so the player can see the payment method section
        const modalBox = document.querySelector('.modal-box');
        if (modalBox) {
            setTimeout(() => {
                modalBox.scrollTo({
                    top: modalBox.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
}

async function processPaySuitePayment(method) {
    if (!selectedCoinPackage) {
        showModal({ icon:'⚠️', title:'Selecione um Pacote', desc:'Escolha primeiro um pacote de moedas.', actions:[{label:'OK', onClick: hideModal}] });
        return;
    }
    const { coins, price } = selectedCoinPackage;



    const methodName = method === 'emola' ? 'e-Mola' : 'M-Pesa';
    const phonePlaceholder = method === 'emola' ? '86 123 4567' : '84 123 4567';
    const phoneHintNums = method === 'emola' ? '86 ou 87' : '84 ou 85';
    
    showModal({
        circleIcon:'<i class="fas fa-mobile-alt"></i>', circleType:'info',
        title:`Pagar com ${methodName}`, centered: true,
        html: `
            <div class="pay-phone-section">
                <p class="pay-summary">Pacote: <strong>${coins} Moedas</strong> por <strong>${price} MT</strong></p>
                <div class="pay-phone-field">
                    <span class="pay-phone-prefix">+258</span>
                    <input type="tel" id="coins-phone-input" class="pay-phone-input" placeholder="${phonePlaceholder}" maxlength="12" inputmode="numeric">
                </div>
                <p class="pay-phone-hint">Insira o número ${methodName} (${phoneHintNums}) para receber o pedido de pagamento</p>
            </div>
        `,
        actions:[
            {label:`💳 Pagar ${price} MT`, class:'modal-btn-success', onClick: async () => {
                const phone = document.getElementById('coins-phone-input')?.value.trim().replace(/\s/g, '');
                if (!phone || phone.length < 9) { showCombo('Número inválido! ❌'); return; }
                const firstTwo = phone.substring(0, 2);
                if (method === 'emola' && !['86','87'].includes(firstTwo)) { showCombo('Número e-Mola: 86 ou 87 ❌'); return; }
                if (method === 'mpesa' && !['84','85'].includes(firstTwo)) { showCombo('Número M-Pesa: 84 ou 85 ❌'); return; }
                
                hideModal();
                showLoading(true, `A criar pedido de pagamento de ${price} MT...`);
                try {
                    const reference = `QMZ${Date.now()}`;
                    const response = await fetch(PAYMENT_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            amount: price,
                            reference: reference,
                            description: `QuizMoz - ${coins} Moedas`,
                            phone: phone,
                            method: method
                        })
                    });
                    const data = await response.json();
                    showLoading(false);
                    console.log('Coins purchase response:', JSON.stringify(data));
                    const paymentId = data?.data?.id || data?.id || data?.transaction_id || data?.payment_id;
                    const checkoutUrl = data?.data?.checkout_url || data?.data?.url || data?.checkout_url || data?.url;
                    if (paymentId) {
                        if (checkoutUrl) {
                            showPayNowModal(method, methodName, coins, price, paymentId, checkoutUrl);
                        } else {
                            showPaymentPending(method, methodName, coins, price, paymentId);
                        }
                    } else {
                        const msg = (data && data.message) ? data.message : 'Resposta inválida do servidor';
                        const errDetail = JSON.stringify(data).substring(0, 200);
                        if (method === 'emola') {
                            showEmolaLinkFallbackModal('coins', coins, price, phone);
                        } else {
                            showPaymentError(`${msg}\n\nDetalhes: ${errDetail}`, method);
                        }
                    }
                } catch (e) {
                    showLoading(false);
                    if (method === 'emola') {
                        showEmolaLinkFallbackModal('coins', coins, price, phone);
                    } else {
                        showPaymentError('Não foi possível contactar o servidor: ' + e.message, method);
                    }
                }
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick: hideModal}
        ]
    });
}

function showPayNowModal(method, methodName, coins, price, paymentId, checkoutUrl) {
    showModal({
        icon:'📲', title:'Pagar agora', centered: true,
        html: `
            <div class="pay-now-section">
                <p>Clique em <strong>Abrir Pagamento</strong> para pagar via ${methodName}.</p>
                <p class="pay-now-hint">Após pagar, volte ao jogo e clique em <strong>Já Paguei</strong>.</p>
                <div class="pay-server-error-alert">
                    <span>⚠️</span>
                    <span>Se der erro de rede ou <strong>"Server Error"</strong> no PaySuite após pôr o contacto, arraste a página de pagamento para baixo para atualizá-la e tente novamente.</span>
                </div>
            </div>
        `,
        actions:[
            {label:'💚 Abrir Pagamento', class:'modal-btn-success', onClick:() => {
                if (checkoutUrl) {
                    // Open in system browser (Capacitor) or new tab (web)
                    if (window.Capacitor?.Plugins?.Browser) {
                        window.Capacitor.Plugins.Browser.open({ url: checkoutUrl });
                    } else {
                        window.open(checkoutUrl, '_blank');
                    }
                }
                // After opening, show pending modal with polling
                hideModal();
                showPaymentPending(method, methodName, coins, price, paymentId);
            }},
            {label:'Já Paguei ✅', class:'modal-btn-primary', onClick:() => {
                hideModal();
                verifyPaymentNow(paymentId, coins);
            }},
            {label:'🔄 Tentar Novamente', class:'modal-btn-outline', onClick:() => {
                hideModal();
                processPaySuitePayment(method);
            }},
            {label:'Cancelar', class:'modal-btn-danger', onClick: hideModal}
        ]
    });
}

let _payCheckInterval = null;
let _payCountInterval = null;

function _clearPaymentIntervals() {
    if (_payCheckInterval) { clearInterval(_payCheckInterval); _payCheckInterval = null; }
    if (_payCountInterval) { clearInterval(_payCountInterval); _payCountInterval = null; }
}

function showPaymentPending(method, methodName, coins, price, paymentId) {
    _clearPaymentIntervals();
    let checkCount = 0;
    const maxChecks = 24; // 2 minutos (24 × 5s)
    
    showModal({
        circleIcon:'<i class="fas fa-hourglass-half"></i>', circleType:'info',
        title:'⏳ A aguardar pagamento', centered: true,
        html: `
            <div class="pay-now-section">
                <p>Método: <strong>${methodName}</strong></p>
                <p>Valor: <strong>${price} MT</strong> → <strong>${coins} Moedas</strong></p>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0;">
                <p class="pay-now-hint">Introduza o PIN do ${methodName} no telemóvel para confirmar o pagamento.</p>
                <p style="font-size:0.75em;color:var(--text-dim);margin-top:8px;">A verificar automaticamente... <span id="pay-check-count">0</span>s</p>
            </div>
        `,
        actions:[
            {label:'✅ Já Paguei', class:'modal-btn-success', onClick:() => {
                _clearPaymentIntervals();
                hideModal();
                verifyPaymentNow(paymentId, coins);
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick:() => {
                _clearPaymentIntervals();
                hideModal();
            }}
        ]
    });
    
    _payCountInterval = setInterval(() => {
        checkCount++;
        const el = document.getElementById('pay-check-count');
        if (el) el.textContent = checkCount * 5;
        if (checkCount >= maxChecks) _clearPaymentIntervals();
    }, 5000);
    
    _payCheckInterval = setInterval(async () => {
        try {
            const res = await fetch(`${PAYMENT_API}?id=${paymentId}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            const status = (data.data && data.data.transaction) 
                ? data.data.transaction.status 
                : (data.data ? data.data.status : data.status);
            
            if (['paid', 'completed', 'success', 'approved'].includes(status)) {
                _clearPaymentIntervals();
                hideModal();
                onPaymentSuccess(coins);
            } else if (['failed', 'cancelled', 'rejected'].includes(status)) {
                _clearPaymentIntervals();
                hideModal();
                showPaymentError('O pagamento foi cancelado ou falhou. Tente novamente.', method);
            }
        } catch (e) { console.log('Erro poll:', e); }
    }, 5000);
}

let _verifyRetries = 0;

async function verifyPaymentNow(paymentId, coins) {
    if (_verifyRetries >= 5) {
        _verifyRetries = 0;
        showModal({
            circleIcon:'!', circleType:'danger',
            title:'Verificação Falhou', centered: true,
            desc: 'Não foi possível confirmar o pagamento após várias tentativas. Contacta o suporte.',
            actions:[{label:'OK', class:'modal-btn-gray', onClick: hideModal}]
        });
        return;
    }
    _verifyRetries++;
    showLoading(true, '🔍 Verificando pagamento...');
    
    try {
        const res = await fetch(`${PAYMENT_API}?id=${paymentId}`, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        showLoading(false);
        
        const status = (data.data && data.data.transaction) 
            ? data.data.transaction.status 
            : (data.data ? data.data.status : data.status);
        
        if (['paid', 'completed', 'success', 'approved'].includes(status)) {
            _verifyRetries = 0;
            onPaymentSuccess(coins);
        } else {
            showModal({
                circleIcon:'<i class="fas fa-clock"></i>', circleType:'warn',
                title:'Pagamento Pendente', centered: true,
                desc: 'O pagamento ainda não foi confirmado. Se já pagou, aguarde uns segundos e tente novamente.',
                actions:[
                    {label:'🔄 Verificar novamente', class:'modal-btn-primary', onClick:() => { hideModal(); verifyPaymentNow(paymentId, coins); }},
                    {label:'Fechar', class:'modal-btn-gray', onClick:() => { _verifyRetries = 0; hideModal(); }}
                ]
            });
        }
    } catch (e) {
        showLoading(false);
        showModal({
            circleIcon:'!', circleType:'danger',
            title:'Erro de ligação', centered: true,
            desc: 'Não foi possível verificar o pagamento. Verifica a tua conexão.',
            actions:[{label:'OK', class:'modal-btn-gray', onClick:() => { _verifyRetries = 0; hideModal(); }}]
        });
    }
}

function onPaymentSuccess(coins) {
    gameState.coins += coins;
    updateHUD(); saveState();
    selectedCoinPackage = null;
    syncFirestore();
    showCoinPurchaseEffect(coins);
}

function showPaymentError(msg, method) {
    let alertText = 'Podes voltar ao jogo e <strong>tentar novamente</strong>, ou fazer <strong>refresh</strong> da página.';
    if (method === 'emola') {
        alertText = 'O serviço e-Mola está temporariamente indisponível. Por favor, tenta efetuar o pagamento utilizando M-Pesa.';
    }
    showModal({
        circleIcon:'!', circleType:'warn',
        title:'Erro no Pagamento', centered: true,
        html: `
            <p>${msg}</p>
            <div class="pay-server-error-alert">
                <span>⚠️</span>
                <span>${alertText}</span>
            </div>
        `,
        actions:[
            {label:'🔄 Tentar Novamente', class:'modal-btn-primary', onClick:() => { hideModal(); processPaySuitePayment(method); }},
            {label:'Voltar ao Jogo', class:'modal-btn-gray', onClick: hideModal}
        ]
    });
}

function showEmolaLinkFallbackModal(flowType, coins, price, originalPhone) {
    showModal({
        circleIcon: '<i class="fas fa-link"></i>',
        circleType: 'info',
        title: 'Tente pagar via Link!',
        centered: true,
        desc: `O serviço direto do e-Mola falhou ou está em manutenção.<br><br>Desejas gerar um <strong>Link Seguro da DebitoPay</strong> para concluir o pagamento de <strong>${price} MT</strong>?`,
        actions: [
            {
                label: '📲 Criar Link',
                class: 'modal-btn-success',
                onClick: async () => {
                    hideModal();
                    showLoading(true, 'A gerar link de pagamento...');
                    try {
                        const reference = `QMZEML${Date.now()}`;
                        const response = await fetch(PAYMENT_API, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify({
                                amount: price,
                                reference: reference,
                                description: coins ? `QuizMoz - ${coins} Moedas` : (price === 150 ? 'QuizMoz - Desbloquear Tudo' : 'QuizMoz - Modo V/S'),
                                phone: originalPhone,
                                method: 'emola_link'
                            })
                        });
                        const data = await response.json();
                        showLoading(false);
                        const paymentId = data?.data?.id || data?.id;
                        const checkoutUrl = data?.data?.checkout_url || data?.checkout_url || data?.url;
                        if (paymentId && checkoutUrl) {
                            showEmolaPayNowModal(flowType, coins, price, paymentId, checkoutUrl);
                        } else {
                            showPaymentError('Não foi possível gerar o link de pagamento. Tente novamente.', 'emola');
                        }
                    } catch (e) {
                        showLoading(false);
                        showPaymentError('Erro ao comunicar com o servidor: ' + e.message, 'emola');
                    }
                }
            },
            {
                label: 'Cancelar',
                class: 'modal-btn-gray',
                onClick: hideModal
            }
        ]
    });
}

function showEmolaPayNowModal(flowType, coins, price, paymentId, checkoutUrl) {
    const isStaticLink = paymentId === 'debitopay_link';
    showModal({
        icon: '📲',
        title: isStaticLink ? 'Pagar via Link' : 'Pagar agora',
        centered: true,
        html: isStaticLink ? `
            <div class="pay-now-section">
                <p>Clique em <strong>Abrir Pagamento</strong> para pagar via DebitoPay (Link Oficial).</p>
                <p class="pay-now-hint">Neste link pode pagar via e-Mola ou M-Pesa. Após efetuar o pagamento, envie o comprovativo para o suporte.</p>
            </div>
        ` : `
            <div class="pay-now-section">
                <p>Clique em <strong>Abrir Pagamento</strong> para pagar via e-Mola (DebitoPay Link).</p>
                <p class="pay-now-hint">Após pagar no navegador, volte ao jogo e clique em <strong>Já Paguei</strong>.</p>
            </div>
        `,
        actions: [
            {
                label: '💚 Abrir Pagamento',
                class: 'modal-btn-success',
                onClick: () => {
                    if (window.Capacitor?.Plugins?.Browser) {
                        window.Capacitor.Plugins.Browser.open({ url: checkoutUrl });
                    } else {
                        window.open(checkoutUrl, '_blank');
                    }
                    hideModal();
                    showEmolaPendingModal(flowType, coins, price, paymentId);
                }
            },
            {
                label: isStaticLink ? '💬 Enviar Comprovativo' : 'Já Paguei ✅',
                class: 'modal-btn-primary',
                onClick: () => {
                    hideModal();
                    if (isStaticLink) {
                        const message = encodeURIComponent(`Olá! Fiz o pagamento de ${price} MT para o QuizMoz via link DebitoPay. Aqui está o comprovativo.`);
                        const whatsappUrl = `https://wa.me/258850474056?text=${message}`;
                        if (window.Capacitor?.Plugins?.Browser) {
                            window.Capacitor.Plugins.Browser.open({ url: whatsappUrl });
                        } else {
                            window.open(whatsappUrl, '_blank');
                        }
                    } else {
                        verifyEmolaLinkPayment(flowType, coins, price, paymentId);
                    }
                }
            },
            {
                label: 'Cancelar',
                class: 'modal-btn-danger',
                onClick: hideModal
            }
        ]
    });
}

function showEmolaPendingModal(flowType, coins, price, paymentId) {
    _clearPaymentIntervals();
    let checkCount = 0;
    const maxChecks = 24; // 2 minutos
    
    const isStaticLink = paymentId === 'debitopay_link';
    
    showModal({
        circleIcon: '<i class="fas fa-hourglass-half"></i>',
        circleType: 'info',
        title: isStaticLink ? '📲 Link de Pagamento' : '⏳ A aguardar pagamento',
        centered: true,
        html: isStaticLink ? `
            <div class="pay-now-section">
                <p>Método: <strong>DebitoPay Link</strong></p>
                <p>Valor: <strong>${price} MT</strong></p>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0;">
                <p class="pay-now-hint">Após efetuar o pagamento, tire uma captura do comprovativo e clique em <strong>Enviar Comprovativo</strong> no final do ecrã para ativar a sua compra com o suporte.</p>
            </div>
        ` : `
            <div class="pay-now-section">
                <p>Método: <strong>e-Mola (Link DebitoPay)</strong></p>
                <p>Valor: <strong>${price} MT</strong></p>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0;">
                <p class="pay-now-hint">Após concluir o pagamento na DebitoPay, volte ao jogo e aguarde a confirmação.</p>
                <p style="font-size:0.75em;color:var(--text-dim);margin-top:8px;">A verificar automaticamente... <span id="pay-check-count">0</span>s</p>
            </div>
        `,
        actions: isStaticLink ? [
            {
                label: '💬 Enviar Comprovativo',
                class: 'modal-btn-success',
                onClick: () => {
                    const message = encodeURIComponent(`Olá! Fiz o pagamento de ${price} MT para o QuizMoz via link DebitoPay. Aqui está o comprovativo.`);
                    const whatsappUrl = `https://wa.me/258850474056?text=${message}`;
                    if (window.Capacitor?.Plugins?.Browser) {
                        window.Capacitor.Plugins.Browser.open({ url: whatsappUrl });
                    } else {
                        window.open(whatsappUrl, '_blank');
                    }
                    hideModal();
                }
            },
            {
                label: 'Voltar ao Jogo',
                class: 'modal-btn-gray',
                onClick: hideModal
            }
        ] : [
            {
                label: '✅ Já Paguei',
                class: 'modal-btn-success',
                onClick: () => {
                    _clearPaymentIntervals();
                    hideModal();
                    verifyEmolaLinkPayment(flowType, coins, price, paymentId);
                }
            },
            {
                label: 'Cancelar',
                class: 'modal-btn-gray',
                onClick: () => {
                    _clearPaymentIntervals();
                    hideModal();
                }
            }
        ]
    });
    
    if (isStaticLink) return; // Sem polling para link estático
    
    _payCountInterval = setInterval(() => {
        checkCount++;
        const el = document.getElementById('pay-check-count');
        if (el) el.textContent = checkCount * 5;
        if (checkCount >= maxChecks) _clearPaymentIntervals();
    }, 5000);
    
    _payCheckInterval = setInterval(async () => {
        try {
            const res = await fetch(`${PAYMENT_API}?id=${paymentId}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            const status = data.data?.status || data.status;
            
            if (['paid', 'completed', 'success', 'approved'].includes(status)) {
                _clearPaymentIntervals();
                hideModal();
                rewardUserAfterLinkSuccess(flowType, coins);
            } else if (['failed', 'cancelled'].includes(status)) {
                _clearPaymentIntervals();
                hideModal();
                showPaymentError('O pagamento via link falhou ou foi cancelado.', 'emola');
            }
        } catch (e) { console.log('Erro poll emola link:', e); }
    }, 5000);
}

async function verifyEmolaLinkPayment(flowType, coins, price, paymentId) {
    showLoading(true, '🔍 Verificando pagamento...');
    try {
        const res = await fetch(`${PAYMENT_API}?id=${paymentId}`, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        showLoading(false);
        const status = data.data?.status || data.status;
        
        if (['paid', 'completed', 'success', 'approved'].includes(status)) {
            rewardUserAfterLinkSuccess(flowType, coins);
        } else {
            showModal({
                circleIcon: '<i class="fas fa-clock"></i>',
                circleType: 'warn',
                title: 'Pagamento Pendente',
                centered: true,
                desc: 'Ainda não confirmámos o pagamento na DebitoPay. Se já pagou, aguarde uns segundos e tente novamente.',
                actions: [
                    { label: '🔄 Verificar novamente', class: 'modal-btn-primary', onClick: () => { hideModal(); verifyEmolaLinkPayment(flowType, coins, price, paymentId); } },
                    { label: 'Fechar', class: 'modal-btn-gray', onClick: hideModal }
                ]
            });
        }
    } catch (e) {
        showLoading(false);
        showPaymentError('Erro de ligação: ' + e.message, 'emola');
    }
}

function rewardUserAfterLinkSuccess(flowType, coins) {
    if (flowType === 'unlock_all') {
        onUnlockAllSuccess();
    } else if (flowType === 'vs_mode') {
        onVSUnlockSuccess();
    } else {
        onPaymentSuccess(coins);
    }
}

function showCoinPurchaseEffect(coins) {
    spawnConfetti(); spawnConfetti();
    playSound('victory');
    
    // Show coin overlay
    const overlay = document.getElementById('floating-coin-overlay');
    document.getElementById('floating-coin-amount').textContent = `+${coins}`;
    overlay.style.display = 'flex';
    
    overlay.onclick = () => {
        overlay.style.display = 'none';
        spawnConfetti();
    };
    document.getElementById('floating-coin-back').onclick = (e) => {
        e.stopPropagation();
        overlay.style.display = 'none';
    };
}

function openProfile() {
    // Pause timer when profile opens
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
    const tier = getTier(gameState.level);
    const xpNeeded = getXPForLevel(gameState.level);
    const unlockedDiscsCount = (gameState.unlockedDisciplines?.length || 0) + Object.keys(classDisciplines).reduce((acc, k) => acc + (classDisciplines[k]?.length > 0 ? 1 : 0), 0);
    const totalDiscs = Object.values(classDisciplines).reduce((acc, d) => acc + d.length, 0);
    
    const ntWins = gameState.nomeTerraWins || 0;
    let trophyIcon = '🔒';
    let trophyLabel = 'Sem vitórias Nome Terra';
    if (ntWins >= 20) {
        trophyIcon = '👑🏆';
        trophyLabel = 'Campeão Supremo';
    } else if (ntWins >= 10) {
        trophyIcon = '🏆';
        trophyLabel = 'Troféu de Ouro';
    } else if (ntWins >= 5) {
        trophyIcon = '🥈';
        trophyLabel = 'Troféu de Prata';
    } else if (ntWins >= 1) {
        trophyIcon = '🥉';
        trophyLabel = 'Troféu de Bronze';
    }

    showModal({ icon: '', title: 'Meu Perfil',
        html: `
            <div class="profile-avatar">${tier.icon}</div>
            <div class="profile-tier-label">${tier.name}</div>
            <div class="profile-name-display">${gameState.playerName}</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; background: rgba(0,0,0,0.02); padding: 6px 12px; border-radius: 20px; width: fit-content; margin-left: auto; margin-right: auto; margin-bottom: 8px;">
                <span style="font-size: 1.2em;">${trophyIcon}</span>
                <span style="font-size: 0.85em; font-weight: 700; color: var(--text-dim);">${trophyLabel} (${ntWins} ${ntWins === 1 ? 'vitória' : 'vitórias'})</span>
            </div>
            <button class="profile-edit-nick-btn" id="profile-edit-nick">
                <i class="fas fa-pencil-alt"></i> Editar Nickname
            </button>
            <div class="profile-edit-section" id="profile-edit-section" style="display:none;">
                <input type="text" id="profile-nick-input" class="profile-nick-input" value="${gameState.playerName}" maxlength="20" placeholder="Novo nickname">
                <button class="profile-save-nick" id="profile-save-nick"><i class="fas fa-check"></i> Salvar</button>
            </div>
            <div class="profile-xp-section">
                <div class="profile-xp-header"><span>Nível ${gameState.level}</span><span>${gameState.exp} / ${xpNeeded} XP</span></div>
                <div class="profile-bar"><div class="profile-bar-fill" style="width:${(gameState.exp/xpNeeded)*100}%;background:linear-gradient(90deg,#FFD700,#FFA000);"></div></div>
                <div class="profile-xp-next">Próximo: Nv. ${gameState.level + 1}</div>
            </div>
            <div class="profile-tier-progress">
                <span>🥚 ${tier.name}</span>
                <span>${Math.round(tier.minLevel ? ((gameState.level - tier.minLevel) / 3) * 100 : 0)}%</span>
                <span>🔍 ${TIERS[TIERS.indexOf(tier) + 1]?.name || 'Max'}</span>
            </div>
            <div class="profile-grid">
                <div class="profile-stat"><div class="stat-val" style="color:#4CAF50;">${gameState.qi}</div><div class="stat-label">QI</div></div>
                <div class="profile-stat"><div class="stat-val" style="color:#FF9800;">${gameState.coins}</div><div class="stat-label">Moedas</div></div>
                <div class="profile-stat"><div class="stat-val" style="color:#2196F3;">${unlockedDiscsCount}/${totalDiscs}</div><div class="stat-label">Disciplinas</div></div>
                <div class="profile-stat profile-ranking-btn" id="profile-open-ranking"><div class="stat-val" style="color:#E91E63;"><i class="fas fa-trophy"></i></div><div class="stat-label">Ranking</div></div>
            </div>
        `,
        closeable: false,
        actions: [
            {label:'Fechar', class:'modal-btn-primary', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }},
            ...(gameState.isGuest
                ? [{label:'➡️ Criar Conta / Entrar', class:'modal-btn-outline', onClick:() => { hideModal(); showAuthScreen(); }}]
                : [{label:'Sair da conta', class:'modal-btn-danger', onClick:() => {
                    signOut(auth);
                    gameState.isGuest = true;
                    gameState.authCompleted = false;
                    saveState(); hideModal();
                    // Hide game, show auth screen
                    document.getElementById('game-container').style.display = 'none';
                    showAuthScreen();
                }}]
            )
        ]
    });
    
    // Bind profile edit
    setTimeout(() => {
        document.getElementById('profile-edit-nick')?.addEventListener('click', () => {
            const editSection = document.getElementById('profile-edit-section');
            editSection.style.display = editSection.style.display === 'none' ? 'flex' : 'none';
        });
        document.getElementById('profile-save-nick')?.addEventListener('click', () => {
            const input = document.getElementById('profile-nick-input');
            const nick = input?.value.trim();
            if (nick && nick.length >= 2 && nick.length <= 20) {
                gameState.playerName = nick; saveState(); updateHUD();
                document.querySelector('.profile-name-display').textContent = nick;
                document.getElementById('profile-edit-section').style.display = 'none';
                playSound('coin');
                showCombo('Nome atualizado! ✅');
            }
        });
    }, 50);
    // Bind ranking button in profile — keep timer paused throughout
    setTimeout(() => {
        document.getElementById('profile-open-ranking')?.addEventListener('click', () => {
            // Timer stays paused — openRanking will handle it
            hideModal();
            openRanking();
        });
    }, 100);
}

async function shareProgress() {
    // Pause timer during share
    const wasPaused = gameState.currentQuiz?.isPaused;
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
    
    const tier = getTier(gameState.level);
    const shareUrl = 'https://play.google.com/store/apps/details?id=com.quizmoz.app&pcampaignid=web_share';
    const text = `🎮 *QuizMoz* - Jogo Educacional Moçambicano!\n\n📊 Estou no Nível ${gameState.level} — ${tier.icon} ${tier.name}\n🧠 QI: ${gameState.qi}\n🪙 ${gameState.coins} moedas\n\n🔥 Joga também e prova o teu conhecimento!\n\n📲 Baixa aqui: ${shareUrl}`;
    
    try {
        // Try Capacitor Share plugin first (native Android share sheet)
        if (window.Capacitor?.Plugins?.Share) {
            await window.Capacitor.Plugins.Share.share({
                title: 'QuizMoz — Jogo Educacional',
                text: text,
                url: shareUrl,
                dialogTitle: 'Partilhar QuizMoz'
            });
        } else if (navigator.share) {
            // Fallback: Web Share API
            await navigator.share({ title: 'QuizMoz — Jogo Educacional', text: text, url: shareUrl });
        } else {
            // Last fallback: copy to clipboard
            await navigator.clipboard?.writeText(text);
            showModal({ icon:'📤', title:'Copiado!', desc:'Texto copiado! Cola no WhatsApp, Facebook ou onde quiseres.', closeable: false, actions:[{label:'OK', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = wasPaused || false; }}] });
            return; // Don't resume here, modal handles it
        }
    } catch(e) {
        // User cancelled or error, ignore silently
        console.log('Share cancelled or failed:', e);
    }
    
    // Resume timer after share completes (or is cancelled)
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = wasPaused || false;
}

// ===== REWARDED ADS (AdMob) =====
const AD_UNIT_IDS = {
    coins:            'ca-app-pub-1954059473041916/3384914106',  // 10 MOEDAS
    energy:           'ca-app-pub-1954059473041916/3384914106',  // same as coins
    time:             'ca-app-pub-1954059473041916/4424272498',  // 60segundos
    reveal:           'ca-app-pub-1954059473041916/4232700800',  // revelar_resposta
    redraw_letter:    'ca-app-pub-1954059473041916/3384914106',  // same as coins
    redraw_category:  'ca-app-pub-1954059473041916/3384914106',  // same as coins
};

let _admobInitialized = false;

async function ensureAdMobInitialized() {
    if (window.Capacitor?.Plugins?.AdMob && !_admobInitialized) {
        try {
            const { AdMob } = window.Capacitor.Plugins;
            await AdMob.initialize({ requestTrackingAuthorization: false });
            _admobInitialized = true;
        } catch (e) {
            console.warn('AdMob initialization failed:', e);
        }
    }
}

function showRewardedAd(type) {
    const rewardNames = {
        coins: '🪙 +10 Moedas',
        time: '⏳ +60 segundos de tempo',
        reveal: '💡 Revelar a resposta correta',
        energy: '⚡ +1 Energia',
        redraw_category: '🎰 Nova Categoria',
        redraw_letter: '🎰 Nova Letra',
        pause_coins: '🪙 +5 Moedas (Bónus de Pausa)'
    };
    const rewardName = rewardNames[type] || 'uma recompensa';
    
    // Pause game during confirmation
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;

    showModal({
        circleIcon: '📺',
        circleType: 'info',
        title: 'Ver Anúncio?',
        centered: true,
        closeable: false,
        desc: `Assistirás a um vídeo publicitário para receberes a recompensa:<br><strong style="font-size:1.1em; color:#FF9800; display:block; margin-top:8px;">${rewardName}</strong>`,
        actions: [
            {
                label: '📺 Ver Anúncio',
                class: 'modal-btn-success',
                onClick: () => {
                    hideModal();
                    executeRewardedAd(type);
                }
            },
            {
                label: 'Cancelar',
                class: 'modal-btn-gray',
                onClick: () => {
                    hideModal();
                    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                }
            }
        ]
    });
}

async function executeRewardedAd(type) {
    // type: 'coins' | 'time' | 'reveal' | 'energy' | 'redraw_category' | 'redraw_letter'
    const adId = AD_UNIT_IDS[type] || AD_UNIT_IDS.coins;
    let rewardedListener = null;
    let dismissedListener = null;
    
    // Always pause timer when showing ad
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
    
    // Check internet first
    if (!navigator.onLine) {
        showNoInternetModal();
        return;
    }
    
    try {
        if (window.Capacitor?.Plugins?.AdMob) {
            const { AdMob } = window.Capacitor.Plugins;
            
            // Initialize AdMob once
            await ensureAdMobInitialized();
            
            // Show loading while preparing
            showLoading(true, 'A carregar anúncio...');
            
            // Load rewarded ad with the specific unit
            const isTesting = localStorage.getItem('test_ads_mode') === 'true';
            await AdMob.prepareRewardVideoAd({
                adId: isTesting ? 'ca-app-pub-3940256099942544/5224354917' : adId,
                isTesting: isTesting
            });
            
            showLoading(false);
            
            // Register listeners for reward and dismiss events
            let rewardEarned = false;
            
            rewardedListener = await AdMob.addListener('onRewardedVideoAdReward', (info) => {
                rewardEarned = true;
            });
            
            dismissedListener = await AdMob.addListener('onRewardedVideoAdDismissed', () => {
                if (rewardedListener) rewardedListener.remove();
                if (dismissedListener) dismissedListener.remove();
                
                if (rewardEarned) {
                    applyAdReward(type);
                } else {
                    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                }
            });
            
            // Show it and wait for reward
            await AdMob.showRewardVideoAd();
        } else {
            // Fallback for web/testing: simulate loading then grant
            showLoading(true, 'A carregar anúncio...');
            await new Promise(r => setTimeout(r, 800));
            showLoading(false);
            applyAdReward(type);
        }
    } catch (e) {
        showLoading(false);
        console.warn('Ad error:', e);
        try {
            if (rewardedListener) rewardedListener.remove();
            if (dismissedListener) dismissedListener.remove();
        } catch (err) {}
        
        // Check if user just dismissed the ad (not an error)
        const msg = (e?.message || e?.toString() || '').toLowerCase();
        if (msg.includes('dismiss') || msg.includes('cancel') || msg.includes('closed')) {
            if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
            return;
        }
        
        showModal({ circleIcon:'!', circleType:'warn', title:'Anúncio Indisponível', centered: true,
            desc: 'Não foi possível carregar o anúncio neste momento.<br><br><strong>Detalhes técnicos:</strong> ' + (e?.message || e?.toString() || e || 'Sem detalhes') + '<br><br>💡 Se estás a testar, podes ligar o <strong>Modo Teste</strong> clicando 5 vezes seguidas na versão da app no rodapé da página inicial.',
            actions:[
                {label:'🔄 Tentar Novamente', class:'modal-btn-primary', onClick:() => { hideModal(); showRewardedAd(type); }},
                {label:'Fechar', class:'modal-btn-gray', onClick:() => {
                    hideModal();
                    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                }}
            ]
        });
    }
}

function applyAdReward(type) {
    // Note: isPaused stays true until user dismisses the ad overlay
    // The reward is granted but timer only resumes when user interacts
    switch (type) {
        case 'coins':
            gameState.coins += 10;
            playSound('coin'); spawnConfetti();
            updateHUD(); saveState();
            // Show floating coin overlay for player to rescue
            showCoinPurchaseEffect(10);
            // Also spawn coins flying to HUD
            spawnCoinFlyEffect(10);
            break;
        case 'pause_coins':
            gameState.coins += 5;
            playSound('coin'); spawnConfetti();
            updateHUD(); saveState();
            showCoinPurchaseEffect(5);
            spawnCoinFlyEffect(5);
            showModal({ icon:'✅', title:'+5 Moedas!', centered: true,
                desc: 'A tua recompensa foi adicionada com sucesso. Clica para continuar.',
                actions:[{label:'▶️ Continuar a Jogar', class:'modal-btn-success', onClick:() => {
                    hideModal();
                    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                }}]
            });
            break;
        case 'time':
            if (gameState.currentQuiz) {
                gameState.currentQuiz.timeLeft += 60;
                // DON'T resume timer here — wait for user to close ad
                updateTimerUI();
                playSound('timer');
                showCombo('+60 Segundos! ⏰');
                // Show modal to let user resume when ready
                showModal({ icon:'✅', title:'+60 Segundos!', centered: true,
                    desc: 'O teu tempo foi aumentado. Clica para continuar.',
                    actions:[{label:'▶️ Continuar a Jogar', class:'modal-btn-success', onClick:() => {
                        hideModal();
                        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                    }}]
                });
            }
            break;
        case 'reveal':
            if (gameState.currentQuiz) {
                const correct = gameState.currentQuiz.questions[gameState.currentQuiz.currentIndex].correct;
                document.querySelectorAll('.answer-btn').forEach(b => {
                    if (b.dataset.key === correct) b.classList.add('revealed');
                });
                playSound('coin');
                showCombo('Resposta Revelada! 💡');
                // Show modal to let user resume when ready
                showModal({ icon:'✅', title:'Resposta Revelada!', centered: true,
                    desc: 'A resposta correta está destacada. Clica para continuar.',
                    actions:[{label:'▶️ Continuar a Jogar', class:'modal-btn-success', onClick:() => {
                        hideModal();
                        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                    }}]
                });
            }
            break;
        case 'energy':
            gameState.energy += 1;
            gameState.bonusEnergy = (gameState.bonusEnergy || 0) + 1;
            playSound('coin');
            updateHUD(); saveState(); hideModal();
            spawnEnergyFlyEffect(1);
            break;
        case 'redraw_letter':
            playSound('coin');
            applyLetterRedraw();
            break;
        case 'redraw_category':
            playSound('coin');
            applyCategoryRedraw();
            break;
    }
}

// ===== INTERSTITIAL ADS (AdMob) =====
async function preloadInterstitial() {
    if (window.Capacitor?.Plugins?.AdMob) {
        await ensureAdMobInitialized();
        const { AdMob } = window.Capacitor.Plugins;
        const isTesting = localStorage.getItem('test_ads_mode') === 'true';
        try {
            await AdMob.prepareRewardInterstitialAd({
                adId: isTesting ? 'ca-app-pub-3940256099942544/5354046379' : 'ca-app-pub-1954059473041916/8572574831',
                isTesting: isTesting
            });
        } catch(e) {
            console.warn('Preload reward interstitial failed:', e);
        }
    }
}

async function executeRewardedInterstitialAd(type) {
    return new Promise(async (resolve) => {
        // type: 'pause_coins' (gives 5 coins) or 'losses' (no reward, just shown automatically)
        const adId = 'ca-app-pub-1954059473041916/8572574831';
        let rewardedListener = null;
        let dismissedListener = null;
        let failedListener = null;
        
        // Always pause timer when showing ad
        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
        
        // Check internet first
        if (!navigator.onLine) {
            showNoInternetModal();
            resolve(false);
            return;
        }
        
        try {
            if (window.Capacitor?.Plugins?.AdMob) {
                const { AdMob } = window.Capacitor.Plugins;
                
                // Initialize AdMob once
                await ensureAdMobInitialized();
                
                showLoading(true, 'A carregar anúncio...');
                
                const isTesting = localStorage.getItem('test_ads_mode') === 'true';
                let rewardEarned = false;
                
                rewardedListener = await AdMob.addListener('onRewardedInterstitialAdReward', (info) => {
                    console.log('Rewarded interstitial reward received:', info);
                    rewardEarned = true;
                });
                
                dismissedListener = await AdMob.addListener('onRewardedInterstitialAdDismissed', () => {
                    if (rewardedListener) rewardedListener.remove();
                    if (dismissedListener) dismissedListener.remove();
                    if (failedListener) failedListener.remove();
                    
                    if (rewardEarned) {
                        if (type === 'pause_coins') {
                            applyAdReward('pause_coins');
                        } else {
                            if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                        }
                    } else {
                        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                    }
                    resolve(true);
                });

                failedListener = await AdMob.addListener('onRewardedInterstitialAdFailedToShow', () => {
                    if (rewardedListener) rewardedListener.remove();
                    if (dismissedListener) dismissedListener.remove();
                    if (failedListener) failedListener.remove();
                    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                    resolve(false);
                });
                
                try {
                    // Try showing directly first (relies on preloaded ad)
                    showLoading(false);
                    await AdMob.showRewardInterstitialAd();
                } catch(e) {
                    console.warn('Preloaded rewarded interstitial show failed, preparing and showing:', e);
                    try {
                        showLoading(true, 'A carregar anúncio...');
                        await AdMob.prepareRewardInterstitialAd({
                            adId: isTesting ? 'ca-app-pub-3940256099942544/5354046379' : adId,
                            isTesting: isTesting
                        });
                        showLoading(false);
                        await AdMob.showRewardInterstitialAd();
                    } catch(errShow) {
                        showLoading(false);
                        console.error('Failed to prepare or show rewarded interstitial ad:', errShow);
                        if (rewardedListener) rewardedListener.remove();
                        if (dismissedListener) dismissedListener.remove();
                        if (failedListener) failedListener.remove();
                        resolve(false);
                    }
                }
            } else {
                // Fallback for web/testing
                showLoading(true, 'A carregar anúncio...');
                await new Promise(r => setTimeout(r, 800));
                showLoading(false);
                if (type === 'pause_coins') {
                    applyAdReward('pause_coins');
                }
                resolve(true);
            }
        } catch (e) {
            showLoading(false);
            console.warn('Rewarded Interstitial Ad error:', e);
            try {
                if (rewardedListener) rewardedListener.remove();
                if (dismissedListener) dismissedListener.remove();
                if (failedListener) failedListener.remove();
            } catch (err) {}
            
            const msg = (e?.message || e?.toString() || '').toLowerCase();
            if (msg.includes('dismiss') || msg.includes('cancel') || msg.includes('closed')) {
                if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                resolve(false);
                return;
            }
            
            showModal({ circleIcon:'!', circleType:'warn', title:'Anúncio Indisponível', centered: true,
                desc: 'Não foi possível carregar o anúncio neste momento.<br><br><strong>Detalhes técnicos:</strong> ' + (e?.message || e?.toString() || e || 'Sem detalhes') + '<br><br>💡 Se estás a testar, podes ligar o <strong>Modo Teste</strong> clicando 5 vezes no rodapé da página inicial.',
                actions:[
                    {label:'Fechar', class:'modal-btn-gray', onClick:() => {
                        hideModal();
                        if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
                        resolve(false);
                    }}
                ]
            });
        }
    });
}

async function showInterstitialAd() {
    return executeRewardedInterstitialAd('losses');
}

window.triggerScreenTransitionAd = function(screenId) {
    // Transition ads currently handled on-demand
};

// ===== RANKING LEADERBOARD =====
let _rankingCache = null;
let _rankingCacheTime = 0;
const RANKING_CACHE_TTL = 120000; // 2-minute cache
async function openRanking() {
    if (!navigator.onLine) {
        showNoInternetModal(() => openRanking());
        return;
    }
    playSound('button');
    // Pause timer when ranking opens
    if (gameState.currentQuiz) gameState.currentQuiz.isPaused = true;
    
    // If guest user, prompt to create account first
    if (gameState.isGuest) {
        showModal({
            circleIcon:'<i class="fas fa-trophy"></i>', circleType:'warn',
            title:'Ranking Global', centered: true, closeable: false,
            html: `
                <div style="text-align:center;padding:10px 0;">
                    <div style="font-size:3em;margin-bottom:10px;">🏆</div>
                    <p>Para ver e participar do <strong>Ranking Global</strong>, precisas de criar uma conta ou entrar com Google.</p>
                    <p style="font-size:0.85em;color:var(--text-dim);margin-top:10px;">O teu progresso local será mantido!</p>
                </div>
            `,
            actions:[
                {label:'📝 Criar Conta / Entrar', class:'modal-btn-success', onClick:() => {
                    hideModal();
                    document.getElementById('game-container').style.display = 'none';
                    showAuthScreen();
                }},
                {label:'Voltar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
            ]
        });
        return;
    }
    
    // Sync current user data to Firestore immediately before loading ranking
    await syncFirestoreNow();
    
    showLoading(true, 'A carregar ranking...');
    
    let rankingHtml = '';
    try {
        // Check internet first
        if (!navigator.onLine) {
            showLoading(false);
            showNoInternetModal(() => openRanking());
            return;
        }
        
        // Use cached ranking if available and fresh
        let useCached = _rankingCache && (Date.now() - _rankingCacheTime < RANKING_CACHE_TTL);
        let snapshot;
        if (!useCached) {
            try {
                // Try with orderBy first (requires Firestore index)
                const q = query(collection(db, 'users'), orderBy('score', 'desc'), limit(50));
                snapshot = await getDocs(q);
            } catch (indexErr) {
                // If index is missing, fetch all users and sort client-side
                console.warn('Firestore index missing, fetching all users:', indexErr);
                const fallbackQ = query(collection(db, 'users'), limit(50));
                snapshot = await getDocs(fallbackQ);
            }
        }
        showLoading(false);
        
        // Collect all players and sort by score client-side
        let allPlayers;
        if (useCached) {
            allPlayers = _rankingCache;
        } else {
            allPlayers = [];
            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                allPlayers.push({
                    id: docSnap.id,
                    playerName: d.playerName || 'Jogador',
                    level: d.level || 1,
                    qi: d.qi || 70,
                    coins: d.coins || 0,
                    score: d.score || 0,
                    nomeTerraWins: d.nomeTerraWins || 0
                });
            });
            allPlayers.sort((a, b) => b.score - a.score);
            _rankingCache = allPlayers;
            _rankingCacheTime = Date.now();
        }
        
        let myRank = '-';
        const players = [];
        
        allPlayers.forEach((p, idx) => {
            const rank = idx + 1;
            const isMe = auth.currentUser && p.id === auth.currentUser.uid;
            if (isMe) myRank = rank;
            
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const tierObj = getTier(p.level);
            
            const ntWins = p.nomeTerraWins || 0;
            let trophy = '';
            if (ntWins >= 20) trophy = ' 👑🏆';
            else if (ntWins >= 10) trophy = ' 🏆';
            else if (ntWins >= 5) trophy = ' 🥈';
            else if (ntWins >= 1) trophy = ' 🥉';
            
            players.push(`
                <div class="ranking-row ${isMe ? 'ranking-me' : ''} ${rank <= 3 ? 'ranking-top' : ''}">
                    <div class="ranking-pos">${medal}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${tierObj.icon} ${p.playerName}${trophy}</div>
                        <div class="ranking-details">Nv.${p.level} • QI ${p.qi} • ${p.coins} 🪙</div>
                    </div>
                    <div class="ranking-score">${p.score}</div>
                </div>
            `);
        });
        
        if (players.length === 0) {
            rankingHtml = '<p style="text-align:center;color:var(--text-dim);padding:20px;">Nenhum jogador registado ainda. Sê o primeiro!</p>';
        } else {
            rankingHtml = `
                <div class="ranking-header">
                    <span>A tua posição: <strong>${myRank}</strong></span>
                    <span>Total: ${allPlayers.length} jogadores</span>
                </div>
                <div class="ranking-list">${players.join('')}</div>
            `;
        }
    } catch (e) {
        showLoading(false);
        console.warn('Ranking error:', e);
        
        showModal({
            circleIcon:'<i class="fas fa-exclamation-triangle"></i>', circleType:'warn',
            title:'Erro ao Carregar', centered: true, closeable: false,
            html: `
                <div style="text-align:center;padding:10px 0;">
                    <div style="font-size:2.5em;margin-bottom:10px;">📡</div>
                    <p>Não foi possível carregar o ranking.</p>
                    <p style="font-size:0.85em;color:var(--text-dim);margin-top:8px;">Verifica a tua ligação à internet e tenta novamente.</p>
                </div>
            `,
            actions:[
                {label:'🔄 Tentar Novamente', class:'modal-btn-primary', onClick:() => { hideModal(); openRanking(); }},
                {label:'Voltar', class:'modal-btn-gray', onClick: () => { hideModal(); if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false; }}
            ]
        });
        return;
    }
    
    showModal({
        icon:'🏆', title:'Ranking Global', closeable: false,
        html: `<div class="ranking-container">${rankingHtml}</div>`,
        actions:[
            {label:'🔄 Atualizar', class:'modal-btn-outline', onClick:() => { hideModal(); _rankingCache = null; _rankingCacheTime = 0; openRanking(); }},
            {label:'⬅️ Voltar', class:'modal-btn-primary', onClick: () => {
                hideModal();
                // Resume timer when returning from ranking to game
                if (gameState.currentQuiz) gameState.currentQuiz.isPaused = false;
            }}
        ]
    });
}

// Debounced syncFirestore — avoids rapid repeated writes to Firestore
let _syncTimer = null;
let _syncDirty = false;
function syncFirestore() {
    if (gameState.isGuest || !auth.currentUser) return;
    _syncDirty = true;
    if (_syncTimer) return; // already scheduled
    _syncTimer = setTimeout(async () => {
        _syncTimer = null;
        if (!_syncDirty) return;
        _syncDirty = false;
        try {
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
                playerName: gameState.playerName, level: gameState.level, exp: gameState.exp,
                coins: gameState.coins, qi: gameState.qi, score: gameState.level * 100 + gameState.qi * 2 + gameState.coins,
                vsUnlocked: gameState.vsUnlocked || false,
                freeMatchesLeft: gameState.freeMatchesLeft !== undefined ? gameState.freeMatchesLeft : 3,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch(e) { console.warn('Sync error:', e); }
    }, 3000); // 3-second debounce window
}
// Force immediate sync (used before ranking fetch)
async function syncFirestoreNow() {
    if (gameState.isGuest || !auth.currentUser) return;
    if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
    _syncDirty = false;
    try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
            playerName: gameState.playerName, level: gameState.level, exp: gameState.exp,
            coins: gameState.coins, qi: gameState.qi, score: gameState.level * 100 + gameState.qi * 2 + gameState.coins,
            vsUnlocked: gameState.vsUnlocked || false,
            freeMatchesLeft: gameState.freeMatchesLeft !== undefined ? gameState.freeMatchesLeft : 3,
            nomeTerraWins: gameState.nomeTerraWins || 0,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch(e) { console.warn('Sync error:', e); }
}

// ===== NOTIFICATION SYSTEM =====
const NOTIFICATION_MESSAGES = [
    // Engraçadas & Cómicas
    '😴 Ei, mano! O teu cérebro já está a fazer "load..." há mais de 24 horas. Entra lá para atualizar o sistema!',
    '🦟 Até os mosquitos de Maputo estão mais ativos que tu hoje! Bora txunar o teu QI no QuizMoz?',
    '🧠 Alerta de Cérebro Deserto: O teu QI mandou uma mensagem a dizer que tem saudades de trabalhar. Vamos jogar?',
    '🍳 A fritar ovos? Deixa a cozinha e vem fritar o cérebro com as perguntas mais difíceis do Moz!',
    '🐢 Mais lento que chapa em hora de ponta! Entra no jogo e acesera esse raciocínio!',
    '🙋‍♂️ Stop! Alguém vai gritar STOP no Nome Terra e tu ainda estás a dormir na linha? Entra já!',
    '💸 O teu QI está a desvalorizar mais que o metical em dia mau! Bora subir esse nível!',
    '🤷‍♂️ Puto, esqueceste-te do caminho para o topo? A roleta já está com teias de aranha!',
    '🧐 Dizem por aí que o teu QI tirou férias sem pedir autorização. Vem já trazê-lo de volta!',
    '🔌 Cérebro em modo de poupança de energia? Vamos ligar o turbo com um quiz rápido!',
    '🌶️ Este quiz está mais quente que piripíri da Zambézia! Vais aguentar ou vais fugir?',
    '🥶 Que gelo é esse? Um dia sem QuizMoz e o teu QI já está a tremer de frio!',
    '📻 Notícia de última hora: O teu lugar no ranking foi visto a chorar de saudades tuas.',
    '🥥 Não deixes o teu cérebro virar água de coco! Vem jogar e mostra que tens massa cinzenta.',
    '🤦‍♀️ Os teus amigos estão a subir de nível e tu... bom, tu estás a ver passar as nuvens. Bora lá!',
    '🦁 Até o leão da savana corre atrás do saber, e tu nem o dedo mexes para girar a roleta!',
    '🦥 Preguiça nível mestre? O QuizMoz desafia-te a sair dessa zona de conforto agora mesmo.',
    '🧩 Falta-te uma peça hoje? Ah, já sabemos, é a tua dose diária de QuizMoz!',
    '🛶 A navegar na maionese? Volta para a terra firme e mostra o que vales no Nome Terra.',
    '🥑 Mais mole que abacate maduro! Dá um clique na app e mostra a tua força mental!',
    '📢 Procura-se: Um jogador inteligente que desapareceu há 24 horas. Recompensa: Moedas de ouro!',
    '🤔 Sabias que pensar queima calorias? Entra no QuizMoz e faz o teu treino de ginásio mental!',
    '🧗‍♂️ A cair do ranking como jaca madura? Segura-te bem e sobe de volta!',
    '🦖 Não deixes o teu conhecimento ficar fóssil! Vem refrescar as ideias connosco.',
    '🛌 Acorda, chefe! A roleta do QuizMoz já tem saudades dos teus giros de sorte.',
    
    // Desafiadoras
    '🧠 Duvido que consigas acertar 5 perguntas seguidas hoje. Prova que estou errado!',
    '👑 O trono do QI moçambicano está livre. Tens coragem de ir lá reclamá-lo?',
    '🔥 Os teus amigos acham que sabem mais do que tu. Vais deixar que fiquem com a última palavra?',
    '🎯 Um verdadeiro campeão não falha dois dias seguidos. O desafio está lançado!',
    '🌪️ A roleta está armada com perguntas venenosas. Consegues obter a pontuação máxima sem errar nenhuma?',
    '⏳ O tempo está a correr no Nome Terra. Quem será o mais rápido a gritar STOP hoje?',
    '⚡ A tua energia está no máximo! É um desperdício não usá-la para esmagar os recordes.',
    '📈 O teu QI estagnou. Só os fortes conseguem ultrapassar a barreira dos 120 pontos de QI.',
    '🛑 Alguém desafiou-te no modo V/S! Vais aceitar o duelo ou vais bater em retirada?',
    '🗺️ Conheces mesmo Moçambique? A classe de Geografia tem perguntas que te vão fazer suar!',
    '📚 Pensas que és o mais inteligente da tua turma? O ranking geral diz o contrário. Vem provar o teu valor!',
    '🧐 Apenas 5% dos jogadores conseguem responder à pergunta do dia. Estás nesse grupo?',
    '🥊 Ronda de titãs! Entra na roleta e luta pelo primeiro lugar do dia.',
    '🪓 Cortaste o hábito? O conhecimento exige consistência. Volta ao jogo!',
    '🥇 O primeiro lugar do ranking está apenas a alguns pontos de distância. Vais desistir agora?',
    '🕯️ Não deixes a tua mente apagar. O desafio de hoje vai testar os teus limites mais profundos.',
    '🌪️ A tempestade de perguntas começou. Entra e mostra que és o mestre do saber.',
    '🧠 O teu cérebro contra o nosso banco de perguntas. Quem vencerá hoje?',
    '🎭 Modo Nome Terra: As letras de hoje são traiçoeiras. Consegues preencher tudo antes do Stop?',
    '🏃‍♂️ A concorrência não dorme. Enquanto não jogas, o teu rival está a subir de nível!',
    '💎 Perguntas lendárias desbloqueadas. Tens o nível necessário para responder a elas?',
    '🤯 Este quiz vai dar um nó na tua cabeça. Estás preparado para o teste definitivo?',
    '🏰 Defende o teu império de conhecimento! Entra e garante a tua pontuação diária.',
    '🚨 Alerta de duelo: O modo V/S está à tua espera. Não deixes o teu adversário sem resposta.',
    '🎓 O teste de QI mais difícil de Moçambique espera por ti. Vais encarar ou vais recuar?',
    
    // Motivadoras
    '🌱 Cada dia que jogas é um passo para seres mais inteligente. Vamos treinar hoje?',
    '💡 O conhecimento é a única coisa que ninguém te pode tirar. Alimenta a tua mente no QuizMoz!',
    '🏆 Grandes mentes constroem-se com pequenos hábitos diários. Entra e faz a tua jogada de hoje.',
    '🧠 O teu cérebro é como um músculo: quanto mais treinas no QuizMoz, mais forte ele fica!',
    '✨ Hoje é um excelente dia para aprenderes algo novo. Deixa o QuizMoz surpreender-te!',
    '📖 Mais uma página da tua história de sucesso. Entra e conquista novos pontos de QI!',
    '🤝 O teu cérebro conta contigo para se manter afiado. Vamos a isso, parceiro!',
    '🌈 Errar também é aprender. Não tenhas medo das perguntas difíceis, vem evoluir connosco!',
    '🌟 O teu potencial é infinito. Dedica 5 minutos do teu dia a expandir a tua mente.',
    '🎒 A escola da vida nunca fecha. O QuizMoz traz-te o melhor do conhecimento de Moçambique.',
    '🔑 A chave para o sucesso é a consistência. Mantém a tua mente ativa jogando todos os dias!',
    '🥇 Cada resposta certa é uma vitória pessoal. Sente o orgulho de saber mais!',
    '🕯️ Ilumina o teu caminho com o saber. O QuizMoz ajuda-te a descobrir novas curiosidades.',
    '🚀 Pronto para descolar? Eleva o teu QI para a estratosfera com os nossos desafios!',
    '💎 O conhecimento brilha mais que qualquer joia. Vem lapidar a tua inteligência hoje.',
    '🗺️ Explora a riqueza da nossa terra. Aprende mais sobre a história e cultura de Moçambique!',
    '💪 Sente-te imparável. Supera os teus limites intelectuais jogando uma partida rápida.',
    '🌻 Alimenta a tua curiosidade. O mundo está cheio de respostas que tu mereces saber.',
    '🎯 Foco e determinação. Define o teu objetivo de hoje e vem alcançá-lo no QuizMoz.',
    '🔭 Olha mais longe. Descobre factos presumíveis que vão mudar a tua forma de ver as coisas.',
    '☀️ Um novo dia, uma nova oportunidade de seres melhor. Começa com um quiz!',
    '🎈 Aprender pode ser muito divertido. Entra e diverte-te enquanto ficas mais inteligente!',
    '👑 Reclama a tua coroa da sabedoria. Tu és capaz de acertar em todas as categorias.',
    '🏁 A meta está próxima. Mantém o ritmo e não deixes o teu progresso diário a meio.',
    '💖 O saber não ocupa lugar. Vem encher a tua mente de coisas boas no nosso jogo.',
    
    // Moçambicanas
    '🇲🇿 Orgulho da nossa terra! Mostra que és o maior conhecedor da nossa história e cultura.',
    '🏖️ Da Ponta do Ouro ao Rovuma, não há mente mais brilhante que a tua quando estás focado!',
    '🥁 Sente o batuque do conhecimento! O QuizMoz traz-te a essência das nossas províncias.',
    '🐠 Mais rápido que um peixe na Ilha de Moçambique! Entra e responde antes de todos.',
    '🌾 Como a machamba que dá frutos, a tua mente precisa de ser cultivada todos os dias.',
    '🥤 Fica fresco como uma boa Badjias com pão! Vem jogar para relaxar e aprender.',
    '🚉 O comboio do saber está a partir da Estação de Maputo! Não percas esta viagem.',
    '🐆 Com a agilidade de um leopardo da Gorongosa, responde rápido e vence os teus amigos!',
    '🌊 Como as ondas da praia da Barra, deixa o conhecimento fluir na tua mente hoje!',
    '🎨 Pinta o teu dia com as cores da nossa bandeira. Mostra o teu orgulho nacional no QuizMoz!',
    '🏔️ Sobe tão alto como o Monte Binga! Alcança o topo do ranking de QI.',
    '🍤 Tão saboroso como um caril de camarão da Beira! Os nossos quizzes de hoje estão irresistíveis.',
    '🌳 Firme como um embondeiro gigante! Constrói uma base sólida de conhecimento connosco.',
    '🍍 Tão doce como a ananás de Muxúnguè! Aprender no QuizMoz é um verdadeiro prazer.',
    '🎭 A nossa cultura é a nossa maior riqueza. Vem testar o que sabes sobre o nosso belo Moçambique.',
    '⛵ Navega como um dhow tradicional de Pemba. Enfrenta as perguntas mais difíceis com classe!',
    '🦁 Mostra a garra dos Mambas! Entra no modo V/S e vence o jogo para a tua equipa.',
    '🌽 A colheita do QI começou! Vem recolher as moedas que acumulaste para ti.',
    '🌅 O sol já nasceu no Índico. Começa a tua manhã a aquecer a mente no QuizMoz!',
    '💬 Quem tem boca vai a Gilé, e quem tem QuizMoz vai direto ao topo do conhecimento!',
    '👜 Tão resistente como o artesanato de vime! Mostra que a tua memória aguenta qualquer desafio.',
    '🎶 Baila ao ritmo da Marrabenta! Diverte-te e joga com os teus amigos no Nome Terra.',
    '🍊 Mais sumarento que laranja de Inhambane! O quiz de hoje está cheio de novidades.',
    '🛡️ Guerreiro do saber! Protege a tua pontuação contra os ataques dos rivais.',
    '🇲🇿 Faz brilhar a nossa pátria amada! Mostra ao mundo o nível da inteligência moçambicana.'
];

async function scheduleNotifications() {
    try {
        if (!window.Capacitor?.Plugins?.LocalNotifications) return;
        const { LocalNotifications } = window.Capacitor.Plugins;
        
        // Request permission
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
            perm = await LocalNotifications.requestPermissions();
        }
        if (perm.display !== 'granted') return;
        
        // Cancel existing
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }
        
        // Schedule notifications at peak hours (10:00, 12:00, 16:00, 18:00, and 20:00) over 10 days
        const peakHours = [10, 12, 16, 18, 20];
        const now = new Date();
        const notifications = NOTIFICATION_MESSAGES.map((msg, i) => {
            const dayOffset = Math.floor(i / peakHours.length) + 1;
            const hourIdx = i % peakHours.length;
            const targetHour = peakHours[hourIdx];
            
            const scheduleDate = new Date(now);
            scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
            scheduleDate.setHours(targetHour, 0, 0, 0); // local peak time
            return {
                id: 1000 + i,
                title: i === 0 ? '🚨 QuizMoz — Volta Guerreiro!' : 'QuizMoz 🎮',
                body: msg,
                schedule: {
                    at: scheduleDate,
                    allowWhileIdle: true
                },
                sound: 'default',
                smallIcon: 'ic_notification',
                iconColor: '#5E9B9D'
            };
        });
        
        await LocalNotifications.schedule({ notifications });
    } catch(e) { console.warn('Notification schedule error:', e); }
}

// ===== V/S MODE — DESAFIE UM AMIGO =====
const VS_CATEGORIES = [
    { id: 'CAT1', name: 'Moçambique & África', emoji: '🌍', color: '#E53935', file: 'CAT1_Mocambique_Africa.json' },
    { id: 'CAT2', name: 'Ciências & Mundo', emoji: '🔬', color: '#1E88E5', file: 'CAT2_Ciencias_Mundo.json' },
    { id: 'CAT3', name: 'Língua & Cultura', emoji: '📚', color: '#8E24AA', file: 'CAT3_Lingua_Cultura.json' },
    { id: 'CAT4', name: 'Bíblia & Finanças', emoji: '📖', color: '#43A047', file: 'CAT4_Biblia_Financas.json' },
    { id: 'CAT5', name: 'Temas Diversos', emoji: '🎲', color: '#FF6F00', file: 'CAT5_mistura.json' },
    { id: 'CAT6', name: 'Bandeiras & Países', emoji: '🏴', color: '#00897B', file: 'CAT6_Bandeiras_Paises.json' }
];
const VS_MAX_ROUNDS = 3;
const VS_QUESTIONS_PER_ROUND = 3;
const VS_TIME_PER_QUESTION = 30;
let vsState = null;
let vsUnsubscribe = null;
let vsTimerInterval = null;

// Dedicated VS questions fetcher — loads from Modo_VS/ folder
async function fetchVSQuestions(catFile) {
    const url = `${BASE_URL}/Modo_VS/${catFile}?v=${GAME_VERSION}`;
    // Check cache (48h)
    const cacheKey = `quizmoz_vs_cache_${catFile}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 48 * 60 * 60 * 1000) return data;
        } catch(e) {}
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao carregar perguntas V/S');
    const json = await res.json();
    let questions = [];
    if (json.data) {
        for (let key in json.data) {
            if (key.startsWith('Q_ID')) {
                const idx = key.replace('Q_ID', '');
                questions.push({
                    id: `vs_${idx}`, text: json.data[key],
                    image: json.data[`IMG_ID${idx}`] || null,
                    options: { 'A': json.data[`A0_ID${idx}`]||'', 'B': json.data[`A1_ID${idx}`]||'', 'C': json.data[`A2_ID${idx}`]||'', 'D': json.data[`A3_ID${idx}`]||'' },
                    correct: String.fromCharCode(65 + (json.data[`S_ID${idx}`] || 0)),
                    justification: json.data[`txtS_ID${idx}`] || ''
                });
            }
        }
    }
    try { localStorage.setItem(cacheKey, JSON.stringify({ data: questions, ts: Date.now() })); } catch(e) {}
    return questions;
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// ===== V/S PAYWALL =====
function showVSPaywall() {
    if (!navigator.onLine) {
        showNoInternetModal(() => showVSPaywall());
        return;
    }
    showModal({
        circleIcon: '💎',
        circleType: 'success',
        title: 'Desbloquear Tudo por 150 MT?',
        centered: true,
        closeable: false,
        desc: `
            Em vez de desbloquear apenas o <strong>Modo V/S & Nome Terra por 50 MT</strong>, prefere desbloquear <strong>TUDO</strong> no jogo por apenas <strong>150 MT</strong>?<br><br>
            ⭐ <strong>O que inclui (150 MT):</strong><br>
            • Todas as classes offline desbloqueadas permanentemente<br>
            • Modo Batalha V/S sem limites<br>
            • Modo Nome Terra ilimitado
        `,
        actions: [
            {
                label: '💎 Sim, Desbloquear Tudo (150 MT)',
                class: 'modal-btn-success',
                onClick: () => {
                    hideModal();
                    processUnlockAllLevels();
                }
            },
            {
                label: 'Não, apenas Nome Terra & V/S (50 MT)',
                class: 'modal-btn-gray',
                onClick: () => {
                    hideModal();
                    showVSPaywallDirect();
                }
            }
        ]
    });
}

function showVSPaywallDirect() {
    if (!navigator.onLine) {
        showNoInternetModal(() => showVSPaywallDirect());
        return;
    }
    showModal({
        circleIcon:'<i class="fas fa-lock"></i>', circleType:'warn',
        title:'⚔️ Desbloquear Modo V/S & Nome Terra', centered: true,
        html: `
            <div style="text-align:center;margin-bottom:12px;">
                <div style="font-size:3em;margin-bottom:8px;">⚔️</div>
                <p style="color:var(--text);font-weight:600;margin-bottom:4px;">Batalha contra amigos em tempo real!</p>
                <p style="color:var(--text-dim);font-size:0.85em;">Desbloqueia <strong>permanentemente</strong> o Modo V/S e Nome Terra</p>
                <div style="background:linear-gradient(135deg,#6C5CE7,#00B894);color:white;padding:12px 20px;border-radius:14px;margin:14px 0;font-weight:800;font-size:1.2em;">50 MT</div>
            </div>
            <div class="pay-buttons" style="margin-top:8px;">
                <button class="pay-btn pay-emola" id="vs-pay-emola"><span class="pay-icon">📱</span> e-Mola</button>
                <button class="pay-btn pay-mpesa" id="vs-pay-mpesa"><span class="pay-icon">📱</span> M-Pesa</button>
            </div>
        `,
        actions: [{label:'Voltar', class:'modal-btn-gray', onClick: hideModal}]
    });
    setTimeout(() => {
        document.getElementById('vs-pay-emola')?.addEventListener('click', () => { hideModal(); processVSPayment('emola'); });
        document.getElementById('vs-pay-mpesa')?.addEventListener('click', () => { hideModal(); processVSPayment('mpesa'); });
    }, 100);
}

async function processVSPayment(method) {
    const price = 50;

    const methodName = method === 'emola' ? 'e-Mola' : 'M-Pesa';
    const phonePlaceholder = method === 'emola' ? '86 123 4567' : '84 123 4567';
    const phoneHintNums = method === 'emola' ? '86 ou 87' : '84 ou 85';
    
    showModal({
        circleIcon:'<i class="fas fa-mobile-alt"></i>', circleType:'info',
        title:`Pagar com ${methodName}`, centered: true,
        html: `
            <div class="pay-phone-section">
                <p class="pay-summary">Desbloquear Modo V/S e Nome Terra — <strong>${price} MT</strong></p>
                <div class="pay-phone-field">
                    <span class="pay-phone-prefix">+258</span>
                    <input type="tel" id="vs-phone-input" class="pay-phone-input" placeholder="${phonePlaceholder}" maxlength="12" inputmode="numeric">
                </div>
                <p class="pay-phone-hint">Insira o número ${methodName} (${phoneHintNums}) para receber o pedido de pagamento</p>
            </div>
        `,
        actions:[
            {label:`💳 Pagar ${price} MT`, class:'modal-btn-success', onClick: async () => {
                const phone = document.getElementById('vs-phone-input')?.value.trim().replace(/\s/g, '');
                if (!phone || phone.length < 9) { showCombo('Número inválido! ❌'); return; }
                const firstTwo = phone.substring(0, 2);
                if (method === 'emola' && !['86','87'].includes(firstTwo)) { showCombo('Número e-Mola: 86 ou 87 ❌'); return; }
                if (method === 'mpesa' && !['84','85'].includes(firstTwo)) { showCombo('Número M-Pesa: 84 ou 85 ❌'); return; }
                
                hideModal();
                showLoading(true, `A criar pedido de pagamento de ${price} MT...`);
                try {
                    const reference = 'QMZVS' + Date.now();
                    const response = await fetch(PAYMENT_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            amount: price,
                            reference: reference,
                            description: 'QuizMoz - Modo V/S',
                            phone: phone,
                            method: method
                        })
                    });
                    const data = await response.json();
                    showLoading(false);
                    console.log('VS Mode purchase response:', JSON.stringify(data));
                    const paymentId = data?.data?.id || data?.id || data?.transaction_id || data?.payment_id;
                    const checkoutUrl = data?.data?.checkout_url || data?.data?.url || data?.checkout_url || data?.url;
                    if (paymentId) {
                        if (checkoutUrl) {
                            showVSPayNow(method, methodName, paymentId, checkoutUrl);
                        } else {
                            showVSPayPending(method, methodName, paymentId);
                        }
                    } else {
                        const errMsg = data?.message || data?.error || data?.data?.message || 'Resposta inválida';
                        const errDetail = JSON.stringify(data).substring(0, 200);
                        if (method === 'emola') {
                            showEmolaLinkFallbackModal('vs_mode', null, price, phone);
                        } else {
                            showPaymentError(`${errMsg}\n\nDetalhes: ${errDetail}`, method);
                        }
                    }
                } catch (e) {
                    showLoading(false);
                    if (method === 'emola') {
                        showEmolaLinkFallbackModal('vs_mode', null, price, phone);
                    } else {
                        showPaymentError('Não foi possível contactar o servidor: ' + e.message, method);
                    }
                }
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick: hideModal}
        ]
    });
}

function showVSPayNow(method, methodName, paymentId, checkoutUrl) {
    showModal({
        icon:'📲', title:'Pagar agora', centered: true,
        html: `
            <div class="pay-now-section">
                <p>Clique em <strong>Abrir Pagamento</strong> para pagar via ${methodName}.</p>
                <p class="pay-now-hint">Após pagar, volte e clique em <strong>Já Paguei</strong>.</p>
                <div class="pay-server-error-alert">
                    <span>⚠️</span>
                    <span>Se der erro de rede ou <strong>"Server Error"</strong> no PaySuite após pôr o contacto, arraste a página de pagamento para baixo para atualizá-la e tente novamente.</span>
                </div>
            </div>
        `,
        actions:[
            {label:'💚 Abrir Pagamento', class:'modal-btn-success', onClick:() => {
                if (checkoutUrl) { if (window.Capacitor?.Plugins?.Browser) window.Capacitor.Plugins.Browser.open({ url: checkoutUrl }); else window.open(checkoutUrl, '_blank'); }
                hideModal(); showVSPayPending(method, methodName, paymentId);
            }},
            {label:'Já Paguei ✅', class:'modal-btn-primary', onClick:() => { hideModal(); verifyVSPayment(paymentId); }},
            {label:'Cancelar', class:'modal-btn-danger', onClick: hideModal}
        ]
    });
}

let _vsCheckInterval = null;
function showVSPayPending(method, methodName, paymentId) {
    if (_vsCheckInterval) { clearInterval(_vsCheckInterval); _vsCheckInterval = null; }
    showModal({
        circleIcon:'<i class="fas fa-hourglass-half"></i>', circleType:'info',
        title:'⏳ A aguardar pagamento', centered: true,
        desc: 'Método: <strong>' + methodName + '</strong><br>Valor: <strong>50 MT</strong> → Modo V/S & Nome Terra<br><br><small style="color:var(--text-dim);">Confirme o USSD Push introduzindo o PIN no telemóvel.</small>',
        actions:[
            {label:'✅ Já Paguei', class:'modal-btn-success', onClick:() => { if (_vsCheckInterval) { clearInterval(_vsCheckInterval); _vsCheckInterval = null; } hideModal(); verifyVSPayment(paymentId); }},
            {label:'Cancelar', class:'modal-btn-gray', onClick:() => { if (_vsCheckInterval) { clearInterval(_vsCheckInterval); _vsCheckInterval = null; } hideModal(); }}
        ]
    });
    _vsCheckInterval = setInterval(async () => {
        try {
            const res = await fetch(PAYMENT_API + '?id=' + paymentId, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            const status = (data.data && data.data.transaction) ? data.data.transaction.status : (data.data ? data.data.status : data.status);
            if (['paid','completed','success','approved'].includes(status)) { clearInterval(_vsCheckInterval); _vsCheckInterval = null; hideModal(); onVSUnlockSuccess(); }
        } catch (e) { console.log('Poll VS error:', e); }
    }, 5000);
}

async function verifyVSPayment(paymentId) {
    showLoading(true, '🔍 Verificando pagamento...');
    try {
        const res = await fetch(PAYMENT_API + '?id=' + paymentId, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        showLoading(false);
        const status = (data.data && data.data.transaction) ? data.data.transaction.status : (data.data ? data.data.status : data.status);
        if (['paid','completed','success','approved'].includes(status)) { onVSUnlockSuccess(); }
        else {
            showModal({ circleIcon:'<i class="fas fa-clock"></i>', circleType:'warn', title:'Pagamento Pendente', centered: true,
                desc: 'O pagamento ainda não foi confirmado.',
                actions:[
                    {label:'🔄 Verificar novamente', class:'modal-btn-primary', onClick:() => { hideModal(); verifyVSPayment(paymentId); }},
                    {label:'Fechar', class:'modal-btn-gray', onClick: hideModal}
                ]
            });
        }
    } catch (e) {
        showLoading(false);
        showModal({ circleIcon:'!', circleType:'danger', title:'Erro de ligação', centered: true,
            desc: 'Não foi possível verificar.', actions:[{label:'OK', class:'modal-btn-gray', onClick: hideModal}]
        });
    }
}

function onVSUnlockSuccess() {
    gameState.vsUnlocked = true;
    saveState(); syncFirestore();
    spawnConfetti(); spawnConfetti(); spawnConfetti();
    setTimeout(() => { spawnConfetti(); spawnConfetti(); }, 500);
    playSound('victory');
    showModal({ icon:'🎉', title:'Modo V/S & Nome Terra Desbloqueados!', centered: true,
        desc: 'Parabéns! Os modos V/S e Nome Terra foram desbloqueados <strong>permanentemente</strong> na tua conta!<br><br>⚔️ Desafia os teus amigos agora!',
        actions: [{label:'💪 Entendido!', class:'modal-btn-success', onClick: hideModal}]
    });
}

function openVSLobby() {
    if (!navigator.onLine) {
        showNoInternetModal(() => openVSLobby());
        return;
    }
    document.getElementById('fab-watch-ad').style.display = 'none';
    document.getElementById('fab-vs-mode').style.display = 'none';
    if (gameState.isGuest || !auth.currentUser) {
        showModal({ circleIcon:'<i class="fas fa-user-lock"></i>', circleType:'warn', title:'Conta Necessária', centered: true,
            desc: 'Para jogar o modo V/S precisas de uma conta.',
            actions:[
                {label:'📝 Criar Conta', class:'modal-btn-success', onClick:() => { hideModal(); document.getElementById('game-container').style.display = 'none'; showAuthScreen(); }},
                {label:'Voltar', class:'modal-btn-gray', onClick: hideModal}
            ]
        });
        return;
    }
    showScreen('vs-lobby', (c) => {
        currentScreen = 'vs-lobby';
        hideQuizControls();
        const freePlays = gameState.freeMatchesLeft !== undefined ? gameState.freeMatchesLeft : 3;
        const badgeHtml = gameState.vsUnlocked 
            ? `<div class="vs-badge-unlocked"><i class="fas fa-crown"></i> Acesso Ilimitado</div>`
            : `<div class="vs-badge-free"><i class="fas fa-play-circle"></i> ${freePlays} Jogadas Grátis Restantes</div>`;
        c.innerHTML = `
            <div class="vs-lobby">
                <div class="vs-lobby-header">
                    <div class="vs-lobby-icon">⚔️</div>
                    <h2 class="vs-lobby-title">Modo V/S</h2>
                    <p class="vs-lobby-sub">Desafie um amigo para uma batalha de Quiz!</p>
                    ${badgeHtml}
                </div>
                <div class="vs-lobby-actions">
                    <button class="vs-btn vs-btn-create" id="vs-create-room">
                        <i class="fas fa-plus-circle"></i>
                        <div><strong>Criar Sala</strong><span>Gere um código e partilhe</span></div>
                    </button>
                    <button class="vs-btn vs-btn-join" id="vs-join-room">
                        <i class="fas fa-sign-in-alt"></i>
                        <div><strong>Aceitar Desafio</strong><span>Cole o código do amigo</span></div>
                    </button>
                </div>
                <div class="vs-lobby-rules">
                    <h3>📋 Regras</h3>
                    <ul>
                        <li>⚔️ Batalha 1 contra 1 em tempo real</li>
                        <li>🏆 Melhor de ${VS_MAX_ROUNDS} rounds — primeiro a ganhar ${Math.ceil(VS_MAX_ROUNDS/2)} vence!</li>
                        <li>🎰 Turnos alternados para girar a roleta</li>
                        <li>${VS_QUESTIONS_PER_ROUND}️⃣ Cada round tem ${VS_QUESTIONS_PER_ROUND} perguntas</li>
                        <li>⏱️ ${VS_TIME_PER_QUESTION} segundos por pergunta</li>
                        <li>⏰ Tempo esgotado = resposta errada!</li>
                        <li>🚪 Quem desistir, perde!</li>
                    </ul>
                    <div class="vs-lobby-cats">
                        <h4 style="margin:10px 0 6px;font-size:0.85em;color:var(--text-dim);">🎲 Categorias disponíveis:</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
                            ${VS_CATEGORIES.map(c => `<span style="background:${c.color};color:#fff;padding:4px 10px;border-radius:20px;font-size:0.78em;font-weight:700;">${c.emoji} ${c.name}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div style="background:linear-gradient(135deg,#6C5CE7,#00B894);border-radius:14px;padding:14px 18px;margin-bottom:20px;text-align:center;box-shadow:0 4px 16px rgba(108,92,231,0.3);">
                    <div style="font-size:1.8em;margin-bottom:4px;">🔥</div>
                    <div style="color:#fff;font-weight:800;font-size:1.05em;">Mais de 2000 perguntas</div>
                    <div style="color:rgba(255,255,255,0.85);font-size:0.82em;font-weight:600;">Atualizadas todos os dias!</div>
                </div>
                <button class="disc-voltar-btn" id="vs-back"><i class="fas fa-arrow-left"></i> Voltar</button>
            </div>
        `;
        document.getElementById('vs-create-room').onclick = () => { playSound('button'); createVSRoom(); };
        document.getElementById('vs-join-room').onclick = () => { playSound('button'); showJoinRoom(); };
        document.getElementById('vs-back').onclick = () => { playSound('button'); goClasses(); };
    });
}

async function createVSRoom() {
    if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
        showVSPaywall();
        return;
    }
    if (gameState.energy <= 0) {
        showOutOfEnergyModal();
        return;
    }
    showLoading(true, 'A criar sala...');
    const code = generateRoomCode();
    const roomRef = doc(db, 'vs_rooms', code);
    try {
        await setDoc(roomRef, {
            hostId: auth.currentUser.uid,
            hostName: gameState.playerName,
            guestId: null, guestName: null,
            status: 'waiting',
            roomCode: code,
            currentRound: 0,
            hostScore: 0, guestScore: 0,
            hostRoundsWon: 0, guestRoundsWon: 0,
            hostAnswers: {}, guestAnswers: {},
            hostRoundCorrect: 0, guestRoundCorrect: 0,
            roundHistory: [],
            whoseTurn: 'host',
            category: null, questions: [],
            reactions: [],
            createdAt: serverTimestamp()
        });
        showLoading(false);
        showWaitingRoom(code, 'host');
    } catch (e) {
        console.error('createVSRoom error:', e);
        showLoading(false);
        showModal({ circleIcon:'!', circleType:'danger', title:'Erro', centered: true,
            desc: `Não foi possível criar a sala.\n${e.message || e}`,
            actions:[{label:'OK', class:'modal-btn-gray', onClick: hideModal}]
        });
    }
}

function showJoinRoom() {
    showModal({ icon:'🎮', title:'Aceitar Desafio', centered: true,
        html: `<div class="vs-join-section">
            <p>Cole o código da sala do teu amigo:</p>
            <input type="text" id="vs-code-input" class="vs-code-input" placeholder="EX: ABC123" maxlength="6" style="text-transform:uppercase;">
        </div>`,
        actions:[
            {label:'⚔️ Entrar', class:'modal-btn-success', onClick: () => {
                const code = document.getElementById('vs-code-input')?.value.trim().toUpperCase();
                if (!code || code.length !== 6) { showCombo('Código inválido! ❌'); return; }
                hideModal(); joinVSRoom(code);
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick: hideModal}
        ]
    });
}

async function joinVSRoom(code) {
    if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
        showVSPaywall();
        return;
    }
    if (gameState.energy <= 0) {
        showOutOfEnergyModal();
        return;
    }
    showLoading(true, 'A entrar na sala...');
    const roomRef = doc(db, 'vs_rooms', code);
    try {
        const snap = await getDoc(roomRef);
        if (!snap.exists()) { showLoading(false); showCombo('Sala não encontrada! ❌'); return; }
        const data = snap.data();
        if (data.status !== 'waiting') { showLoading(false); showCombo('Sala já em jogo! ❌'); return; }
        if (data.hostId === auth.currentUser.uid) { showLoading(false); showCombo('Não podes entrar na tua própria sala! ❌'); return; }
        await updateDoc(roomRef, {
            guestId: auth.currentUser.uid,
            guestName: gameState.playerName,
            status: 'playing',
            currentRound: 1,
            whoseTurn: 'host'
        });
        showLoading(false);
        showWaitingRoom(code, 'guest');
    } catch (e) {
        showLoading(false);
        showModal({ circleIcon:'!', circleType:'danger', title:'Erro', centered: true,
            desc: 'Não foi possível entrar.', actions:[{label:'OK', class:'modal-btn-gray', onClick: hideModal}]
        });
    }
}

function showWaitingRoom(code, role) {
    vsState = { code, role, round: 0, myScore: 0, opScore: 0, myRoundsWon: 0, opRoundsWon: 0, roundHistory: [] };
    if (vsUnsubscribe) vsUnsubscribe();
    showScreen('vs-waiting', (c) => {
        currentScreen = 'vs-waiting';
        hideQuizControls();
        c.innerHTML = `
            <div class="vs-waiting">
                <div class="vs-waiting-icon">⏳</div>
                <h2>Sala Criada!</h2>
                <div class="vs-code-display">
                    <span class="vs-code-label">Código da Sala:</span>
                    <div class="vs-code-big" id="vs-room-code">${code}</div>
                    <button class="vs-copy-btn" id="vs-copy-code"><i class="fas fa-copy"></i> Copiar Código</button>
                    <button class="vs-share-btn" id="vs-share-whatsapp" style="background:#25D366;color:white;border:none;padding:10px 24px;border-radius:25px;font-weight:700;cursor:pointer;font-family:'Quicksand',sans-serif;margin-top:8px;margin-left:8px;">
                        <i class="fab fa-whatsapp"></i> Enviar no WhatsApp
                    </button>
                </div>
                <p class="vs-waiting-hint">Partilha o código com o teu amigo para ele entrar!</p>
                <div class="vs-waiting-anim"><div class="vs-dot"></div><div class="vs-dot"></div><div class="vs-dot"></div></div>
                <p class="vs-waiting-status" id="vs-wait-status">A aguardar adversário...</p>
                <button class="modal-btn-danger" id="vs-cancel-room" style="margin-top:20px;">✕ Cancelar</button>
            </div>
        `;
        document.getElementById('vs-copy-code').onclick = () => {
            navigator.clipboard?.writeText(code);
            showCombo('Código copiado! 📋');
        };
        document.getElementById('vs-share-whatsapp').onclick = () => {
            const msg = `⚔️ *QuizMoz — Modo V/S*\n\nEstou à tua espera! Entra com o código:\n\n══ 🔑 *${code}* ══\n\nAbre o QuizMoz → Modo V/S → Aceitar Desafio`;
            const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            if (window.Capacitor?.Plugins?.Browser) window.Capacitor.Plugins.Browser.open({ url });
            else window.open(url, '_blank');
        };
        document.getElementById('vs-cancel-room').onclick = () => { leaveVSRoom(); };
    });
    // Listen for room changes
    const roomRef = doc(db, 'vs_rooms', code);
    vsUnsubscribe = onSnapshot(roomRef, (snap) => {
        if (!snap.exists()) { leaveVSRoom('Sala encerrada.'); return; }
        const d = snap.data();
        
        // Handle reaction updates in real-time
        if (d.reactions && Array.isArray(d.reactions) && vsState) {
            if (!vsState.processedReactionIds) {
                vsState.processedReactionIds = new Set();
            }
            d.reactions.forEach(r => {
                if (r && r.id && !vsState.processedReactionIds.has(r.id)) {
                    vsState.processedReactionIds.add(r.id);
                    if (vsState.lastProcessedReactionTime && r.timestamp > vsState.lastProcessedReactionTime) {
                        triggerReactionAnimation(r.uid, r.emoji);
                    }
                }
            });
        }
        
        // Guest joined or Rematch started — transition to playing
        if (d.status === 'playing' && d.guestId && d.currentRound >= 1) {
            hideModal(); // hide results / rematch modals
            
            // Deduct energy once per match start / rematch
            if (vsState && !vsState.energyDeducted) {
                if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
                    showVSPaywall();
                    leaveVSRoom();
                    return;
                }
                if (gameState.energy <= 0) {
                    showOutOfEnergyModal();
                    leaveVSRoom();
                    return;
                }
                if (!gameState.vsUnlocked) {
                    gameState.freeMatchesLeft = Math.max(0, (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) - 1);
                }
                gameState.energy = Math.max(0, gameState.energy - 1);
                updateHUD();
                saveState();
                syncFirestore();
                vsState.energyDeducted = true;
            }

            // Reset results tracking on rematch
            if (vsState) {
                if (d.currentRound === 1) {
                    vsState._startedRound = 0;
                    vsState._startedQuestions = 0;
                }
                if (vsState.shownFinalResults) {
                    vsState.shownFinalResults = false;
                    vsState.hostRematchNotified = false;
                    vsState.guestRematchNotified = false;
                }
            }

            const opName = role === 'host' ? d.guestName : d.hostName;
            const statusEl = document.getElementById('vs-wait-status');
            if (statusEl) statusEl.textContent = `${opName} entrou! Preparando...`;
            
            // Only start if we haven't started this round yet
            if (!vsState || !vsState._startedRound || vsState._startedRound < d.currentRound) {
                if (vsState) vsState._startedRound = d.currentRound;
                setTimeout(() => startVSRound(code, role, d), 1500);
            }
        }
        // Round done — both submitted
        if (d.status === 'round_done') {
            showVSRoundResult(d, role);
        }
        // Match over
        if (d.status === 'finished' || d.status === 'match_over') {
            if (d.hostRematch && d.guestRematch) {
                // Both agreed to rematch! Host triggers reset
                if (role === 'host') {
                    resetRoomForRematch(code);
                }
                return;
            }
            
            // Check if opponent requested rematch and notify
            if (role === 'host' && d.guestRematch && vsState && !vsState.guestRematchNotified) {
                vsState.guestRematchNotified = true;
                showCombo('O adversário quer revanche! 🔄');
                const btn = document.getElementById('btn-vs-rematch');
                if (btn) {
                    btn.classList.add('modal-btn-success');
                    btn.textContent = '🔄 Aceitar Revanche!';
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            }
            if (role === 'guest' && d.hostRematch && vsState && !vsState.hostRematchNotified) {
                vsState.hostRematchNotified = true;
                showCombo('O adversário quer revanche! 🔄');
                const btn = document.getElementById('btn-vs-rematch');
                if (btn) {
                    btn.classList.add('modal-btn-success');
                    btn.textContent = '🔄 Aceitar Revanche!';
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            }
            
            // Only show results if not already shown
            if (vsState && !vsState.shownFinalResults) {
                vsState.shownFinalResults = true;
                showVSFinalResult(d, role);
            }
        }
        // Roulette result — questions ready
        if (d.status === 'roulette_done' && d.questions && d.questions.length > 0) {
            if (!vsState || !vsState._startedQuestions || vsState._startedQuestions < d.currentRound) {
                if (vsState) vsState._startedQuestions = d.currentRound;
                startVSQuestions(code, role, d);
            }
        }
    });
}

async function leaveVSRoom(msg) {
    if (vsUnsubscribe) { vsUnsubscribe(); vsUnsubscribe = null; }
    if (vsTimerInterval) { clearInterval(vsTimerInterval); vsTimerInterval = null; }
    if (vsState?.code) {
        try {
            const roomRef = doc(db, 'vs_rooms', vsState.code);
            const snap = await getDoc(roomRef);
            if (snap.exists()) {
                const d = snap.data();
                if (d.status === 'waiting' || (vsState.role === 'host' && !d.guestId)) {
                    await deleteDoc(roomRef);
                } else {
                    await updateDoc(roomRef, { status: 'finished', winner: vsState.role === 'host' ? 'guest' : 'host', reason: 'forfeit' });
                }
            }
        } catch(e) { console.warn('Leave room error:', e); }
    }
    vsState = null;
    if (msg) showCombo(msg);
    openVSLobby();
}

async function startVSRound(code, role, roomData) {
    const round = roomData.currentRound || 1;
    vsState.round = round;
    vsState.code = code;
    vsState.role = role;
    vsState.roomData = roomData;
    const whoseTurn = roomData.whoseTurn || 'host';
    const opName = role === 'host' ? roomData.guestName : roomData.hostName;
    const myRW = role === 'host' ? (roomData.hostRoundsWon || 0) : (roomData.guestRoundsWon || 0);
    const opRW = role === 'host' ? (roomData.guestRoundsWon || 0) : (roomData.hostRoundsWon || 0);
    vsState.myRoundsWon = myRW;
    vsState.opRoundsWon = opRW;
    // Build round indicator dots
    const roundDots = Array.from({length: VS_MAX_ROUNDS}, (_, i) => {
        const r = i + 1;
        if (r < round) return `<span class="vs-round-dot done">●</span>`;
        if (r === round) return `<span class="vs-round-dot active">●</span>`;
        return `<span class="vs-round-dot">○</span>`;
    }).join('');

    showScreen('vs-game', (c) => {
        currentScreen = 'vs-game';
        hideQuizControls();
        document.getElementById('floating-controls').style.display = 'none';
        c.innerHTML = `
            <div class="vs-round-intro">
                <div class="vs-round-badge">ROUND ${round} de ${VS_MAX_ROUNDS}</div>
                <div class="vs-round-dots">${roundDots}</div>
                <div class="vs-players-row">
                    <div class="vs-player-card vs-player-me">
                        <div class="vs-player-avatar">${getTier(gameState.level).icon}</div>
                        <div class="vs-player-name">${gameState.playerName}</div>
                        <div class="vs-player-score">${vsState.myScore}</div>
                        <div class="vs-rounds-won">🏆 ${myRW}</div>
                    </div>
                    <div class="vs-versus">VS</div>
                    <div class="vs-player-card vs-player-op">
                        <div class="vs-player-avatar">🎮</div>
                        <div class="vs-player-name">${opName}</div>
                        <div class="vs-player-score">${vsState.opScore}</div>
                        <div class="vs-rounds-won">🏆 ${opRW}</div>
                    </div>
                </div>
                <p class="vs-turn-info">${whoseTurn === role ? '🎰 É a tua vez de girar a roleta!' : '⏳ O adversário vai girar a roleta...'}</p>
                <div id="vs-roulette-area"></div>
            </div>
        `;
        if (whoseTurn === role) {
            setTimeout(() => showVSRoulette(code, role, roomData), 1000);
        }
    });
}

function showVSRoulette(code, role, roomData = null) {
    const area = document.getElementById('vs-roulette-area');
    if (!area) return;
    area.innerHTML = `
        <div class="vs-roulette-container">
            <div style="position:relative;width:300px;height:300px;">
                <div style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:26px solid #1a1a2e;z-index:10;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>
                <canvas id="vs-wheel-canvas" width="300" height="300" style="border-radius:50%;"></canvas>
            </div>
            <button class="vs-spin-btn" id="vs-spin-btn">🎰 GIRAR!</button>
        </div>
    `;

    const canvas = document.getElementById('vs-wheel-canvas');
    const ctx = canvas.getContext('2d');
    const total = VS_CATEGORIES.length;
    const arc = (2 * Math.PI) / total;
    const cx = 150, cy = 150, r = 138;
    let currentAngle = 0;

    // Map categories for canvas with multiline labels
    const catData = VS_CATEGORIES.map(c => ({
        label: c.name.replace(' & ', ' &\n'),
        color: c.color,
        icon: c.emoji,
        textColor: '#fff'
    }));
    // Special text colors for light backgrounds
    if (catData[0]) catData[0].textColor = '#5a3e00'; // Moçambique (red bg - use white)

    function drawWheel(angle) {
        ctx.clearRect(0, 0, 300, 300);
        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();

        for (let i = 0; i < total; i++) {
            const start = angle + i * arc;
            const end = start + arc;
            const cat = catData[i];
            // Slice
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, end);
            ctx.closePath();
            ctx.fillStyle = cat.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Text + Icon
            const midAngle = start + arc / 2;
            const textR = r * 0.62;
            const tx = cx + Math.cos(midAngle) * textR;
            const ty = cy + Math.sin(midAngle) * textR;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(midAngle + Math.PI / 2);
            const lines = cat.label.split('\n');
            ctx.fillStyle = cat.textColor;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const lineH = 15;
            const offsetY = -((lines.length - 1) * lineH) / 2;
            lines.forEach((line, j) => ctx.fillText(line, 0, offsetY + j * lineH));
            // Icon
            ctx.font = '17px sans-serif';
            ctx.fillText(cat.icon, 0, offsetY - 20);
            ctx.restore();
        }
        // Center circle
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QuizMoz', cx, cy);
    }

    drawWheel(currentAngle);

    document.getElementById('vs-spin-btn').onclick = () => {
        playSound('button');
        const btn = document.getElementById('vs-spin-btn');
        btn.disabled = true; btn.style.opacity = '0.5';

        // Extract history of played categories to filter duplicates in this match
        const history = roomData ? (roomData.roundHistory || []) : [];
        const playedCategories = history.map(h => h.category);

        let availableIndices = [];
        VS_CATEGORIES.forEach((cat, index) => {
            if (!playedCategories.includes(cat.name)) {
                availableIndices.push(index);
            }
        });

        // Fallback if all categories were already played
        if (availableIndices.length === 0) {
            availableIndices = VS_CATEGORIES.map((_, idx) => idx);
        }

        const chosen = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const extraSpins = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
        
        // 8% chance of pointer landing exactly between two categories
        const isBoundary = Math.random() < 0.08;
        const targetSliceAngle = isBoundary ? (chosen * arc) : (chosen * arc + arc / 2);
        
        // Mathematically align chosen segment under the top pointer (at 1.5 * Math.PI)
        const currentAngleNormalized = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const desiredAngle = (1.5 * Math.PI - targetSliceAngle + 4 * Math.PI) % (2 * Math.PI);
        let diff = desiredAngle - currentAngleNormalized;
        if (diff < 0) diff += 2 * Math.PI;
        
        const targetAngle = currentAngle + extraSpins + diff;
        const duration = 4000;
        const startTime = performance.now();
        const startAngle = currentAngle;
        let lastTickSegment = -1;

        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

        function animate(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            currentAngle = startAngle + (targetAngle - startAngle) * easeOut(t);
            drawWheel(currentAngle);
            // Tick sound when crossing segment boundaries
            const normalized = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const currentSegment = Math.floor(normalized / arc);
            if (currentSegment !== lastTickSegment) {
                lastTickSegment = currentSegment;
                playSound('tick');
            }
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                currentAngle = targetAngle;
                
                if (isBoundary) {
                    playSound('tick');
                    showCombo('Ficou no meio! 🎰 Gira novamente!');
                    if (btn) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }
                    return;
                }

                const cat = VS_CATEGORIES[chosen];
                playSound('victory');
                spawnConfetti(); spawnConfetti();
                showCombo(`${cat.emoji} ${cat.name}!`);
                
                setTimeout(() => {
                    const container = document.querySelector('.vs-roulette-container');
                    if (container) {
                        container.innerHTML = `
                            <div style="font-size: 1.1em; font-weight: 700; color: var(--text); margin-bottom: 12px; text-align: center; font-family: 'Quicksand', sans-serif;">
                                Categoria Sorteada: <br><span style="font-size: 1.3em; color: ${cat.color};">${cat.emoji} ${cat.name}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; margin: 10px auto 0 auto;">
                                <button class="nt-start-btn" id="vs-btn-confirm-cat" style="margin: 0;">🚀 Começar Partida</button>
                                <button class="nt-opt-btn" id="vs-btn-redraw-cat-ad" style="margin: 0; padding: 12px; font-weight: 700; background: #FFF3E0; border: 2px solid #FF9800; color: #E65100; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    🎰 Outra Categoria ([ANÚNCIO] 📺)
                                </button>
                                <button class="nt-opt-btn" id="vs-btn-redraw-cat-coins" style="margin: 0; padding: 12px; font-weight: 700; background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    🪙 Outra Categoria (20 Moedas)
                                </button>
                            </div>
                        `;
                        
                        document.getElementById('vs-btn-confirm-cat').onclick = async () => {
                            playSound('button');
                            showLoading(true, 'A carregar perguntas...');
                            try {
                                const allQ = await fetchVSQuestions(cat.file);
                                if (!allQ || allQ.length === 0) {
                                    throw new Error('Nenhuma pergunta carregada.');
                                }
                                
                                const roomRef = doc(db, 'vs_rooms', code);
                                const roomSnap = await getDoc(roomRef);
                                let hostId = null, guestId = null;
                                if (roomSnap.exists()) {
                                    const rData = roomSnap.data();
                                    hostId = rData.hostId;
                                    guestId = rData.guestId;
                                }

                                let hostCorrect = [];
                                let guestCorrect = [];
                                if (hostId) {
                                    const snapH = await getDoc(doc(db, 'users', hostId));
                                    if (snapH.exists()) hostCorrect = snapH.data().vsCorrectQuestions || [];
                                }
                                if (guestId) {
                                    const snapG = await getDoc(doc(db, 'users', guestId));
                                    if (snapG.exists()) guestCorrect = snapG.data().vsCorrectQuestions || [];
                                }

                                const eitherCorrect = Array.from(new Set([...hostCorrect, ...guestCorrect]));
                                let filteredQ = allQ.filter(q => !eitherCorrect.includes(q.text));

                                if (filteredQ.length < VS_QUESTIONS_PER_ROUND) {
                                    filteredQ = [...allQ];
                                }

                                shuffleArray(filteredQ);
                                const shuffled = filteredQ.slice(0, VS_QUESTIONS_PER_ROUND);
                                await updateDoc(roomRef, {
                                    category: cat.name,
                                    questions: shuffled.map(q => ({ 
                                        text: q.text, 
                                        options: q.options, 
                                        correct: q.correct, 
                                        justification: q.justification || '',
                                        image: q.image || null
                                    })),
                                    status: 'roulette_done',
                                    hostAnswers: {}, guestAnswers: {},
                                    hostRoundCorrect: 0, guestRoundCorrect: 0
                                });
                                showLoading(false);
                            } catch (e) {
                                console.error('VS fetch error:', e);
                                showLoading(false);
                                showCombo('Tema falhou ao abrir! 🎰 Gira novamente.');
                                reRenderVSRouletteAndSpin();
                            }
                        };
                        
                        document.getElementById('vs-btn-redraw-cat-ad').onclick = () => {
                            playSound('button');
                            showRewardedAd('redraw_category');
                        };
                        
                        document.getElementById('vs-btn-redraw-cat-coins').onclick = () => {
                            playSound('button');
                            if (gameState.coins < 20) {
                                showCombo('Moedas insuficientes! ❌');
                                return;
                            }
                            gameState.coins -= 20;
                            playSound('coin');
                            updateHUD();
                            saveState();
                            syncFirestore();
                            reRenderVSRouletteAndSpin();
                        };
                    }
                }, 1000);
            }
        }
        animate(performance.now());
    };
}

function applyCategoryRedraw() {
    reRenderVSRouletteAndSpin();
}

function reRenderVSRouletteAndSpin() {
    if (vsState && vsState.code && vsState.role && vsState.roomData) {
        showVSRoulette(vsState.code, vsState.role, vsState.roomData);
        setTimeout(() => {
            const btn = document.getElementById('vs-spin-btn');
            if (btn) btn.click();
        }, 100);
    }
}

function startVSQuestions(code, role, roomData) {
    const questions = roomData.questions;
    if (!questions || questions.length === 0) return;
    let qIdx = 0;
    let myAnswers = {};
    let timeLeft = VS_TIME_PER_QUESTION;

    function showVSQuestion() {
        if (qIdx >= questions.length) {
            submitVSAnswers(code, role, myAnswers, questions);
            return;
        }
        const q = questions[qIdx];
        showScreen('vs-game', (c) => {
            currentScreen = 'vs-game';
            hideQuizControls();
            document.getElementById('floating-controls').style.display = 'none';
            timeLeft = VS_TIME_PER_QUESTION;
            const imgUrl = q.image ? `https://raw.githubusercontent.com/BrunoMatherry/quizmoz-data/main/Modo_VS/${q.image}` : null;
            c.innerHTML = `
                <div class="vs-quiz">
                    <div class="vs-quiz-header">
                        <span class="vs-quiz-cat">${roomData.category}</span>
                        <span class="vs-quiz-counter">${qIdx+1}/${questions.length}</span>
                        <span class="vs-quiz-timer" id="vs-timer">⏱️ ${timeLeft}s</span>
                    </div>
                    ${imgUrl ? `<div class="vs-quiz-image"><img src="${imgUrl}" alt="Imagem da pergunta" /></div>` : ''}
                    <div class="vs-quiz-question" id="vs-q-text"></div>
                    <div class="vs-quiz-answers" id="vs-answers" style="display:none;"></div>
                </div>
            `;
            // Typewriter effect
            const textEl = document.getElementById('vs-q-text');
            let charIdx = 0;
            const typeInterval = setInterval(() => {
                if (charIdx < q.text.length) {
                    textEl.textContent += q.text[charIdx];
                    charIdx++;
                } else {
                    clearInterval(typeInterval);
                    // Show answers after typing done
                    const answersDiv = document.getElementById('vs-answers');
                    answersDiv.style.display = 'flex';
                    answersDiv.innerHTML = Object.entries(q.options).map(([k, v]) =>
                        `<button class="vs-answer-btn" data-key="${k}"><span class="vs-letter">${k}</span>${v}</button>`
                    ).join('');
                    answersDiv.querySelectorAll('.vs-answer-btn').forEach(btn => {
                        btn.onclick = () => {
                            clearInterval(vsTimerInterval);
                            const key = btn.dataset.key;
                            myAnswers[qIdx] = key;
                            answersDiv.querySelectorAll('.vs-answer-btn').forEach(b => { b.onclick = null; b.style.pointerEvents = 'none'; });
                            btn.classList.add(key === q.correct ? 'correct' : 'wrong');
                            answersDiv.querySelectorAll('.vs-answer-btn').forEach(b => { if (b.dataset.key === q.correct) b.classList.add('correct'); });
                            playSound(key === q.correct ? 'correct' : 'wrong');
                            setTimeout(() => { qIdx++; showVSQuestion(); }, 1200);
                        };
                    });
                    // Start timer
                    vsTimerInterval = setInterval(() => {
                        timeLeft--;
                        const timerEl = document.getElementById('vs-timer');
                        if (timerEl) timerEl.textContent = `⏱️ ${timeLeft}s`;
                        if (timeLeft <= 0) {
                            clearInterval(vsTimerInterval);
                            myAnswers[qIdx] = null;
                            answersDiv.querySelectorAll('.vs-answer-btn').forEach(b => { b.onclick = null; b.style.pointerEvents = 'none'; if (b.dataset.key === q.correct) b.classList.add('correct'); });
                            playSound('wrong');
                            showCombo('Tempo! ⏰');
                            setTimeout(() => { qIdx++; showVSQuestion(); }, 1200);
                        }
                    }, 1000);
                }
            }, 35);
        });
    }
    showVSQuestion();
}

async function submitVSAnswers(code, role, myAnswers, questions) {
    let correct = 0;
    const correctQuestionTexts = [];
    Object.entries(myAnswers).forEach(([idx, ans]) => { 
        const q = questions[parseInt(idx)];
        if (ans === q.correct) {
            correct++;
            if (q.text) correctQuestionTexts.push(q.text);
        }
    });

    if (auth.currentUser && correctQuestionTexts.length > 0) {
        (async () => {
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                let existingCorrect = [];
                if (userSnap.exists()) {
                    existingCorrect = userSnap.data().vsCorrectQuestions || [];
                }
                const updatedCorrect = Array.from(new Set([...existingCorrect, ...correctQuestionTexts]));
                await setDoc(userRef, { vsCorrectQuestions: updatedCorrect }, { merge: true });
            } catch (e) {
                console.warn('Error saving vsCorrectQuestions:', e);
            }
        })();
    }

    const roomRef = doc(db, 'vs_rooms', code);
    const field = role === 'host' ? 'hostAnswers' : 'guestAnswers';
    const scoreField = role === 'host' ? 'hostScore' : 'guestScore';
    const roundCorrectField = role === 'host' ? 'hostRoundCorrect' : 'guestRoundCorrect';
    try {
        const snap = await getDoc(roomRef);
        const d = snap.data();
        const prevScore = d[scoreField] || 0;
        const update = {};
        update[field] = myAnswers;
        update[scoreField] = prevScore + correct;
        update[roundCorrectField] = correct;
        // Check if opponent already submitted
        const opField = role === 'host' ? 'guestAnswers' : 'hostAnswers';
        const opAnswers = d[opField];
        if (opAnswers && Object.keys(opAnswers).length > 0) {
            // Both submitted — determine round winner
            const opCorrectField = role === 'host' ? 'guestRoundCorrect' : 'hostRoundCorrect';
            const opCorrect = d[opCorrectField] || 0;
            const myCorrectTotal = correct;
            // Determine who won this round
            let hostRW = d.hostRoundsWon || 0;
            let guestRW = d.guestRoundsWon || 0;
            const hostRC = role === 'host' ? myCorrectTotal : opCorrect;
            const guestRC = role === 'host' ? opCorrect : myCorrectTotal;
            if (hostRC > guestRC) hostRW++;
            else if (guestRC > hostRC) guestRW++;
            // Both get +0.5 on tie (tracked as full points via score)
            update.hostRoundsWon = hostRW;
            update.guestRoundsWon = guestRW;
            // Save round history
            const history = d.roundHistory || [];
            history.push({
                round: d.currentRound,
                category: d.category,
                hostCorrect: hostRC,
                guestCorrect: guestRC,
                winner: hostRC > guestRC ? 'host' : guestRC > hostRC ? 'guest' : 'tie'
            });
            update.roundHistory = history;
            // Check if match is over (best of 3 = first to 2 wins or all rounds done)
            const winsNeeded = Math.ceil(VS_MAX_ROUNDS / 2);
            if (hostRW >= winsNeeded || guestRW >= winsNeeded || d.currentRound >= VS_MAX_ROUNDS) {
                update.status = 'match_over';
                update.winner = hostRW > guestRW ? 'host' : guestRW > hostRW ? 'guest' : 'tie';
                update.reason = 'completed';
            } else {
                update.status = 'round_done';
            }
        }
        await updateDoc(roomRef, update);
        if (!opAnswers || Object.keys(opAnswers).length === 0) {
            showScreen('vs-game', (c) => {
                c.innerHTML = `<div class="vs-waiting"><div class="vs-waiting-icon">⏳</div><h2>A aguardar adversário...</h2><p style="color:var(--text-dim);margin-top:8px;">Acertaste ${correct}/${questions.length} neste round!</p><div class="vs-waiting-anim"><div class="vs-dot"></div><div class="vs-dot"></div><div class="vs-dot"></div></div></div>`;
            });
        }
    } catch (e) {
        showCombo('Erro ao enviar respostas ❌');
    }
}

function showVSRoundResult(roomData, role) {
    if (vsTimerInterval) { clearInterval(vsTimerInterval); vsTimerInterval = null; }
    const hScore = roomData.hostScore || 0;
    const gScore = roomData.guestScore || 0;
    const myScore = role === 'host' ? hScore : gScore;
    const opScore = role === 'host' ? gScore : hScore;
    vsState.myScore = myScore;
    vsState.opScore = opScore;
    const round = roomData.currentRound || 1;
    const opName = role === 'host' ? roomData.guestName : roomData.hostName;
    const myRW = role === 'host' ? (roomData.hostRoundsWon || 0) : (roomData.guestRoundsWon || 0);
    const opRW = role === 'host' ? (roomData.guestRoundsWon || 0) : (roomData.hostRoundsWon || 0);
    vsState.myRoundsWon = myRW;
    vsState.opRoundsWon = opRW;
    // Determine round winner from round history
    const history = roomData.roundHistory || [];
    const thisRound = history.find(r => r.round === round);
    const myRC = thisRound ? (role === 'host' ? thisRound.hostCorrect : thisRound.guestCorrect) : 0;
    const opRC = thisRound ? (role === 'host' ? thisRound.guestCorrect : thisRound.hostCorrect) : 0;
    const roundWon = myRC > opRC;
    const roundTie = myRC === opRC;

    if (roundWon) { spawnConfetti(); spawnConfetti(); playSound('victory'); }
    else if (!roundTie) { playSound('wrong'); }
    else { playSound('button'); }

    const winsNeeded = Math.ceil(VS_MAX_ROUNDS / 2);
    const isLastRound = round >= VS_MAX_ROUNDS || myRW >= winsNeeded || opRW >= winsNeeded;

    showScreen('vs-game', (c) => {
        c.innerHTML = `
            <div class="vs-result">
                <div class="vs-result-badge">ROUND ${round} — ${roundWon ? '✅ Ganhaste!' : roundTie ? '🤝 Empate!' : '❌ Perdeste!'}</div>
                <div class="vs-round-score-detail">
                    <span>Acertaste <strong>${myRC}/${VS_QUESTIONS_PER_ROUND}</strong></span>
                    <span>•</span>
                    <span>${opName}: <strong>${opRC}/${VS_QUESTIONS_PER_ROUND}</strong></span>
                </div>
                <div class="vs-result-players">
                    <div class="vs-result-card ${roundWon ? 'winner' : ''}">
                        <div class="vs-result-name">${gameState.playerName}</div>
                        <div class="vs-result-score">${myScore}</div>
                        <div class="vs-rounds-won-big">🏆 ${myRW} rounds</div>
                    </div>
                    <div class="vs-result-vs">VS</div>
                    <div class="vs-result-card ${!roundWon && !roundTie ? 'winner' : ''}">
                        <div class="vs-result-name">${opName}</div>
                        <div class="vs-result-score">${opScore}</div>
                        <div class="vs-rounds-won-big">🏆 ${opRW} rounds</div>
                    </div>
                </div>
                <div class="vs-result-actions">
                    ${isLastRound
                        ? ''
                        : `<button class="vs-btn vs-btn-create" id="vs-next-round"><i class="fas fa-forward"></i> Próximo Round</button>`
                    }
                    <button class="modal-btn-danger" id="vs-quit-match">🚪 ${isLastRound ? 'Sair' : 'Desistir'}</button>
                </div>
            </div>
        `;
        if (!isLastRound) {
            document.getElementById('vs-next-round').onclick = async () => {
                playSound('button');
                const roomRef = doc(db, 'vs_rooms', vsState.code);
                const nextTurn = roomData.whoseTurn === 'host' ? 'guest' : 'host';
                await updateDoc(roomRef, {
                    currentRound: round + 1,
                    whoseTurn: nextTurn,
                    status: 'playing',
                    category: null,
                    questions: [],
                    hostAnswers: {},
                    guestAnswers: {},
                    hostRoundCorrect: 0,
                    guestRoundCorrect: 0
                });
                vsState._startedRound = round + 1;
                startVSRound(vsState.code, role, { ...roomData, currentRound: round + 1, whoseTurn: nextTurn, hostAnswers: {}, guestAnswers: {} });
            };
        }
        document.getElementById('vs-quit-match').onclick = () => {
            if (isLastRound) {
                leaveVSRoom();
            } else {
                showModal({ icon:'🚪', title:'Desistir?', centered: true,
                    desc: 'Se desistires, perdes o jogo!',
                    actions:[
                        {label:'Sim, desistir', class:'modal-btn-danger', onClick: () => { hideModal(); leaveVSRoom('Desististe do jogo.'); }},
                        {label:'Continuar', class:'modal-btn-success', onClick: hideModal}
                    ]
                });
            }
        };
    });
}

async function resetRoomForRematch(code) {
    const roomRef = doc(db, 'vs_rooms', code);
    try {
        await updateDoc(roomRef, {
            status: 'playing',
            currentRound: 1,
            hostScore: 0, guestScore: 0,
            hostRoundsWon: 0, guestRoundsWon: 0,
            hostAnswers: {}, guestAnswers: {},
            hostRoundCorrect: 0, guestRoundCorrect: 0,
            roundHistory: [],
            whoseTurn: 'host',
            category: null, questions: [],
            hostRematch: false,
            guestRematch: false,
            reactions: []
        });
    } catch (e) {
        console.error('Error resetting room for rematch:', e);
    }
}

function showVSFinalResult(roomData, role) {
    if (vsTimerInterval) { clearInterval(vsTimerInterval); vsTimerInterval = null; }
    if (vsState) {
        vsState.lastProcessedReactionTime = Date.now();
        vsState.energyDeducted = false;
    }
    const winner = roomData.winner;
    const reason = roomData.reason || '';
    const iWon = winner === role;
    const isTie = winner === 'tie';
    const opName = role === 'host' ? roomData.guestName : roomData.hostName;
    const hScore = roomData.hostScore || 0;
    const gScore = roomData.guestScore || 0;
    const myScore = role === 'host' ? hScore : gScore;
    const opScore = role === 'host' ? gScore : hScore;
    const myRW = role === 'host' ? (roomData.hostRoundsWon || 0) : (roomData.guestRoundsWon || 0);
    const opRW = role === 'host' ? (roomData.guestRoundsWon || 0) : (roomData.hostRoundsWon || 0);
    const history = roomData.roundHistory || [];

    // Rewards
    const winRewardCoins = 30;
    const winRewardXP = 10;
    const loseRewardCoins = 5;
    const earnedCoins = (iWon || reason === 'forfeit') ? winRewardCoins : loseRewardCoins;
    const earnedXP = (iWon || reason === 'forfeit') ? winRewardXP : 0;

    // Apply rewards immediately
    if (!roomData.rewardsApplied) {
        roomData.rewardsApplied = true;
        gameState.coins += earnedCoins;
        gameState.exp += earnedXP;
        saveState();
        syncFirestore();
    }

    // Massive celebration for winner
    if (iWon || (isTie && myScore >= opScore)) {
        spawnConfetti(); spawnConfetti(); spawnConfetti();
        setTimeout(() => { spawnConfetti(); spawnConfetti(); }, 500);
        setTimeout(() => spawnConfetti(), 1000);
        playSound('victory');
    } else {
        playSound('wrong');
    }

    const resultTitle = iWon ? '🏆 VITÓRIA!' : isTie ? '🤝 EMPATE!' : (reason === 'forfeit' ? '🏆 VITÓRIA!' : '😢 DERROTA');
    const resultDesc = iWon
        ? `Parabéns! Venceste contra <strong>${opName}</strong>!`
        : isTie
            ? `Empate com <strong>${opName}</strong>! Boa partida!`
            : reason === 'forfeit'
                ? `<strong>${opName}</strong> desistiu. Tu vences!`
                : `<strong>${opName}</strong> venceu desta vez. Tenta novamente!`;
    const rewardHtml = (iWon || reason === 'forfeit')
        ? `<div class="vs-reward" style="font-size:1.15em; font-weight:800; color:#4CAF50; margin:12px 0;">🎁 +${winRewardCoins} 🪙 · +${winRewardXP} XP</div>`
        : isTie
            ? `<div class="vs-reward" style="font-size:1.15em; font-weight:800; color:#FF9800; margin:12px 0;">🎁 +${loseRewardCoins} 🪙 (participação)</div>`
            : `<div class="vs-reward vs-reward-lose" style="font-size:1.15em; font-weight:800; color:#F44336; margin:12px 0;">+${loseRewardCoins} 🪙 (participação)</div>`;

    showModal({ icon: '', title: '', centered: true,
        html: `<div class="vs-final-celebration">
            <div class="vs-final-title">${resultTitle}</div>
            <p class="vs-final-desc">${resultDesc}</p>
            <div class="vs-final-scores-grid">
                <div class="vs-final-player ${iWon || isTie ? 'winner' : ''}" id="vs-result-card-${auth.currentUser.uid}">
                    <div class="vs-final-avatar">${getTier(gameState.level).icon}</div>
                    <div class="vs-final-pname">${gameState.playerName}</div>
                    <div class="vs-final-pscore" id="vs-my-ticker">0</div>
                    <div class="vs-final-rounds">🏆 ${myRW} rounds</div>
                </div>
                <div class="vs-final-divider">VS</div>
                <div class="vs-final-player ${(!iWon && !isTie) || isTie ? 'winner' : ''}" id="vs-result-card-${role === 'host' ? roomData.guestId : roomData.hostId}">
                    <div class="vs-final-avatar">🎮</div>
                    <div class="vs-final-pname">${opName}</div>
                    <div class="vs-final-pscore" id="vs-op-ticker">0</div>
                    <div class="vs-final-rounds">🏆 ${opRW} rounds</div>
                </div>
            </div>
            
            <div class="reaction-bar-container" style="margin: 15px auto; text-align: center; max-width: 320px; width: 100%;">
                <div style="font-size: 0.8em; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Reagir:</div>
                <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; background: rgba(0,0,0,0.03); padding: 8px; border-radius: 12px; box-sizing: border-box;" id="vs-reaction-bar-buttons"></div>
            </div>
            
            <h3 style="font-size:0.95em; color:var(--text); margin:18px 0 8px; text-align:left;">📝 Folha de Respostas (Notebook)</h3>
            <div class="notebook-container">
                <div class="notebook-sheet">
                    <div class="notebook-header">
                        <div class="notebook-title">👤 ${gameState.playerName}</div>
                    </div>
                    <ul class="notebook-content">
                        ${history.length > 0 ? history.map(r => {
                            const myC = role === 'host' ? r.hostCorrect : r.guestCorrect;
                            let stampClass = 'stamp-errado';
                            let stampText = 'Mau';
                            if (myC >= 3) { stampClass = 'stamp-excelente'; stampText = 'Excelente!'; }
                            else if (myC >= 1) { stampClass = 'stamp-repetido'; stampText = 'Regular'; }
                            return `
                                <li class="notebook-row">
                                    <div class="notebook-category">R${r.round} - ${r.category.substring(0, 15)}</div>
                                    <div class="notebook-value" style="color: ${myC > 0 ? '#2e86de' : '#e74c3c'}">${myC} acertos</div>
                                    <div class="notebook-stamp ${stampClass}">${stampText}</div>
                                </li>
                            `;
                        }).join('') : '<li class="notebook-row">Sem rounds registados</li>'}
                    </ul>
                </div>
                <div class="notebook-sheet">
                    <div class="notebook-header">
                        <div class="notebook-title">🎮 ${opName}</div>
                    </div>
                    <ul class="notebook-content">
                        ${history.length > 0 ? history.map(r => {
                            const opC = role === 'host' ? r.guestCorrect : r.hostCorrect;
                            let stampClass = 'stamp-errado';
                            let stampText = 'Mau';
                            if (opC >= 3) { stampClass = 'stamp-excelente'; stampText = 'Excelente!'; }
                            else if (opC >= 1) { stampClass = 'stamp-repetido'; stampText = 'Regular'; }
                            return `
                                <li class="notebook-row">
                                    <div class="notebook-category">R${r.round} - ${r.category.substring(0, 15)}</div>
                                    <div class="notebook-value" style="color: ${opC > 0 ? '#2e86de' : '#e74c3c'}">${opC} acertos</div>
                                    <div class="notebook-stamp ${stampClass}">${stampText}</div>
                                </li>
                            `;
                        }).join('') : '<li class="notebook-row">Sem rounds registados</li>'}
                    </ul>
                </div>
            </div>
            
            ${rewardHtml}
        </div>`,
        actions:[
            {label:'🔄 Jogar Novamente', class:'modal-btn-success', id: 'btn-vs-rematch', onClick: async () => {
                await showInterstitialAd();
                if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
                    showVSPaywall();
                    return;
                }
                if (gameState.energy <= 0) {
                    showOutOfEnergyModal();
                    return;
                }
                const btn = document.getElementById('btn-vs-rematch');
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '⏳ A aguardar adversário...';
                    btn.style.opacity = '0.6';
                }
                
                try {
                    const roomRef = doc(db, 'vs_rooms', vsState.code);
                    if (role === 'host') {
                        await updateDoc(roomRef, { hostRematch: true });
                    } else {
                        await updateDoc(roomRef, { guestRematch: true });
                    }
                } catch (e) {
                    console.error('Error sending rematch request:', e);
                }
            }},
            {label:'🏠 Sair', class:'modal-btn-gray', onClick: () => {
                hideModal();
                leaveVSRoom();
            }}
        ]
    });

    // Start ticking animation and coin flying after mounting
    setTimeout(() => {
        animatePointsTicker('vs-my-ticker', myScore);
        animatePointsTicker('vs-op-ticker', opScore);
        
        const reactionBtnContainer = document.getElementById('vs-reaction-bar-buttons');
        if (reactionBtnContainer) {
            const emojis = ['👑', '🖕', '😎', '🤪', '🤬', '🤡', '💩', '💀', '🥶', '😴'];
            emojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.style.cssText = 'background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 6px 10px; font-size: 1.4em; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); outline: none; margin: 2px;';
                btn.innerText = emoji;
                btn.addEventListener('click', () => sendReaction(emoji));
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    sendReaction(emoji);
                });
                reactionBtnContainer.appendChild(btn);
            });
            
            const parent = reactionBtnContainer.parentElement;
            if (parent) {
                const chatContainer = document.createElement('div');
                chatContainer.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 10px; width: 100%;';
                chatContainer.innerHTML = `
                    <input type="text" id="vs-chat-input" maxlength="15" placeholder="Mensagem (máx 15)..." style="flex: 1; max-width: 200px; padding: 6px 12px; border: 1px solid rgba(0,0,0,0.15); border-radius: 20px; font-size: 0.85em; font-family: 'Quicksand', sans-serif; outline: none; background: white;" />
                    <button id="vs-btn-send-chat" style="background: var(--primary); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; outline: none; transition: transform 0.2s;"><i class="fas fa-paper-plane" style="font-size: 0.8em;"></i></button>
                `;
                parent.appendChild(chatContainer);
                
                const sendBtn = chatContainer.querySelector('#vs-btn-send-chat');
                const chatInput = chatContainer.querySelector('#vs-chat-input');
                
                const onSend = () => {
                    const val = chatInput.value.trim();
                    if (val) {
                        sendReaction(val);
                        chatInput.value = '';
                    }
                };
                
                sendBtn.onclick = onSend;
                chatInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        onSend();
                    }
                };
            }
        }
        
        setTimeout(() => {
            spawnCoinFlyEffect(earnedCoins, gameState.coins);
        }, 1300);
    }, 200);
}

// ===== NOME TERRA MODE =====
let ntRoomState = null;
let ntTempVotes = {};
let ntUnsubscribe = null;
let ntTimerInterval = null;
let ntTimeElapsed = 0;

const NT_ALL_CATEGORIES = {
    easy: ["Nome", "País", "Cidade", "Cor", "Animal", "Alimento", "Objeto", "Profissão"],
    normal: ["Nome", "País", "Cidade", "Cor", "Animal", "Alimento", "Objeto", "Profissão", "Carro", "Cantor", "Marca", "Filme"],
    hard: ["Nome", "País", "Cidade", "Cor", "Animal", "Alimento", "Objeto", "Profissão", "Carro", "Cantor", "Marca", "Filme", "Ator", "Novela", "Personagem", "Capital", "Música", "Roupa", "Parte do Corpo", "Instrumento"]
};

function normalizeNTText(text) {
    if (!text) return "";
    return text.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

function isValidNTName(name, letter) {
    if (!name) return 0;
    const clean = normalizeNTText(name);
    if (clean.length < 2 || clean.length > 15) return 0;
    if (clean[0] !== letter.toLowerCase()) return 0;

    const vowels = ['a', 'e', 'i', 'o', 'u'];
    
    let vowelCount = 0;
    let consonantCount = 0;
    for (let char of clean) {
        if (vowels.includes(char)) {
            vowelCount++;
        } else if (char >= 'a' && char <= 'z') {
            consonantCount++;
        }
    }
    
    if (vowelCount === 0 || consonantCount === 0) return 0;

    let consecutiveConsonants = 0;
    let consecutiveVowels = 0;
    
    const validConsonantClusters = [
        'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'vr',
        'bl', 'cl', 'fl', 'gl', 'pl', 'tl',
        'ch', 'lh', 'nh', 'qu', 'gu', 'sc', 'xc', 'ps', 'st'
    ];

    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (vowels.includes(char)) {
            consecutiveVowels++;
            consecutiveConsonants = 0;
        } else if (char >= 'a' && char <= 'z') {
            consecutiveConsonants++;
            consecutiveVowels = 0;
        }

        if (consecutiveVowels > 3) return 0;

        if (consecutiveConsonants >= 3) {
            const triple = clean.slice(i - 2, i + 1);
            const hasStr = triple.includes('str') || triple.includes('chr') || triple.includes('sph') || triple.includes('phr') || triple.includes('mpt') || triple.includes('rts') || triple.includes('nds');
            if (!hasStr) {
                const pair1 = triple.slice(0, 2);
                const pair2 = triple.slice(1, 3);
                const hasValidPair = validConsonantClusters.includes(pair1) || validConsonantClusters.includes(pair2);
                if (!hasValidPair) return 0;
            }
        }
        
        if (consecutiveConsonants >= 4) return 0;
    }

    // Determine phonetic score (1, 2, or 3)
    if (clean.length <= 3) {
        return 1;
    }

    let hasClusterOrDiphthong = false;
    for (let cluster of validConsonantClusters) {
        if (clean.includes(cluster)) {
            hasClusterOrDiphthong = true;
            break;
        }
    }

    if (!hasClusterOrDiphthong) {
        for (let i = 0; i < clean.length - 1; i++) {
            if (vowels.includes(clean[i]) && vowels.includes(clean[i+1])) {
                hasClusterOrDiphthong = true;
                break;
            }
        }
    }

    if (clean.length >= 5 && hasClusterOrDiphthong) {
        return 3;
    }
    
    return 2;
}


function getDictionaryCategoryList(dictionary, cat) {
    if (!dictionary || !cat) return [];
    const categoryKey = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const dictCatKey = Object.keys(dictionary).find(k => {
        const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return normalizedKey === categoryKey;
    });
    return dictCatKey ? dictionary[dictCatKey] : [];
}

function openNomeTerraLobby() {
    ntSinglePlayerUsedLetters = [];
    if (!navigator.onLine) {
        showNoInternetModal(() => openNomeTerraLobby());
        return;
    }
    document.getElementById('fab-watch-ad').style.display = 'none';
    document.getElementById('fab-vs-mode').style.display = 'none';
    if (gameState.isGuest || !auth.currentUser) {
        showModal({ circleIcon:'<i class="fas fa-user-lock"></i>', circleType:'warn', title:'Conta Necessária', centered: true,
            desc: 'Para jogar o modo Nome Terra precisas de uma conta.',
            actions:[
                {label:'📝 Criar Conta', class:'modal-btn-success', onClick:() => { hideModal(); document.getElementById('game-container').style.display = 'none'; showAuthScreen(); }},
                {label:'Voltar', class:'modal-btn-gray', onClick: hideModal}
            ]
        });
        return;
    }
    showScreen('nt-lobby', (c) => {
        currentScreen = 'nt-lobby';
        hideQuizControls();
        const freePlays = gameState.freeMatchesLeft !== undefined ? gameState.freeMatchesLeft : 3;
        const badgeHtml = gameState.vsUnlocked 
            ? `<div class="vs-badge-unlocked"><i class="fas fa-crown"></i> Acesso Ilimitado</div>`
            : `<div class="vs-badge-free"><i class="fas fa-play-circle"></i> ${freePlays} Jogadas Grátis Restantes</div>`;
        c.innerHTML = `
            <div class="nt-lobby">
                <div class="nt-lobby-header">
                    <div class="nt-lobby-icon">📝</div>
                    <h2 class="nt-lobby-title">Nome Terra - Stop</h2>
                    <p class="nt-lobby-sub">Preencha as categorias o mais rápido possível e grite STOP! Jogue com seus amigos.</p>
                    ${badgeHtml}
                </div>
                
                <div class="vs-lobby-rules" style="margin-top: 15px; text-align: left; padding: 14px; margin-bottom: 15px;">
                    <h3 style="font-size: 0.95em; color: var(--text); margin-bottom: 8px;">📋 Regras do Jogo:</h3>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85em; color: var(--text-dim); line-height: 1.45;">
                        <li style="margin-bottom: 4px;">🎰 <strong>Sorteio:</strong> Sorteie uma letra (aleatória ou escolha manual).</li>
                        <li style="margin-bottom: 4px;">📝 <strong>Preenchimento:</strong> Escreva palavras que começam com a letra sorteada.</li>
                        <li style="margin-bottom: 4px;">🚨 <strong>STOP:</strong> O primeiro a terminar pode gritar <strong>STOP!</strong> para congelar as respostas dos oponentes.</li>
                        <li style="margin-bottom: 4px;">📊 <strong>Pontos:</strong> 10 pontos por palavra correta e única; 5 pontos se repetida; 0 se errada.</li>
                        <li style="margin-bottom: 4px;">👑 <strong>Chefe:</strong> No modo online, o vencedor da rodada torna-se o novo Chefe 👑 da sala para a próxima partida.</li>
                        <li style="margin-bottom: 4px;">🪙 <strong>Moedas:</strong> Ganhe moedas de acordo com seu número de acertos.</li>
                    </ul>
                </div>
                
                <div class="nt-lobby-section">
                    <h3>🎮 Modo de Jogo</h3>
                    <div class="nt-option-grid">
                        <button class="nt-opt-btn active" id="nt-mode-single" data-mode="single">👤 Jogar Solo</button>
                        <button class="nt-opt-btn" id="nt-mode-multi" data-mode="multiplayer">👥 Online (até 4)</button>
                    </div>
                </div>

                <div class="nt-lobby-section">
                    <h3>⚡ Dificuldade</h3>
                    <div class="nt-option-grid-3">
                        <button class="nt-opt-btn active" id="nt-diff-easy" data-diff="easy">Fácil (8)</button>
                        <button class="nt-opt-btn" id="nt-diff-normal" data-diff="normal">Normal (12)</button>
                        <button class="nt-opt-btn" id="nt-diff-hard" data-diff="hard">Difícil (20)</button>
                    </div>
                </div>

                <div class="nt-lobby-section">
                    <h3>🎰 Seleção da Letra</h3>
                    <div class="nt-option-grid">
                        <button class="nt-opt-btn active" id="nt-letter-random" data-lmode="random">🎲 Roleta Aleatória</button>
                        <button class="nt-opt-btn" id="nt-letter-manual" data-lmode="manual">👤 Escolha Manual</button>
                    </div>
                    
                    <div class="nt-letter-select-wrap" id="nt-letter-select-wrap" style="display: none;">
                        <p style="font-size: 0.85em; color: var(--text-dim); margin-bottom: 8px;">Selecione a Letra:</p>
                        <div class="nt-letter-grid" id="nt-letter-grid"></div>
                    </div>
                </div>

                <div class="nt-lobby-section" id="nt-multi-actions" style="display: none; background: transparent; box-shadow: none; padding: 0;">
                    <div class="vs-lobby-actions" style="margin-bottom: 0;">
                        <button class="vs-btn vs-btn-create" id="nt-create-room" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
                            <i class="fas fa-plus-circle"></i>
                            <div><strong>Criar Sala</strong><span>Convide até 3 amigos</span></div>
                        </button>
                        <button class="vs-btn vs-btn-join" id="nt-join-room" style="background: linear-gradient(135deg, #d35400, #c0392b);">
                            <i class="fas fa-sign-in-alt"></i>
                            <div><strong>Entrar na Sala</strong><span>Cole o código do amigo</span></div>
                        </button>
                    </div>
                </div>

                <button class="nt-start-btn" id="nt-start-btn">🚀 Iniciar Partida Solo</button>
                <button class="disc-voltar-btn" id="nt-back" style="margin-top: 14px;"><i class="fas fa-arrow-left"></i> Voltar</button>
            </div>
        `;

        bindNTLobbyEvents(c);
    });
}

function bindNTLobbyEvents(c) {
    let mode = 'single';
    let difficulty = 'easy';
    let letterMode = 'random';
    let manualLetter = 'A';

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const grid = document.getElementById('nt-letter-grid');
    if (grid) {
        grid.innerHTML = alphabet.map(l => `<button class="nt-letter-btn ${l === 'A' ? 'active' : ''}" data-letter="${l}">${l}</button>`).join('');
        grid.querySelectorAll('.nt-letter-btn').forEach(btn => {
            btn.onclick = () => {
                grid.querySelectorAll('.nt-letter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                manualLetter = btn.dataset.letter;
                playSound('click');
            };
        });
    }

    const modeBtns = [document.getElementById('nt-mode-single'), document.getElementById('nt-mode-multi')];
    modeBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            playSound('click');

            const startBtn = document.getElementById('nt-start-btn');
            const multiActions = document.getElementById('nt-multi-actions');
            if (mode === 'single') {
                if (startBtn) startBtn.style.display = 'block';
                if (multiActions) multiActions.style.display = 'none';
            } else {
                if (startBtn) startBtn.style.display = 'none';
                if (multiActions) multiActions.style.display = 'block';
            }
        };
    });

    const diffBtns = [document.getElementById('nt-diff-easy'), document.getElementById('nt-diff-normal'), document.getElementById('nt-diff-hard')];
    diffBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            difficulty = btn.dataset.diff;
            playSound('click');
        };
    });

    const lmodeBtns = [document.getElementById('nt-letter-random'), document.getElementById('nt-letter-manual')];
    lmodeBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = () => {
            lmodeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            letterMode = btn.dataset.lmode;
            playSound('click');

            const wrap = document.getElementById('nt-letter-select-wrap');
            if (letterMode === 'manual') {
                if (wrap) wrap.style.display = 'block';
            } else {
                if (wrap) wrap.style.display = 'none';
            }
        };
    });

    const startBtn = document.getElementById('nt-start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            playSound('button');
            if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
                showVSPaywall();
                return;
            }
            if (gameState.energy <= 0) {
                showOutOfEnergyModal();
                return;
            }
            if (!gameState.vsUnlocked) {
                gameState.freeMatchesLeft = Math.max(0, (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) - 1);
            }
            gameState.energy--;
            updateHUD();
            saveState();
            syncFirestore();

            startNTSingleGame(difficulty, letterMode, manualLetter);
        };
    }

    const createBtn = document.getElementById('nt-create-room');
    if (createBtn) {
        createBtn.onclick = () => {
            playSound('button');
            createNTRoom(difficulty, letterMode, manualLetter);
        };
    }

    const joinBtn = document.getElementById('nt-join-room');
    if (joinBtn) {
        joinBtn.onclick = () => {
            playSound('button');
            showNTJoinRoom();
        };
    }

    const backBtn = document.getElementById('nt-back');
    if (backBtn) {
        backBtn.onclick = () => {
            playSound('button');
            goClasses();
        };
    }
}

function startNTSingleGame(difficulty, letterMode, manualLetter) {
    let chosenLetter = manualLetter;
    if (letterMode === 'random') {
        chosenLetter = drawRandomLetter(ntSinglePlayerUsedLetters);
        ntSinglePlayerUsedLetters.push(chosenLetter);
    }
    
    const cats = NT_ALL_CATEGORIES[difficulty];
    
    ntRoomState = {
        isMultiplayer: false,
        difficulty: difficulty,
        letter: chosenLetter,
        categories: cats,
        answers: {},
        timeElapsed: 0
    };
    
    if (letterMode === 'random') {
        runSinglePlayerLetterAnimation(chosenLetter);
    } else {
        startNTGameplay();
    }
}

function runSinglePlayerLetterAnimation(chosenLetter) {
    showScreen('nt-game', (c) => {
        currentScreen = 'nt-game';
        hideQuizControls();
        document.getElementById('floating-controls').style.display = 'none';
        c.innerHTML = `
            <div class="nt-lobby" style="margin-top: 50px;">
                <div class="nt-lobby-icon" style="font-size: 5em;">🎲</div>
                <h2 class="nt-lobby-title">Sorteando Letra</h2>
                <div style="font-size: 6em; font-family: 'Righteous', cursive; margin: 30px 0; color: #d35400;" id="nt-anim-letter">A</div>
                <p style="color: var(--text-dim); font-weight: 600;">Preparando o seu caderno...</p>
            </div>
        `;
        
        const animEl = document.getElementById('nt-anim-letter');
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVZ';
        let counter = 0;
        const interval = setInterval(() => {
            animEl.textContent = letters[counter % letters.length];
            counter++;
            playSound('tick');
        }, 50);
        
        setTimeout(() => {
            clearInterval(interval);
            animEl.textContent = chosenLetter;
            playSound('victory');
            spawnConfetti();
            
            setTimeout(() => {
                c.innerHTML = `
                    <div class="nt-lobby" style="margin-top: 50px;">
                        <div class="nt-lobby-icon" style="font-size: 5em;">🎲</div>
                        <h2 class="nt-lobby-title">Letra Sorteada</h2>
                        <div style="font-size: 6em; font-family: 'Righteous', cursive; margin: 20px 0; color: #d35400;">${chosenLetter}</div>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; margin: 0 auto;">
                            <button class="nt-start-btn" id="nt-btn-confirm-letter" style="background: linear-gradient(135deg, #2ecc71, #27ae60); margin: 0;">🚀 Começar Jogo</button>
                            <button class="nt-opt-btn" id="nt-btn-redraw-ad" style="margin: 0; padding: 12px; font-weight: 700; background: #FFF3E0; border: 2px solid #FF9800; color: #E65100; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                🎰 Outra Letra ([ANÚNCIO] 📺)
                            </button>
                            <button class="nt-opt-btn" id="nt-btn-redraw-coins" style="margin: 0; padding: 12px; font-weight: 700; background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; gap: 8px;">
                                🪙 Outra Letra (20 Moedas)
                            </button>
                        </div>
                    </div>
                `;
                
                document.getElementById('nt-btn-confirm-letter').onclick = () => {
                    playSound('button');
                    startNTGameplay();
                };
                
                document.getElementById('nt-btn-redraw-ad').onclick = () => {
                    playSound('button');
                    showRewardedAd('redraw_letter');
                };
                
                document.getElementById('nt-btn-redraw-coins').onclick = () => {
                    playSound('button');
                    if (gameState.coins < 20) {
                        showCombo('Moedas insuficientes! ❌');
                        return;
                    }
                    gameState.coins -= 20;
                    playSound('coin');
                    updateHUD();
                    saveState();
                    syncFirestore();
                    applyLetterRedraw();
                };
            }, 1000);
        }, 2000);
    });
}

function applyLetterRedraw() {
    if (ntRoomState && ntRoomState.isMultiplayer) {
        const roomRef = doc(db, 'nome_terra_rooms', ntRoomState.code);
        getDoc(roomRef).then(snap => {
            if (snap.exists()) {
                const d = snap.data();
                const newL = drawRandomLetter(d.usedLetters || []);
                const updatedUsed = [...(d.usedLetters || [])];
                if (!updatedUsed.includes(newL)) {
                    updatedUsed.push(newL);
                }
                updateDoc(roomRef, {
                    letter: newL,
                    usedLetters: updatedUsed
                });
            }
        });
    } else {
        const newL = drawRandomLetter(ntSinglePlayerUsedLetters);
        ntSinglePlayerUsedLetters.push(newL);
        if (ntRoomState) {
            ntRoomState.letter = newL;
        }
        runSinglePlayerLetterAnimation(newL);
    }
}

function startNTGameplay() {
    ntTimeElapsed = 0;
    if (ntTimerInterval) clearInterval(ntTimerInterval);
    
    ntTimerInterval = setInterval(() => {
        ntTimeElapsed++;
        const timerEl = document.getElementById('nt-timer-value-display');
        if (timerEl) {
            const min = Math.floor(ntTimeElapsed / 60);
            const sec = ntTimeElapsed % 60;
            timerEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    }, 1000);

    let currentPage = 0;
    const itemsPerPage = 4;
    const totalPages = Math.ceil(ntRoomState.categories.length / itemsPerPage);

    function renderNTPage() {
        showScreen('nt-game', (c) => {
            currentScreen = 'nt-game';
            hideQuizControls();
            document.getElementById('floating-controls').style.display = 'none';

            const startIdx = currentPage * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, ntRoomState.categories.length);
            const pageCats = ntRoomState.categories.slice(startIdx, endIdx);

            const min = Math.floor(ntTimeElapsed / 60);
            const sec = ntTimeElapsed % 60;
            const timerStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

            let inputsHtml = '';
            pageCats.forEach((cat) => {
                const currentVal = ntRoomState.answers[cat] || '';
                inputsHtml += `
                    <div class="nt-category-item">
                        <label class="nt-category-label">${cat}</label>
                        <input type="text" 
                               class="handwritten-input nt-input-field" 
                               data-cat="${cat}" 
                               placeholder="Começa com ${ntRoomState.letter}" 
                               value="${currentVal}" 
                               maxlength="30"
                               style="text-transform: capitalize;">
                    </div>
                `;
            });

            const dotsHtml = Array.from({ length: totalPages }, (_, i) => {
                return `<span class="nt-page-dot ${i === currentPage ? 'active' : ''}" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${i === currentPage ? '#5E9B9D' : 'rgba(0,0,0,0.15)'}; margin: 0 4px; transition: all 0.2s; ${i === currentPage ? 'transform: scale(1.3); background: #5E9B9D;' : ''}"></span>`;
            }).join('');

            c.innerHTML = `
                <div class="nt-game">
                    <div class="nt-header">
                        <div class="nt-badge-letter">${ntRoomState.letter}</div>
                        <div class="nt-header-info">
                            <h4>Modo Nome Terra</h4>
                            <span>Nível: ${ntRoomState.difficulty.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div class="nt-timer-stop-row">
                        <div class="nt-timer-badge">
                            ⏱️ <span id="nt-timer-value-display">${timerStr}</span>
                        </div>
                        <button class="nt-stop-btn" id="nt-stop-btn">🚨 STOP!</button>
                    </div>

                    <div class="nt-paper-area-container" style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%;">
                        <!-- Seta Esquerda (flutuante) -->
                        <button class="nt-side-arrow-btn" id="nt-side-prev" style="position: absolute; left: -12px; z-index: 10; background: #5E9B9D; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.15); outline: none; transition: transform 0.1s; ${currentPage === 0 ? 'display: none;' : ''}" ${currentPage === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left" style="font-size: 1.1em;"></i>
                        </button>

                        <div class="nt-paper-area notebook-paper" id="nt-notebook-area" style="flex: 1; margin: 0 16px;">
                            ${inputsHtml}
                        </div>

                        <!-- Seta Direita (flutuante) -->
                        <button class="nt-side-arrow-btn" id="nt-side-next" style="position: absolute; right: -12px; z-index: 10; background: #5E9B9D; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.15); outline: none; transition: transform 0.1s;">
                            <i class="fas ${currentPage === totalPages - 1 ? 'fa-check' : 'fa-chevron-right'}" style="font-size: 1.1em;"></i>
                        </button>
                    </div>

                    <div class="nt-pager-nav" style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 14px;">
                        <div style="display: flex; justify-content: center; align-items: center;">
                            ${dotsHtml}
                        </div>
                        <span class="nt-page-indicator" style="font-size: 0.85em; color: var(--text-dim); font-weight: 700;">Pág. ${currentPage + 1} de ${totalPages}</span>
                        
                        <div style="display: flex; gap: 20px; margin-top: 6px;">
                            <button class="nt-nav-btn" id="nt-prev-btn" ${currentPage === 0 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-left"></i> Anterior
                            </button>
                            <button class="nt-nav-btn" id="nt-next-btn">
                                ${currentPage === totalPages - 1 ? 'Enviar ✓' : 'Próximo <i class="fas fa-chevron-right"></i>'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            c.querySelectorAll('.nt-input-field').forEach(input => {
                input.oninput = () => {
                    const cat = input.dataset.cat;
                    ntRoomState.answers[cat] = input.value;
                };
            });

            const onPrev = () => {
                saveCurrentPageInputs();
                currentPage--;
                renderNTPage();
                playSound('click');
            };

            const onNext = () => {
                saveCurrentPageInputs();
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    renderNTPage();
                    playSound('click');
                } else {
                    stopNTRound();
                }
            };

            document.getElementById('nt-prev-btn').onclick = onPrev;
            document.getElementById('nt-next-btn').onclick = onNext;
            
            const sidePrev = document.getElementById('nt-side-prev');
            if (sidePrev) sidePrev.onclick = onPrev;
            
            const sideNext = document.getElementById('nt-side-next');
            if (sideNext) sideNext.onclick = onNext;

            document.getElementById('nt-stop-btn').onclick = () => {
                saveCurrentPageInputs();
                stopNTRound();
            };
        });
    }

    function saveCurrentPageInputs() {
        const fields = document.querySelectorAll('.nt-input-field');
        fields.forEach(field => {
            const cat = field.dataset.cat;
            ntRoomState.answers[cat] = field.value.trim();
        });
    }

    renderNTPage();
}

async function stopNTRound() {
    if (ntTimerInterval) { clearInterval(ntTimerInterval); ntTimerInterval = null; }
    
    if (!ntRoomState.isMultiplayer) {
        showLoading(true, 'A verificar respostas...');
        
        let dictionary = null;
        try {
            const letter = ntRoomState.letter.toLowerCase();
            const res = await fetch(`https://raw.githubusercontent.com/BrunoMatherry/quizmoz-data/main/Nome_Terra_ab/${letter}.json`);
            if (res.ok) {
                dictionary = await res.json();
            }
        } catch (e) {
            console.warn('GitHub dictionary load failed. Using letter match fallback.', e);
        }
        
        showLoading(false);
        showNTSingleResults(dictionary);
    } else {
        showLoading(true, 'Enviando STOP...');
        
        // Save current page inputs to ntRoomState.answers
        const fields = document.querySelectorAll('.nt-input-field');
        fields.forEach(field => {
            const cat = field.dataset.cat;
            ntRoomState.answers[cat] = field.value.trim();
        });

        // Ensure missing categories have at least an empty string
        ntRoomState.categories.forEach(cat => {
            if (ntRoomState.answers[cat] === undefined) {
                ntRoomState.answers[cat] = '';
            }
        });

        const myAnswers = { ...ntRoomState.answers };
        
        try {
            const roomRef = doc(db, 'nome_terra_rooms', ntRoomState.code);
            let roomPlayers = [];
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(roomRef);
                if (!sfDoc.exists()) {
                    throw new Error("Room does not exist!");
                }
                const d = sfDoc.data();
                const updatedPlayers = d.players.map(p => {
                    if (p.uid === auth.currentUser.uid) {
                        return {
                            ...p,
                            answers: myAnswers,
                            stopped: true
                        };
                    }
                    return p;
                });
                roomPlayers = updatedPlayers;
                
                const updates = { players: updatedPlayers };
                if (d.status !== 'stopped') {
                    updates.status = 'stopped';
                    updates.stopTriggeredBy = auth.currentUser.uid;
                }
                transaction.update(roomRef, updates);
            });
            
            showScreen('nt-game', (c) => {
                const isHost = ntRoomState.role === 'host';
                c.innerHTML = `
                    <div class="nt-lobby" style="margin-top: 50px;">
                        <div class="vs-waiting-icon">⏳</div>
                        <h2 style="color:var(--text);font-family:'Comfortaa',cursive;">Respostas Enviadas!</h2>
                        <p style="color:var(--text-dim);font-weight:600;margin-top:10px;">Aguardando os outros jogadores finalizarem...</p>
                        <div class="vs-waiting-anim" style="margin-top:20px;"><div class="vs-dot"></div><div class="vs-dot"></div><div class="vs-dot"></div></div>
                        
                        <div class="nt-lobby-section" style="margin-top: 20px; width: 100%; max-width: 280px; margin-left: auto; margin-right: auto; text-align: left;">
                            <h3 style="font-size: 0.95em; color: var(--text); margin-bottom: 8px; font-weight: 700; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 4px;">👥 Status dos Jogadores:</h3>
                            <ul id="nt-answers-players-list-1" style="list-style: none; padding: 0; margin: 0;"></ul>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:10px; margin-top:30px; width:100%; max-width:260px; margin-left:auto; margin-right:auto;">
                            ${isHost ? `
                                <button class="nt-start-btn" id="nt-btn-answers-force-1" style="background: linear-gradient(135deg, #e67e22, #d35400); box-shadow: 0 4px 12px rgba(211,84,0,0.2); margin: 0; width: 100%;"><i class="fas fa-flag-checkered"></i> Forçar Fim de Jogo</button>
                            ` : ''}
                            <button class="disc-voltar-btn" id="nt-btn-answers-exit-1" style="margin: 0; width: 100%;"><i class="fas fa-home"></i> Sair da Partida</button>
                        </div>
                    </div>
                `;
                if (isHost) {
                    document.getElementById('nt-btn-answers-force-1').onclick = () => {
                        playSound('button');
                        const playersToGrade = ntRoomState.latestPlayers || roomPlayers;
                        gradeMultiplayerRound(ntRoomState.code, playersToGrade, ntRoomState.letter, ntRoomState.categories);
                    };
                }
                document.getElementById('nt-btn-answers-exit-1').onclick = () => {
                    playSound('button');
                    leaveNTRoom();
                };
            });
            showLoading(false);
        } catch(e) {
            console.error('Error stopping room:', e);
            showLoading(false);
            showCombo('Erro ao enviar STOP ❌');
        }
    }
}

function showNTSingleResults(dictionary) {
    let correctCount = 0;
    let totalCategories = ntRoomState.categories.length;
    
    let htmlLines = '';
    ntRoomState.categories.forEach(cat => {
        const answer = ntRoomState.answers[cat] || '';
        const normalized = normalizeNTText(answer);
        
        let isValid = false;
        let points = 0;
        if (normalized !== '') {
            if (dictionary) {
                const catList = getDictionaryCategoryList(dictionary, cat);
                const normalizedDict = catList.map(w => normalizeNTText(w));
                isValid = normalizedDict.includes(normalized);
            } else {
                isValid = false; // strictly false if offline/no database
            }

            if (isValid) {
                points = 10;
            } else if (cat.toLowerCase() === 'nome') {
                const nameScore = isValidNTName(answer, ntRoomState.letter);
                if (nameScore > 0) {
                    isValid = true;
                    points = nameScore;
                }
            }
        }
        
        if (isValid) correctCount++;
        
        let dicaHtml = '';
        if (dictionary) {
            const catList = getDictionaryCategoryList(dictionary, cat);
            if (catList.length > 0) {
                const randomDica = catList[Math.floor(Math.random() * catList.length)];
                dicaHtml = `<div style="font-size:0.8em; color:#e67e22; margin-top:2px; font-family:'Architects Daughter', cursive;">Sugestão: ${randomDica}</div>`;
            }
        }
        
        htmlLines += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 10px; border-bottom:1px solid #e1dec9;">
                <div style="text-align:left;">
                    <span style="font-weight:700; color:var(--text-dim); text-transform:uppercase; font-size:0.85em;">${cat}</span>
                    ${!isValid ? dicaHtml : ''}
                </div>
                <span class="handwritten-text" style="flex:1; text-align:right; margin-right:15px; text-decoration: ${isValid ? 'none' : 'line-through'}; color: ${isValid ? '#2e86de' : '#e74c3c'};">
                    ${answer || '---'}
                </span>
                <span style="font-size:1.1em;">
                    ${isValid ? `<span style="color:#2ecc71;">✓ (${points} pts)</span>` : '<span style="color:#e74c3c;">✗ (0 pts)</span>'}
                </span>
            </div>
        `;
    });
    
    let coinsEarned = 0;
    if (correctCount === totalCategories) {
        coinsEarned = 10;
    } else {
        const ratio = correctCount / totalCategories;
        if (ratio > 0.5) {
            coinsEarned = 7;
        } else if (ratio >= 0.25) {
            coinsEarned = 5;
        } else if (correctCount > 0) {
            coinsEarned = 4;
        } else {
            coinsEarned = 0;
        }
    }
    const xpEarned = correctCount * 5;
    
    gameState.coins += coinsEarned;
    gameState.exp += xpEarned;
    
    const xpNeeded = getXPForLevel(gameState.level);
    if (gameState.exp >= xpNeeded) {
        gameState.level++;
        gameState.exp -= xpNeeded;
        setTimeout(() => {
            playSound('victory');
            showLevelUp(gameState.level, getTier(gameState.level), null, gameState.level * 100 + gameState.qi * 2 + gameState.coins);
        }, 1500);
    }
    
    updateHUD();
    saveState();
    syncFirestore();
    playSound(correctCount > 0 ? 'victory' : 'wrong');
    spawnConfetti();

    showScreen('nt-results', (c) => {
        currentScreen = 'nt-results';
        c.innerHTML = `
            <div class="nt-game" style="max-width:100%; height: auto; min-height: 100%; padding-bottom: 120px;">
                <div class="nt-results-title">📝 Resultados Nome Terra</div>
                
                <div class="vs-lobby-rules" style="padding:15px; margin-bottom:12px; text-align:center;">
                    <div style="font-size:1.8em; margin-bottom:4px;">📊 Resumo da Partida</div>
                    <p style="color:var(--text);font-weight:700;font-size:1.05em;">Letra Jogada: <strong style="color:#d35400;font-size:1.4em;">${ntRoomState.letter}</strong></p>
                    <p style="color:var(--text-dim);font-size:0.9em;margin-top:2px;">Tempo Total: <strong>${ntTimeElapsed} segundos</strong></p>
                    <p style="color:var(--text-dim);font-size:0.9em;">Acertos: <strong>${correctCount} de ${totalCategories} categorias</strong></p>
                </div>

                <div class="nt-paper-area notebook-paper" style="min-height:auto; margin-bottom:15px; padding-top:10px;">
                    ${htmlLines}
                </div>

                <div class="vs-reward" style="margin-bottom:15px; text-align:center;">
                    🎁 Recompensas:<br>
                    🪙 +${coinsEarned} Moedas<br>
                    ⭐ +${xpEarned} XP
                </div>

                <button class="nt-start-btn" id="nt-btn-play-again">🔄 Jogar Novamente</button>
                <button class="disc-voltar-btn" id="nt-btn-leave" style="margin-top:10px;"><i class="fas fa-home"></i> Menu Principal</button>
            </div>
        `;

        document.getElementById('nt-btn-play-again').onclick = () => {
            playSound('button');
            openNomeTerraLobby();
        };

        document.getElementById('nt-btn-leave').onclick = () => {
            playSound('button');
            goClasses();
        };
    });
}

async function createNTRoom(difficulty, letterMode, manualLetter) {
    if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
        showVSPaywall();
        return;
    }
    if (gameState.energy <= 0) {
        showOutOfEnergyModal();
        return;
    }
    showLoading(true, 'Criando sala Nome Terra...');
    const code = generateRoomCode();
    const roomRef = doc(db, 'nome_terra_rooms', code);
    
    const cats = NT_ALL_CATEGORIES[difficulty];
    
    let chosenLetter = manualLetter;
    if (letterMode === 'random') {
        chosenLetter = drawRandomLetter([]);
    }

    try {
        await setDoc(roomRef, {
            roomId: code,
            hostId: auth.currentUser.uid,
            hostName: gameState.playerName,
            status: 'waiting',
            difficulty: difficulty,
            letterMode: letterMode,
            letter: chosenLetter,
            usedLetters: [chosenLetter],
            reactions: [],
            categories: cats,
            players: [
                {
                    uid: auth.currentUser.uid,
                    name: gameState.playerName,
                    score: 0,
                    answers: {},
                    ready: true,
                    stopped: false,
                    isHost: true
                }
            ],
            stopTriggeredBy: null,
            createdAt: serverTimestamp()
        });
        showLoading(false);
        showNTWaitingRoom(code, 'host');
        if (ntRoomState) {
            ntRoomState.difficulty = difficulty;
            ntRoomState.letterMode = letterMode;
            ntRoomState.letter = chosenLetter;
        }
    } catch(e) {
        console.error('Error creating Nome Terra room:', e);
        showLoading(false);
        showCombo('Erro ao criar sala ❌');
    }
}

function showNTJoinRoom() {
    showModal({ icon:'📝', title:'Entrar no Nome Terra', centered: true,
        html: `<div class="vs-join-section">
            <p>Cole o código da sala Nome Terra do seu amigo:</p>
            <input type="text" id="nt-code-input" class="vs-code-input" placeholder="EX: ABC123" maxlength="6" style="text-transform:uppercase;">
        </div>`,
        actions:[
            {label:'⚔&nbsp; Entrar', class:'modal-btn-success', onClick: () => {
                const code = document.getElementById('nt-code-input')?.value.trim().toUpperCase();
                if (!code || code.length !== 6) { showCombo('Código inválido! ❌'); return; }
                hideModal(); joinNTRoom(code);
            }},
            {label:'Cancelar', class:'modal-btn-gray', onClick: hideModal}
        ]
    });
}

async function joinNTRoom(code) {
    if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
        showVSPaywall();
        return;
    }
    if (gameState.energy <= 0) {
        showOutOfEnergyModal();
        return;
    }
    showLoading(true, 'Entrando na sala Nome Terra...');
    const roomRef = doc(db, 'nome_terra_rooms', code);
    try {
        const snap = await getDoc(roomRef);
        if (!snap.exists()) { showLoading(false); showCombo('Sala não encontrada! ❌'); return; }
        const data = snap.data();
        if (data.status !== 'waiting') { showLoading(false); showCombo('Sala já em jogo! ❌'); return; }
        if (data.players.some(p => p.uid === auth.currentUser.uid)) { showLoading(false); showCombo('Você já está na sala! ❌'); return; }
        if (data.players.length >= 4) { showLoading(false); showCombo('Sala cheia! (Máx. 4 jogadores) ❌'); return; }
        
        const newPlayer = {
            uid: auth.currentUser.uid,
            name: gameState.playerName,
            score: 0,
            answers: {},
            ready: true,
            stopped: false,
            isHost: false
        };
        
        await updateDoc(roomRef, {
            players: [...data.players, newPlayer]
        });
        
        showLoading(false);
        showNTWaitingRoom(code, 'guest');
        if (ntRoomState) {
            ntRoomState.difficulty = data.difficulty;
            ntRoomState.letterMode = data.letterMode;
            ntRoomState.letter = data.letter;
        }
    } catch (e) {
        console.error('Error joining NT room:', e);
        showLoading(false);
        showCombo('Erro ao entrar na sala ❌');
    }
}

function showNTWaitingRoom(code, role) {
    ntRoomState = { code, role, isMultiplayer: true };
    if (ntUnsubscribe) ntUnsubscribe();
    
    showScreen('nt-waiting', (c) => {
        currentScreen = 'nt-waiting';
        hideQuizControls();
        c.innerHTML = `
            <div class="vs-waiting">
                <div class="vs-waiting-icon">⏳</div>
                <h2>Sala Nome Terra</h2>
                <div class="vs-code-display">
                    <span class="vs-code-label">Código da Sala:</span>
                    <div class="vs-code-big" id="nt-room-code">${code}</div>
                    <button class="vs-copy-btn" id="nt-copy-code"><i class="fas fa-copy"></i> Copiar Código</button>
                    <button class="vs-share-btn" id="nt-share-whatsapp" style="background:#25D366;color:white;border:none;padding:10px 24px;border-radius:25px;font-weight:700;cursor:pointer;margin-top:8px;margin-left:8px;font-family:'Quicksand',sans-serif;">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                </div>
                
                <div class="nt-lobby-section" style="margin-top: 15px;">
                    <h3>👥 Jogadores na Sala (<span id="nt-players-count">1</span>/4)</h3>
                    <ul id="nt-players-list" style="list-style: none; padding: 0;"></ul>
                </div>
                
                <div class="vs-waiting-anim"><div class="vs-dot"></div><div class="vs-dot"></div><div class="vs-dot"></div></div>
                
                <button class="nt-start-btn" id="nt-start-multi-btn" style="display:none; background: linear-gradient(135deg, #2ecc71, #27ae60); margin-top: 20px;">🚀 Iniciar Jogo</button>
                <button class="modal-btn-danger" id="nt-cancel-room" style="margin-top:20px;">✕ Sair da Sala</button>
            </div>
        `;
        
        document.getElementById('nt-copy-code').onclick = () => {
            navigator.clipboard?.writeText(code);
            showCombo('Código copiado! 📋');
        };
        
        document.getElementById('nt-share-whatsapp').onclick = () => {
            const diffLabels = { easy: 'Fácil (8)', normal: 'Normal (12)', hard: 'Difícil (20)' };
            const modeLabels = { random: '🎲 Roleta Aleatória', manual: '👤 Escolha Manual' };
            
            const diffStr = diffLabels[ntRoomState.difficulty] || ntRoomState.difficulty || 'Normal';
            const modeStr = modeLabels[ntRoomState.letterMode] || ntRoomState.letterMode || 'Aleatório';
            
            let configInfo = `\n\n⚙️ *Configurações da Sala:*`;
            configInfo += `\n- ⚡ Dificuldade: *${diffStr}*`;
            configInfo += `\n- 🎰 Sorteio: *${modeStr}*`;
            if (ntRoomState.letterMode === 'manual' && ntRoomState.letter) {
                configInfo += ` (Letra: *${ntRoomState.letter}*)`;
            }
            
            const msg = `📝 *QuizMoz — Nome Terra (Stop)*\n\nEntra na minha sala com o código:\n\n══ 🔑 *${code}* ══${configInfo}\n\nAbre o QuizMoz → Nome Terra → Entrar na Sala`;
            const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            if (window.Capacitor?.Plugins?.Browser) window.Capacitor.Plugins.Browser.open({ url });
            else window.open(url, '_blank');
        };
        
        document.getElementById('nt-cancel-room').onclick = () => { leaveNTRoom(); };
    });

    const roomRef = doc(db, 'nome_terra_rooms', code);
    ntUnsubscribe = onSnapshot(roomRef, (snap) => {
        if (!snap.exists()) { leaveNTRoom('Sala encerrada pelo Chefe 👑.'); return; }
        const d = snap.data();
        
        const letterChanged = ntRoomState && ntRoomState.letter && ntRoomState.letter !== d.letter;
        
        if (ntRoomState) {
            ntRoomState.difficulty = d.difficulty;
            ntRoomState.letterMode = d.letterMode;
            ntRoomState.letter = d.letter;
        }
        
        if (d.status === 'waiting' && currentScreen === 'nt-results') {
            if (gameState.energy <= 0) {
                showOutOfEnergyModal();
                leaveNTRoom();
                return;
            }
            const myRole = d.hostId === auth.currentUser.uid ? 'host' : 'guest';
            showNTWaitingRoom(code, myRole);
            return;
        }
        
        // Handle reaction updates in real-time
        if (d.reactions && Array.isArray(d.reactions) && ntRoomState) {
            if (!ntRoomState.processedReactionIds) {
                ntRoomState.processedReactionIds = new Set();
            }
            d.reactions.forEach(r => {
                if (r && r.id && !ntRoomState.processedReactionIds.has(r.id)) {
                    ntRoomState.processedReactionIds.add(r.id);
                    if (ntRoomState.lastProcessedReactionTime && r.timestamp > ntRoomState.lastProcessedReactionTime) {
                        if (r.emoji.startsWith('appeal:')) {
                            const parts = r.emoji.split(':');
                            const cat = parts[1];
                            const ans = parts[2];
                            const votesKey = `${r.uid}_${cat}`;
                            const existingVotes = d.votes ? (d.votes[votesKey] || {}) : {};
                            const alreadyVoted = existingVotes[auth.currentUser.uid] !== undefined;
                            if (!alreadyVoted) {
                                const senderName = d.players.find(p => p.uid === r.uid)?.name || 'Um jogador';
                                showAppealAlert(senderName, cat, ans, r.uid);
                            }
                        } else {
                            triggerReactionAnimation(r.uid, r.emoji);
                        }
                    }
                }
            });
        }
        
        if (ntRoomState) {
            ntRoomState.latestPlayers = d.players;
            ntRoomState.latestRoomData = d;
        }

        const listEl1 = document.getElementById('nt-answers-players-list-1');
        const listEl2 = document.getElementById('nt-answers-players-list-2');
        const renderStatusList = (el) => {
            if (el && d.players) {
                el.innerHTML = d.players.map(p => `
                    <li style="padding: 8px 10px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; font-weight: 700; color: var(--text); font-size: 0.9em;">
                        <span>👤 ${p.name} ${p.uid === d.hostId ? '👑' : ''}</span>
                        ${p.stopped ? '<span style="color:#2ecc71;">Pronto ✓</span>' : '<span style="color:#e67e22;font-style:italic;">A digitar... ⏳</span>'}
                    </li>
                `).join('');
            }
        };
        renderStatusList(listEl1);
        renderStatusList(listEl2);
        
        const countEl = document.getElementById('nt-players-count');
        const listEl = document.getElementById('nt-players-list');
        if (countEl) countEl.textContent = d.players.length;
        if (listEl) {
            listEl.innerHTML = d.players.map(p => {
                const wins = p.wins || 0;
                let trophyBadge = '';
                if (wins > 0) {
                    trophyBadge = `<span style="color:#f1c40f; margin-left: 8px;">${'🏆'.repeat(wins)}</span>`;
                }
                return `
                    <li class="nt-lobby-player-row" data-uid="${p.uid}" style="padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; font-weight: 700; color: var(--text); cursor: pointer; background: rgba(0,0,0,0.01); margin-bottom: 6px; border-radius: 10px; transition: background 0.2s;">
                        <span>👤 ${p.name} ${p.uid === d.hostId ? '👑 (Chefe)' : ''}${trophyBadge}</span>
                        <span style="color:#2ecc71;">Pronto ✓</span>
                    </li>
                `;
            }).join('');
            
            d.players.forEach(p => {
                const row = listEl.querySelector(`[data-uid="${p.uid}"]`);
                if (row) {
                    row.onclick = () => {
                        playSound('button');
                        showNTRoomPlayerProfile(p);
                    };
                }
            });
        }
        
        const startBtn = document.getElementById('nt-start-multi-btn');
        if (startBtn) {
            if (role === 'host') {
                startBtn.style.display = 'block';
                if (d.players.length >= 2) {
                    startBtn.disabled = false;
                    startBtn.style.opacity = '1';
                } else {
                    startBtn.disabled = true;
                    startBtn.style.opacity = '0.5';
                }
                startBtn.onclick = async () => {
                    playSound('button');
                    if (gameState.energy <= 0) {
                        showOutOfEnergyModal();
                        return;
                    }
                    if (!gameState.vsUnlocked) {
                        gameState.freeMatchesLeft = Math.max(0, (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) - 1);
                    }
                    gameState.energy--;
                    updateHUD();
                    saveState();
                    syncFirestore();
                    if (ntRoomState) {
                        ntRoomState.energyDeducted = true;
                    }
                    
                    await updateDoc(roomRef, { status: 'playing' });
                };
            } else {
                startBtn.style.display = 'none';
            }
        }
        
        if (d.status === 'playing') {
            if (ntRoomState && !ntRoomState.gameStarted) {
                ntRoomState.gameStarted = true;
                
                // Guest energy check & deduction
                if (role !== 'host') {
                    if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
                        showVSPaywall();
                        leaveNTRoom();
                        return;
                    }
                    if (gameState.energy <= 0) {
                        showOutOfEnergyModal();
                        leaveNTRoom();
                        return;
                    }
                    if (!gameState.vsUnlocked) {
                        gameState.freeMatchesLeft = Math.max(0, (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) - 1);
                    }
                    gameState.energy = Math.max(0, gameState.energy - 1);
                    updateHUD();
                    saveState();
                    syncFirestore();
                    ntRoomState.energyDeducted = true;
                }
                
                hideModal();
                ntRoomState.difficulty = d.difficulty;
                ntRoomState.letter = d.letter;
                ntRoomState.categories = d.categories;
                ntRoomState.answers = {};
                ntRoomState.rewardsApplied = false;
                ntRoomState.grading = false;
                ntRoomState.shownFinalResults = false;
                ntRoomState.gameplayActive = false; // reset gameplayActive flag
                
                if (d.letterMode === 'random') {
                    showNTRouletteScreen(code, d.letter);
                } else {
                    // Manual mode starts immediately
                    if (role === 'host') {
                        const roomRef = doc(db, 'nome_terra_rooms', code);
                        updateDoc(roomRef, { status: 'gameplay_active' });
                    }
                }
            }
            
            // If letter changed during waiting/playing state (redraw), re-run roulette
            if (letterChanged) {
                showNTRouletteScreen(code, d.letter);
            }
        }
        
        if (d.status === 'gameplay_active') {
            if (ntRoomState && !ntRoomState.gameplayActive) {
                ntRoomState.gameplayActive = true;
                startNTGameplay();
            }
        }
        
        if (d.status !== 'stopped') {
            ntRoomState.grading = false;
        }
        
        const myPlayer = d.players.find(p => p.uid === auth.currentUser.uid);
        
        if (d.status === 'stopped' && currentScreen === 'nt-game' && myPlayer && !myPlayer.stopped) {
            const stopTriggerUser = d.players.find(p => p.uid === d.stopTriggeredBy)?.name || 'Adversário';
            showCombo(`STOP! ${stopTriggerUser} parou o jogo! 🚨`);
            playSound('wrong');
            
            // Save current page inputs
            const fields = document.querySelectorAll('.nt-input-field');
            fields.forEach(field => {
                const cat = field.dataset.cat;
                ntRoomState.answers[cat] = field.value.trim();
            });

            // Ensure missing categories have at least an empty string
            ntRoomState.categories.forEach(cat => {
                if (ntRoomState.answers[cat] === undefined) {
                    ntRoomState.answers[cat] = '';
                }
            });

            const myAnswers = { ...ntRoomState.answers };
            
            submitNTMultiplayerAnswers(code, myAnswers);
        }
        
        if (role === 'host' && d.status === 'stopped' && d.players.every(p => p.stopped) && !ntRoomState.grading) {
            ntRoomState.grading = true;
            gradeMultiplayerRound(code, d.players, d.letter, d.categories);
        }
        
        if (d.status === 'finished') {
            if (ntRoomState && !ntRoomState.shownFinalResults) {
                ntRoomState.shownFinalResults = true;
                showNTMultiplayerFinalResults(d);
            } else {
                updateNTResultsScores(d);
            }
        }
    });
}

function showNTRouletteScreen(code, targetLetter) {
    showScreen('nt-game', (c) => {
        currentScreen = 'nt-game';
        hideQuizControls();
        document.getElementById('floating-controls').style.display = 'none';
        c.innerHTML = `
            <div class="nt-lobby" style="margin-top: 50px;">
                <div class="nt-lobby-icon" style="font-size: 5em;">🎲</div>
                <h2 class="nt-lobby-title">Sorteando Letra</h2>
                <div style="font-size: 6em; font-family: 'Righteous', cursive; margin: 30px 0; color: #d35400;" id="nt-anim-letter">A</div>
                <p style="color: var(--text-dim); font-weight: 600;">Sincronizando com a sala...</p>
            </div>
        `;
        
        const animEl = document.getElementById('nt-anim-letter');
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVZ';
        let counter = 0;
        const interval = setInterval(() => {
            animEl.textContent = letters[counter % letters.length];
            counter++;
            playSound('tick');
        }, 50);
        
        setTimeout(() => {
            clearInterval(interval);
            animEl.textContent = targetLetter;
            playSound('victory');
            spawnConfetti();
            
            setTimeout(() => {
                const isHost = (ntRoomState && ntRoomState.role === 'host');
                c.innerHTML = `
                    <div class="nt-lobby" style="margin-top: 50px;">
                        <div class="nt-lobby-icon" style="font-size: 5em;">🎲</div>
                        <h2 class="nt-lobby-title">Letra Sorteada</h2>
                        <div style="font-size: 6em; font-family: 'Righteous', cursive; margin: 20px 0; color: #d35400;">${targetLetter}</div>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; margin: 0 auto;">
                            ${isHost ? `
                                <button class="nt-start-btn" id="nt-btn-confirm-letter" style="background: linear-gradient(135deg, #2ecc71, #27ae60); margin: 0;">🚀 Começar Jogo</button>
                                <button class="nt-opt-btn" id="nt-btn-redraw-ad" style="margin: 0; padding: 12px; font-weight: 700; background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    🎰 Outra Letra (Anúncio 📺)
                                </button>
                                <button class="nt-opt-btn" id="nt-btn-redraw-coins" style="margin: 0; padding: 12px; font-weight: 700; background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    🪙 Outra Letra (20 Moedas)
                                </button>
                            ` : `
                                <p style="color: var(--text-dim); font-weight: 600; font-style: italic;">Aguardando o Chefe iniciar o jogo...</p>
                            `}
                        </div>
                    </div>
                `;
                
                if (isHost) {
                    document.getElementById('nt-btn-confirm-letter').onclick = async () => {
                        playSound('button');
                        const roomRef = doc(db, 'nome_terra_rooms', code);
                        await updateDoc(roomRef, { status: 'gameplay_active' });
                    };
                    
                    document.getElementById('nt-btn-redraw-ad').onclick = () => {
                        playSound('button');
                        showRewardedAd('redraw_letter');
                    };
                    
                    document.getElementById('nt-btn-redraw-coins').onclick = () => {
                        playSound('button');
                        if (gameState.coins < 20) {
                            showCombo('Moedas insuficientes! ❌');
                            return;
                        }
                        gameState.coins -= 20;
                        playSound('coin');
                        updateHUD();
                        saveState();
                        syncFirestore();
                        applyLetterRedraw();
                    };
                }
            }, 1000);
        }, 2000);
    });
}

async function submitNTMultiplayerAnswers(code, answers) {
    showLoading(true, 'Enviando respostas...');
    if (ntTimerInterval) { clearInterval(ntTimerInterval); ntTimerInterval = null; }
    
    try {
        const roomRef = doc(db, 'nome_terra_rooms', code);
        let roomPlayers = [];
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(roomRef);
            if (!sfDoc.exists()) {
                throw new Error("Room does not exist!");
            }
            const d = sfDoc.data();
            const updatedPlayers = d.players.map(p => {
                if (p.uid === auth.currentUser.uid) {
                    return {
                        ...p,
                        answers: answers,
                        stopped: true
                    };
                }
                return p;
            });
            roomPlayers = updatedPlayers;
            transaction.update(roomRef, { players: updatedPlayers });
        });
        
        showScreen('nt-game', (c) => {
            const isHost = ntRoomState.role === 'host';
            c.innerHTML = `
                <div class="nt-lobby" style="margin-top: 50px;">
                    <div class="vs-waiting-icon">⏳</div>
                    <h2 style="color:var(--text);font-family:'Comfortaa',cursive;">Respostas Enviadas!</h2>
                    <p style="color:var(--text-dim);font-weight:600;margin-top:10px;">Aguardando os outros jogadores finalizarem...</p>
                    <div class="vs-waiting-anim" style="margin-top:20px;"><div class="vs-dot"></div><div class="vs-dot"></div><div class="vs-dot"></div></div>
                    
                    <div class="nt-lobby-section" style="margin-top: 20px; width: 100%; max-width: 280px; margin-left: auto; margin-right: auto; text-align: left;">
                        <h3 style="font-size: 0.95em; color: var(--text); margin-bottom: 8px; font-weight: 700; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 4px;">👥 Status dos Jogadores:</h3>
                        <ul id="nt-answers-players-list-2" style="list-style: none; padding: 0; margin: 0;"></ul>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:30px; width:100%; max-width:260px; margin-left:auto; margin-right:auto;">
                        ${isHost ? `
                            <button class="nt-start-btn" id="nt-btn-answers-force-2" style="background: linear-gradient(135deg, #e67e22, #d35400); box-shadow: 0 4px 12px rgba(211,84,0,0.2); margin: 0; width: 100%;"><i class="fas fa-flag-checkered"></i> Forçar Fim de Jogo</button>
                        ` : ''}
                        <button class="disc-voltar-btn" id="nt-btn-answers-exit-2" style="margin: 0; width: 100%;"><i class="fas fa-home"></i> Sair da Partida</button>
                    </div>
                </div>
            `;
            if (isHost) {
                document.getElementById('nt-btn-answers-force-2').onclick = () => {
                    playSound('button');
                    const playersToGrade = ntRoomState.latestPlayers || roomPlayers;
                    gradeMultiplayerRound(ntRoomState.code, playersToGrade, ntRoomState.letter, ntRoomState.categories);
                };
            }
            document.getElementById('nt-btn-answers-exit-2').onclick = () => {
                playSound('button');
                leaveNTRoom();
            };
        });
        showLoading(false);
    } catch(e) {
        console.error('Error submitting NT multiplayer answers:', e);
        showLoading(false);
        showCombo('Erro ao enviar respostas ❌');
    }
}

async function gradeMultiplayerRound(code, players, letter, categories) {
    showLoading(true, 'Processando resultados...');
    
    let dictionary = null;
    try {
        const letterLower = letter.toLowerCase();
        const res = await fetch(`https://raw.githubusercontent.com/BrunoMatherry/quizmoz-data/main/Nome_Terra_ab/${letterLower}.json`);
        if (res.ok) {
            dictionary = await res.json();
        }
    } catch(e) {
        console.warn('GitHub dictionary load failed for multiplayer grading. Using fallback.');
    }
    
    const gradedPlayers = players.map(p => {
        return {
            ...p,
            score: 0,
            pointsDetail: {}
        };
    });
    
    categories.forEach(cat => {
        const categoryKey = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const answersByPlayer = players.map(p => ({
            uid: p.uid,
            raw: p.answers[cat] || '',
            normalized: normalizeNTText(p.answers[cat] || '')
        }));
        
        const correctStatus = {};
        const isPhonetic = {};
        answersByPlayer.forEach(ap => {
            if (ap.normalized === '') {
                correctStatus[ap.uid] = false;
                return;
            }
            
            let databaseValid = false;
            if (dictionary) {
                let dictCatKey = Object.keys(dictionary).find(k => k.toLowerCase() === categoryKey);
                if (!dictCatKey) {
                    dictCatKey = Object.keys(dictionary).find(k => categoryKey.includes(k.toLowerCase()) || k.toLowerCase().includes(categoryKey));
                }
                const catList = dictCatKey ? dictionary[dictCatKey] : [];
                const normalizedDict = catList.map(w => normalizeNTText(w));
                databaseValid = normalizedDict.includes(ap.normalized);
            } else {
                databaseValid = ap.normalized[0] === letter.toLowerCase();
            }
            
            if (databaseValid) {
                correctStatus[ap.uid] = true;
            } else {
                if (cat.toLowerCase() === 'nome') {
                    const nameScore = isValidNTName(ap.raw, letter);
                    if (nameScore > 0) {
                        correctStatus[ap.uid] = true;
                        isPhonetic[ap.uid] = nameScore;
                    } else {
                        correctStatus[ap.uid] = false;
                    }
                } else {
                    correctStatus[ap.uid] = false;
                }
            }
        });
        
        answersByPlayer.forEach(ap => {
            if (!correctStatus[ap.uid]) {
                const gp = gradedPlayers.find(p => p.uid === ap.uid);
                if (gp) gp.pointsDetail[cat] = 0;
                return;
            }
            
            const matches = answersByPlayer.filter(other => other.uid !== ap.uid && correctStatus[other.uid] && other.normalized === ap.normalized);
            
            let pts = 10;
            if (isPhonetic[ap.uid]) {
                const baseScore = isPhonetic[ap.uid];
                pts = (matches.length > 0) ? Math.max(1, Math.round(baseScore / 2)) : baseScore;
            } else {
                if (matches.length > 0) {
                    pts = 5;
                }
            }
            
            const gp = gradedPlayers.find(p => p.uid === ap.uid);
            if (gp) {
                gp.score += pts;
                gp.pointsDetail[cat] = pts;
            }
        });
    });
    
    try {
        let maxScore = -1;
        let winnerUid = null;
        gradedPlayers.forEach(p => {
            if (p.score > maxScore) {
                maxScore = p.score;
                winnerUid = p.uid;
            }
        });

        // Increment victories (wins) for the player(s) with the highest score in this round
        gradedPlayers.forEach(p => {
            if (p.score === maxScore && maxScore > 0) {
                p.wins = (p.wins || 0) + 1;
            } else {
                p.wins = p.wins || 0;
            }
        });

        const roomRef = doc(db, 'nome_terra_rooms', code);
        const updates = {
            players: gradedPlayers,
            status: 'finished'
        };
        if (winnerUid) {
            updates.hostId = winnerUid;
        }
        await updateDoc(roomRef, updates);
        showLoading(false);
    } catch(e) {
        console.error('Error grading multiplayer round:', e);
        showLoading(false);
        showCombo('Erro ao calcular resultados ❌');
    }
}

function showNTMultiplayerFinalResults(roomData) {
    if (ntTimerInterval) { clearInterval(ntTimerInterval); ntTimerInterval = null; }
    if (ntRoomState) {
        ntRoomState.lastProcessedReactionTime = Date.now();
        ntRoomState.energyDeducted = false;
    }
    
    let maxScore = -1;
    roomData.players.forEach(p => {
        if (p.score > maxScore) {
            maxScore = p.score;
        }
    });

    const winners = roomData.players.filter(p => p.score === maxScore);
    const isTie = winners.length > 1;
    const amIWinner = winners.some(w => w.uid === auth.currentUser.uid);
    const primaryWinner = winners[0];
    const iWon = amIWinner && !isTie;
    
    const myPlayerObj = roomData.players.find(p => p.uid === auth.currentUser.uid);
    let myCorrectCount = 0;
    const totalMultiCategories = roomData.categories.length;
    if (myPlayerObj && myPlayerObj.pointsDetail) {
        Object.values(myPlayerObj.pointsDetail).forEach(pts => {
            if (pts > 0) myCorrectCount++;
        });
    }
    
    let coinsEarned = 0;
    if (myCorrectCount === totalMultiCategories) {
        coinsEarned = 10;
    } else {
        const ratio = myCorrectCount / totalMultiCategories;
        if (ratio >= 0.5) {
            coinsEarned = 7;
        } else if (ratio >= 0.25) {
            coinsEarned = 5;
        } else if (myCorrectCount > 0) {
            coinsEarned = 4;
        } else {
            coinsEarned = 2; // Recompensa mínima de participação online
        }
    }
    
    const xpEarned = amIWinner ? 30 : 10;
    
    if (!ntRoomState.rewardsApplied) {
        ntRoomState.rewardsApplied = true;
        gameState.coins += coinsEarned;
        gameState.exp += xpEarned;
        if (amIWinner) {
            gameState.nomeTerraWins = (gameState.nomeTerraWins || 0) + 1;
        }
        saveState();
        syncFirestore();
    }
    
    playSound(amIWinner ? 'victory' : 'wrong');
    if (amIWinner) {
        spawnConfetti();
        spawnConfetti();
    }

    let resultTitle = '🥈 FIM DE JOGO';
    let resultDesc = `O vencedor e novo Chefe 👑 é <strong>${primaryWinner ? primaryWinner.name : 'Ninguém'}</strong> com <strong>${maxScore} pontos</strong>!`;
    if (isTie) {
        const winnerNames = winners.map(w => w.name).join(' e ');
        resultTitle = '🤝 EMPATE!';
        resultDesc = `Empate em 1º lugar entre <strong>${winnerNames}</strong> com <strong>${maxScore} pontos</strong>!<br>O novo Chefe 👑 é <strong>${primaryWinner ? primaryWinner.name : 'Ninguém'}</strong>.`;
    } else if (iWon) {
        resultTitle = '🎉 VITÓRIA!';
    }
    
    showScreen('nt-results', (c) => {
        currentScreen = 'nt-results';
        c.innerHTML = `
            <div class="nt-game" style="max-width:100%; height: auto; min-height: 100%; padding-bottom: 120px;">
                <div class="nt-results-title">🏆 Fim de Partida Nome Terra</div>
                
                <div class="vs-final-celebration">
                    <div class="vs-final-title">${resultTitle}</div>
                    <p class="vs-final-desc">${resultDesc}</p>
                </div>
                
                <div class="vs-final-scores-grid">
                    ${roomData.players.map((p, idx) => {
                        let pCorrectCount = 0;
                        if (p.pointsDetail) {
                            Object.values(p.pointsDetail).forEach(pts => {
                                if (pts > 0) pCorrectCount++;
                            });
                        }
                        let pCoins = 2;
                        if (pCorrectCount === totalMultiCategories) {
                            pCoins = 10;
                        } else {
                            const ratio = pCorrectCount / totalMultiCategories;
                            if (ratio >= 0.5) pCoins = 7;
                            else if (ratio >= 0.25) pCoins = 5;
                            else if (pCorrectCount > 0) pCoins = 4;
                        }
                        const isPlayerWinner = winners.some(w => w.uid === p.uid);
                        const pXP = isPlayerWinner ? 30 : 10;
                        const wins = p.wins || 0;
                        let trophies = '';
                        if (wins > 0) {
                            trophies = `<div style="color:#f1c40f; font-size: 1.1em; margin-top: 4px; display: flex; justify-content: center; gap: 2px;">${'🏆'.repeat(wins)}</div>`;
                        } else {
                            trophies = `<div style="color:var(--text-dim); font-size: 0.75em; margin-top: 4px; font-style: italic;">Sem vitórias</div>`;
                        }
                        
                        return `
                            <div class="vs-final-player ${isPlayerWinner ? 'winner' : ''}" id="nt-result-card-${p.uid}" style="padding: 10px 5px; position: relative; overflow: visible; cursor: pointer;">
                                <div class="vs-final-avatar">${isPlayerWinner ? '🏆' : '👤'}</div>
                                <div class="vs-final-pname" style="font-size: 0.9em; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</div>
                                <div class="vs-final-pscore" id="nt-p-ticker-${p.uid}">0</div>
                                <div class="vs-final-rounds" style="font-size: 0.75em; color: var(--text-dim);">pontos</div>
                                ${trophies}
                                <div style="margin-top: 6px; font-size: 0.75em; font-weight: 800; color: #2ecc71; background: rgba(46,204,113,0.1); padding: 2px 4px; border-radius: 6px; display: inline-block;">
                                    🪙 +${pCoins} | ⭐ +${pXP}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="reaction-bar-container" style="margin: 15px auto; text-align: center; max-width: 320px; width: 100%;">
                    <div style="font-size: 0.8em; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Reagir:</div>
                    <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; background: rgba(0,0,0,0.03); padding: 8px; border-radius: 12px; box-sizing: border-box;" id="nt-reaction-bar-buttons"></div>
                </div>

                <div style="margin: 20px 0; text-align: center;">
                    <button class="nt-start-btn" id="nt-btn-show-papers" style="background: linear-gradient(135deg, #3498db, #2980b9); box-shadow: 0 4px 14px rgba(52,152,219,0.3); font-weight: 800;"><i class="fas fa-file-signature"></i> Ver Caderno de Respostas</button>
                </div>

                <button class="nt-start-btn" id="nt-btn-lobby-rematch">🔄 Jogar Novamente</button>
                <button class="disc-voltar-btn" id="nt-btn-lobby-exit" style="margin-top:10px;"><i class="fas fa-home"></i> Sair para Menu</button>
            </div>
        `;
        
        document.getElementById('nt-btn-show-papers').onclick = () => {
            playSound('button');
            ntTempVotes = {}; // Reset temp votes
            const currentData = (ntRoomState && ntRoomState.latestRoomData) ? ntRoomState.latestRoomData : roomData;
            showNTPapersModal(currentData);
        };

        document.getElementById('nt-btn-lobby-rematch').onclick = async () => {
            playSound('button');
            await showInterstitialAd();
            const currentIsHost = (roomData.hostId === auth.currentUser.uid);
            if (currentIsHost) {
                if (!gameState.vsUnlocked && (gameState.freeMatchesLeft === undefined ? 3 : gameState.freeMatchesLeft) <= 0) {
                    showVSPaywall();
                    return;
                }
                if (gameState.energy <= 0) {
                    showOutOfEnergyModal();
                    return;
                }
                resetNTRoomForRematch(ntRoomState.code);
            } else {
                showCombo('Apenas o Chefe 👑 pode reiniciar a partida!');
            }
        };

        document.getElementById('nt-btn-lobby-exit').onclick = () => {
            playSound('button');
            leaveNTRoom();
        };

        // Start tickers and coin flying
        setTimeout(() => {
            roomData.players.forEach((p) => {
                animatePointsTicker(`nt-p-ticker-${p.uid}`, p.score);
                
                const card = document.getElementById(`nt-result-card-${p.uid}`);
                if (card) {
                    card.onclick = () => {
                        playSound('button');
                        showNTRoomPlayerProfile(p);
                    };
                }
            });
            
            const reactionBtnContainer = document.getElementById('nt-reaction-bar-buttons');
            if (reactionBtnContainer) {
                const emojis = ['👑', '🖕', '😎', '🤪', '🤬', '🤡', '💩', '💀', '🥶', '😴'];
                emojis.forEach(emoji => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.style.cssText = 'background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 6px 10px; font-size: 1.4em; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); outline: none; margin: 2px;';
                    btn.innerText = emoji;
                    btn.addEventListener('click', () => sendReaction(emoji));
                    btn.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        sendReaction(emoji);
                    });
                    reactionBtnContainer.appendChild(btn);
                });
                
                const parent = reactionBtnContainer.parentElement;
                if (parent) {
                    const chatContainer = document.createElement('div');
                    chatContainer.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 10px; width: 100%;';
                    chatContainer.innerHTML = `
                        <input type="text" id="nt-chat-input" maxlength="15" placeholder="Mensagem (máx 15)..." style="flex: 1; max-width: 200px; padding: 6px 12px; border: 1px solid rgba(0,0,0,0.15); border-radius: 20px; font-size: 0.85em; font-family: 'Quicksand', sans-serif; outline: none; background: white;" />
                        <button id="nt-btn-send-chat" style="background: var(--primary); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; outline: none; transition: transform 0.2s;"><i class="fas fa-paper-plane" style="font-size: 0.8em;"></i></button>
                    `;
                    parent.appendChild(chatContainer);
                    
                    const sendBtn = chatContainer.querySelector('#nt-btn-send-chat');
                    const chatInput = chatContainer.querySelector('#nt-chat-input');
                    
                    const onSend = () => {
                        const val = chatInput.value.trim();
                        if (val) {
                            sendReaction(val);
                            chatInput.value = '';
                        }
                    };
                    
                    sendBtn.onclick = onSend;
                    chatInput.onkeydown = (e) => {
                        if (e.key === 'Enter') {
                            onSend();
                        }
                    };
                }
            }

            setTimeout(() => {
                spawnCoinFlyEffect(coinsEarned, gameState.coins);
            }, 1300);
        }, 200);
    });
}

function showNTRoomPlayerProfile(player) {
    const wins = player.wins || 0;
    let trophiesHtml = '';
    for (let i = 0; i < wins; i++) {
        trophiesHtml += '<span style="font-size: 2.2em; margin: 0 4px; filter: drop-shadow(0 2px 4px rgba(243,156,18,0.3)); animation: popIn 0.3s ease;">🏆</span>';
    }
    if (wins === 0) {
        trophiesHtml = '<div style="color:var(--text-dim);font-style:italic;">Nenhuma vitória nesta partida ainda.</div>';
    }
    
    showModal({
        circleIcon: '👤',
        circleType: 'info',
        title: `Perfil: ${player.name}`,
        centered: true,
        html: `
            <div style="text-align:center; padding: 10px 0;">
                <div style="font-size: 1.1em; font-weight: 700; margin-bottom: 12px; color:var(--text);">Vitórias nesta partida:</div>
                <div style="display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:8px; min-height: 50px;">
                    ${trophiesHtml}
                </div>
                <div style="font-size: 0.85em; color:var(--text-dim); margin-top: 15px;">
                    Sala: <strong>${ntRoomState?.code || ''}</strong> • ${wins} ${wins === 1 ? 'vitória' : 'vitórias'}
                </div>
            </div>
        `,
        actions: [{label: 'Fechar', class: 'modal-btn-primary', onClick: hideModal}]
    });
}

function updateNTResultsScores(d) {
    if (currentScreen !== 'nt-results' || !d.players) return;
    
    // Find winners
    let maxScore = -1;
    d.players.forEach(p => {
        if (p.score > maxScore) maxScore = p.score;
    });
    const winners = d.players.filter(p => p.score === maxScore);
    const isTie = winners.length > 1;
    const amIWinner = winners.some(w => w.uid === auth.currentUser.uid);
    const primaryWinner = winners[0];
    const iWon = amIWinner && !isTie;
    
    let resultTitle = '🥈 FIM DE JOGO';
    let resultDesc = `O vencedor e novo Chefe 👑 é <strong>${primaryWinner ? primaryWinner.name : 'Ninguém'}</strong> com <strong>${maxScore} pontos</strong>!`;
    if (isTie) {
        const winnerNames = winners.map(w => w.name).join(' e ');
        resultTitle = '🤝 EMPATE!';
        resultDesc = `Empate em 1º lugar entre <strong>${winnerNames}</strong> com <strong>${maxScore} pontos</strong>!<br>O novo Chefe 👑 é <strong>${primaryWinner ? primaryWinner.name : 'Ninguém'}</strong>.`;
    } else if (iWon) {
        resultTitle = '🎉 VITÓRIA!';
    }
    
    // Update celebration details if DOM elements exist
    const finalTitleEl = document.querySelector('.vs-final-title');
    const finalDescEl = document.querySelector('.vs-final-desc');
    if (finalTitleEl) finalTitleEl.textContent = resultTitle;
    if (finalDescEl) finalDescEl.innerHTML = resultDesc;
    
    // Update each player card score and visual status
    d.players.forEach((p) => {
        const scoreEl = document.getElementById(`nt-p-ticker-${p.uid}`);
        if (scoreEl) {
            const currentScoreVal = parseInt(scoreEl.textContent) || 0;
            if (currentScoreVal !== p.score) {
                animatePointsTicker(`nt-p-ticker-${p.uid}`, p.score);
            }
        }
        
        const cardEl = document.getElementById(`nt-result-card-${p.uid}`);
        if (cardEl) {
            const isPlayerWinner = winners.some(w => w.uid === p.uid);
            if (isPlayerWinner) {
                cardEl.classList.add('winner');
                const avatarEl = cardEl.querySelector('.vs-final-avatar');
                if (avatarEl) avatarEl.textContent = '🏆';
            } else {
                cardEl.classList.remove('winner');
                const avatarEl = cardEl.querySelector('.vs-final-avatar');
                if (avatarEl) avatarEl.textContent = '👤';
            }
        }
    });
    
    // Re-sort DOM elements in vs-final-scores-grid by score
    const gridEl = document.querySelector('.vs-final-scores-grid');
    if (gridEl) {
        const cards = Array.from(gridEl.children);
        cards.sort((a, b) => {
            const aUid = a.id.replace('nt-result-card-', '');
            const bUid = b.id.replace('nt-result-card-', '');
            const aPlayer = d.players.find(p => p.uid === aUid);
            const bPlayer = d.players.find(p => p.uid === bUid);
            const aScore = aPlayer ? (aPlayer.score || 0) : 0;
            const bScore = bPlayer ? (bPlayer.score || 0) : 0;
            return bScore - aScore;
        });
        gridEl.innerHTML = '';
        cards.forEach(card => gridEl.appendChild(card));
    }
}

function showNTPapersModal(roomData) {
    const headerHtml = roomData.players.map(p => `
        <th id="nt-paper-header-${p.uid}" style="text-align: center; min-width: 100px; padding: 10px; color: var(--text); font-weight: 800; position: relative; overflow: visible;">👤 ${p.name}</th>
    `).join('');
    
    let rowsHtml = '';
    roomData.categories.forEach(cat => {
        let playerCols = roomData.players.map(p => {
            const ans = p.answers[cat] || '---';
            const pts = p.pointsDetail ? (p.pointsDetail[cat] || 0) : 0;
            let valColor = '#e74c3c'; // vermelho
            let badge = '✕ 0 pts';
            
            if (pts === 10) { valColor = '#2ecc71'; badge = '✓ 10 pts'; }
            else if (pts === 5) { valColor = '#f39c12'; badge = '🤝 5 pts'; }
            else if (pts > 0) { valColor = '#2ecc71'; badge = `✓ ${pts} pts`; }
            
            let extraHtml = '';
            let cellAttrs = '';
            
            if (pts === 0 && ans !== '---') {
                const votesKey = `${p.uid}_${cat}`;
                const existingVotes = roomData.votes ? (roomData.votes[votesKey] || {}) : {};
                const votersCount = Object.keys(existingVotes).length;
                
                if (p.uid === auth.currentUser.uid) {
                    if (votersCount > 0) {
                        extraHtml = `<div style="font-size: 0.75em; color: var(--primary); margin-top: 4px; font-weight: 700;">🗳️ ${votersCount} votos</div>`;
                    } else {
                        extraHtml = `<button class="nt-appeal-btn" onclick="claimAppeal('${cat}', '${ans}')" style="background: var(--primary); color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 0.7em; font-weight: 700; margin-top: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-bullhorn" style="font-size:0.8em;"></i> Reivindicar</button>`;
                    }
                } else {
                    const myVote = existingVotes[auth.currentUser.uid];
                    const myTempVote = ntTempVotes[votesKey];
                    
                    if (myVote !== undefined) {
                        extraHtml = `<div style="font-size: 0.7em; color: #2ecc71; margin-top: 4px; font-weight: 700;">Votaste: +${myVote} pts</div>`;
                    } else if (myTempVote !== undefined) {
                        extraHtml = `<div style="font-size: 0.7em; color: #e67e22; margin-top: 4px; font-weight: 700;">Selecionado: +${myTempVote} pts ✅</div>`;
                        cellAttrs = `onclick="openVotePopup('${p.uid}', '${p.name}', '${cat}', '${ans}')" style="cursor: pointer; background: rgba(230,126,34,0.05);"`;
                    } else {
                        extraHtml = `<div style="font-size: 0.7em; color: var(--primary); margin-top: 4px; font-weight: 700; text-decoration: underline;">🗳️ Clica para votar</div>`;
                        cellAttrs = `onclick="openVotePopup('${p.uid}', '${p.name}', '${cat}', '${ans}')" style="cursor: pointer; background: rgba(0,0,0,0.02);"`;
                    }
                }
            }
            
            return `
                <td ${cellAttrs} style="text-align: center; padding: 10px; vertical-align: middle; border-bottom: 1px solid rgba(0,0,0,0.05); ${pts === 0 && ans !== '---' && p.uid !== auth.currentUser.uid ? 'cursor: pointer;' : ''}">
                    <div style="font-family: 'Architects Daughter', cursive; font-size: 1.15em; color: ${valColor}; font-weight: 700; word-break: break-word;">${ans}</div>
                    <div style="font-size: 0.75em; color: var(--text-dim); margin-top: 3px; font-weight: 600;">${badge}</div>
                    ${extraHtml}
                </td>
            `;
        }).join('');
        
        rowsHtml += `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="font-weight: 800; text-transform: uppercase; font-size: 0.8em; color: var(--text-dim); padding: 10px; vertical-align: middle; background: rgba(0,0,0,0.01); width: 110px;">${cat}</td>
                ${playerCols}
            </tr>
        `;
    });
    
    const tableHtml = `
        <div class="reaction-bar-container" style="margin: 5px auto 15px auto; text-align: center; max-width: 320px; width: 100%;">
            <div style="font-size: 0.8em; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Reagir no Caderno:</div>
            <div style="display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; background: rgba(0,0,0,0.03); padding: 6px; border-radius: 12px; box-sizing: border-box;" id="paper-reaction-bar-buttons"></div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 6px; width: 100%;">
                <input type="text" id="paper-chat-input" maxlength="15" placeholder="Mensagem (máx 15)..." style="flex: 1; max-width: 200px; padding: 4px 10px; border: 1px solid rgba(0,0,0,0.15); border-radius: 20px; font-size: 0.8em; font-family: 'Quicksand', sans-serif; outline: none; background: white;" />
                <button id="paper-btn-send-chat" style="background: var(--primary); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; outline: none; transition: transform 0.2s;"><i class="fas fa-paper-plane" style="font-size: 0.7em;"></i></button>
            </div>
        </div>
        <div class="nt-results-table-wrap" style="max-height: 380px; overflow-y: auto; overflow-x: auto; width: 100%; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); background: var(--card-bg); margin-top: 10px; box-sizing: border-box;">
            <table class="nt-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85em;">
                <thead>
                    <tr style="background: rgba(0,0,0,0.03); border-bottom: 2px solid rgba(0,0,0,0.08);">
                        <th style="min-width: 110px; padding: 10px; color: var(--text-dim); font-weight: 800;">Categoria</th>
                        ${headerHtml}
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
    
    showModal({
        circleIcon: '<i class="fas fa-user-circle"></i>',
        circleType: 'info',
        title: 'Caderno de Respostas',
        centered: true,
        html: tableHtml,
        actions: [
            {
                label: '🗳️ Votar',
                class: 'modal-btn-success',
                id: 'nt-btn-confirm-all-votes',
                onClick: async () => {
                    const btn = document.getElementById('nt-btn-confirm-all-votes');
                    if (btn) {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                        btn.innerText = 'A processar...';
                    }
                    
                    hideModal();
                    if (Object.keys(ntTempVotes).length > 0) {
                        showLoading(true, 'A submeter votos...');
                        await submitAllTempVotes();
                        showLoading(false);
                    }
                }
            }
        ]
    });
    
    // Bind paper reaction buttons and input
    setTimeout(() => {
        const btnContainer = document.getElementById('paper-reaction-bar-buttons');
        if (btnContainer) {
            const emojis = ['👑', '🖕', '😎', '🤪', '🤬', '🤡', '💩', '💀', '🥶', '😴'];
            emojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.style.cssText = 'background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 4px 8px; font-size: 1.2em; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.2s; outline: none; margin: 2px;';
                btn.innerText = emoji;
                btn.addEventListener('click', () => sendReaction(emoji));
                btnContainer.appendChild(btn);
            });
            
            const sendBtn = document.getElementById('paper-btn-send-chat');
            const chatInput = document.getElementById('paper-chat-input');
            if (sendBtn && chatInput) {
                const onSend = () => {
                    const val = chatInput.value.trim();
                    if (val) {
                        sendReaction(val);
                        chatInput.value = '';
                    }
                };
                sendBtn.onclick = onSend;
                chatInput.onkeydown = (e) => {
                    if (e.key === 'Enter') onSend();
                };
            }
        }
    }, 100);
}

async function claimAppeal(cat, ans) {
    playSound('click');
    const code = ntRoomState.code;
    const roomRef = doc(db, 'nome_terra_rooms', code);
    try {
        const reactionObj = {
            id: Math.random().toString(36).substring(2, 9),
            uid: auth.currentUser.uid,
            emoji: `appeal:${cat}:${ans}`,
            timestamp: Date.now()
        };
        await updateDoc(roomRef, {
            reactions: arrayUnion(reactionObj)
        });
        showCombo('Apelo enviado aos adversários! 📣');
        reopenPapersModal();
    } catch(e) {
        console.warn(e);
    }
}

async function submitAllTempVotes() {
    if (!ntRoomState || !ntRoomState.code || Object.keys(ntTempVotes).length === 0) return;
    const roomRef = doc(db, 'nome_terra_rooms', ntRoomState.code);
    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(roomRef);
            if (!sfDoc.exists()) return;
            const d = sfDoc.data();
            
            const votes = d.votes || {};
            
            // Apply all temporary votes
            for (const [key, points] of Object.entries(ntTempVotes)) {
                if (!votes[key]) votes[key] = {};
                votes[key][auth.currentUser.uid] = points;
            }
            
            const updatedPlayers = d.players.map(p => {
                const newDetail = { ...(p.pointsDetail || {}) };
                
                d.categories.forEach(cat => {
                    const key = `${p.uid}_${cat}`;
                    if (votes[key]) {
                        let sum = 0;
                        let count = 0;
                        for (let voter in votes[key]) {
                            if (voter !== p.uid) {
                                sum += votes[key][voter];
                                count++;
                            }
                        }
                        if (count > 0) {
                            newDetail[cat] = Math.round(sum / count);
                        }
                    }
                });
                
                // Sum overall score
                let totalScore = 0;
                d.categories.forEach(cat => {
                    totalScore += newDetail[cat] || 0;
                });
                
                return {
                    ...p,
                    pointsDetail: newDetail,
                    score: totalScore
                };
            });
            
            transaction.update(roomRef, {
                votes: votes,
                players: updatedPlayers
            });
        });
        
        // Reset temp votes after successfully committing
        ntTempVotes = {};
    } catch (e) {
        console.error('Error submitting all votes:', e);
        showCombo('Erro ao registar os votos! ❌');
    }
}

function openVotePopup(playerUid, playerName, category, answer) {
    playSound('click');
    const votesKey = `${playerUid}_${category}`;
    const currentTempVote = ntTempVotes[votesKey];
    
    const modalHtml = `
        <div style="text-align: left; margin-bottom: 15px;">
            <p style="margin-bottom: 12px; color: var(--text);">Votar na resposta <strong>"${answer}"</strong> de <strong>${playerName}</strong> para a categoria <strong>"${category}"</strong>.</p>
            <p style="font-weight: 700; font-size: 0.9em; margin-bottom: 8px; color: var(--text-dim);">Como você avalia esta resposta?</p>
            
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 10px; background: var(--card-bg); border: 1px solid rgba(0,0,0,0.1); padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 600;">
                    <input type="radio" name="nt-vote-option" value="1" ${(currentTempVote === 1 || currentTempVote === undefined) ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
                    <span>👍 +1 Ponto</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; background: var(--card-bg); border: 1px solid rgba(0,0,0,0.1); padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 600;">
                    <input type="radio" name="nt-vote-option" value="3" ${currentTempVote === 3 ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
                    <span>🌟 +3 Pontos</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; background: var(--card-bg); border: 1px solid rgba(0,0,0,0.1); padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 600;">
                    <input type="radio" name="nt-vote-option" value="5" ${currentTempVote === 5 ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
                    <span>🏆 +5 Pontos</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; background: var(--card-bg); border: 1px solid rgba(0,0,0,0.1); padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 600;">
                    <input type="radio" name="nt-vote-option" value="0" ${currentTempVote === 0 ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
                    <span>❌ Rejeitar</span>
                </label>
            </div>
        </div>
    `;
    
    showModal({
        circleIcon: '<i class="fas fa-vote-yea"></i>',
        circleType: 'info',
        title: 'Votação de Resposta',
        centered: true,
        html: modalHtml,
        actions: [
            {
                label: 'Confirmar ✅',
                class: 'modal-btn-success',
                onClick: () => {
                    const selectedOpt = document.querySelector('input[name="nt-vote-option"]:checked');
                    const points = selectedOpt ? parseInt(selectedOpt.value) : 0;
                    ntTempVotes[votesKey] = points;
                    reopenPapersModal();
                }
            },
            {
                label: 'Voltar',
                class: 'modal-btn-gray',
                onClick: () => reopenPapersModal()
            }
        ]
    });
}

async function submitVoteAndRefresh(playerUid, category, points) {
    hideModal();
    showLoading(true, 'Registando voto...');
    await castVote(playerUid, category, points);
    showLoading(false);
    reopenPapersModal();
}

async function reopenPapersModal() {
    hideModal();
    const code = ntRoomState.code;
    const roomRef = doc(db, 'nome_terra_rooms', code);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
        showNTPapersModal(snap.data());
    }
}

function showAppealAlert(senderName, cat, ans, senderUid) {
    if (senderUid === auth.currentUser.uid) return;
    playSound('victory');
    openVotePopup(senderUid, senderName, cat, ans);
}

window.claimAppeal = claimAppeal;
window.openVotePopup = openVotePopup;

async function resetNTRoomForRematch(code) {
    showLoading(true, 'Reiniciando partida...');
    const roomRef = doc(db, 'nome_terra_rooms', code);
    try {
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
            const d = snap.data();
            const resetPlayers = d.players.map(p => ({
                ...p,
                score: 0,
                answers: {},
                stopped: false,
                pointsDetail: {}
            }));
            
            const used = d.usedLetters || [];
            let chosenLetter = d.letter;
            if (d.letterMode === 'random') {
                chosenLetter = drawRandomLetter(used);
            }
            
            const updatedUsedLetters = [...used];
            if (!updatedUsedLetters.includes(chosenLetter)) {
                updatedUsedLetters.push(chosenLetter);
            }
            
            await updateDoc(roomRef, {
                status: 'waiting',
                letter: chosenLetter,
                usedLetters: updatedUsedLetters,
                players: resetPlayers,
                stopTriggeredBy: null,
                rewardsApplied: false,
                reactions: []
            });
        }
        showLoading(false);
    } catch(e) {
        console.error('Error resetting NT room:', e);
        showLoading(false);
        showCombo('Erro ao reiniciar sala ❌');
    }
}

async function sendReaction(emoji) {
    playSound('click');
    const isNT = !!ntRoomState;
    const code = isNT ? ntRoomState.code : (vsState ? vsState.code : null);
    if (!code) return;
    
    const dbPath = isNT ? 'nome_terra_rooms' : 'vs_rooms';
    const roomRef = doc(db, dbPath, code);
    try {
        const reactionObj = {
            id: Math.random().toString(36).substring(2, 9),
            uid: auth.currentUser.uid,
            emoji: emoji,
            timestamp: Date.now()
        };
        await updateDoc(roomRef, {
            reactions: arrayUnion(reactionObj)
        });
    } catch(e) {
        console.warn('Failed to send reaction:', e);
    }
}

function triggerReactionAnimation(uid, emoji) {
    let card = document.getElementById(`nt-paper-header-${uid}`);
    let isPaperHeader = false;
    if (card) {
        isPaperHeader = true;
    } else {
        card = document.getElementById(`nt-result-card-${uid}`);
    }
    if (!card) {
        card = document.getElementById(`vs-result-card-${uid}`);
    }
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const isText = (emoji.length > 3);
    
    if (isText) {
        const oldBubble = document.querySelector(`.chat-bubble-user-${uid}`);
        if (oldBubble) oldBubble.remove();
        
        const bubble = document.createElement('div');
        bubble.className = `chat-speech-bubble chat-bubble-user-${uid}`;
        bubble.textContent = emoji;
        
        if (isPaperHeader) {
            bubble.style.position = 'fixed';
            bubble.style.bottom = 'auto';
            bubble.style.top = `${rect.top - 15}px`;
            bubble.style.left = `${rect.left + rect.width / 2}px`;
            bubble.style.transform = 'translate(-50%, -100%)';
            bubble.style.zIndex = '12000';
            document.body.appendChild(bubble);
        } else {
            card.appendChild(bubble);
        }
        playSound('click');
        
        setTimeout(() => {
            bubble.classList.add('fade-out');
            setTimeout(() => {
                bubble.remove();
            }, 400);
        }, 4000);
    } else {
        const el = document.createElement('div');
        el.className = 'flying-reaction';
        el.textContent = emoji;
        
        // TikTok-style random sways and scales
        const randomOffset = (Math.random() - 0.5) * 50; // -25px to +25px start position
        const randomSway = (Math.random() - 0.5) * 70;   // -35px to +35px sway
        const randomRotate = (Math.random() - 0.5) * 50; // -25deg to +25deg rotation
        const randomHeight = 120 + Math.random() * 80;   // 120px to 200px height
        
        el.style.setProperty('--start-x', `${randomOffset}px`);
        el.style.setProperty('--sway-x', `${randomOffset + randomSway}px`);
        el.style.setProperty('--target-y', `${-randomHeight}px`);
        el.style.setProperty('--rotate-deg', `${randomRotate}deg`);
        
        if (isPaperHeader) {
            el.style.position = 'fixed';
            el.style.top = `${rect.top}px`;
            el.style.left = `${rect.left + rect.width / 2}px`;
            el.style.zIndex = '12000';
            document.body.appendChild(el);
        } else {
            card.appendChild(el);
        }
        playSound('click');
        
        setTimeout(() => {
            el.remove();
        }, 1700);
    }
}

async function leaveNTRoom(msg) {
    if (ntUnsubscribe) { ntUnsubscribe(); ntUnsubscribe = null; }
    if (ntTimerInterval) { clearInterval(ntTimerInterval); ntTimerInterval = null; }
    
    if (ntRoomState?.isMultiplayer && ntRoomState?.code) {
        try {
            const roomRef = doc(db, 'nome_terra_rooms', ntRoomState.code);
            const snap = await getDoc(roomRef);
            if (snap.exists()) {
                const d = snap.data();
                if (d.players.length <= 1) {
                    await deleteDoc(roomRef);
                } else {
                    const remainingPlayers = d.players.filter(p => p.uid !== auth.currentUser.uid);
                    await updateDoc(roomRef, {
                        players: remainingPlayers
                    });
                }
            }
        } catch(e) { console.warn('Leave NT room error:', e); }
    }
    
    ntRoomState = null;
    if (msg) showCombo(msg);
    openNomeTerraLobby();
}

// ===== MASCOT AND PAUSE UPDATES =====
let mascotBubbleTimeout = null;

const MASCOT_PHRASES = {
    question: [
        "Você não vai errar isso, ${nome}!",
        "Essa é fácil, não seja 🐴😅",
        "Vê um anúncio, mas não erra essa 🙏",
        "Mano ${nome}, não dorme na linha! Foca! 🇲🇿",
        "Presta atenção ${nome}, não deves dar maningue falhar!",
        "Esta pergunta é maningue fácil, mano!",
        "Se errares esta, vais me pagar um baji! 😋",
        "Eish, ${nome}, vais mesmo vacilar com esta? 🧐"
    ],
    correct: [
        "Isso mesmo, mano! 🥳",
        "Génio absoluto, ${nome}! 🔥",
        "Sabes muito, mazza! 😎",
        "Assim sim! Deu orgulho! 🇲🇿",
        "Aí sim, ${nome}! Estás afiado! 🤪"
    ],
    wrong: [
        "Eish, mano... 😢",
        "A sério, ${nome}? 😞",
        "Que azar, dormiste na linha! 😭",
        "Vais pagar o baji! 😋",
        "Eish, essa doeu... 🤕"
    ],
    timeout: [
        "O tempo fugiu, mano! ⏰",
        "Dormiste na linha! 😴",
        "Eish, tempo esgotado! 🥶"
    ]
};

function showMascot() {
    const mascot = document.getElementById('mascot-container');
    if (mascot) {
        mascot.style.display = 'flex';
        mascot.className = 'mascot-container mascot-right';
        const emojiEl = document.getElementById('mascot-emoji');
        if (emojiEl) emojiEl.textContent = '🧐';
        const bubble = document.getElementById('mascot-bubble');
        if (bubble) bubble.classList.remove('pop');
    }
}

function hideMascot() {
    const mascot = document.getElementById('mascot-container');
    if (mascot) {
        mascot.style.display = 'none';
    }
    if (mascotBubbleTimeout) {
        clearTimeout(mascotBubbleTimeout);
        mascotBubbleTimeout = null;
    }
}

function mascotTrigger(event) {
    const mascot = document.getElementById('mascot-container');
    if (!mascot || mascot.style.display === 'none') return;

    const emojiEl = document.getElementById('mascot-emoji');
    const bubbleEl = document.getElementById('mascot-bubble');
    const bubbleTextEl = document.getElementById('mascot-bubble-text');

    if (!emojiEl || !bubbleEl || !bubbleTextEl) return;

    if (mascotBubbleTimeout) {
        clearTimeout(mascotBubbleTimeout);
        mascotBubbleTimeout = null;
    }

    let emoji = '🧐';
    let text = '';
    const name = gameState.playerName || 'Jogador';

    switch (event) {
        case 'question':
            if (Math.random() < 0.6) {
                emoji = Math.random() < 0.5 ? '🧐' : '🤔';
                const list = MASCOT_PHRASES.question;
                text = list[Math.floor(Math.random() * list.length)].replace(/\$\{nome\}/g, name);
            }
            break;
        case 'correct':
            const happyEmojis = ['🥳', '😎', '🤪', '🥰', '🙌'];
            emoji = happyEmojis[Math.floor(Math.random() * happyEmojis.length)];
            const listC = MASCOT_PHRASES.correct;
            text = listC[Math.floor(Math.random() * listC.length)].replace(/\$\{nome\}/g, name);
            break;
        case 'wrong':
            const sadEmojis = ['😢', '😞', '😭', '🥶', '🤕'];
            emoji = sadEmojis[Math.floor(Math.random() * sadEmojis.length)];
            const listW = MASCOT_PHRASES.wrong;
            text = listW[Math.floor(Math.random() * listW.length)].replace(/\$\{nome\}/g, name);
            break;
        case 'timeout':
            const timeoutEmojis = ['😴', '🥶', '🤕'];
            emoji = timeoutEmojis[Math.floor(Math.random() * timeoutEmojis.length)];
            const listT = MASCOT_PHRASES.timeout;
            text = listT[Math.floor(Math.random() * listT.length)].replace(/\$\{nome\}/g, name);
            break;
    }

    if (emoji) {
        emojiEl.textContent = emoji;
    }

    if (text) {
        bubbleTextEl.innerHTML = text;
        bubbleEl.classList.add('pop');
        mascotBubbleTimeout = setTimeout(() => {
            bubbleEl.classList.remove('pop');
        }, 4000);
    } else {
        bubbleEl.classList.remove('pop');
    }
}

async function pauseGame() {
    if (!gameState.currentQuiz || gameState.currentQuiz.isPaused) return;
    playSound('button');
    gameState.currentQuiz.isPaused = true;
    
    showModal({
        icon: '⏸️',
        title: 'Jogo Pausado',
        desc: 'O teu jogo foi suspenso temporariamente.',
        closeable: false,
        actions: [
            {
                label: '▶️ Retomar Jogo',
                class: 'modal-btn-success',
                onClick: () => {
                    hideModal();
                    if (gameState.currentQuiz) {
                        gameState.currentQuiz.isPaused = false;
                    }
                }
            },
            {
                label: '[ANÚNCIO] 📺 Ver Anúncio (+5 🪙)',
                class: 'modal-btn-warning',
                onClick: async () => {
                    hideModal();
                    executeRewardedAd('pause_coins');
                }
            },
            {
                label: '⬅️ Abandonar Quiz',
                class: 'modal-btn-danger',
                onClick: () => {
                    hideModal();
                    clearInterval(timerInterval);
                    const cId = gameState.currentQuiz.classId;
                    gameState.currentQuiz = null;
                    saveState();
                    goDisciplines(cId, classesData[cId]?.name || '');
                }
            }
        ]
    });
}


