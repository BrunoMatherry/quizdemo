// Mazza Language Audio & Text-to-Speech Engine
// Supports English (en-US / en-GB) and Mandarin Chinese (zh-CN) via Web Speech Synthesis

class MazzaAudioEngine {
    constructor() {
        this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.voices = [];
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.slowSpeed = false;

        if (this.synth) {
            this.loadVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    loadVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices() || [];
    }

    getBestVoice(lang) {
        if (!this.voices || this.voices.length === 0) {
            this.loadVoices();
        }
        
        const targetLangPrefix = lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
        
        // Match exact or prefix
        let voice = this.voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase()));
        if (!voice) {
            voice = this.voices.find(v => v.lang && v.lang.toLowerCase().startsWith(targetLangPrefix));
        }
        return voice || null;
    }

    speak(text, lang = 'en-US', options = {}) {
        if (!this.synth || !text) {
            console.warn('[MazzaAudio] SpeechSynthesis not available or text empty.');
            if (options.onEnd) options.onEnd();
            return;
        }

        // Cancel previous speech
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        
        // Audio rate: slower if requested (great for learning pronunciation)
        utterance.rate = options.slow ? 0.72 : (options.rate || (lang.startsWith('zh') ? 0.85 : 0.95));
        utterance.pitch = options.pitch || 1.0;

        const voice = this.getBestVoice(lang);
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (err) => {
            console.warn('[MazzaAudio] Speech error:', err);
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (options.onError) options.onError(err);
            if (options.onEnd) options.onEnd();
        };

        if (options.onBoundary) {
            utterance.onboundary = options.onBoundary;
        }

        this.currentUtterance = utterance;
        
        // Trigger synthesis
        try {
            this.synth.speak(utterance);
        } catch (e) {
            console.error('[MazzaAudio] Error speaking:', e);
            if (options.onEnd) options.onEnd();
        }
    }

    stop() {
        if (this.synth) {
            try {
                this.synth.cancel();
            } catch (e) {
                // ignore
            }
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }

    toggleSlowSpeed() {
        this.slowSpeed = !this.slowSpeed;
        return this.slowSpeed;
    }
}

export const mazzaAudio = new MazzaAudioEngine();
