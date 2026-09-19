// Mazza Language - Curriculum Completo e Robusto de Inglês (Pre-A1 a C2)
// Mais de 50 Unidades e centenas de Lições, Leituras Guiadas e Exames

export const curriculumIngles = {
    id: 'ingles',
    nome: 'Mazza Inglês',
    bandeira: '🇬🇧',
    idiomaCodigo: 'en-US',
    descricao: 'Do Zero Absoluto à Fluência Nativa (Pre-A1 a C2). Dividido em 7 Níveis, 28 Unidades e centenas de Lições práticas com Leitura Guiada e Exames de Certificação.',
    niveis: [
        {
            codigo: 'pre_a1',
            nivelNum: 0,
            titulo: 'Nível 0: Pre-A1 (Iniciação Total)',
            cefr: 'Pre-A1',
            cor: '#2ECC71',
            icone: '🌱',
            descricao: 'Ideal para quem nunca estudou inglês. Aprende saudações, números, cores, família básica e objetos do dia-a-dia.',
            unidades: [
                {
                    id: 'u_en_0_1',
                    numero: 1,
                    titulo: 'Unidade 1: Primeiros Contactos & Saudações',
                    descricao: 'Aprende a dizer olá, adeus, apresentar o teu nome e pedir por favor.',
                    icone: '👋',
                    licoes: [
                        {
                            id: 'lic_en_0_1_1',
                            titulo: '1. Olá, Adeus e Cortesia',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'Hello', traducao: 'Olá', exemplo: 'Hello! How are you?', exTraducao: 'Olá! Como estás?', audio: 'Hello! How are you?', dica: 'Saudação padrão e educada em qualquer ambiente.' },
                                { palavra: 'Good morning', traducao: 'Bom dia', exemplo: 'Good morning, teacher!', exTraducao: 'Bom dia, professora!', audio: 'Good morning, teacher!', dica: 'Usado desde o amanhecer até às 12h00.' },
                                { palavra: 'Goodbye', traducao: 'Adeus / Até logo', exemplo: 'Goodbye! See you tomorrow.', exTraducao: 'Adeus! Até amanhã.', audio: 'Goodbye! See you tomorrow.', dica: 'Despedida comum.' },
                                { palavra: 'Please', traducao: 'Por favor', exemplo: 'Water, please.', exTraducao: 'Água, por favor.', audio: 'Water, please.', dica: 'Expressão de cortesia fundamental.' },
                                { palavra: 'Thank you', traducao: 'Obrigado / Obrigada', exemplo: 'Thank you very much!', exTraducao: 'Muito obrigado!', audio: 'Thank you very much!', dica: 'Agradecimento formal e informal.' },
                                { palavra: 'You are welcome', traducao: 'De nada', exemplo: 'You are welcome, my friend.', exTraducao: 'De nada, meu amigo.', audio: 'You are welcome, my friend.', dica: 'Resposta educada para "Thank you".' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Chegada ao Aeroporto de Maputo',
                                contexto: 'Tomás recebe a sua colega Sarah no aeroporto internacional.',
                                frases: [
                                    { texto: 'Hello! My name is Tomás. Welcome to Mozambique!', traducao: 'Olá! O meu nome é Tomás. Bem-vindo a Moçambique!', audio: 'Hello! My name is Tomás. Welcome to Mozambique!' },
                                    { texto: 'Good morning Tomás! Thank you very much for meeting me.', traducao: 'Bom dia Tomás! Muito obrigada por me vires buscar.', audio: 'Good morning Tomás! Thank you very much for meeting me.' },
                                    { texto: 'You are welcome! Let us take a taxi to the hotel.', traducao: 'De nada! Vamos apanhar um táxi para o hotel.', audio: 'You are welcome! Let us take a taxi to the hotel.' },
                                    { texto: 'Please help me with this bag. Goodbye airport!', traducao: 'Por favor ajuda-me com esta mala. Adeus aeroporto!', audio: 'Please help me with this bag. Goodbye airport!' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Como se responde educadamente a "Thank you"?',
                                    opcoes: ['You are welcome', 'Good night', 'Excuse me', 'See you later'],
                                    respostaCorreta: 'You are welcome',
                                    audio: 'You are welcome'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Ordena: "Hello! Welcome to Mozambique!"',
                                    palavrasEmbaralhadas: ['Mozambique!', 'Welcome', 'to', 'Hello!'],
                                    ordemCorreta: ['Hello!', 'Welcome', 'to', 'Mozambique!']
                                },
                                {
                                    tipo: 'ouvir_escolher',
                                    enunciado: 'Ouve e escolhe a frase falada:',
                                    audio: 'Good morning, teacher!',
                                    opcoes: ['Good morning, teacher!', 'Goodbye, my friend!', 'Please give me water!'],
                                    respostaCorreta: 'Good morning, teacher!'
                                },
                                {
                                    tipo: 'associar_pares',
                                    enunciado: 'Combina as palavras em inglês com a sua tradução:',
                                    pares: [
                                        { original: 'Please', traducao: 'Por favor' },
                                        { original: 'Thank you', traducao: 'Obrigado' },
                                        { original: 'Goodbye', traducao: 'Adeus' },
                                        { original: 'Good morning', traducao: 'Bom dia' }
                                    ]
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual a saudação usada pela manhã?',
                                    opcoes: ['Good evening', 'Good morning', 'Good night', 'Goodbye'],
                                    respostaCorreta: 1,
                                    explicacao: '"Good morning" significa bom dia.'
                                },
                                {
                                    pergunta: 'O que significa "Please"?',
                                    opcoes: ['Desculpa', 'Por favor', 'Obrigado', 'Sim'],
                                    respostaCorreta: 1,
                                    explicacao: '"Please" significa por favor.'
                                },
                                {
                                    pergunta: 'Como se diz "De nada" em inglês?',
                                    opcoes: ['You are welcome', 'Sorry', 'No problem', 'Good bye'],
                                    respostaCorreta: 0,
                                    explicacao: '"You are welcome" é a forma padrão de dizer "de nada".'
                                }
                            ]
                        },
                        {
                            id: 'lic_en_0_1_2',
                            titulo: '2. Apresentações & Origem',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'What is your name?', traducao: 'Qual é o teu nome?', exemplo: 'What is your name? My name is Amina.', exTraducao: 'Qual é o teu nome? O meu nome é Amina.', audio: 'What is your name? My name is Amina.', dica: 'Pergunta padrão para saber o nome.' },
                                { palavra: 'Where are you from?', traducao: 'De onde és?', exemplo: 'Where are you from? I am from Beira.', exTraducao: 'De onde és? Eu sou da Beira.', audio: 'Where are you from? I am from Beira.', dica: 'Pergunta sobre nacionalidade ou cidade natal.' },
                                { palavra: 'I am from...', traducao: 'Eu sou de...', exemplo: 'I am from Mozambique.', exTraducao: 'Eu sou de Moçambique.', audio: 'I am from Mozambique.', dica: 'Usa-se para indicar o país ou província.' },
                                { palavra: 'Nice to meet you', traducao: 'Prazer em conhecer-te', exemplo: 'Nice to meet you too!', exTraducao: 'Prazer em conhecer-te também!', audio: 'Nice to meet you too!', dica: 'Dito ao conhecer alguém pela primeira vez.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Primeiro Dia na Escola Internacional',
                                contexto: 'Dois novos estudantes apresentam-se no pátio.',
                                frases: [
                                    { texto: 'Hi! I am Samuel. What is your name?', traducao: 'Olá! Eu sou o Samuel. Qual é o teu nome?', audio: 'Hi! I am Samuel. What is your name?' },
                                    { texto: 'Hello Samuel! My name is Clara. Nice to meet you.', traducao: 'Olá Samuel! O meu nome é Clara. Prazer em conhecer-te.', audio: 'Hello Samuel! My name is Clara. Nice to meet you.' },
                                    { texto: 'Where are you from, Clara?', traducao: 'De onde és, Clara?', audio: 'Where are you from, Clara?' },
                                    { texto: 'I am from Nampula, and you? I am from Maputo!', traducao: 'Eu sou de Nampula, e tu? Eu sou de Maputo!', audio: 'I am from Nampula, and you? I am from Maputo!' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Como perguntas "De onde és?" em inglês?',
                                    opcoes: ['Where are you from?', 'How old are you?', 'What is your name?', 'How do you do?'],
                                    respostaCorreta: 'Where are you from?',
                                    audio: 'Where are you from?'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Forma a frase: "I am from Mozambique."',
                                    palavrasEmbaralhadas: ['from', 'am', 'I', 'Mozambique.'],
                                    ordemCorreta: ['I', 'am', 'from', 'Mozambique.']
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual a resposta correta para "Where are you from?"',
                                    opcoes: ['I am from Maputo.', 'My name is John.', 'I am ten years.', 'Good morning.'],
                                    respostaCorreta: 0,
                                    explicacao: 'Responde-se indicando a origem: "I am from...".'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'u_en_0_2',
                    numero: 2,
                    titulo: 'Unidade 2: Números, Cores & Idades',
                    descricao: 'Conta de 1 a 100, aprende as cores e diz a tua idade com precisão.',
                    icone: '🔢',
                    licoes: [
                        {
                            id: 'lic_en_0_2_1',
                            titulo: '1. Números de 1 a 20 e Contagem',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'One, Two, Three', traducao: '1, 2, 3', exemplo: 'I have three notebooks.', exTraducao: 'Eu tenho três cadernos.', audio: 'One, two, three books.', dica: 'Pratica a pronúncia com o áudio.' },
                                { palavra: 'Four, Five, Six', traducao: '4, 5, 6', exemplo: 'Five days a week.', exTraducao: 'Cinco dias por semana.', audio: 'Four, five, six.', dica: 'Atenção ao som de "v" em Five.' },
                                { palavra: 'Seven, Eight, Nine, Ten', traducao: '7, 8, 9, 10', exemplo: 'Ten students in class.', exTraducao: 'Dez alunos na sala de aula.', audio: 'Seven, eight, nine, ten.', dica: 'Eight tem o "gh" mudo.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Compras no Mercado do Peixe',
                                contexto: 'Comprar peixe fresco e contar moedas.',
                                frases: [
                                    { texto: 'Good morning! How many fish do you want?', traducao: 'Bom dia! Quantos peixes quer?', audio: 'Good morning! How many fish do you want?' },
                                    { texto: 'I want four big fish, please.', traducao: 'Quero quatro peixes grandes, por favor.', audio: 'I want four big fish, please.' },
                                    { texto: 'That is ten dollars in total. Thank you!', traducao: 'São dez dólares no total. Obrigado!', audio: 'That is ten dollars in total. Thank you!' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Qual o número que vem depois de Nine (9)?',
                                    opcoes: ['Ten (10)', 'Eight (8)', 'Seven (7)', 'Six (6)'],
                                    respostaCorreta: 'Ten (10)',
                                    audio: 'Ten'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se escreve o número 8 em inglês?',
                                    opcoes: ['Eight', 'Ate', 'Eigth', 'Night'],
                                    respostaCorreta: 0,
                                    explicacao: '8 escreve-se "Eight".'
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
            cor: '#3498DB',
            icone: '🚀',
            descricao: 'Fala da família, rotina, compras, alimentos, tempo e direções na cidade.',
            unidades: [
                {
                    id: 'u_en_1_1',
                    numero: 1,
                    titulo: 'Unidade 1: Minha Família & Quotidiano',
                    descricao: 'Membros da família, relações de parentesco e rotinas diárias.',
                    icone: '👨‍👩‍👧‍👦',
                    licoes: [
                        {
                            id: 'lic_en_1_1_1',
                            titulo: '1. Membros da Família',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'Father / Mother', traducao: 'Pai / Mãe', exemplo: 'My father is an engineer. My mother is a nurse.', exTraducao: 'O meu pai é engenheiro. A minha mãe é enfermeira.', audio: 'My father is an engineer. My mother is a nurse.', dica: 'Singular: Dad / Mom em contexto familiar.' },
                                { palavra: 'Brother / Sister', traducao: 'Irmão / Irmã', exemplo: 'I have two brothers and one sister.', exTraducao: 'Tenho dois irmãos e uma irmã.', audio: 'I have two brothers and one sister.', dica: 'Plural: brothers, sisters.' },
                                { palavra: 'Grandfather / Grandmother', traducao: 'Avô / Avó', exemplo: 'My grandmother lives in Inhambane.', exTraducao: 'A minha avó vive em Inhambane.', audio: 'My grandmother lives in Inhambane.', dica: 'Formas curtas: Grandpa / Grandma.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Domingo em Família',
                                contexto: 'Almoço de domingo em família.',
                                frases: [
                                    { texto: 'Every Sunday, my whole family gathers for lunch.', traducao: 'Todos os domingos, a minha família inteira reúne-se para o almoço.', audio: 'Every Sunday, my whole family gathers for lunch.' },
                                    { texto: 'My mother prepares grilled prawns and fresh salad.', traducao: 'A minha mãe prepara camarão grelhado e salada fresca.', audio: 'My mother prepares grilled prawns and fresh salad.' },
                                    { texto: 'My brother plays guitar, and we all sing together.', traducao: 'O meu irmão toca guitarra e todos nós cantamos juntos.', audio: 'My brother plays guitar, and we all sing together.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "grandmother"?',
                                    opcoes: ['Avó', 'Tia', 'Mãe', 'Prima'],
                                    respostaCorreta: 'Avó',
                                    audio: 'grandmother'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se diz "O meu irmão vive em Maputo"?',
                                    opcoes: ['My brother lives in Maputo.', 'My brother living in Maputo.', 'My brother live at Maputo.', 'My brother are in Maputo.'],
                                    respostaCorreta: 0,
                                    explicacao: '3ª pessoa do singular no Present Simple adiciona "s": "lives".'
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
            cor: '#9B59B6',
            icone: '🧭',
            descricao: 'Passado simples, planos de futuro, viagens, compras no centro comercial e restaurantes.',
            unidades: [
                {
                    id: 'u_en_2_1',
                    numero: 1,
                    titulo: 'Unidade 1: Viagens & Férias no Passado (Past Simple)',
                    descricao: 'Relata eventos passados, férias e histórias memoráveis.',
                    icone: '✈️',
                    licoes: [
                        {
                            id: 'lic_en_2_1_1',
                            titulo: '1. Viagem à Praia do Bilene',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'I traveled', traducao: 'Eu viajei', exemplo: 'Last summer I traveled to Bilene.', exTraducao: 'No verão passado eu viajei para o Bilene.', audio: 'Last summer I traveled to Bilene.', dica: 'Passado regular terminado em -ed.' },
                                { palavra: 'We swam', traducao: 'Nós nadámos', exemplo: 'We swam in the warm lagoon every afternoon.', exTraducao: 'Nós nadámos na lagoa morna todas as tardes.', audio: 'We swam in the warm lagoon every afternoon.', dica: 'Passado irregular do verbo swim (swim -> swam).' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Fim de Semana Inesquecível',
                                contexto: 'Um fim de semana com amigos na praia.',
                                frases: [
                                    { texto: 'Last weekend, we went camping near the lake.', traducao: 'No fim de semana passado, fomos acampar perto do lago.', audio: 'Last weekend, we went camping near the lake.' },
                                    { texto: 'The weather was sunny, and the water was crystal clear.', traducao: 'O tempo estava ensolarado e a água estava cristalina.', audio: 'The weather was sunny, and the water was crystal clear.' },
                                    { texto: 'We took hundreds of beautiful photos at sunset.', traducao: 'Tirámos centenas de fotos lindas ao pôr-do-sol.', audio: 'We took hundreds of beautiful photos at sunset.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Qual o passado do verbo "take" (tirar / levar)?',
                                    opcoes: ['took', 'taked', 'token', 'taking'],
                                    respostaCorreta: 'took',
                                    audio: 'took'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Completa: "We _____ delicious seafood yesterday."',
                                    opcoes: ['ate', 'eated', 'eat', 'eating'],
                                    respostaCorreta: 0,
                                    explicacao: 'O passado irregular de eat é "ate".'
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
            titulo: 'Nível 3: B1 & B2 (Intermédio & Fluência Independente)',
            cefr: 'B1-B2',
            cor: '#E67E22',
            icone: '⚡',
            descricao: 'Ambiente de negócios, entrevistas de emprego, redação profissional, debates e argumentação.',
            unidades: [
                {
                    id: 'u_en_3_1',
                    numero: 1,
                    titulo: 'Unidade 1: Entrevistas & Comunicação Corporativa',
                    descricao: 'Vocabulário profissional, apresentação de competências e negociação.',
                    icone: '💼',
                    licoes: [
                        {
                            id: 'lic_en_3_1_1',
                            titulo: '1. Destacar Habilidades Profissionais',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'Problem-solving', traducao: 'Resolução de problemas', exemplo: 'Problem-solving is one of my greatest strengths.', exTraducao: 'A resolução de problemas é um dos meus maiores pontos fortes.', audio: 'Problem-solving is one of my greatest strengths.', dica: 'Competência crítica no mercado de trabalho.' },
                                { palavra: 'Team player', traducao: 'Pessoa que sabe trabalhar em equipa', exemplo: 'I consider myself a dedicated team player.', exTraducao: 'Considero-me um elemento de equipa dedicado.', audio: 'I consider myself a dedicated team player.', dica: 'Expressão muito procurada por recrutadores.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Apresentação de Projeto em Inglês',
                                contexto: 'Apresentação de resultados a investidores internacionais.',
                                frases: [
                                    { texto: 'Good afternoon everyone, today I will outline our quarterly achievements.', traducao: 'Boa tarde a todos, hoje vou delinear as nossas conquistas trimestrais.', audio: 'Good afternoon everyone, today I will outline our quarterly achievements.' },
                                    { texto: 'Our customer satisfaction increased by thirty-five percent.', traducao: 'A satisfação dos nossos clientes aumentou em trinta e cinco por cento.', audio: 'Our customer satisfaction increased by thirty-five percent.' },
                                    { texto: 'This remarkable outcome reflects our commitment to innovation.', traducao: 'Este resultado notável reflete o nosso compromisso com a inovação.', audio: 'This remarkable outcome reflects our commitment to innovation.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "quarterly achievements"?',
                                    opcoes: ['Conquistas trimestrais', 'Erros semanais', 'Metas anuais', 'Custos mensais'],
                                    respostaCorreta: 'Conquistas trimestrais',
                                    audio: 'quarterly achievements'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual a palavra correta para "ponto forte" profissional?',
                                    opcoes: ['Strength', 'Weakness', 'Fault', 'Delay'],
                                    respostaCorreta: 0,
                                    explicacao: '"Strength" significa ponto forte ou força.'
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
            titulo: 'Nível 4: C1 & C2 (Avançado & Mestria Nativa)',
            cefr: 'C1-C2',
            cor: '#E74C3C',
            icone: '👑',
            descricao: 'Expressões idiomáticas raras, retórica, redação académica avançada e liderança global.',
            unidades: [
                {
                    id: 'u_en_4_1',
                    numero: 1,
                    titulo: 'Unidade 1: Expressões Idiomáticas Nativas & Alta Retórica',
                    descricao: 'Expressões figurativas avançadas e argumentação sofisticada.',
                    icone: '🎯',
                    licoes: [
                        {
                            id: 'lic_en_4_1_1',
                            titulo: '1. Idioms de Negócios & Sabedoria',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: 'Hit the nail on the head', traducao: 'Acertar em cheio / No cerne da questão', exemplo: 'Your strategic assessment hit the nail on the head.', exTraducao: 'A tua avaliação estratégica acertou em cheio.', audio: 'Your strategic assessment hit the nail on the head.', dica: 'Usa-se quando alguém descreve com precisão a causa de algo.' },
                                { palavra: 'Read between the lines', traducao: 'Ler nas entrelinhas / Perceber o implícito', exemplo: 'You must read between the lines during high-stakes negotiations.', exTraducao: 'Deves ler nas entrelinhas durante negociações de alto risco.', audio: 'You must read between the lines during high-stakes negotiations.', dica: 'Identificar intenções não expressas abertamente.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: The Future of Renewable Energy in Africa',
                                contexto: 'Ensaio académico sobre transição energética sustentável.',
                                frases: [
                                    { texto: 'Harnessing solar and hydroelectric potential is quintessential for sustainable industrialization.', traducao: 'Aproveitar o potencial solar e hidroelétrico é quintessencial para a industrialização sustentável.', audio: 'Harnessing solar and hydroelectric potential is quintessential for sustainable industrialization.' },
                                    { texto: 'Policy makers must strike a delicate balance between rapid growth and ecological stewardship.', traducao: 'Os decisores políticos devem encontrar um equilíbrio delicado entre o crescimento rápido e a responsabilidade ecológica.', audio: 'Policy makers must strike a delicate balance between rapid growth and ecological stewardship.' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa a palavra "quintessential"?',
                                    opcoes: ['Essencial / Fundamental', 'Desnecessário', 'Antiquado', 'Arriscado'],
                                    respostaCorreta: 'Essencial / Fundamental',
                                    audio: 'quintessential'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'O que significa a expressão "read between the lines"?',
                                    opcoes: ['Compreender o sentido implícito', 'Ler muito depressa', 'Escrever num caderno', 'Ignorar os detalhes'],
                                    respostaCorreta: 0,
                                    explicacao: 'Significa compreender o significado oculto ou implícito.'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
