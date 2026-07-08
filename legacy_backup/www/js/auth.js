// ===== QUIZMOZ — FIREBASE AUTH + RANKING =====
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCF_WhSSxn11Cv4VxZ6B5ngOOgSO-TKUno",
    authDomain: "quizmoz-31b31.firebaseapp.com",
    projectId: "quizmoz-31b31",
    storageBucket: "quizmoz-31b31.firebasestorage.app",
    messagingSenderId: "762913423131",
    appId: "1:762913423131:web:ece627bb11c1be52b6ddbe",
    measurementId: "G-N739ZMXXF8"
};

let db = null;
let auth = null;
let currentUser = null;
let realRankingPlayers = null;
let guestMode = false;
var _loginReminderTimer = null;

// ===== LIMITES ANTI-CHEAT =====
const _MAX_LEVEL  = 100;
const _MAX_EXP    = 999999;
const _MAX_COINS  = 99999;
const _MAX_QI     = 300;
const _MIN_QI     = 70;

// ===== SEGURANÇA: CHECKSUM DO ESTADO LOCAL =====
// Impede manipulação directa do localStorage
const _CK = 'qmz_ck';
function _stateChecksum(s) {
    const raw = `${s.level}|${s.exp}|${s.coins}|${s.qi}|QmZ_PLY_2024`;
    let h = 5381;
    for (let i = 0; i < raw.length; i++) {
        h = ((h << 5) + h) ^ raw.charCodeAt(i);
        h = h >>> 0;
    }
    return h.toString(36);
}
function _saveChecksum(s) {
    try { localStorage.setItem(_CK, _stateChecksum(s)); } catch(_) {}
}
function _verifyChecksum(s) {
    const stored = localStorage.getItem(_CK);
    if (!stored) return null; // primeira instalação — sem histórico
    return stored === _stateChecksum(s);
}

// ===== SANITIZAÇÃO =====
function _sanitizeName(name) {
    return String(name).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().substring(0, 20);
}

// ===== INICIALIZAÇÃO =====
function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK não disponível — modo offline');
        _proceedToGame();
        return;
    }
    if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.startsWith('COLOQUE')) {
        console.warn('Firebase não configurado — modo offline');
        _proceedToGame();
        return;
    }
    try {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        auth = firebase.auth();
        db   = firebase.firestore();

        // Trata resultado de redirect do Google (fluxo Cordova/WebView)
        auth.getRedirectResult().then(function(result) {
            if (result && result.user) {
                // O redirect retornou com sucesso — onAuthStateChanged tratará o resto
            }
        }).catch(function(e) {
            console.warn('Redirect result:', e.code);
        });

        auth.onAuthStateChanged(function(user) {
            if (user) {
                currentUser = user;
                guestMode = false;
                clearTimeout(_loginReminderTimer);
                _onUserLoggedIn(user);
            } else {
                currentUser = null;
                guestMode = true;
                // Login não obrigatório — jogo avança como convidado
                _proceedToGame();
                _scheduleLoginReminder();
            }
        });
    } catch (e) {
        console.error('Firebase erro de inicialização');
        _proceedToGame();
    }
}

// ===== FLUXO APÓS LOGIN =====
async function _onUserLoggedIn(user) {
    _showAuthLoading(true);
    try {
        const _timeout = new Promise((_,rej) => setTimeout(()=>rej(new Error('timeout')), 10000));
const doc = await Promise.race([db.collection('players').doc(user.uid).get(), _timeout]);
        if (doc.exists) {
            _mergeServerData(doc.data());
        } else {
            const displayName = user.displayName ? _sanitizeName(user.displayName) : '';
            if (!gameState.playerName && displayName) {
                gameState.playerName = displayName;
            }
            await syncPlayerToFirestore();
        }
        fetchRealRanking();
    } catch (e) {
        console.error('Erro ao carregar dados do servidor');
    }
    _showAuthLoading(false);
    _hideAuthScreen();
    _proceedToGame();
}

