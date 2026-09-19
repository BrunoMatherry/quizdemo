// Mazza Mandarim - Dados Estruturados do Zero ao Avançado (HSK 1 a HSK 6)

export const mazzaMandarimData = {
    id: 'mandarim',
    nome: 'Mazza Mandarim',
    bandeira: '🇨🇳',
    idiomaCodigo: 'zh-CN',
    descricao: 'Aprende Chinês Mandarim do zero absoluto até ao nível avançado HSK 6 com Hanzi, Pinyin, Leitura Guiada e Áudio Nativo.',
    niveis: [
        {
            codigo: 'hsk1',
            nivelNum: 0,
            titulo: 'Nível 1: HSK 1 (Iniciação Total & Tons)',
            cefr: 'HSK 1',
            cor: '#FF7675',
            icone: '🏮',
            descricao: 'Saudações, números, família, pronomes básicos e os 4 tons do Mandarim.',
            modulos: [
                {
                    id: 'mod_m_1_1',
                    titulo: 'Módulo 1: Primeiras Palavras & Saudações',
                    licoes: [
                        {
                            id: 'lic_m_1_1_1',
                            titulo: 'Olá, Adeus e Agradecimento (你好 & 谢谢)',
                            flashcards: [
                                {
                                    palavra: '你好',
                                    pinyin: 'Nǐ hǎo',
                                    traducao: 'Olá',
                                    exemplo: '你好！我是李明。',
                                    pinyinExemplo: 'Nǐ hǎo! Wǒ shì Lǐ Míng.',
                                    exTraducao: 'Olá! Eu sou o Li Ming.',
                                    audio: '你好！我是李明。',
                                    dica: 'A saudação mais famosa do mundo. Formada por 你 (tu) + 好 (bom).'
                                },
                                {
                                    palavra: '谢谢',
                                    pinyin: 'Xièxie',
                                    traducao: 'Obrigado / Obrigada',
                                    exemplo: '谢谢你！',
                                    pinyinExemplo: 'Xièxie nǐ!',
                                    exTraducao: 'Obrigado a ti!',
                                    audio: '谢谢你！',
                                    dica: 'O primeiro "Xiè" tem tom 4 (descendente) e o segundo é tom neutro.'
                                },
                                {
                                    palavra: '不客气',
                                    pinyin: 'Bú kèqi',
                                    traducao: 'De nada',
                                    exemplo: '不客气，请坐。',
                                    pinyinExemplo: 'Bú kèqi, qǐng zuò.',
                                    exTraducao: 'De nada, por favor senta-te.',
                                    audio: '不客气，请坐。',
                                    dica: 'Significa literalmente "não seja cerimonioso".'
                                },
                                {
                                    palavra: '再见',
                                    pinyin: 'Zàijiàn',
                                    traducao: 'Adeus / Até logo',
                                    exemplo: '老师，再见！',
                                    pinyinExemplo: 'Lǎoshī, zàijiàn!',
                                    exTraducao: 'Professor, adeus!',
                                    audio: '老师，再见！',
                                    dica: '再 (novamente) + 见 (ver-nos) = ver-nos novamente!'
                                },
                                {
                                    palavra: '我是...',
                                    pinyin: 'Wǒ shì...',
                                    traducao: 'Eu sou...',
                                    exemplo: '我是莫桑比克人。',
                                    pinyinExemplo: 'Wǒ shì Mòsāngbǐkè rén.',
                                    exTraducao: 'Eu sou moçambicano.',
                                    audio: '我是莫桑比克人。',
                                    dica: '是 (shì) é o verbo ser.'
                                }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Primeiro Encontro em Maputo (初次见面)',
                                contexto: 'Wang e Carlos conhecem-se na universidade.',
                                frases: [
                                    { texto: '你好！你叫什么名字？', pinyin: 'Nǐ hǎo! Nǐ jiào shénme míngzi?', traducao: 'Olá! Qual é o teu nome?', audio: '你好！你叫什么名字？' },
                                    { texto: '你好！我叫 Carlos，我是莫桑比克人。', pinyin: 'Nǐ hǎo! Wǒ jiào Carlos, wǒ shì Mòsāngbǐkè rén.', traducao: 'Olá! Eu chamo-me Carlos, sou moçambicano.', audio: '你好！我叫 Carlos，我是莫桑比克人。' },
                                    { texto: '认识你很高兴！我叫王老师。', pinyin: 'Rènshi nǐ hěn gāoxìng! Wǒ jiào Wáng lǎoshī.', traducao: 'Muito prazer em conhecer-te! Eu sou o Professor Wang.', audio: '认识你很高兴！我叫王老师。' },
                                    { texto: '谢谢王老师！再见！', pinyin: 'Xièxie Wáng lǎoshī! Zàijiàn!', traducao: 'Obrigado Professor Wang! Adeus!', audio: '谢谢王老师！再见！' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "你好" (Nǐ hǎo)?',
                                    opcoes: ['Adeus', 'Olá', 'Obrigado', 'Por favor'],
                                    respostaCorreta: 'Olá',
                                    audio: '你好'
                                },
                                {
                                    tipo: 'construtor_frase',
                                    enunciado: 'Ordena os caracteres para formar: "Olá! Eu sou Carlos."',
                                    palavrasEmbaralhadas: ['Carlos。', '你好！', '我是'],
                                    ordemCorreta: ['你好！', '我是', 'Carlos。']
                                },
                                {
                                    tipo: 'ouvir_escolher',
                                    enunciado: 'Ouve a pronúncia em chinês e escolhe o significado:',
                                    audio: '谢谢你！',
                                    opcoes: ['Obrigado a ti!', 'Bom dia!', 'Até logo!'],
                                    respostaCorreta: 'Obrigado a ti!'
                                },
                                {
                                    tipo: 'associar_pares',
                                    enunciado: 'Associa os caracteres ao seu significado em português:',
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
                                    pergunta: 'Qual o Pinyin correto para a saudação "你好"?',
                                    opcoes: ['Nǐ hǎo', 'Xièxie', 'Zàijiàn', 'Qǐngwèn'],
                                    respostaCorreta: 0,
                                    explicacao: '你好 lê-se "Nǐ hǎo" e significa "Olá".'
                                },
                                {
                                    pergunta: 'Como se responde educadamente quando alguém diz "谢谢" (Xièxie)?',
                                    opcoes: ['再见 (Zàijiàn)', '不客气 (Bú kèqi)', '你好 (Nǐ hǎo)', '对不起 (Duìbuqǐ)'],
                                    respostaCorreta: 1,
                                    explicacao: 'A resposta padrão para obrigado é 不客气 (Bú kèqi - de nada).'
                                },
                                {
                                    pergunta: 'O que significa o caractere "人" (rén) na frase "我是莫桑比克人"?',
                                    opcoes: ['Comida', 'Cidade', 'Pessoa / Nacionalidade', 'Escola'],
                                    respostaCorreta: 2,
                                    explicacao: '人 significa pessoa. País + 人 indica a nacionalidade (ex: 莫桑比克人 = moçambicano).'
                                }
                            ]
                        },
                        {
                            id: 'lic_m_1_1_2',
                            titulo: 'Números de 1 a 10 e Idade (一到十)',
                            flashcards: [
                                { palavra: '一, 二, 三', pinyin: 'Yī, Èr, Sān', traducao: '1, 2, 3', exemplo: '我有三个朋友。', pinyinExemplo: 'Wǒ yǒu sān gè péngyou.', exTraducao: 'Eu tenho três amigos.', audio: '一, 二, 三', dica: 'Um, dois, três traços horizontais nos caracteres.' },
                                { palavra: '四, 五, 六', pinyin: 'Sì, Wǔ, Liù', traducao: '4, 5, 6', exemplo: '星期五', pinyinExemplo: 'Xīngqī wǔ', exTraducao: 'Sexta-feira', audio: '四, 五, 六', dica: 'Pratica o tom 4 de Sì e Liù.' },
                                { palavra: '七, 八, 九, 十', pinyin: 'Qī, Bā, Jiǔ, Shí', traducao: '7, 8, 9, 10', exemplo: '十个苹果', pinyinExemplo: 'Shí gè píngguǒ', exTraducao: 'Dez maçãs', audio: '七, 八, 九, 十', dica: '八 (bā - 8) é considerado o número da sorte na China!' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Comprando Frutas no Mercado (在水果市场)',
                                contexto: 'Comprar maçãs em chinês.',
                                frases: [
                                    { texto: '老板，这个多少钱？', pinyin: 'Lǎobǎn, zhège duōshao qián?', traducao: 'Chefe, quanto custa este?', audio: '老板，这个多少钱？' },
                                    { texto: '十块钱三个。', pinyin: 'Shí kuài qián sān gè.', traducao: 'Dez yuans por três.', audio: '十块钱三个。' },
                                    { texto: '好，我要六个。谢谢！', pinyin: 'Hǎo, wǒ yào liù gè. Xièxie!', traducao: 'Está bem, eu quero seis. Obrigado!', audio: '好，我要六个。谢谢！' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'Qual caractere representa o número 8 em chinês?',
                                    opcoes: ['八 (bā)', '四 (sì)', '十 (shí)', '二 (èr)'],
                                    respostaCorreta: '八 (bā)',
                                    audio: '八'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Como se pergunta "Quanto custa?" em chinês?',
                                    opcoes: ['多少钱？ (Duōshao qián?)', '叫什么？ (Jiào shénme?)', '去哪里？ (Qù nǎli?)', '你是谁？ (Nǐ shì shéi?)'],
                                    respostaCorreta: 0,
                                    explicacao: '多少钱 significa literalmente "quanto dinheiro / quanto custa".'
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
            titulo: 'Nível 2: HSK 2 (Comunicação Prática)',
            cefr: 'HSK 2',
            cor: '#00CEC9',
            icone: '🐉',
            descricao: 'Rotinas, compras, transporte, direções e comida chinesa.',
            modulos: [
                {
                    id: 'mod_m_2_1',
                    titulo: 'Módulo 1: Restaurante & Vida Quotidiana',
                    licoes: [
                        {
                            id: 'lic_m_2_1_1',
                            titulo: 'Pedir Comida e Beber Chá (点菜与喝茶)',
                            flashcards: [
                                { palavra: '米饭', pinyin: 'Mǐfàn', traducao: 'Arroz cozido', exemplo: '我喜欢吃中国米饭。', pinyinExemplo: 'Wǒ xǐhuan chī Zhōngguó mǐfàn.', exTraducao: 'Eu gosto de comer arroz chinês.', audio: '我喜欢吃中国米饭。', dica: 'Comida base na culinária chinesa.' },
                                { palavra: '喝茶', pinyin: 'Hē chá', traducao: 'Beber chá', exemplo: '中国人喜欢喝热茶。', pinyinExemplo: 'Zhōngguórén xǐhuan hē rè chá.', exTraducao: 'Os chineses gostam de beber chá quente.', audio: '中国人喜欢喝热茶。', dica: 'Tradição milenar chinesa.' },
                                { palavra: '好吃', pinyin: 'Hǎochī', traducao: 'Delicioso / Saboroso', exemplo: '这个菜非常好吃！', pinyinExemplo: 'Zhège cài fēicháng hǎochī!', exTraducao: 'Este prato é extremamente delicioso!', audio: '这个菜非常好吃！', dica: '好 (bom) + 吃 (comer).' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Jantar no Restaurante Chinês (在饭馆吃饭)',
                                contexto: 'Jantar com amigos.',
                                frases: [
                                    { texto: '你想吃什么菜？', pinyin: 'Nǐ xiǎng chī shénme cài?', traducao: 'Que prato gostarias de comer?', audio: '你想吃什么菜？' },
                                    { texto: '我想吃牛肉和米饭，还要喝绿茶。', pinyin: 'Wǒ xiǎng chī niúròu hé mǐfàn, hái yào hē lǜchá.', traducao: 'Eu quero comer carne de vaca com arroz e também beber chá verde.', audio: '我想吃牛肉和米饭，还要喝绿茶。' },
                                    { texto: '太好了！这里的中国菜非常好吃。', pinyin: 'Tài hǎo le! Zhèlǐ de Zhōngguó cài fēicháng hǎochī.', traducao: 'Ótimo! A comida chinesa daqui é muito saborosa.', audio: '太好了！这里的中国菜非常好吃。' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "好吃" (Hǎochī)?',
                                    opcoes: ['Delicioso', 'Caro', 'Quente', 'Doce'],
                                    respostaCorreta: 'Delicioso',
                                    audio: '好吃'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'Qual o significado do verbo "喝" (hē)?',
                                    opcoes: ['Beber', 'Comer', 'Andar', 'Comprar'],
                                    respostaCorreta: 0,
                                    explicacao: '喝 (hē) significa beber (ex: 喝茶 = beber chá, 喝水 = beber água).'
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
            titulo: 'Nível 3: HSK 3 & 4 (Intermédio & Fluência)',
            cefr: 'HSK 3-4',
            cor: '#6C5CE7',
            icone: '⛩️',
            descricao: 'Expressar sentimentos, viagens por toda a China, cultura e trabalho.',
            modulos: [
                {
                    id: 'mod_m_3_1',
                    titulo: 'Módulo 1: Viagem e Trabalho Internacional',
                    licoes: [
                        {
                            id: 'lic_m_3_1_1',
                            titulo: 'Viajar de Comboio de Alta Velocidade (坐高铁)',
                            flashcards: [
                                { palavra: '高铁', pinyin: 'Gāotiě', traducao: 'Comboio de Alta Velocidade', exemplo: '中国的高铁非常快而且准时。', pinyinExemplo: 'Zhōngguó de gāotiě fēicháng kuài érqiě zhǔnshí.', exTraducao: 'Os comboios de alta velocidade da China são muito rápidos e pontuais.', audio: '中国的高铁非常快而且准时。', dica: 'A maior rede ferroviária de alta velocidade do mundo.' },
                                { palavra: '方便', pinyin: 'Fāngbiàn', traducao: 'Conveniente / Prático', exemplo: '用手机支付非常方便。', pinyinExemplo: 'Yòng shǒujī zhīfù fēicháng fāngbiàn.', exTraducao: 'Pagar com o telemóvel é muito conveniente.', audio: '用手机支付非常方便。', dica: 'Termo chave na vida moderna chinesa.' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Viagem de Pequim a Xangai (从北京到上海)',
                                contexto: 'Experiência de viagem no comboio de alta velocidade.',
                                frases: [
                                    { texto: '今天我和朋友坐高铁从北京去上海。', pinyin: 'Jīntiān wǒ hé péngyou zuò gāotiě cóng Běijīng qù Shànghǎi.', traducao: 'Hoje eu e o meu amigo apanhámos o comboio de alta velocidade de Pequim para Xangai.', audio: '今天我和朋友坐高铁从北京去上海。' },
                                    { texto: '全程只需要四个半小时，非常舒适。', pinyin: 'Quánchéng zhǐ xūyào sì gè bàn xiǎoshí, fēicháng shūshì.', traducao: 'Toda a viagem demorou apenas quatro horas e meia, muito confortável.', audio: '全程只需要四个半小时，非常舒适。' },
                                    { texto: '学习汉语让我们的旅行变得更加有趣。', pinyin: 'Xuéxí Hànyǔ ràng wǒmen de lǚxíng biànde gèngjiā yǒuqù.', traducao: 'Aprender chinês tornou a nossa viagem muito mais interessante.', audio: '学习汉语让我们的旅行变得更加有趣。' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que significa "方便" (Fāngbiàn)?',
                                    opcoes: ['Conveniente / Prático', 'Lento', 'Perigoso', 'Difícil'],
                                    respostaCorreta: 'Conveniente / Prático',
                                    audio: '方便'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'O que significa a palavra "高铁" (Gāotiě)?',
                                    opcoes: ['Comboio de alta velocidade', 'Avião comercial', 'Navio de carga', 'Autocarro urbano'],
                                    respostaCorreta: 0,
                                    explicacao: '高铁 (Gāotiě) é a abreviatura de 高速铁路 (ferrovia de alta velocidade).'
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
            titulo: 'Nível 4: HSK 5 & 6 (Avançado & Provérbios Chengyu)',
            cefr: 'HSK 5-6',
            cor: '#E17055',
            icone: '🐼',
            descricao: 'Negócios com a China, cooperação África-China, literatura e Chengyu (provérbios de 4 caracteres).',
            modulos: [
                {
                    id: 'mod_m_4_1',
                    titulo: 'Módulo 1: Chengyu & Sabedoria Tradicional',
                    licoes: [
                        {
                            id: 'lic_m_4_1_1',
                            titulo: 'Provérbios Clássicos (成语)',
                            flashcards: [
                                { palavra: '一石二鸟', pinyin: 'Yī shí èr niǎo', traducao: 'Matar dois coelhos de uma cajadada só (literalmente: uma pedra, dois pássaros)', exemplo: '这个方案既节约成本又提高效率，真是一石二鸟。', pinyinExemplo: 'Zhège fāng\'àn jì jiéyuē chéngběn yòu tígāo xiàolǜ, zhēn shì yī shí èr niǎo.', exTraducao: 'Este plano poupa custos e aumenta a eficiência, é mesmo dois pássaros com uma pedra.', audio: '一石二鸟', dica: 'Chengyu muito popular em conversação e negócios.' },
                                { palavra: '千里之行，始于足下', pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià', traducao: 'Uma jornada de mil milhas começa com um simples passo', exemplo: '学好中文虽然不容易，但千里之行，始于足下。', pinyinExemplo: 'Xué hǎo Zhōngwén suīrán bù róngyì, dàn qiān lǐ zhī xíng, shǐ yú zú xià.', exTraducao: 'Aprender bem chinês não é fácil, mas uma jornada de mil milhas começa com um único passo.', audio: '千里之行，始于足下。', dica: 'Provérbio célebre de Lao Tsé (Laozi).' }
                            ],
                            leituraGuiada: {
                                titulo: 'Leitura Guiada: Cooperação Moçambique-China e Oportunidades Futuras',
                                contexto: 'Reflexão sobre relações bilaterais e intercâmbio cultural.',
                                frases: [
                                    { texto: '中国与非洲各国的经贸合作与文化交流日益密切。', pinyin: 'Zhōngguó yǔ Fēizhōu gè guó de jīngmào hézuò yǔ wénhuà jiāoliú rìyì mìqiè.', traducao: 'A cooperação económica e os intercâmbios culturais entre a China e os países africanos estão a tornar-se cada vez mais estreitos.', audio: '中国与非洲各国的经贸合作与文化交流日益密切。' },
                                    { texto: '掌握汉语能够为年轻人打开广阔的国际舞台和职业机会。', pinyin: 'Zhǎngwò Hànyǔ nénggòu wèi niánqīngrén dǎkāi guǎngkuò de guójì wǔtái hé zhíyè jīhuì.', traducao: 'Dominar o mandarim abre para os jovens um vasto palco internacional e oportunidades de carreira.', audio: '掌握汉语能够为年轻人打开广阔的国际舞台和职业机会。' },
                                    { texto: '通过 Mazza Language，每个人都能自信地连接世界。', pinyin: 'Tōngguò Mazza Language, měi gè rén dōu néng zìxìn de liánjiē shìjiè.', traducao: 'Através do Mazza Language, qualquer pessoa pode conectar-se com confiança ao mundo.', audio: '通过 Mazza Language，每个人都能自信地连接世界。' }
                                ]
                            },
                            exercicios: [
                                {
                                    tipo: 'multipla_escolha',
                                    enunciado: 'O que ensina o provérbio "千里之行，始于足下"?',
                                    opcoes: ['Toda grande caminhada começa com o primeiro passo', 'A pressa é inimiga da perfeição', 'Mais vale um pássaro na mão', 'O tempo é ouro'],
                                    respostaCorreta: 'Toda grande caminhada começa com o primeiro passo',
                                    audio: '千里之行，始于足下。'
                                }
                            ],
                            miniTeste: [
                                {
                                    pergunta: 'O que significa o Chengyu "一石二鸟"?',
                                    opcoes: ['Alcançar dois objetivos com uma única ação', 'Perder a oportunidade', 'Voar muito alto', 'Comprar dois bilhetes'],
                                    respostaCorreta: 0,
                                    explicacao: '一石二鸟 significa alcançar dois resultados positivos com um único esforço.'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
