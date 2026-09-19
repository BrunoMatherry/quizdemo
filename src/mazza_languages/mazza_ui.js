// Mazza Language UI - Sistema Avançado com 2 Cards Principais, Unidades e Gamificação
import { mazzaAudio } from './mazza_audio.js';
import { mazzaEngine } from './mazza_engine.js';

export class MazzaUI {
    constructor() {
        this.currentView = 'selector'; // 'selector' | 'path' | 'lesson' | 'vocab'
        this.currentLesson = null;
        this.currentStageIndex = 0;
        this.stages = [];
        this.onExitCallback = null;
        this.onRewardCallback = null;
        this.activeLevelIndex = 0;
    }

    renderHub(container, { onExit, onReward }) {
        this.onExitCallback = onExit;
        this.onRewardCallback = onReward;

        // If user already picked a language in this session, render the path; otherwise, show the 2 giant cards
        if (mazzaEngine.state.activeLanguage) {
            this.renderLanguagePath(container, mazzaEngine.state.activeLanguage);
        } else {
            this.renderLanguageSelector(container);
        }
    }

    // ==========================================
    // 1. TELA PRINCIPAL: 2 CARDS GIGANTES
    // ==========================================
    renderLanguageSelector(container) {
        const statsEn = mazzaEngine.getStats('ingles');
        const statsZh = mazzaEngine.getStats('mandarim');
        const hearts = mazzaEngine.getHearts();

        let html = `
            <div class="mazza-selector-screen">
                <!-- TOP HEADER -->
                <div class="mazza-header">
                    <button class="mazza-back-btn" id="mazza-btn-exit-to-quiz">
                        <i class="fas fa-arrow-left"></i> Voltar ao Menu
                    </button>
                    <div class="mazza-hub-title">
                        <span class="mazza-brand-badge">MAZZA LANGUAGE</span>
                        <h2>Escolhe o teu Idioma</h2>
                    </div>
                    <div class="mazza-header-hearts" title="Vidas">
                        <span class="heart-icon">❤️</span>
                        <strong>${hearts}/5</strong>
                    </div>
                </div>

                <div class="mazza-selector-intro">
                    <p>Metodologia avançada com percurso pedagógico estruturado do zero ao nível mais avançado, leitura guiada falada por voz nativa e testes de certificação.</p>
                </div>

                <!-- 2 MAIN CARDS -->
                <div class="mazza-two-cards-grid">
                    <!-- CARD 1: MAZZA INGLÊS -->
                    <div class="mazza-big-card card-ingles" id="card-select-ingles">
                        <div class="card-glow"></div>
                        <div class="big-card-flag">🇬🇧</div>
                        <div class="big-card-header">
                            <span class="big-card-badge">7 NÍVEIS · CEFR PRE-A1 A C2</span>
                            <h3>Mazza Inglês</h3>
                            <p class="big-card-desc">Do zero absoluto até à fluência nativa e corporativa internacional.</p>
                        </div>

                        <div class="big-card-metrics">
                            <div class="metric-item">
                                <span class="m-val">${statsEn.completedCount}</span>
                                <span class="m-lbl">Lições Feitas</span>
                            </div>
                            <div class="metric-item">
                                <span class="m-val">${statsEn.words}</span>
                                <span class="m-lbl">Palavras</span>
                            </div>
                            <div class="metric-item">
                                <span class="m-val">${statsEn.xp}</span>
                                <span class="m-lbl">XP Inglês</span>
                            </div>
                        </div>

                        <div class="big-card-features">
                            <span><i class="fas fa-check-circle"></i> 28 Unidades Estruturadas</span>
                            <span><i class="fas fa-check-circle"></i> Leitura Guiada com Áudio Nativo</span>
                            <span><i class="fas fa-check-circle"></i> Testes de Certificação</span>
                        </div>

                        <button class="btn-open-language btn-ingles">
                            Entrar no Mazza Inglês <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    <!-- CARD 2: MAZZA MANDARIM -->
                    <div class="mazza-big-card card-mandarim" id="card-select-mandarim">
                        <div class="card-glow"></div>
                        <div class="big-card-flag">🇨🇳</div>
                        <div class="big-card-header">
                            <span class="big-card-badge">6 NÍVEIS · HSK 1 ATÉ HSK 6</span>
                            <h3>Mazza Mandarim</h3>
                            <p class="big-card-desc">Caracteres Hanzi, 4 tons fonéticos, Pinyin e provérbios Chengyu.</p>
                        </div>

                        <div class="big-card-metrics">
                            <div class="metric-item">
                                <span class="m-val">${statsZh.completedCount}</span>
                                <span class="m-lbl">Lições Feitas</span>
                            </div>
                            <div class="metric-item">
                                <span class="m-val">${statsZh.words}</span>
                                <span class="m-lbl">Hanzi / Palavras</span>
                            </div>
                            <div class="metric-item">
                                <span class="m-val">${statsZh.xp}</span>
                                <span class="m-lbl">XP Mandarim</span>
                            </div>
                        </div>

                        <div class="big-card-features">
                            <span><i class="fas fa-check-circle"></i> HSK 1 a HSK 6 com Pinyin & Tons</span>
                            <span><i class="fas fa-check-circle"></i> Pronúncia Nativa Falada ao Toque</span>
                            <span><i class="fas fa-check-circle"></i> Histórias Culturais & Negócios</span>
                        </div>

                        <button class="btn-open-language btn-mandarim">
                            Entrar no Mazza Mandarim <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('mazza-btn-exit-to-quiz')?.addEventListener('click', () => {
            mazzaAudio.stop();
            if (this.onExitCallback) this.onExitCallback();
        });

        document.getElementById('card-select-ingles')?.addEventListener('click', () => {
            mazzaEngine.setActiveLanguage('ingles');
            this.renderLanguagePath(container, 'ingles');
        });

        document.getElementById('card-select-mandarim')?.addEventListener('click', () => {
            mazzaEngine.setActiveLanguage('mandarim');
            this.renderLanguagePath(container, 'mandarim');
        });
    }

    // ==========================================
    // 2. TRILHA DE APRENDIZAGEM (PATH COM UNIDADES)
    // ==========================================
    renderLanguagePath(container, langId) {
        const curr = mazzaEngine.getCurriculum(langId);
        const stats = mazzaEngine.getStats(langId);
        const currentLevel = curr.niveis[this.activeLevelIndex] || curr.niveis[0];

        let html = `
            <div class="mazza-path-container">
                <!-- TOP HEADER COM STATUS -->
                <div class="mazza-header-nav">
                    <button class="mazza-back-btn" id="btn-back-to-selector">
                        <i class="fas fa-globe"></i> Trocar Idioma
                    </button>
                    <div class="mazza-header-stats-pill">
                        <span class="pill-item" title="Sequência">🔥 ${stats.streak}d</span>
                        <span class="pill-item" title="Vidas">❤️ ${stats.hearts}/5</span>
                        <span class="pill-item" title="XP">✨ ${stats.xp}</span>
                        <span class="pill-item" title="Liga">${stats.league.icon} ${stats.league.name}</span>
                    </div>
                </div>

                <!-- LEVEL SELECTOR PILLS -->
                <div class="mazza-level-selector-row">
                    ${curr.niveis.map((lvl, idx) => {
                        const isUnlocked = mazzaEngine.isLevelUnlocked(langId, lvl.codigo, idx);
                        const isSelected = idx === this.activeLevelIndex;
                        return `
                            <button class="lvl-pill-btn ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}" data-lvl-idx="${idx}" style="--pill-color: ${lvl.cor};">
                                <span>${lvl.icone} ${lvl.cefr}</span>
                                ${!isUnlocked ? '<i class="fas fa-lock"></i>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- ACTIVE LEVEL BANNER -->
                <div class="mazza-active-level-banner" style="border-left: 5px solid ${currentLevel.cor};">
                    <div class="lvl-banner-badge">
                        <span class="banner-icon">${currentLevel.icone}</span>
                        <div>
                            <h3>${currentLevel.titulo}</h3>
                            <p>${currentLevel.descricao}</p>
                        </div>
                    </div>
                </div>

                <!-- UNITS LEARNING TREE -->
                <div class="mazza-units-tree">
        `;

        currentLevel.unidades.forEach((unidade, uIdx) => {
            const isUnitUnlocked = mazzaEngine.isUnitUnlocked(langId, unidade.id, uIdx);
            
            html += `
                <div class="mazza-unit-card ${isUnitUnlocked ? 'unlocked' : 'locked'}">
                    <div class="unit-card-header">
                        <div class="unit-icon-bubble">${unidade.icone}</div>
                        <div class="unit-info">
                            <span class="unit-num-tag">UNIDADE ${unidade.numero}</span>
                            <h4>${unidade.titulo}</h4>
                            <p>${unidade.descricao}</p>
                        </div>
                        ${!isUnitUnlocked ? '<span class="unit-lock-icon"><i class="fas fa-lock"></i></span>' : '<span class="unit-ready-icon"><i class="fas fa-star"></i></span>'}
                    </div>

                    <!-- LESSON NODES PATH (DUOLINGO STYLE) -->
                    <div class="unit-nodes-path">
            `;

            unidade.licoes.forEach((lic, lIdx) => {
                const isCompleted = mazzaEngine.isLessonCompleted(langId, lic.id);
                const crowns = mazzaEngine.getLessonCrowns(lic.id);

                html += `
                    <div class="path-node-item ${isCompleted ? 'completed' : ''} ${!isUnitUnlocked ? 'disabled' : ''}" 
                         data-lic-id="${lic.id}" data-lvl-idx="${this.activeLevelIndex}" data-unit-idx="${uIdx}">
                        <div class="node-circle" style="--node-accent: ${currentLevel.cor};">
                            <span class="node-icon">${isCompleted ? '👑' : '⭐'}</span>
                            ${crowns > 0 ? `<div class="node-crown-counter">${crowns}/3</div>` : ''}
                        </div>
                        <div class="node-details">
                            <strong>${lic.titulo}</strong>
                            <div class="node-tags">
                                <span class="tag-sm">📖 Leitura Guiada</span>
                                <span class="tag-sm">🎙️ Áudio TTS</span>
                                <span class="tag-sm">🎯 Mini-Teste</span>
                            </div>
                        </div>
                        <button class="node-action-btn" ${!isUnitUnlocked ? 'disabled' : ''}>
                            ${isCompleted ? 'Revisar' : 'Começar'}
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>

                <!-- BOTTOM NAV OF MAZZA LANGUAGE -->
                <div class="mazza-bottom-bar">
                    <button class="mazza-nav-tab active" id="tab-nav-path">
                        <i class="fas fa-map-marked-alt"></i>
                        <span>Trilha</span>
                    </button>
                    <button class="mazza-nav-tab" id="tab-nav-vocab">
                        <i class="fas fa-book"></i>
                        <span>Dicionário (${stats.words})</span>
                    </button>
                    <button class="mazza-nav-tab" id="tab-nav-practice">
                        <i class="fas fa-heartbeat"></i>
                        <span>Treinar Vidas</span>
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Bind events
        document.getElementById('btn-back-to-selector')?.addEventListener('click', () => {
            mazzaEngine.setActiveLanguage(null);
            this.renderLanguageSelector(container);
        });

        container.querySelectorAll('.lvl-pill-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeLevelIndex = parseInt(btn.dataset.lvlIdx, 10);
                this.renderLanguagePath(container, langId);
            });
        });

        container.querySelectorAll('.path-node-item:not(.disabled)').forEach(node => {
            node.addEventListener('click', () => {
                const licId = node.dataset.licId;
                const lvlIdx = parseInt(node.dataset.lvlIdx, 10);
                const unitIdx = parseInt(node.dataset.unitIdx, 10);
                this.startLesson(container, langId, lvlIdx, unitIdx, licId);
            });
        });

        document.getElementById('tab-nav-vocab')?.addEventListener('click', () => {
            this.renderVocabularyBank(container, langId);
        });

        document.getElementById('tab-nav-practice')?.addEventListener('click', () => {
            this.renderPracticeMode(container, langId);
        });
    }

    // ==========================================
    // 3. EXECUÇÃO DA LIÇÃO INTERATIVA
    // ==========================================
    startLesson(container, langId, levelIdx, unitIdx, lessonId) {
        const hearts = mazzaEngine.getHearts();
        if (hearts <= 0) {
            alert('Estás sem corações ❤️! Entra no Modo Treino para recuperar vidas ou aguarda 30 minutos.');
            this.renderPracticeMode(container, langId);
            return;
        }

        const curr = mazzaEngine.getCurriculum(langId);
        const level = curr.niveis[levelIdx];
        const unit = level.unidades[unitIdx];
        const lesson = unit.licoes.find(l => l.id === lessonId);

        if (!lesson) return;

        this.currentLesson = lesson;
        this.currentLangId = langId;
        this.currentLangCode = curr.idiomaCodigo;
        this.currentLevelIndex = levelIdx;
        this.currentUnitIndex = unitIdx;

        this.stages = [
            { type: 'flashcards', title: 'Vocabulário & Pronúncia Nativa' },
            { type: 'leitura', title: 'Leitura Guiada Interativa' },
            { type: 'exercicios', title: 'Exercícios Práticos' },
            { type: 'miniteste', title: 'Mini-Teste de Avaliação' }
        ];
        this.currentStageIndex = 0;

        this.renderStage(container);
    }

    renderStage(container) {
        const stage = this.stages[this.currentStageIndex];
        const langCode = this.currentLangCode;
        const hearts = mazzaEngine.getHearts();

        let contentHtml = '';

        if (stage.type === 'flashcards') {
            contentHtml = this.renderFlashcardsView(this.currentLesson.flashcards, langCode);
        } else if (stage.type === 'leitura') {
            contentHtml = this.renderLeituraGuiadaView(this.currentLesson.leituraGuiada, langCode);
        } else if (stage.type === 'exercicios') {
            contentHtml = this.renderExerciciosView(this.currentLesson.exercicios, langCode);
        } else if (stage.type === 'miniteste') {
            contentHtml = this.renderMiniTesteView(this.currentLesson.miniTeste, langCode);
        }

        const progressPercent = Math.round(((this.currentStageIndex) / this.stages.length) * 100);

        container.innerHTML = `
            <div class="mazza-lesson-player">
                <div class="mazza-player-top">
                    <button class="mazza-btn-close-lesson" id="btn-close-player">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="mazza-progress-bar-wrap">
                        <div class="mazza-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div class="mazza-player-hearts">
                        <span>❤️</span> <strong>${hearts}</strong>
                    </div>
                    <button class="mazza-btn-turtle" id="btn-toggle-turtle" title="Voz Lenta">
                        🐢 <span id="turtle-status">Normal</span>
                    </button>
                </div>

                <div class="mazza-stage-header">
                    <span class="stage-step-tag">Etapa ${this.currentStageIndex + 1} de ${this.stages.length}</span>
                    <h3>${stage.title}</h3>
                </div>

                <div class="mazza-stage-body" id="mazza-stage-body">
                    ${contentHtml}
                </div>
            </div>
        `;

        document.getElementById('btn-close-player')?.addEventListener('click', () => {
            mazzaAudio.stop();
            this.renderLanguagePath(container, this.currentLangId);
        });

        document.getElementById('btn-toggle-turtle')?.addEventListener('click', () => {
            const isSlow = mazzaAudio.toggleSlowSpeed();
            const el = document.getElementById('turtle-status');
            if (el) el.innerText = isSlow ? 'Lenta (Ativa)' : 'Normal';
        });

        this.bindStageEvents(container, stage.type);
    }

    renderFlashcardsView(flashcards, langCode) {
        let cardsHtml = (flashcards || []).map((card, idx) => `
            <div class="mazza-flashcard-item">
                <div class="flashcard-top">
                    <span class="card-num">#${idx + 1}</span>
                    <button class="mazza-audio-btn" data-audio-text="${card.audio || card.palavra}">
                        <i class="fas fa-volume-up"></i> Ouvir Pronúncia
                    </button>
                </div>
                <div class="flashcard-main-word">
                    <h2>${card.palavra}</h2>
                    ${card.pinyin ? `<div class="word-pinyin">📌 Pinyin: ${card.pinyin}</div>` : ''}
                    <div class="word-meaning">${card.traducao}</div>
                </div>
                <div class="flashcard-example">
                    <div class="ex-orig">${card.exemplo}</div>
                    ${card.pinyinExemplo ? `<div class="ex-pinyin">${card.pinyinExemplo}</div>` : ''}
                    <div class="ex-trad">${card.exTraducao}</div>
                </div>
                ${card.dica ? `<div class="flashcard-tip"><i class="fas fa-lightbulb"></i> <strong>Nota:</strong> ${card.dica}</div>` : ''}
            </div>
        `).join('');

        return `
            <div class="mazza-flashcards-container">
                <p class="section-hint">Toca no botão de áudio para escutar e memorizar os termos:</p>
                <div class="mazza-cards-list">
                    ${cardsHtml}
                </div>
                <div class="stage-footer-action">
                    <button class="mazza-btn-primary" id="btn-next-stage">
                        Continuar para a Leitura Guiada <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderLeituraGuiadaView(leitura, langCode) {
        if (!leitura) {
            return `
                <div class="mazza-guided-reading">
                    <p>Leitura concluída!</p>
                    <button class="mazza-btn-primary" id="btn-next-stage">Continuar</button>
                </div>
            `;
        }

        let phrasesHtml = leitura.frases.map((frase, idx) => `
            <div class="mazza-reading-phrase" data-audio="${frase.audio}">
                <div class="phrase-speaker-btn">
                    <i class="fas fa-volume-up"></i>
                </div>
                <div class="phrase-text-block">
                    <div class="phrase-orig">${frase.texto}</div>
                    ${frase.pinyin ? `<div class="phrase-pinyin">${frase.pinyin}</div>` : ''}
                    <div class="phrase-trad">${frase.traducao}</div>
                </div>
            </div>
        `).join('');

        return `
            <div class="mazza-guided-reading">
                <div class="reading-context-banner">
                    <div class="context-icon">📖</div>
                    <div>
                        <h4>${leitura.titulo}</h4>
                        <p>${leitura.contexto}</p>
                    </div>
                </div>

                <div class="reading-instruction-pill">
                    <i class="fas fa-hand-pointer"></i> Toca em qualquer frase para a API narrar o texto em voz alta com pronúncia nativa!
                </div>

                <div class="reading-phrases-wrapper">
                    ${phrasesHtml}
                </div>

                <div class="stage-footer-action">
                    <button class="mazza-btn-primary" id="btn-next-stage">
                        Avançar para os Exercícios <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderExerciciosView(exercicios, langCode) {
        if (!exercicios || exercicios.length === 0) {
            return `
                <div class="mazza-exercises-container">
                    <p>Exercícios concluídos!</p>
                    <button class="mazza-btn-primary" id="btn-next-stage">Ir para o Mini-Teste</button>
                </div>
            `;
        }

        let itemsHtml = exercicios.map((ex, idx) => {
            if (ex.tipo === 'multipla_escolha') {
                return `
                    <div class="mazza-exercise-card" data-ex-idx="${idx}">
                        <div class="ex-question-label">Exercício ${idx + 1} · Escolha Múltipla</div>
                        <h4>${ex.enunciado}</h4>
                        ${ex.audio ? `<button class="mazza-audio-btn-sm" data-audio="${ex.audio}"><i class="fas fa-volume-up"></i> Ouvir</button>` : ''}
                        <div class="ex-options-grid">
                            ${ex.opcoes.map(opt => `<button class="mazza-option-chip" data-val="${opt}">${opt}</button>`).join('')}
                        </div>
                        <div class="ex-feedback" style="display:none;"></div>
                    </div>
                `;
            } else if (ex.tipo === 'construtor_frase') {
                return `
                    <div class="mazza-exercise-card" data-ex-idx="${idx}">
                        <div class="ex-question-label">Exercício ${idx + 1} · Construtor de Frases</div>
                        <h4>${ex.enunciado}</h4>
                        <div class="sentence-target-area" id="target-area-${idx}">
                            <span class="placeholder-text">Toca nas palavras abaixo para construir a frase</span>
                        </div>
                        <div class="sentence-source-chips" id="source-chips-${idx}">
                            ${ex.palavrasEmbaralhadas.map(word => `<button class="word-chip" data-word="${word}">${word}</button>`).join('')}
                        </div>
                        <button class="mazza-btn-check-sentence" data-ex-idx="${idx}"><i class="fas fa-check"></i> Verificar Frase</button>
                        <div class="ex-feedback" style="display:none;"></div>
                    </div>
                `;
            } else if (ex.tipo === 'ouvir_escolher') {
                return `
                    <div class="mazza-exercise-card" data-ex-idx="${idx}">
                        <div class="ex-question-label">Exercício ${idx + 1} · Desafio de Escuta</div>
                        <h4>${ex.enunciado}</h4>
                        <button class="mazza-audio-btn-big" data-audio="${ex.audio}"><i class="fas fa-volume-up"></i> Tocar Áudio</button>
                        <div class="ex-options-grid">
                            ${ex.opcoes.map(opt => `<button class="mazza-option-chip" data-val="${opt}">${opt}</button>`).join('')}
                        </div>
                        <div class="ex-feedback" style="display:none;"></div>
                    </div>
                `;
            } else if (ex.tipo === 'associar_pares') {
                return `
                    <div class="mazza-exercise-card" data-ex-idx="${idx}">
                        <div class="ex-question-label">Exercício ${idx + 1} · Associação de Pares</div>
                        <h4>${ex.enunciado}</h4>
                        <div class="matching-pairs-board">
                            ${ex.pares.map(p => `
                                <div class="pair-row">
                                    <span class="pair-left">${p.original}</span>
                                    <span class="pair-arrow">➔</span>
                                    <span class="pair-right">${p.traducao}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');

        return `
            <div class="mazza-exercises-container">
                <div class="mazza-exercises-list">
                    ${itemsHtml}
                </div>
                <div class="stage-footer-action">
                    <button class="mazza-btn-primary" id="btn-next-stage">
                        Fazer o Mini-Teste de Nível <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderMiniTesteView(miniTeste, langCode) {
        let questionsHtml = (miniTeste || []).map((q, qIdx) => `
            <div class="mazza-test-card" data-test-idx="${qIdx}">
                <div class="test-q-badge">Pergunta ${qIdx + 1} de ${miniTeste.length}</div>
                <h4>${q.pergunta}</h4>
                <div class="test-options-list">
                    ${q.opcoes.map((opt, optIdx) => `
                        <button class="test-opt-btn" data-opt-idx="${optIdx}" data-correct="${optIdx === q.respostaCorreta}">
                            <span class="opt-letter">${String.fromCharCode(65 + optIdx)}</span>
                            <span class="opt-label">${opt}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="test-explanation" style="display:none;">${q.explicacao || ''}</div>
            </div>
        `).join('');

        return `
            <div class="mazza-test-container">
                <div class="test-header-banner">
                    <div class="test-icon">🎯</div>
                    <div>
                        <h4>Mini-Teste de Avaliação</h4>
                        <p>Responda com atenção para conquistar a Coroa 👑 e desbloquear a próxima fase!</p>
                    </div>
                </div>

                <div class="test-questions-wrapper">
                    ${questionsHtml}
                </div>

                <div class="test-results-summary" id="test-results-summary" style="display:none;">
                    <div class="result-trophy">👑</div>
                    <h3>Parabéns! Lição Concluída!</h3>
                    <p id="result-score-text">Conquistaste a Coroa de Domínio desta fase!</p>
                    <div class="result-rewards-pill">
                        <span>+60 XP Idioma</span> · <span>+25 Moedas 🪙</span>
                    </div>
                    <button class="mazza-btn-primary" id="btn-finish-lesson">
                        Concluir e Voltar à Trilha 🚀
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // 4. DICIONÁRIO / BANCO DE VOCABULÁRIO
    // ==========================================
    renderVocabularyBank(container, langId) {
        const langData = mazzaEngine.getCurriculum(langId);
        const vocabDict = mazzaEngine.state.wordsLearned[langId] || {};
        const wordList = Object.values(vocabDict);

        let html = `
            <div class="mazza-vocab-container">
                <div class="mazza-header-nav">
                    <button class="mazza-back-btn" id="btn-vocab-back">
                        <i class="fas fa-arrow-left"></i> Voltar à Trilha
                    </button>
                    <div class="mazza-hub-title">
                        <h2>📖 Dicionário Pessoal (${wordList.length})</h2>
                    </div>
                </div>

                <p class="section-hint">Todas as palavras e caracteres que aprendeste no ${langData.nome}. Toca para escutar a pronúncia:</p>

                <div class="mazza-vocab-grid">
        `;

        if (wordList.length === 0) {
            html += `<div class="empty-vocab-msg">Ainda não completaste nenhuma lição. Começa agora para preencher o teu vocabulário!</div>`;
        } else {
            wordList.forEach(w => {
                html += `
                    <div class="vocab-word-card">
                        <div class="vocab-top">
                            <strong>${w.palavra}</strong>
                            <button class="mazza-audio-btn-sm" data-audio="${w.audio || w.palavra}">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                        ${w.pinyin ? `<div class="vocab-pinyin">${w.pinyin}</div>` : ''}
                        <div class="vocab-trad">${w.traducao}</div>
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('btn-vocab-back')?.addEventListener('click', () => {
            this.renderLanguagePath(container, langId);
        });

        container.querySelectorAll('.mazza-audio-btn-sm').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.audio;
                mazzaAudio.speak(text, langData.idiomaCodigo);
            });
        });
    }

    // ==========================================
    // 5. MODO TREINO / RECUPERAR VIDAS
    // ==========================================
    renderPracticeMode(container, langId) {
        const langData = mazzaEngine.getCurriculum(langId);

        container.innerHTML = `
            <div class="mazza-practice-container">
                <div class="mazza-header-nav">
                    <button class="mazza-back-btn" id="btn-practice-back">
                        <i class="fas fa-arrow-left"></i> Voltar
                    </button>
                    <div class="mazza-hub-title">
                        <h2>❤️ Treino & Recuperação</h2>
                    </div>
                </div>

                <div class="practice-card-box">
                    <div class="practice-icon">🧘</div>
                    <h3>Recuperar Vidas</h3>
                    <p>Faz uma sessão rápida de revisão auditiva e mental para recarregar todos os teus 5 corações ❤️ imediatamente!</p>
                    <button class="mazza-btn-primary" id="btn-do-refill-hearts">
                        ⚡ Recarregar 5 Corações Agora
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-practice-back')?.addEventListener('click', () => {
            this.renderLanguagePath(container, langId);
        });

        document.getElementById('btn-do-refill-hearts')?.addEventListener('click', () => {
            mazzaEngine.refillHearts();
            alert('❤️ Os teus corações foram totalmente recarregados!');
            this.renderLanguagePath(container, langId);
        });
    }

    bindStageEvents(container, stageType) {
        const langCode = this.currentLangCode;

        container.querySelectorAll('.mazza-audio-btn, .mazza-audio-btn-sm, .mazza-audio-btn-big').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = btn.dataset.audioText || btn.dataset.audio;
                if (text) {
                    btn.classList.add('playing');
                    mazzaAudio.speak(text, langCode, {
                        slow: mazzaAudio.slowSpeed,
                        onEnd: () => btn.classList.remove('playing')
                    });
                }
            });
        });

        container.querySelectorAll('.mazza-reading-phrase').forEach(phraseEl => {
            phraseEl.addEventListener('click', () => {
                const audioText = phraseEl.dataset.audio;
                container.querySelectorAll('.mazza-reading-phrase').forEach(el => el.classList.remove('active-reading'));
                phraseEl.classList.add('active-reading');

                mazzaAudio.speak(audioText, langCode, {
                    slow: mazzaAudio.slowSpeed,
                    onEnd: () => phraseEl.classList.remove('active-reading')
                });
            });
        });

        container.querySelectorAll('.mazza-option-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const parent = chip.closest('.mazza-exercise-card');
                const exIdx = parseInt(parent.dataset.exIdx, 10);
                const ex = this.currentLesson.exercicios[exIdx];
                const feedbackEl = parent.querySelector('.ex-feedback');

                parent.querySelectorAll('.mazza-option-chip').forEach(c => c.classList.remove('selected', 'correct', 'wrong'));
                chip.classList.add('selected');

                if (chip.dataset.val === ex.respostaCorreta) {
                    chip.classList.add('correct');
                    feedbackEl.style.display = 'block';
                    feedbackEl.style.color = '#2ecc71';
                    feedbackEl.innerHTML = '🎉 Excelente! Resposta correta.';
                } else {
                    chip.classList.add('wrong');
                    feedbackEl.style.display = 'block';
                    feedbackEl.style.color = '#e74c3c';
                    feedbackEl.innerHTML = `❌ Resposta incorreta. Resposta correta: <strong>${ex.respostaCorreta}</strong>`;
                    mazzaEngine.loseHeart();
                }
            });
        });

        container.querySelectorAll('.sentence-source-chips .word-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const card = chip.closest('.mazza-exercise-card');
                const targetArea = card.querySelector('.sentence-target-area');
                const placeholder = targetArea.querySelector('.placeholder-text');
                if (placeholder) placeholder.remove();

                if (chip.parentElement.classList.contains('sentence-source-chips')) {
                    targetArea.appendChild(chip);
                } else {
                    card.querySelector('.sentence-source-chips').appendChild(chip);
                }
            });
        });

        container.querySelectorAll('.mazza-btn-check-sentence').forEach(btn => {
            btn.addEventListener('click', () => {
                const exIdx = parseInt(btn.dataset.exIdx, 10);
                const ex = this.currentLesson.exercicios[exIdx];
                const card = btn.closest('.mazza-exercise-card');
                const targetArea = card.querySelector('.sentence-target-area');
                const feedbackEl = card.querySelector('.ex-feedback');

                const chosenWords = Array.from(targetArea.querySelectorAll('.word-chip')).map(c => c.dataset.word);
                const isMatch = JSON.stringify(chosenWords) === JSON.stringify(ex.ordemCorreta);

                feedbackEl.style.display = 'block';
                if (isMatch) {
                    feedbackEl.style.color = '#2ecc71';
                    feedbackEl.innerHTML = '🎉 Perfeito! Ordem correta.';
                } else {
                    feedbackEl.style.color = '#e74c3c';
                    feedbackEl.innerHTML = `❌ Ordem incorreta. Ordem correta: <strong>${ex.ordemCorreta.join(' ')}</strong>`;
                    mazzaEngine.loseHeart();
                }
            });
        });

        let answeredCount = 0;
        const totalQ = this.currentLesson.miniTeste?.length || 0;

        container.querySelectorAll('.test-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.mazza-test-card');
                if (card.dataset.answered === 'true') return;
                card.dataset.answered = 'true';

                const isCorrect = btn.dataset.correct === 'true';
                btn.classList.add(isCorrect ? 'correct' : 'wrong');

                if (!isCorrect) {
                    mazzaEngine.loseHeart();
                    card.querySelector('.test-opt-btn[data-correct="true"]')?.classList.add('correct');
                }

                const explEl = card.querySelector('.test-explanation');
                if (explEl) explEl.style.display = 'block';

                answeredCount++;
                if (answeredCount >= totalQ) {
                    const summaryEl = document.getElementById('test-results-summary');
                    if (summaryEl) summaryEl.style.display = 'flex';

                    const res = mazzaEngine.recordLessonCompletion(this.currentLangId, this.currentLesson.id, this.currentLesson.flashcards);
                    mazzaEngine.unlockNextUnit(this.currentLangId, this.currentLevelIndex, this.currentUnitIndex);

                    if (this.onRewardCallback) {
                        this.onRewardCallback({ xp: res.xpEarned, coins: 25 });
                    }
                }
            });
        });

        document.getElementById('btn-next-stage')?.addEventListener('click', () => {
            mazzaAudio.stop();
            if (this.currentStageIndex < this.stages.length - 1) {
                this.currentStageIndex++;
                this.renderStage(container);
            }
        });

        document.getElementById('btn-finish-lesson')?.addEventListener('click', () => {
            mazzaAudio.stop();
            this.renderLanguagePath(container, this.currentLangId);
        });
    }
}

export const mazzaUI = new MazzaUI();