function _mergeServerData(serverData) {
    if (!serverData) return;
    // Servidor tem prioridade — e valores são validados antes de aceitar
    const sLevel  = Math.min(Math.max(parseInt(serverData.level)  || 1,       1),       _MAX_LEVEL);
    const sExp    = Math.min(Math.max(parseInt(serverData.exp)    || 0,       0),       _MAX_EXP);
    const sCoins  = Math.min(Math.max(parseInt(serverData.coins)  || 0,       0),       _MAX_COINS);
    const sQi     = Math.min(Math.max(parseInt(serverData.qi)     || _MIN_QI, _MIN_QI), _MAX_QI);

    if (sLevel  > (gameState.level  || 1))    gameState.level  = sLevel;
    if (sExp    > (gameState.exp    || 0))    gameState.exp    = sExp;
    if (sCoins  > (gameState.coins  || 0))    gameState.coins  = sCoins;
    if (sQi     > (gameState.qi     || _MIN_QI)) gameState.qi  = sQi;
    if (serverData.name && !gameState.playerName) {
        gameState.playerName = _sanitizeName(serverData.name);
    }
    if (Array.isArray(serverData.unlockedClasses)) {
        serverData.unlockedClasses.forEach(c => {
            if (typeof c === 'string' && !gameState.unlockedClasses.includes(c)) {
                gameState.unlockedClasses.push(c);
            }
        });
    }
    saveGameState();
    if (typeof updateHeader === 'function') updateHeader();
}

// ===== SINCRONIZAR COM FIRESTORE =====
var _syncTimer = null;
var _lastSyncTime = 0;
const _MIN_SYNC_INTERVAL = 30000; // mínimo 15 segundos entre sincronizações

function scheduleSyncToFirestore() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(syncPlayerToFirestore, 20000);
}

async function syncPlayerToFirestore() {
    if (!currentUser || !db) return;

    const now = Date.now();
    if (now - _lastSyncTime < _MIN_SYNC_INTERVAL) return; // rate limit
    _lastSyncTime = now;

    try {
        // Validar e sanitizar todos os campos antes de enviar para o servidor
        const safeLevel  = Math.min(Math.max(parseInt(gameState.level)  || 1,       1),       _MAX_LEVEL);
        const safeExp    = Math.min(Math.max(parseInt(gameState.exp)    || 0,       0),       _MAX_EXP);
        const safeCoins  = Math.min(Math.max(parseInt(gameState.coins)  || 0,       0),       _MAX_COINS);
        const safeQi     = Math.min(Math.max(parseInt(gameState.qi)     || _MIN_QI, _MIN_QI), _MAX_QI);
        const safeName   = _sanitizeName(gameState.playerName || 'Jogador') || 'Jogador';

        const score = safeLevel * 100 + safeQi * 2 + safeCoins;
        const tier = (typeof getRankTier === 'function')
            ? getRankTier(safeLevel)
            : { title: 'Novato', icon: '🥚' };

        await db.collection('players').doc(currentUser.uid).set({
            name:            safeName,
            level:           safeLevel,
            exp:             safeExp,
            coins:           safeCoins,
            qi:              safeQi,
            score:           score,
            tier:            tier.title,
            tierIcon:        tier.icon,
            unlockedClasses: (gameState.unlockedClasses || []).filter(c => typeof c === 'string'),
            lastActive:      firebase.firestore.FieldValue.serverTimestamp()
            // email não é guardado — privacidade do utilizador
        }, { merge: true });
    } catch (e) {
        // Não expor detalhes do erro em produção
        console.warn('Sincronização Firestore falhou');
    }
}

