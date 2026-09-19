// Mazza Inglês - Dados Estruturados do Zero ao Avançado (Pre-A1 até C2)

export const mazzaInglesData = {
    id: 'ingles',
    nome: 'Mazza Inglês',
    bandeira: '🇬🇧',
    idiomaCodigo: 'en-US',
    descricao: 'Aprende inglês do zero absoluto à fluência avançada com o método Mazza (Pre-A1 a C2).',
    niveis: [
        {
            codigo: 'pre_a1',
            nivelNum: 0,
            titulo: 'Nível 0: Pre-A1 (Iniciação Total)',
            cefr: 'Pre-A1',
            cor: '#43E97B',
            icone: '🌱',
            descricao: 'Primeiras palavras, saudações, números, cores e expressões básicas.',
            modulos: [
                {
                    id: 'mod_0_1',
                    titulo: 'Módulo 1: Primeiros Passos & Saudações',
                    licoes: [
                        {
                            id: 'lic_0_1_1',
                            titulo: 'Olá, Adeus e Apresentações',
                            flashcards: [
                                { palavra: 'Hello', traducao: 'Olá', exemplo: 'Hello! How are you?', exTraducao: 'Olá! Como estás?', audio: 'Hello! How are you?', dica: 'Saudação universal em qualquer hora do dia.' },
                                { palavra: 'Good morning', traducao: 'Bom dia', exemplo: 'Good morning, friend!', exTraducao: 'Bom dia, amigo!', audio: 'Good morning, friend!', dica: 'Usado desde o acordar até ao meio-dia.' },
                                { palavra: 'My name is...', traducao: 'O meu nome é...', exemplo: 'My name is Tomás.', exTraducao: 'O meu nome é Tomás.', audio: 'My name is Tomás.', dica: 'Forma mais comum de dizer o teu nome.' },
                                { palavra: 'Nice to meet you', traducao: 'Prazer em conhecer-te', exemplo: 'Nice to meet you, Ana!', exTraducao: 'Prazer em conhecer-te, Ana!', audio: 'Nice to meet you, Ana!', dica: 'Usado ao ser apresentado a alguém.' },
                                { palavra: 'Please', traducao: 'Por favor', exemplo: 'Water, please.', exTraducao: 'Água, por favor.', audio: 'Water, please.', dica: 'Palavra essencial de cortesia.' },
                                { palavra: 'Thank you', traducao: 'Obrigado / Obrigada', exemplo: 'Thank you very much!', exTraducao: 'Muito obrigado!', audio: 'Thank you very much!', dica: 'Agradecimento formal ou informal.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Meeting at the Airport',
                                contexto: 'Tomás chega ao aeroporto e encontra a sua colega Sarah.',
                                frases: [
                                    { texto: 'Hello! My name is Tomás.', traducao: 'Olá! O meu nome é Tomás.', audio: 'Hello! My name is Tomás.' },
                                    { texto: 'Good morning Tomás! I am Sarah.', traducao: 'Bom dia Tomás! Eu sou a Sarah.', audio: 'Good morning Tomás! I am Sarah.' },
                                    { texto: 'Nice to meet you, Sarah!', traducao: 'Prazer em conhecer-te, Sarah!', audio: 'Nice to meet you, Sarah!' },
                                    { texto: 'Welcome to Mozambique! Thank you for coming.', traducao: 'Bem-vindo a Moçambique! Obrigado por vires.', audio: 'Welcome to Mozambique! Thank you for coming.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Como dizes "Prazer em conhecer-te" em inglês?',
                                    opcoes: ['Good night', 'Nice to meet you', 'See you later', 'Excuse me'],
                                    respostaCorreta: 'Nice to meet you',
                                    audio: 'Nice to meet you'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Ordena as palavras para formar: "Olá! O meu nome é Tomás."',
                                    palavrasEmbaralhadas: ['is', 'Hello!', 'Tomás.', 'My', 'name'],
                                    ordemCorreta: ['Hello!', 'My', 'name', 'is', 'Tomás.']
                                },
                                {
                                    tipo: 'ouvir_escolher',
                                    enunciado: 'Ouve o áudio e escolhe a opção correta:',
                                    audio: 'Thank you very much!',
                                    opcoes: ['Thank you very much!', 'Please give me water!', 'Good morning teacher!'],
                                    respostaCorreta: 'Thank you very much!'
                                },
                                {
                                    tipo: 'associar_pares',
                                    enunciado: 'Combina cada palavra em inglês com a sua tradução:',
                                    pares: [
                                        { original: 'Please', traducao: 'Por favor' },
                                        { original: 'Thank you', traducao: 'Obrigado' },
                                        { original: 'Good morning', traducao: 'Bom dia' },
                                        { original: 'Goodbye', traducao: 'Adeus' }
                                    ]
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual é a resposta mais adequada para "Nice to meet you"?',
                                    opcoes: ['Nice to meet you too!', 'Good night!', 'No, thank you.', 'I am late.'],
                                    respostaCorreta: 0,
                                    explicacao: 'Responde-se "Nice to meet you too" (Prazer em conhecer-te também).'
                                },
                                {
                                    pergunta: 'Como se pede "Água, por favor" em inglês?',
                                    opcoes: ['Water, sorry.', 'Water, please.', 'Water, bye.', 'Water, hello.'],
                                    respostaCorreta: 1,
                                    explicacao: '"Please" significa "por favor".'
                                },
                                {
                                    pergunta: 'O que significa "Good morning"?',
                                    opcoes: ['Boa noite', 'Boa tarde', 'Bom dia', 'Até amanhã'],
                                    respostaCorreta: 2,
                                    explicacao: '"Good morning" significa "Bom dia".'
                                }
                            ]
                        },
                        {
                            id: 'lic_0_1_2',
                            titulo: 'Números, Cores e Idades',
                            flashcards: [
                                { palavra: 'One, Two, Three', traducao: 'Um, Dois, Três', exemplo: 'I have three books.', exTraducao: 'Eu tenho três livros.', audio: 'One, Two, Three. I have three books.', dica: 'Números cardinais de 1 a 3.' },
                                { palavra: 'Four, Five, Six', traducao: 'Quatro, Cinco, Seis', exemplo: 'Five days a week.', exTraducao: 'Cinco dias por semana.', audio: 'Four, Five, Six.', dica: 'Pratica a pronúncia com o áudio.' },
                                { palavra: 'Blue / Red / Green', traducao: 'Azul / Vermelho / Verde', exemplo: 'The sky is blue.', exTraducao: 'O céu é azul.', audio: 'The sky is blue and the grass is green.', dica: 'Cores primárias e da natureza.' },
                                { palavra: 'How old are you?', traducao: 'Quantos anos tens?', exemplo: 'How old are you? I am twenty.', exTraducao: 'Quantos anos tens? Tenho vinte anos.', audio: 'How old are you? I am twenty.', dica: 'Em inglês usa-se "I am" para idade, não "I have".' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: In the Classroom',
                                contexto: 'A professora pergunta as idades e cores favoritas dos alunos.',
                                frases: [
                                    { texto: 'Welcome class! How old are you, Carlos?', traducao: 'Bem-vindos à turma! Quantos anos tens, Carlos?', audio: 'Welcome class! How old are you, Carlos?' },
                                    { texto: 'I am ten years old.', traducao: 'Eu tenho dez anos.', audio: 'I am ten years old.' },
                                    { texto: 'What is your favorite color?', traducao: 'Qual é a tua cor favorita?', audio: 'What is your favorite color?' },
                                    { texto: 'My favorite color is green and blue!', traducao: 'A minha cor favorita é verde e azul!', audio: 'My favorite color is green and blue!' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Como se diz "Tenho 20 anos" em inglês?',
                                    opcoes: ['I have 20 years', 'I am 20 years old', 'I make 20 years', 'I got 20 years'],
                                    respostaCorreta: 'I am 20 years old',
                                    audio: 'I am twenty years old'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Forma a frase: "The sky is blue."',
                                    palavrasEmbaralhadas: ['is', 'blue.', 'The', 'sky'],
                                    ordemCorreta: ['The', 'sky', 'is', 'blue.']
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual a forma correta para perguntar a idade de alguém?',
                                    opcoes: ['How many years you have?', 'How old are you?', 'What age you got?', 'How old have you?'],
                                    respostaCorreta: 1,
                                    explicacao: 'A pergunta padrão é "How old are you?".'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'a1',
            nivelNum: 1,
            titulo: 'Nível 1: A1 (Iniciante Ativo)',
            cefr: 'A1',
            cor: '#4FACFE',
            icone: '🚀',
            descricao: 'Rotina diária, família, compras, direções e restaurantes.',
            modulos: [
                {
                    id: 'mod_1_1',
                    titulo: 'Módulo 1: Família & Minha Casa',
                    licoes: [
                        {
                            id: 'lic_1_1_1',
                            titulo: 'Membros da Família e Descrições',
                            flashcards: [
                                { palavra: 'Father / Mother', traducao: 'Pai / Mãe', exemplo: 'My father is a doctor and my mother is a teacher.', exTraducao: 'O meu pai é médico e a minha mãe é professora.', audio: 'My father is a doctor and my mother is a teacher.', dica: 'Formas carinhosas: Dad / Mom.' },
                                { palavra: 'Brother / Sister', traducao: 'Irmão / Irmã', exemplo: 'I live with my brother in Maputo.', exTraducao: 'Eu vivo com o meu irmão em Maputo.', audio: 'I live with my brother in Maputo.', dica: 'Irmãos no geral: siblings.' },
                                { palavra: 'House / Apartment', traducao: 'Casa / Apartamento', exemplo: 'Our house has three rooms.', exTraducao: 'A nossa casa tem três quartos.', audio: 'Our house has three rooms.', dica: 'House = casa independente; Apartment = prédio.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: My Family in Mozambique',
                                contexto: 'Fatima descreve a sua família e a sua rotina diária.',
                                frases: [
                                    { texto: 'Hello everyone! I live in Maputo with my family.', traducao: 'Olá a todos! Eu vivo em Maputo com a minha família.', audio: 'Hello everyone! I live in Maputo with my family.' },
                                    { texto: 'My father works near the sea, and my mother cooks delicious food.', traducao: 'O meu pai trabalha perto do mar, e a minha mãe cozinha comida deliciosa.', audio: 'My father works near the sea, and my mother cooks delicious food.' },
                                    { texto: 'Every evening, we sit together and speak English.', traducao: 'Todas as noites, sentamo-nos juntos e falamos inglês.', audio: 'Every evening, we sit together and speak English.' },
                                    { texto: 'Learning together makes us happy!', traducao: 'Aprender juntos faz-nos felizes!', audio: 'Learning together makes us happy!' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Qual é o plural de "sister"?',
                                    opcoes: ['sisters', 'sisteres', 'sisteries', 'sisterz'],
                                    respostaCorreta: 'sisters',
                                    audio: 'sisters'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Ordena: "I live with my family."',
                                    palavrasEmbaralhadas: ['family.', 'with', 'my', 'I', 'live'],
                                    ordemCorreta: ['I', 'live', 'with', 'my', 'family.']
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se diz "A minha mãe é professora" em inglês?',
                                    opcoes: ['My mother has teacher.', 'My mother is a teacher.', 'My mother does teacher.', 'My mother be teacher.'],
                                    respostaCorreta: 1,
                                    explicacao: 'Em profissões no singular, usa-se o artigo "a/an" antes do nome: "is a teacher".'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'a2',
            nivelNum: 2,
            titulo: 'Nível 2: A2 (Elementar Funcional)',
            cefr: 'A2',
            cor: '#667EEA',
            icone: '🧭',
            descricao: 'Passado simples, planos futuros, experiências e conversas quotidianas.',
            modulos: [
                {
                    id: 'mod_2_1',
                    titulo: 'Módulo 1: Experiências Passadas & Histórias',
                    licoes: [
                        {
                            id: 'lic_2_1_1',
                            titulo: 'Férias e Fim de Semana (Past Simple)',
                            flashcards: [
                                { palavra: 'I went', traducao: 'Eu fui', exemplo: 'Last week I went to the beach.', exTraducao: 'Na semana passada eu fui à praia.', audio: 'Last week I went to the beach in Bilene.', dica: 'Passado irregular do verbo "go".' },
                                { palavra: 'We visited', traducao: 'Nós visitámos', exemplo: 'We visited our grandparents yesterday.', exTraducao: 'Nós visitámos os nossos avós ontem.', audio: 'We visited our grandparents yesterday.', dica: 'Passado regular terminado em -ed.' },
                                { palavra: 'It was amazing', traducao: 'Foi incrível', exemplo: 'The concert was amazing!', exTraducao: 'O concerto foi incrível!', audio: 'The concert was amazing!', dica: 'Passado do verbo to be (was / were).' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Trip to Gorongosa National Park',
                                contexto: 'Um relato de viagem ao Parque Nacional da Gorongosa.',
                                frases: [
                                    { texto: 'Last month, our school organized a trip to Gorongosa.', traducao: 'No mês passado, a nossa escola organizou uma viagem à Gorongosa.', audio: 'Last month, our school organized a trip to Gorongosa.' },
                                    { texto: 'We saw lions, elephants, and beautiful birds.', traducao: 'Nós vimos leões, elefantes e pássaros lindos.', audio: 'We saw lions, elephants, and beautiful birds.' },
                                    { texto: 'The guide explained how wildlife conservation works.', traducao: 'O guia explicou como funciona a conservação da vida selvagem.', audio: 'The guide explained how wildlife conservation works.' },
                                    { texto: 'It was the best experience of my life!', traducao: 'Foi a melhor experiência da minha vida!', audio: 'It was the best experience of my life!' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Qual é o passado de "see" (ver)?',
                                    opcoes: ['saw', 'seed', 'seen', 'soor'],
                                    respostaCorreta: 'saw',
                                    audio: 'saw'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Completa: "Yesterday we _____ to Inhambane."',
                                    opcoes: ['go', 'went', 'gone', 'going'],
                                    respostaCorreta: 1,
                                    explicacao: 'O passado de go é went.'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'b1_b2',
            nivelNum: 3,
            titulo: 'Nível 3: B1 & B2 (Intermédio & Independente)',
            cefr: 'B1-B2',
            cor: '#FF7675',
            icone: '⚡',
            descricao: 'Debates, ambiente de negócios, entrevistas e fluência contextual.',
            modulos: [
                {
                    id: 'mod_3_1',
                    titulo: 'Módulo 1: Entrevistas & Mundo Profissional',
                    licoes: [
                        {
                            id: 'lic_3_1_1',
                            titulo: 'Apresentação Profissional & Habilidades',
                            flashcards: [
                                { palavra: 'Leadership skills', traducao: 'Competências de liderança', exemplo: 'Strong leadership skills are essential for this role.', exTraducao: 'Fortes competências de liderança são essenciais para esta função.', audio: 'Strong leadership skills are essential for this role.', dica: 'Muito valorizado no mercado global.' },
                                { palavra: 'Problem-solving', traducao: 'Resolução de problemas', exemplo: 'I excel at problem-solving under pressure.', exTraducao: 'Eu destaco-me na resolução de problemas sob pressão.', audio: 'I excel at problem-solving under pressure.', dica: 'Expressão chave em currículos.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Job Interview in an International Company',
                                contexto: 'Um candidato responde a perguntas estratégicas durante a entrevista.',
                                frases: [
                                    { texto: 'Thank you for giving me the opportunity to interview today.', traducao: 'Obrigado por me dar a oportunidade de ser entrevistado hoje.', audio: 'Thank you for giving me the opportunity to interview today.' },
                                    { texto: 'Over the last three years, I led a successful team in digital marketing.', traducao: 'Nos últimos três anos, liderei uma equipa de sucesso em marketing digital.', audio: 'Over the last three years, I led a successful team in digital marketing.' },
                                    { texto: 'I am passionate about continuous learning and cross-cultural communication.', traducao: 'Sou apaixonado por aprendizagem contínua e comunicação intercultural.', audio: 'I am passionate about continuous learning and cross-cultural communication.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa a expressão "under pressure"?',
                                    opcoes: ['Sob pressão', 'Sem pressa', 'Com facilidade', 'Em silêncio'],
                                    respostaCorreta: 'Sob pressão',
                                    audio: 'under pressure'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se diz "Tenho experiência na área de tecnologia"?',
                                    opcoes: ['I have experience in the tech industry.', 'I am tech experienced industry.', 'I hold tech experience.', 'I make technology field.'],
                                    respostaCorreta: 0,
                                    explicacao: '"I have experience in..." é a estrutura padrão.'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'c1_c2',
            nivelNum: 4,
            titulo: 'Nível 4: C1 & C2 (Avançado & Fluência Total)',
            cefr: 'C1-C2',
            cor: '#E056FD',
            icone: '👑',
            descricao: 'Expressões idiomáticas nativas, redação académica e negociação de alto nível.',
            modulos: [
                {
                    id: 'mod_4_1',
                    titulo: 'Módulo 1: Expressões Nativas & Retórica',
                    licoes: [
                        {
                            id: 'lic_4_1_1',
                            titulo: 'Idioms & Nuances de Comunicação',
                            flashcards: [
                                { palavra: 'Hit the nail on the head', traducao: 'Acertar em cheio / No ponto exato', exemplo: 'Your analysis hit the nail on the head.', exTraducao: 'A tua análise acertou em cheio no problema.', audio: 'Your analysis hit the nail on the head.', dica: 'Expressão idiomática para precisão absoluta.' },
                                { palavra: 'Beyond the shadow of a doubt', traducao: 'Sem sombra de dúvida', exemplo: 'She proved her theory beyond the shadow of a doubt.', exTraducao: 'Ela provou a sua teoria sem qualquer sombra de dúvida.', audio: 'She proved her theory beyond the shadow of a doubt.', dica: 'Nível C2 para certeza categórica.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Global Innovation and Africa’s Tech Rise',
                                contexto: 'Um ensaio sobre a transformação tecnológica em África.',
                                frases: [
                                    { texto: 'Africa stands at the threshold of an unprecedented digital revolution.', traducao: 'África está no limiar de uma revolução digital sem precedentes.', audio: 'Africa stands at the threshold of an unprecedented digital revolution.' },
                                    { texto: 'Young innovators are leveraging artificial intelligence to solve local challenges.', traducao: 'Jovens inovadores estão a alavancar a inteligência artificial para resolver desafios locais.', audio: 'Young innovators are leveraging artificial intelligence to solve local challenges.' },
                                    { texto: 'Mastering languages bridges the divide between local wisdom and global impact.', traducao: 'Dominar idiomas constrói a ponte entre a sabedoria local e o impacto global.', audio: 'Mastering languages bridges the divide between local wisdom and global impact.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "hit the nail on the head"?',
                                    opcoes: ['Acertar em cheio', 'Bater um prego', 'Cometer um erro grave', 'Chegar atrasado'],
                                    respostaCorreta: 'Acertar em cheio',
                                    audio: 'hit the nail on the head'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual palavra é sinónimo de "unprecedented"?',
                                    opcoes: ['Never seen before', 'Commonplace', 'Outdated', 'Predictable'],
                                    respostaCorreta: 0,
                                    explicacao: '"Unprecedented" significa sem precedentes, nunca antes visto.'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
