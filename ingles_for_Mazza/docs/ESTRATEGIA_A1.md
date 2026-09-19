# Inglés para África Lusófona — Nível A1
## Missão, pedagogia, estrutura e especificação do conteúdo

**Missão:** ser o melhor app de inglês para falantes de português em Moçambique, Angola, Cabo Verde, Guiné-Bissau, São Tomé e Príncipe e diáspora — útil no chapa, no mercado, na escola, no hospital e no WhatsApp.

O material original no Drive não está acessível sem login. Este A1 segue o CEFR (Breakthrough) e foi escrito de raiz com vocabulário, nomes, preços em meticais, comida, transporte e rotinas da África lusófona. Quando o Drive estiver partilhado em “qualquer pessoa com o link”, o conteúdo pode ser fundido sem mudar o esquema JSON.

---

## 1. O que o A1 deve conseguir

No fim do A1 o utilizador consegue, em inglês simples e lento:

- cumprimentar, apresentar-se e dizer de onde é
- falar de família, casa, comida, escola e trabalho
- usar números, horas, dias, preços (meticais) e datas
- fazer perguntas curtas (What / Where / Who / How much / Can)
- entender sinais, SMS, menus e diálogos muito curtos
- escrever 3–6 frases sobre si

Vocabulário-alvo: **~700–900 palavras ativas**, 1200 receptivas.  
Gramática-alvo: *to be*, *have*, Present Simple, *there is/are*, artigos, pronomes, possessivos, *can/can’t*, preposições básicas, *Wh-*, imperativos leves.

---

## 2. Princípios pedagógicos (o que torna o app diferente)

1. **Ouvir antes de escrever.** A África lusófona é fortemente oral. Cada frase nova tem áudio. A leitura guiada deixa clicar numa frase e ouvir a pronúncia.
2. **Português como ponte, não muleta eterna.** Instruções em PT-MZ no início; o inglês cresce; o PT vai desaparecendo nas unidades finais.
3. **Vida real de Maputo a Pemba.** Xima, matapa, capulana, chapa, txopela, mercado do povo, metical, estação das chuvas, futebol no quintal — não “the red double-decker in Piccadilly”.
4. **Micro-lições de 3–6 minutos.** 500 lições curtas > 40 aulas longas. Cabe no chapa ou na fila da farmácia.
5. **Mesma língua em 4 portas:** ouvir, falar (repetir), ler (clique-áudio), escrever (ditado / completa).
6. **Erro barato, vitória frequente.** Mini-testes de 4–6 itens. 70% passa. Falhou? Repete só o item, não a unidade inteira.
7. **Repetição espaçada.** Palavras novas voltam em +1 dia, +3 dias, +7 dias dentro de outras lições.
8. **Diversão com respeito.** Pontos, séries (streaks), selos de capulana, mascarote de Ilha, “chapa cheio” como meta diária — sem infantilizar o adulto.

Técnicas por sessão (ciclo de 5 minutos):

1. Aquecer (8–10s de áudio conhecido)
2. Input novo (2–4 frases + 4 palavras)
3. Leitura guiada (clique e ouve)
4. Prática activa (1 tipo de exercício)
5. Mini-saída (1 frase para dizer em voz alta)

---

## 3. Arquitectura do nível A1

```
A1
├── 25 unidades temáticas (ramos)
│   └── 20 micro-lições por unidade   = 500 lições
│       ├── guidedReading (frases clicáveis + audioKey)
│       ├── newWords
│       └── 1–3 activities
├── checkpoints a cada 5 lições (mini-teste)
├── boss test no fim de cada unidade
└── exame A1 após a unidade 25
```

### Ramos (unidades)