// ===== BUSCAR RANKING REAL =====
var _rankingFetchInProgress = false;
async function fetchRealRanking() {
    if (!db) return;
    if (_rankingFetchInProgress) return; // evitar chamadas duplicadas
    _rankingFetchInProgress = true;
    try {
        const snap = await db.collection('players')
            .orderBy('score', 'desc')
            .limit(100)
            .get();
        realRankingPlayers = [];
        snap.forEach(doc => {
            try {
            const d = doc.data();
            realRankingPlayers.push({
                id:            doc.id,
                name:          _sanitizeName(String(d.name || 'Jogador')),
                level:         Math.min(parseInt(d.level) || 1, _MAX_LEVEL),
                score:         parseInt(d.score) || 0,
                tier:          d.tier    || 'Novato',
                tierIcon:      d.tierIcon || '🥚',
                isCurrentUser: currentUser && doc.id === currentUser.uid
            });
            } catch(docErr) { console.warn('Ranking doc error:', docErr); }
        });
        // Atualizar welcome screen se estiver visível
        if (typeof currentScreen !== 'undefined' && currentScreen === 'welcome') {
            if (typeof showWelcomeScreen === 'function') showWelcomeScreen();
        }
    } catch (e) {
        console.warn('Erro ao buscar ranking:', e.code || e.message);
        // Firestore pode precisar de índice composto — dados ficam vazios mas não bloqueia
        if (!realRankingPlayers) realRankingPlayers = [];
    } finally {
        _rankingFetchInProgress = false;
    }
}

function getEffectiveRanking() {
    return realRankingPlayers || (typeof rankingPlayers !== 'undefined' ? rankingPlayers : []);
}

// ===== FLUXO DO JOGO =====
function _proceedToGame() {
    const saved = localStorage.getItem(atob('cXVpem1vel92Nw=='));
    // Todos os jogadores (com conta ou convidados) devem ter um nickname
    if (!gameState.playerName) {
        _askForPlayerName();
        return;
    }
    if (!saved) {
        showWelcomeScreen();
        var _fc=document.getElementById('floating-controls'); if(_fc)_fc.style.display='none';
        var _hb=document.getElementById('home-btn'); if(_hb)_hb.style.display='none';
        var _eb=document.getElementById('exit-btn'); if(_eb)_eb.style.display='flex';
    } else {
        showClassSelection();
        document.getElementById('floating-controls').style.display = 'flex';
        document.getElementById('home-btn').style.display = 'flex';
        document.getElementById('exit-btn').style.display = 'flex';
        if (!gameState.tutorialCompleted) {
            setTimeout(() => { if (typeof startTutorial === 'function') startTutorial(); }, 1500);
        }
    }
}

function _askForPlayerName() {
    // Sugestão de nome: Google display name (se autenticado) ou vazio
    const suggestion = (currentUser && currentUser.displayName)
        ? _sanitizeName(currentUser.displayName) : '';

    Swal.fire({
        title: '🎮 Bem-vindo ao QuizMoz!',
        html: `
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:52px;margin-bottom:8px;">🏆</div>
          <p style="color:#555;font-size:15px;font-weight:600;margin-bottom:4px;">Escolhe o teu Nickname</p>
          <p style="color:#888;font-size:12px;">Este nome aparecerá no Ranking Global</p>
        </div>
        <input type="text" id="swal-pname" class="swal2-input"
               placeholder="Ex: QuizMaster99" maxlength="20"
               value="${suggestion}"
               style="text-align:center;font-size:18px;font-weight:700;letter-spacing:1px;">
        <p style="font-size:11px;color:#aaa;margin-top:8px;text-align:center;">2 a 20 caracteres · sem símbolos especiais</p>`,
        confirmButtonText: '🚀 Entrar no Jogo!',
        confirmButtonColor: '#5E9B9D',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            const input = document.getElementById('swal-pname');
            if (input) { setTimeout(() => input.focus(), 100); }
        },
        preConfirm: () => {
            const n = _sanitizeName(document.getElementById('swal-pname').value);
            if (!n || n.length < 2) {
                Swal.showValidationMessage('O nickname deve ter pelo menos 2 caracteres');
                return false;
            }
            return n;
        }
    }).then(result => {
        if (result.isConfirmed) {
            gameState.playerName = result.value;
            saveGameState();
            // Sincronizar com Firestore se autenticado
            if (currentUser && typeof syncPlayerToFirestore === 'function') {
                syncPlayerToFirestore();
            }
            showWelcomeScreen();
            document.getElementById('floating-controls').style.display = 'none';
            document.getElementById('home-btn').style.display = 'none';
            document.getElementById('exit-btn').style.display = 'flex';
        }
    });
}

