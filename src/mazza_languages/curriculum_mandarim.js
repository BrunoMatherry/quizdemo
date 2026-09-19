// Mazza Language - Curriculum Completo e Robusto de Mandarim (HSK 1 a HSK 6)
// Dividido em Níveis HSK e Unidades Temáticas com Hanzi, Pinyin e Leitura Guiada

export const curriculumMandarim = {
    id: 'mandarim',
    nome: 'Mazza Mandarim',
    bandeira: '🇨🇳',
    idiomaCodigo: 'zh-CN',
    descricao: 'Aprende Mandarim do Zero ao HSK 6 com os 4 tons, caracteres Hanzi, Pinyin fonético, Unidades práticas, Histórias e Exames de Certificação.',
    niveis: [
        {
            codigo: 'hsk1',
            nivelNum: 0,
            titulo: 'Nível 1: HSK 1 (Iniciação Total & 4 Tons)',
            cefr: 'HSK 1',
            cor: '#E74C3C',
            icone: '🏮',
            descricao: 'Aprende saudações, números de 1 a 100, pronomes, família básica, comida e os 4 tons fonéticos.',
            unidades: [
                {
                    id: 'u_zh_1_1',
                    numero: 1,
                    titulo: 'Unidade 1: Saudações & Primeiras Palavras (问候)',
                    descricao: 'Aprende a dizer olá, obrigado, adeus e apresentar o teu nome.',
                    icone: '👋',
                    licoes: [
                        {
                            id: 'lic_zh_1_1_1',
                            titulo: '1. Olá e Agradecimentos (你好 & 谢谢)',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: '你好', pinyin: 'Nǐ hǎo', traducao: 'Olá', exemplo: '你好！我是李明。', pinyinExemplo: 'Nǐ hǎo! Wǒ shì Lǐ Míng.', exTraducao: 'Olá! Eu sou o Li Ming.', audio: '你好！我是李明。', dica: 'Saudação formada por 你 (tu) + 好 (bom).' },
                                { palavra: '谢谢', pinyin: 'Xièxie', traducao: 'Obrigado / Obrigada', exemplo: '谢谢你的帮助！', pinyinExemplo: 'Xièxie nǐ de bāngzhù!', exTraducao: 'Obrigado pela tua ajuda!', audio: '谢谢你的帮助！', dica: 'O primeiro Xiè tem tom 4 e o segundo é tom neutro.' },
                                { palavra: '不客气', pinyin: 'Bú kèqi', traducao: 'De nada', exemplo: '不客气，请进！', pinyinExemplo: 'Bú kèqi, qǐng jìn!', exTraducao: 'De nada, entra por favor!', audio: '不客气，请进！', dica: 'Literalmente: "não seja cerimonioso".' },
                                { palavra: '再见', pinyin: 'Zàijiàn', traducao: 'Adeus / Até logo', exemplo: '老师，再见！', pinyinExemplo: 'Lǎoshī, zàijiàn!', exTraducao: 'Professor, adeus!', audio: '老师，再见！', dica: '再 (de novo) + 见 (ver-nos).' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Primeiro Encontro no Instituto Confúcio',
                                contexto: 'Carlos e o Professor Wang conhecem-se na universidade em Maputo.',
                                frases: [
                                    { texto: '你好！请问你叫什么名字？', pinyin: 'Nǐ hǎo! Qǐngwèn nǐ jiào shénme míngzi?', traducao: 'Olá! Por favor, como te chamas?', audio: '你好！请问你叫什么名字？' },
                                    { texto: '你好！我叫 Carlos，我是莫桑比克学生。', pinyin: 'Nǐ hǎo! Wǒ jiào Carlos, wǒ shì Mòsāngbǐkè xuésheng.', traducao: 'Olá! Chamo-me Carlos, sou estudante moçambicano.', audio: '你好！我叫 Carlos，我是莫桑比克学生。' },
                                    { texto: '很高兴认识你！我叫王老师。', pinyin: 'Hěn gāoxìng rènshi nǐ! Wǒ jiào Wáng lǎoshī.', traducao: 'Muito prazer em conhecer-te! Sou o Professor Wang.', audio: '很高兴认识你！我叫王老师。' },
                                    { texto: '谢谢王老师！明天见！', pinyin: 'Xièxie Wáng lǎoshī! Míngtiān jiàn!', traducao: 'Obrigado Professor Wang! Até amanhã!', audio: '谢谢王老师！明天见！' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "你好" (Nǐ hǎo)?',
                                    opcoes: ['Olá', 'Adeus', 'Obrigado', 'Por favor'],
                                    respostaCorreta: 'Olá',
                                    audio: '你好'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Ordena: "你好！我叫 Carlos。"',
                                    palavrasEmbaralhadas: ['Carlos。', '我叫', '你好！'],
                                    ordemCorreta: ['你好！', '我叫', 'Carlos。']
                                },
                                {
                                    tipo: 'ouvir_escolher',
                                    enunciado: 'Ouve a fala e escolhe o significado:',
                                    audio: '谢谢你！',
                                    opcoes: ['Obrigado a ti!', 'Bom dia!', 'Até amanhã!'],
                                    respostaCorreta: 'Obrigado a ti!'
                                },
                                {
                                    tipo: 'associar_pares',
                                    enunciado: 'Associa os termos em chinês às traduções:',
                                    pares: [
                                        { original: '你好 (Nǐ hǎo)', traducao: 'Olá' },
                                        { original: '谢谢 (Xièxie)', traducao: 'Obrigado' },
                                        { original: '再见 (Zàijiàn)', traducao: 'Adeus' },
                                        { original: '不客气 (Bú kèqi)', traducao: 'De nada' }
                                    ]
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual é o Pinyin correto para a palavra "再见" (Adeus)?',
                                    opcoes: ['Zàijiàn', 'Xièxie', 'Nǐ hǎo', 'Duìbuqǐ'],
                                    respostaCorreta: 0,
                                    explicacao: '再见 lê-se "Zàijiàn" e significa até à vista / adeus.'
                                },
                                {
                                    pergunta: 'Como se diz "estudante" em mandarim?',
                                    opcoes: ['学生 (xuésheng)', '老师 (lǎoshī)', '医生 (yīshēng)', '朋友 (péngyou)'],
                                    respostaCorreta: 0,
                                    explicacao: '学生 (xuésheng) significa estudante.'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'u_zh_1_2',
                    numero: 2,
                    titulo: 'Unidade 2: Números & Compras no Mercado (数字与购物)',
                    descricao: 'Aprende a contar de 1 a 100 e a perguntar preços de frutas.',
                    icone: '🪙',
                    licoes: [
                        {
                            id: 'lic_zh_1_2_1',
                            titulo: '1. Números de 1 a 10 (一到十)',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: '一, 二, 三', pinyin: 'Yī, Èr, Sān', traducao: '1, 2, 3', exemplo: '三本书', pinyinExemplo: 'Sān běn shū', exTraducao: 'Três livros', audio: '一, 二, 三', dica: 'Traços horizontais simples.' },
                                { palavra: '四, 五, 六', pinyin: 'Sì, Wǔ, Liù', traducao: '4, 5, 6', exemplo: '六个苹果', pinyinExemplo: 'Liù gè píngguǒ', exTraducao: 'Seis maçãs', audio: '四, 五, 六', dica: 'Sì tem som de "ss" chiado.' },
                                { palavra: '七, 八, 九, 十', pinyin: 'Qī, Bā, Jiǔ, Shí', traducao: '7, 8, 9, 10', exemplo: '十块钱', pinyinExemplo: 'Shí kuài qián', exTraducao: 'Dez yuans', audio: '七, 八, 九, 十', dica: '八 (8) é o número da prosperidade na China!' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Comprando Maçãs',
                                contexto: 'Conversa no mercado de rua.',
                                frases: [
                                    { texto: '老板，这个苹果多少钱？', pinyin: 'Lǎobǎn, zhège píngguǒ duōshao qián?', traducao: 'Chefe, quanto custa esta maçã?', audio: '老板，这个苹果多少钱？' },
                                    { texto: '五块钱一个，十块钱三个。', pinyin: 'Wǔ kuài qián yī gè, shí kuài qián sān gè.', traducao: 'Cinco yuans cada uma, dez yuans por três.', audio: '五块钱一个，十块钱三个。' },
                                    { texto: '太好了！我要六个苹果。', pinyin: 'Tài hǎo le! Wǒ yào liù gè píngguǒ.', traducao: 'Excelente! Eu quero seis maçãs.', audio: '太好了！我要六个苹果。' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Qual caractere representa o número 10?',
                                    opcoes: ['十 (shí)', '八 (bā)', '四 (sì)', '二 (èr)'],
                                    respostaCorreta: '十 (shí)',
                                    audio: '十'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se pergunta "Quanto custa?" em chinês?',
                                    opcoes: ['多少钱？ (Duōshao qián?)', '谁来了？ (Shéi lái le?)', '在做什么？ (Zài zuò shénme?)', '几点了？ (Jǐ diǎn le?)'],
                                    respostaCorreta: 0,
                                    explicacao: '多少钱 significa quanto dinheiro / quanto custa.'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'hsk2',
            nivelNum: 1,
            titulo: 'Nível 2: HSK 2 (Comunicação Prática & Restaurante)',
            cefr: 'HSK 2',
            cor: '#16A085',
            icone: '🐉',
            descricao: 'Pedir comida em restaurantes chineses, transportes, direções e horários.',
            unidades: [
                {
                    id: 'u_zh_2_1',
                    numero: 1,
                    titulo: 'Unidade 1: Restaurante & Culinária Chinesa (饭馆与美食)',
                    descricao: 'Vocabulário de pratos típicos, beber chá e fazer pedidos.',
                    icone: '🥢',
                    licoes: [
                        {
                            id: 'lic_zh_2_1_1',
                            titulo: '1. Pedir Pratos e Chá Verde (点菜与喝茶)',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: '米饭', pinyin: 'Mǐfàn', traducao: 'Arroz cozido', exemplo: '请给我一碗米饭。', pinyinExemplo: 'Qǐng gěi wǒ yī wǎn mǐfàn.', exTraducao: 'Por favor dê-me uma tigela de arroz.', audio: '请给我一碗米饭。', dica: 'Alimento básico diário na China.' },
                                { palavra: '喝茶', pinyin: 'Hē chá', traducao: 'Beber chá', exemplo: '中国绿茶非常香。', pinyinExemplo: 'Zhōngguó lǜchá fēicháng xiāng.', exTraducao: 'O chá verde chinês é muito aromático.', audio: '中国绿茶非常香。', dica: 'O chá é servido tradicionalmente morno.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Almoço Tradicional com Colegas',
                                contexto: 'Pedir comida num restaurante chinês.',
                                frases: [
                                    { texto: '服务员，请给我们菜单。', pinyin: 'Fúwùyuán, qǐng gěi wǒmen càidān.', traducao: 'Empregado, por favor dê-nos o menu.', audio: '服务员，请给我们菜单。' },
                                    { texto: '我们要一份牛肉炒饭和一壶绿茶。', pinyin: 'Wǒmen yào yī fèn niúròu chǎofàn hé yī hú lǜchá.', traducao: 'Queremos um arroz frito de carne de vaca e um bule de chá verde.', audio: '我们要一份牛肉炒饭和一壶绿茶。' },
                                    { texto: '好的，请稍等，菜马上就来！', pinyin: 'Hǎo de, qǐng shāoděng, cài mǎshàng jiù lái!', traducao: 'Com certeza, aguardem um momento, os pratos saem já!', audio: '好的，请稍等，菜马上就来！' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "服务员" (fúwùyuán)?',
                                    opcoes: ['Empregado de mesa / Garçom', 'Professor', 'Cozinheiro', 'Motorista'],
                                    respostaCorreta: 'Empregado de mesa / Garçom',
                                    audio: '服务员'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se diz "menu" em chinês?',
                                    opcoes: ['菜单 (càidān)', '米饭 (mǐfàn)', '茶水 (cháshuǐ)', '买单 (mǎidān)'],
                                    respostaCorreta: 0,
                                    explicacao: '菜单 (càidān) significa menu ou cardápio.'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'hsk3_hsk4',
            nivelNum: 2,
            titulo: 'Nível 3: HSK 3 & 4 (Intermédio & Viagens na China)',
            cefr: 'HSK 3-4',
            cor: '#8E44AD',
            icone: '⛩️',
            descricao: 'Expressar sentimentos, viajar de comboio de alta velocidade e cultura geral.',
            unidades: [
                {
                    id: 'u_zh_3_1',
                    numero: 1,
                    titulo: 'Unidade 1: Viagens de Trem de Alta Velocidade (坐高铁旅行)',
                    descricao: 'Apanhar comboios bala, comprar bilhetes online e reservar hotéis.',
                    icone: '🚄',
                    licoes: [
                        {
                            id: 'lic_zh_3_1_1',
                            titulo: '1. De Pequim a Xangai em 4 Horas',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: '高铁', pinyin: 'Gāotiě', traducao: 'Comboio de Alta Velocidade', exemplo: '中国高铁时速超过三百公里。', pinyinExemplo: 'Zhōngguó gāotiě shísù chāoguò sān bǎi gōnglǐ.', exTraducao: 'O comboio de alta velocidade chinês ultrapassa 300 km/h.', audio: '中国高铁时速超过三百公里。', dica: 'Rede mais extensa do mundo.' },
                                { palavra: '方便', pinyin: 'Fāngbiàn', traducao: 'Conveniente / Prático', exemplo: '在线购票非常方便。', pinyinExemplo: 'Zàixiàn gòupiào fēicháng fāngbiàn.', exTraducao: 'Comprar bilhetes online é muito conveniente.', audio: '在线购票非常方便。', dica: 'Usado constantemente no dia-a-dia moderno.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Viagem no Comboio Fuxing',
                                contexto: 'Experiência de alta tecnologia sobre carris.',
                                frases: [
                                    { texto: '今天我们要乘坐复兴号高铁去上海。', pinyin: 'Jīntiān wǒmen yào chéngzuò Fùxīnghào gāotiě qù Shànghǎi.', traducao: 'Hoje vamos apanhar o comboio de alta velocidade Fuxing para Xangai.', audio: '今天我们要乘坐复兴号高铁去上海。' },
                                    { texto: '车厢内非常安静，而且提供高速无线网络。', pinyin: 'Chēxiāng nèi fēicháng ānjìng, érqiě tígōng gāosù wúxiàn wǎngluò.', traducao: 'O interior da carruagem é muito silencioso e oferece Wi-Fi de alta velocidade.', audio: '车厢内非常安静，而且提供高速无线网络。' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "安静" (ānjìng)?',
                                    opcoes: ['Silencioso / Calmo', 'Barulhento', 'Lento', 'Caro'],
                                    respostaCorreta: 'Silencioso / Calmo',
                                    audio: '安静'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual a abreviatura de ferrovia de alta velocidade em chinês?',
                                    opcoes: ['高铁 (Gāotiě)', '地铁 (Dìtiě)', '火车 (Huǒchē)', '飞机 (Fēijī)'],
                                    respostaCorreta: 0,
                                    explicacao: '高铁 (Gāotiě) é o comboio de alta velocidade.'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            codigo: 'hsk5_hsk6',
            nivelNum: 3,
            titulo: 'Nível 4: HSK 5 & 6 (Avançado, Negócios & Chengyu)',
            cefr: 'HSK 5-6',
            cor: '#D35400',
            icone: '🐼',
            descricao: 'Contratos comerciais, cooperação internacional, provérbios clássicos Chengyu e diplomacia.',
            unidades: [
                {
                    id: 'u_zh_4_1',
                    numero: 1,
                    titulo: 'Unidade 1: Sabedoria Tradicional & Provérbios Chengyu (成语智慧)',
                    descricao: 'Provérbios de 4 caracteres que expressam sabedoria milenar.',
                    icone: '📜',
                    licoes: [
                        {
                            id: 'lic_zh_4_1_1',
                            titulo: '1. Provérbios Clássicos de Sucesso',
                            tipo: 'padrao',
                            flashcards: [
                                { palavra: '一石二鸟', pinyin: 'Yī shí èr niǎo', traducao: 'Matar dois coelhos de uma cajadada só (uma pedra, dois pássaros)', exemplo: '这项创新技术既环保又节能，真是一石二鸟。', pinyinExemplo: 'Zhè xiàng chuàngxīn jìshù jì huánbǎo yòu jiénéng, zhēn shì yī shí èr niǎo.', exTraducao: 'Esta tecnologia inovadora é ecológica e poupa energia, é mesmo dois pássaros com uma pedra.', audio: '一石二鸟', dica: 'Chengyu célebre para eficácia dupla.' },
                                { palavra: '千里之行，始于足下', pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià', traducao: 'Uma jornada de mil milhas começa com um simples passo', exemplo: '坚持每天在 Mazza Language 学习，千里之行始于足下。', pinyinExemplo: 'Jiānchí měitiān zài Mazza Language xuéxí, qiān lǐ zhī xíng shǐ yú zú xià.', exTraducao: 'Mantém o estudo diário no Mazza Language, pois uma caminhada de mil milhas começa com o primeiro passo.', audio: '千里之行，始于足下。', dica: 'Provérbio clássico de Lao Tsé.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: O Futuro da Cooperação Moçambique-China',
                                contexto: 'Discurso sobre o fortalecimento das relações bilaterais.',
                                frases: [
                                    { texto: '中非友谊源远流长，经贸往来与文化交流不断深化。', pinyin: 'Zhōng-Fēi yǒuyì yuányuǎnliúcháng, jīngmào wǎnglái yǔ wénhuà jiāoliú bùduàn shēnhuà.', traducao: 'A amizade entre a China e a África tem raízes profundas, e os intercâmbios económicos e culturais continuam a aprofundar-se.', audio: '中非友谊源远流长，经贸往来与文化交流不断深化。' },
                                    { texto: '青年人才掌握双语能力，是促进两地共同繁荣的关键桥梁。', pinyin: 'Qīngnián réncái zhǎngwò shuāngyǔ nénglì, shì cùjìn liǎng dì gòngtóng fánróng de guānjiàn qiáoliáng.', traducao: 'Os jovens talentos que dominam ambas as línguas são a ponte essencial para promover a prosperidade comum.', audio: '青年人才掌握双语能力，是促进两地共同繁荣的关键桥梁。' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que expressa o Chengyu "一石二鸟"?',
                                    opcoes: ['Alcançar dois objetivos com uma única ação', 'Perder tempo', 'Proteger os pássaros', 'Atirar pedras'],
                                    respostaCorreta: 'Alcançar dois objetivos com uma única ação',
                                    audio: '一石二鸟'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Quem é o autor do provérbio "千里之行，始于足下"?',
                                    opcoes: ['Lao Tsé (老子)', 'Confúcio (孔子)', 'Sun Tzu (孙子)', 'Li Bai (李白)'],
                                    respostaCorreta: 0,
                                    explicacao: 'É um provérbio atribuído ao filósofo Laozi no Tao Te Ching.'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
