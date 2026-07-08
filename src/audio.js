// QuizMoz v3.1.0 — Audio System (Web Audio API)
let ctx = null;
let muted = false;
let musicEnabled = true;

export function isMusicEnabled() { return musicEnabled; }
export function setMusicEnabled(v) { musicEnabled = v; }

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
}

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }
export function setMuted(v) { muted = v; }

function note(freq, dur, type = 'sine', vol = 0.1, delay = 0) {
    if (muted) return;
    try {
        const c = getCtx();
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = type;
        o.frequency.setValueAtTime(freq, c.currentTime + delay);
        g.gain.setValueAtTime(vol, c.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
        o.start(c.currentTime + delay);
        o.stop(c.currentTime + delay + dur);
    } catch(e) {}
}

export function playSound(type) {
    if (muted) return;
    switch(type) {
        case 'correct': note(659,0.15,'sine',0.1,0); note(784,0.2,'sine',0.1,0.12); break;
        case 'wrong': note(220,0.15,'sawtooth',0.08,0); note(196,0.25,'sawtooth',0.08,0.12); break;
        case 'coin': note(1200,0.08,'sine',0.06,0); note(1500,0.1,'sine',0.06,0.06); break;
        case 'tick': note(523,0.05,'sine',0.04); break;
        case 'click': note(440,0.06,'sine',0.05); break;
        case 'button': note(523,0.08,'sine',0.05); break;
        case 'unlock': note(523,0.12,'sine',0.08,0); note(659,0.12,'sine',0.08,0.1); note(784,0.15,'sine',0.08,0.2); break;
        case 'victory': note(523,0.12,'sine',0.08,0); note(587,0.12,'sine',0.08,0.1); note(659,0.12,'sine',0.08,0.2); note(698,0.12,'sine',0.08,0.3); note(784,0.15,'sine',0.08,0.4); note(880,0.2,'sine',0.08,0.5); break;
        case 'welcome': note(523,0.15,'sine',0.06,0); note(659,0.15,'sine',0.06,0.15); note(784,0.2,'sine',0.06,0.3); break;
    }
}