// ===== AUTH SCREEN =====
function _showAuthScreen() {
    const el = document.getElementById('auth-screen');
    if (el) el.style.display = 'flex';
}
function _hideAuthScreen() {
    const el = document.getElementById('auth-screen');
    if (el) el.style.display = 'none';
}
function _showAuthLoading(show) {
    const card    = document.getElementById('auth-card');
    const spinner = document.getElementById('auth-spinner');
    if (card)    card.style.display    = show ? 'none' : 'block';
    if (spinner) spinner.style.display = show ? 'flex'  : 'none';
}

function toggleEmailForm() {
    const section = document.getElementById('auth-email-section');
    const btn = document.querySelector('.auth-btn-email-toggle');
    if (!section) return;
    const isOpen = section.style.display !== 'none';
    section.style.display = isOpen ? 'none' : 'block';
    if (btn) btn.innerHTML = isOpen
        ? '<i class="fas fa-envelope"></i> Usar Email e Senha'
        : '<i class="fas fa-chevron-up"></i> Fechar';
}

function switchAuthTab(tab) {
    document.getElementById('auth-login-tab').classList.toggle('auth-tab-active',    tab === 'login');
    document.getElementById('auth-register-tab').classList.toggle('auth-tab-active', tab === 'register');
    document.getElementById('auth-login-form').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById('auth-register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('auth-login-error').textContent    = '';
    document.getElementById('auth-register-error').textContent = '';
}

// ===== AÇÕES DE AUTENTICAÇÃO =====
async function doLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('auth-login-error');
    const btn      = document.getElementById('login-btn');
    errEl.textContent = '';

    if (!email || !password) { errEl.textContent = 'Preencha todos os campos.'; return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
        errEl.textContent = _authError(e.code);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
}

async function doRegister() {
    const name     = _sanitizeName(document.getElementById('register-name').value);
    const email    = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm  = document.getElementById('register-confirm').value;
    const errEl    = document.getElementById('auth-register-error');
    const btn      = document.getElementById('register-btn');
    errEl.textContent = '';

    if (!name || !email || !password || !confirm) { errEl.textContent = 'Preencha todos os campos.'; return; }
    if (name.length < 2 || name.length > 20)      { errEl.textContent = 'Nome: 2 a 20 caracteres.'; return; }
    if (password.length < 6)                       { errEl.textContent = 'Senha mínima: 6 caracteres.'; return; }
    if (password !== confirm)                       { errEl.textContent = 'As senhas não coincidem.'; return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        gameState.playerName = name;
        saveGameState();
    } catch (e) {
        errEl.textContent = _authError(e.code);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
    }
}

async function doGoogleLogin() {
    if (!auth) { _proceedToGame(); return; }
    const errEl = document.getElementById('auth-login-error');
    errEl.textContent = '';
    _showAuthLoading(true);

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        // Tenta popup (funciona no browser e em alguns WebViews)
        await auth.signInWithPopup(provider);
        // onAuthStateChanged trata o resto
    } catch (e) {
        if (e.code === 'auth/popup-blocked' ||
            e.code === 'auth/popup-closed-by-user' ||
            e.code === 'auth/cancelled-popup-request') {
            // Fallback: redirect (para Cordova WebView)
            try {
                await auth.signInWithRedirect(provider);
            } catch (e2) {
                _showAuthLoading(false);
                errEl.textContent = 'Google Sign-In não disponível. Usa email/senha.';
            }
        } else {
            _showAuthLoading(false);
            errEl.textContent = _authError(e.code);
        }
    }
}

async function doResetPassword() {
    const email = document.getElementById('login-email').value.trim();
    const errEl = document.getElementById('auth-login-error');
    if (!email) { errEl.textContent = 'Digite o email para recuperar a senha.'; return; }
    try {
        await auth.sendPasswordResetEmail(email);
        errEl.style.color = '#4CAF50';
        errEl.textContent = '✅ Email de recuperação enviado!';
        setTimeout(() => { errEl.style.color = ''; errEl.textContent = ''; }, 5000);
    } catch (e) {
        errEl.textContent = _authError(e.code);
    }
}