| ID | Unidade | Função comunicativa |
|----|---------|---------------------|
| U01 | Olá, Maputo | Cumprimentos e nome |
| U02 | Números e idade | Contar, telefone, idade |
| U03 | Eu sou de… | País, cidade, nacionalidade (SADC + CPLP) |
| U04 | Verbo TO BE | Sou / é / somos |
| U05 | Família | Pais, irmãos, possessivos |
| U06 | Casa e bairro | Divisões, *there is* |
| U07 | Rotina | Present Simple, horas |
| U08 | Comida de casa | Xima, matapa, *I like* |
| U09 | Mercado e preços | Meticais, *how much* |
| U10 | Escola | Objectos, *can*, sala |
| U11 | Trabalho | Profissões locais |
| U12 | Transporte | Chapa, txopela, *go by* |
| U13 | Cidade | Sítios, direcções |
| U14 | Tempo e clima | Dias, chuva, calor |
| U15 | Roupa e cores | Capulana, *wear* |
| U16 | Corpo e saúde | Dói-me, hospital |
| U17 | Desporto e lazer | Futebol, praia |
| U18 | Festas e cultura | Independência, marrabenta |
| U19 | Natureza | Animais, Gorongosa |
| U20 | Telemóvel | WhatsApp, *call / send* |
| U21 | Compras | Loja, tamanho |
| U22 | Perguntas | Wh- questions |
| U23 | Posso / não posso | *can / can’t* |
| U24 | Ontem foi… | Past of *be* + rotina passada leve |
| U25 | Eu no mundo | Revisão A1 + apresentação de 8 frases |

Cada unidade tem 16 lições de conteúdo + 3 revisões espaçadas + 1 teste de unidade = 20.

### Tipos de actividade (o app deve implementar)

| `type` | O que o utilizador faz |
|--------|-------------------------|
| `guided_reading` | Clica frase → ouve pronúncia |
| `listen_repeat` | Ouve e repete (gravação opcional) |
| `multiple_choice` | Quiz 3–4 opções |
| `fill_blank` | Completa a frase |
| `listen_write` | Ditado curto |
| `order_words` | Ordena palavras da frase |
| `match_pairs` | EN ↔ PT ou imagem ↔ palavra |
| `true_false` | Frase verdadeira/falsa |
| `tap_what_you_hear` | Ouve e toca a palavra certa |
| `mini_dialogue` | Escolhe a resposta certa no diálogo |
| `speak_prompt` | Lê/diz uma frase (speech-to-text futuro) |

---

## 4. Sistema de leitura guiada + áudio

Cada frase no JSON tem:

- `en` — texto inglês
- `pt` — apoio em português
- `ipa` — IPA simples (Received / African-friendly)
- `audioKey` — identificador estável para TTS ou ficheiro gravado

O app **não** embute MP3 no JSON. Gera ou descarrega áudio por `audioKey`.

Contrato sugerido:

```
GET /audio/{audioKey}.mp3
```

ou TTS local:

```
speak(sentence.en, voice: "en-ZA" | "en-GB", rate: 0.88)
```

Voz recomendada para África austral: **en-ZA** (África do Sul) ou en-GB lento. Evitar só en-US no arranque.

UX da leitura guiada:

1. Frase em inglês grande
2. Ícone de som à esquerda
3. Tradução revelável (olho)
4. Palavras tocáveis (highlight palavra a palavra no futuro)
5. Botão “outra vez, mais devagar”

---

## 5. Ficheiros JSON (fora do binário da app)

```
a1/
  schema/lesson.schema.json
  manifest.json              ← índice de 25 unidades + 500 ids
  units/u01.json … u25.json  ← 20 lições cada
```

A app lê o `manifest.json`, descarrega só a unidade actual, faz cache.

---

## 6. Gamificação leve (adulta)

- XP: 8–15 por lição, 40 no teste de unidade
- Série diária: “não faltes ao chapa”
- Selos: Capulana Azul (U01), Caju de Cabo Delgado (U08), Leão de Gorongosa (U19)
- Vidas só nos testes (3 erros)
- Modo offline: unidade descarregada

---

## 7. Como crescer para A2–B1

O mesmo esquema JSON serve A2+. Só muda `level`, densidade gramatical e o comprimento dos textos da leitura guiada.

Quando o Drive estiver aberto, mapear cada PDF/doc a `sourceRef` nas lições para não perder o material original do autor.