async function doLogout() {
    if (!auth) { location.reload(); return; }
    try {
        clearTimeout(_syncTimer); // cancelar sync pendente antes de sair
        await auth.signOut();
        localStorage.removeItem(atob('cXVpem1vel92Nw=='));
        localStorage.removeItem(_CK);
        location.reload();
    } catch (e) {
        location.reload();
    }
}

function _authError(code) {
    const map = {
        'auth/user-not-found':        'Utilizador não encontrado.',
        'auth/wrong-password':         'Senha incorreta.',
        'auth/invalid-credential':     'Email ou senha incorretos.',
        'auth/email-already-in-use':   'Este email já está em uso.',
        'auth/invalid-email':          'Email inválido.',
        'auth/weak-password':          'Senha muito fraca (mín. 6 caracteres).',
        'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos.',
        'auth/network-request-failed': 'Sem conexão. Verifique a internet.',
        'auth/operation-not-allowed':  'Método de login não activado no Firebase.',
        'auth/account-exists-with-different-credential': 'Já existe uma conta com este email. Tenta entrar com email/senha.'
    };
    return map[code] || 'Erro ao autenticar. Tente novamente.';
}

// ===== MODO CONVIDADO =====
function playAsGuest() {
    guestMode = true;
    _hideAuthScreen();
    _proceedToGame();
    _scheduleLoginReminder();
}

// ===== LEMBRETE DE LOGIN =====
function _scheduleLoginReminder() {
    clearTimeout(_loginReminderTimer);
    // Primeiro lembrete após 4 minutos de jogo
    _loginReminderTimer = setTimeout(function() {
        if (!currentUser && guestMode) _showLoginReminderToast();
    }, 4 * 60 * 1000);
}

function _showLoginReminderToast() {
    if (currentUser) return;
    if (typeof Swal === 'undefined') return;
    Swal.fire({
        toast: true,
        position: 'top',
        html: `<div style="display:flex;align-items:center;gap:10px;">
                 <span style="font-size:24px;">🏆</span>
                 <div style="text-align:left;">
                   <div style="font-weight:700;font-size:14px;">Entra para ver o Ranking!</div>
                   <div style="font-size:12px;color:#888;">Compara-te com jogadores de todo o país</div>
                 </div>
               </div>`,
        showConfirmButton: true,
        confirmButtonText: 'Entrar',
        confirmButtonColor: '#5E9B9D',
        showCancelButton: true,
        cancelButtonText: '✕',
        timer: 10000,
        timerProgressBar: true,
        customClass: { popup: 'swal2-toast' }
    }).then(result => {
        if (result.isConfirmed) {
            _showAuthScreen();
        } else {
            // Próximo lembrete em 8 minutos
            _loginReminderTimer = setTimeout(function() {
                if (!currentUser && guestMode) _showLoginReminderToast();
            }, 8 * 60 * 1000);
        }
    });
}

// Abre ecrã de login quando convidado tenta aceder ao ranking
function showAuthForRanking() {
    if (currentUser) return;
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '🏆 Ranking Global',
            html: `<div style="text-align:center;padding:10px 0;">
                     <div style="font-size:48px;margin-bottom:10px;">🔒</div>
                     <p style="color:#666;font-size:14px;margin-bottom:5px;">Entra na tua conta para</p>
                     <p style="color:#333;font-size:15px;font-weight:700;">ver e participar no Ranking Global!</p>
                   </div>`,
            showConfirmButton: true,
            confirmButtonText: '<i class="fas fa-sign-in-alt"></i> Entrar / Criar conta',
            confirmButtonColor: '#5E9B9D',
            showCancelButton: true,
            cancelButtonText: 'Agora não'
        }).then(result => {
            if (result.isConfirmed) {
                Swal.close();
                setTimeout(() => _showAuthScreen(), 300);
            }
        });
    }
}
