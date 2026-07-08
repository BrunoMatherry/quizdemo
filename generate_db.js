import fs from 'fs';
import path from 'path';

const CATEGORIES = [
    "Nome", "País", "Cidade", "Cor", "Animal", "Alimento", "Objeto", "Profissão",
    "Carro", "Cantor", "Marca", "Filme", "Ator", "Novela", "Personagem", "Capital",
    "Música", "Roupa", "Parte do Corpo", "Instrumento"
];

// Helper to normalize and categorize database items by starting letter
const rawDatabase = {
    // 20 categories lists
    "Nome": [
        "Ana", "Aline", "Amanda", "Afonso", "António", "Beatriz", "Bruno", "Bernardo", "Bárbara", "Caio", "Carlos", "Camila", "Carolina",
        "Daniel", "Diogo", "Duarte", "Eduardo", "Elisa", "Felipe", "Fernando", "Gabriel", "Guilherme", "Gustavo", "Hugo", "Helena",
        "Igor", "Isabela", "João", "José", "Júlia", "Lucas", "Leonardo", "Luísa", "Mateus", "Miguel", "Mariana", "Nuno", "Natália",
        "Otávio", "Olívia", "Pedro", "Patrícia", "Rafael", "Rodrigo", "Rita", "Sofia", "Samuel", "Tiago", "Teresa", "Victor", "Vanessa",
        "William", "Xavier", "Yuri", "Yasmine", "Zélia", "Zacarias"
    ],
    "País": [
        "Angola", "Argélia", "Alemanha", "Andorra", "Argentina", "Austrália", "Áustria", "Brasil", "Bélgica", "Bahamas", "Bolívia", "Bulgária",
        "Cabo Verde", "Canadá", "Chile", "China", "Colômbia", "Dinamarca", "Djibouti", "Espanha", "Equador", "Egito", "Estados Unidos",
        "França", "Finlândia", "Filipinas", "Gabão", "Gana", "Grécia", "Guiné", "Holanda", "Honduras", "Hungria", "Itália", "Índia", "Inglaterra",
        "Japão", "Jamaica", "Jordânia", "Kuwait", "Quénia", "Líbano", "Líbia", "Luxemburgo", "Moçambique", "Marrocos", "México", "Madagáscar",
        "Namíbia", "Nigéria", "Noruega", "Nova Zelândia", "Omã", "Honduras", "Portugal", "Peru", "Polónia", "Quénia", "Catar", "Rússia", "Roménia",
        "Suécia", "Suíça", "Senegal", "Somália", "África do Sul", "Tailândia", "Tanzânia", "Tunísia", "Turquia", "Uganda", "Ucrânia", "Uruguai",
        "Venezuela", "Vietnã", "Zâmbia", "Zimbabwe"
    ],
    "Cidade": [
        "Aveiro", "Auckland", "Amsterdão", "Aracaju", "Beira", "Braga", "Brasília", "Barcelona", "Boston", "Chimoio", "Coimbra", "Cairo",
        "Chicago", "Dondo", "Durban", "Dallas", "Dublin", "Évora", "Edimburgo", "Faro", "Florença", "Frankfurt", "Gurúè", "Genebra",
        "Glasgow", "Inhambane", "Ibadan", "Istanbul", "Joanesburgo", "Jacarta", "Juba", "Kelimane", "Kiev", "Kigali", "Lichinga", "Lisboa",
        "Luanda", "Londres", "Maputo", "Manica", "Madrid", "Miami", "Munique", "Nampula", "Nairobi", "Nova Iorque", "Ovar", "Oslo", "Orlando",
        "Pemba", "Porto", "Paris", "Pequim", "Quelimane", "Quito", "Quebec", "Roma", "Rio de Janeiro", "Roterdão", "Songo", "Sintra",
        "Sevilha", "Sidney", "Tete", "Tóquio", "Toronto", "Ulongué", "Utrecht", "Vilankulo", "Veneza", "Viena", "Washington", "Wellington",
        "Xai-Xai", "Xangai", "Zumbo", "Zagreb", "Zurique"
    ],
    "Cor": [
        "Azul", "Amarelo", "Antracite", "Aqua", "Branco", "Bege", "Bronze", "Cinzento", "Creme", "Castanho", "Carmesim", "Dourado",
        "Escarlate", "Esmeralda", "Ferrugem", "Fúcsia", "Gelo", "Grená", "Indigo", "Jambo", "Lilás", "Laranja", "Marrom", "Negro",
        "Ocre", "Preto", "Prata", "Púrpura", "Rosa", "Roxo", "Salmão", "Turquesa", "Verde", "Vermelho", "Violeta", "Zarcão"
    ],
    "Animal": [
        "Abelha", "Águia", "Antílope", "Aranha", "Albatroz", "Baleia", "Borboleta", "Búfalo", "Cachorro", "Cavalo", "Canguru", "Cobra",
        "Dinossauro", "Dromedário", "Elefante", "Esquilo", "Estrela-do-mar", "Formiga", "Foca", "Flamingo", "Gato", "Girafa", "Gorila",
        "Hipopótamo", "Hiena", "Jacaré", "Jaguar", "Leão", "Lobo", "Leopardo", "Macaco", "Mosca", "Morcego", "Naja", "Namorado", "Ovelha",
        "Orca", "Pato", "Pinguim", "Pantera", "Quati", "Raposa", "Rato", "Rinoceronte", "Sapo", "Serpente", "Tigre", "Tartaruga", "Tubarão",
        "Urso", "Urubu", "Veado", "Vaca", "Víbora", "Wombat", "Xexéu", "Zebra", "Zangão"
    ],
    "Alimento": [
        "Arroz", "Abacaxi", "Alface", "Amendoim", "Banana", "Batata", "Bacalhau", "Bolo", "Chocolate", "Cebola", "Cenoura", "Doce",
        "Esparguete", "Ervilha", "Feijão", "Figo", "Frango", "Goiaba", "Gelatina", "Hambúrguer", "Iogurte", "Jaca", "Kiwi", "Limão",
        "Laranja", "Maçã", "Melancia", "Manga", "Nozes", "Nectarina", "Ovo", "Pão", "Pipoca", "Pizza", "Queijo", "Quindim", "Romã",
        "Salada", "Sopa", "Tomate", "Trigo", "Uva", "Vagem", "Wafer", "Xarope", "Zimbro"
    ],
    "Objeto": [
        "Anel", "Agulha", "Armário", "Bota", "Balão", "Bexiga", "Cadeira", "Caneta", "Copo", "Dado", "Disco", "Escova", "Faca", "Fita",
        "Garrafa", "Guarda-chuva", "Harpa", "Íman", "Jarra", "Janela", "Lápis", "Livro", "Mesa", "Martelo", "Navio", "Notebook",
        "Óculos", "Prato", "Quadro", "Relógio", "Rádio", "Sapato", "Saco", "Telefone", "Teclado", "Urna", "Vaso", "Vela", "Xícara", "Zíper"
    ],
    "Profissão": [
        "Advogado", "Biólogo", "Bombeiro", "Cientista", "Contabilista", "Dentista", "Engenheiro", "Enfermeiro", "Farmacêutico", "Físico",
        "Gerente", "Geógrafo", "Historiador", "Ilustrador", "Jardineiro", "Jornalista", "Médico", "Músico", "Nutricionista", "Oculista",
        "Professor", "Psicólogo", "Químico", "Recepcionista", "Soldador", "Sociólogo", "Tradutor", "Veterinário", "Zootecnista"
    ],
    "Carro": [
        "Audi", "Aston Martin", "Alfa Romeo", "BMW", "Bentley", "Bugatti", "Chevrolet", "Citroen", "Cadillac", "Dodge", "Ferrari", "Fiat",
        "Ford", "GMC", "Honda", "Hyundai", "Hummer", "Isuzu", "Jaguar", "Jeep", "Kia", "Lamborghini", "Lexus", "Land Rover", "Mazda",
        "Mercedes", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Rolls Royce", "Suzuki", "Subaru", "Toyota",
        "Tesla", "Volkswagen", "Volvo", "Yamaha"
    ],
    "Cantor": [
        "Adele", "Anitta", "Ariana Grande", "Beyonce", "Bruno Mars", "Billie Eilish", "Chico Buarque", "Caetano Veloso", "Drake", "Dua Lipa",
        "Eminem", "Ed Sheeran", "Freddie Mercury", "Gilberto Gil", "Harry Styles", "Ivete Sangalo", "Justin Bieber", "Katy Perry",
        "Luan Santana", "Michael Jackson", "Madonna", "Nelson Ned", "Ozzy Osbourne", "Phil Collins", "Rihanna", "Roberto Carlos",
        "Shakira", "Taylor Swift", "The Weeknd", "Usher", "Valter Artístico", "Wyclef Jean", "Xande de Pilares", "Yuri da Cunha", "Zeca Pagodinho"
    ],
    "Marca": [
        "Apple", "Adidas", "Amazon", "Coca-Cola", "Dell", "Disney", "Epson", "Ford", "Google", "Gucci", "HP", "Honda", "IBM", "Intel",
        "Ikea", "JVC", "Kelloggs", "LG", "Microsoft", "Nike", "Nestle", "Pepsi", "Rolex", "Samsung", "Sony", "Toyota", "Unilever",
        "Visa", "Walmart", "Xiaomi", "Zara"
    ],
    "Filme": [
        "Avatar", "Avengers", "Aladdin", "Batman", "Barbie", "Blade Runner", "Coringa", "Casablanca", "Deadpool", "Duna",
        "Esqueceram de Mim", "Frozen", "Gladiador", "Harry Potter", "Inception", "Interstellar", "Jumanji", "Jurassic Park",
        "King Kong", "Lion King", "Matrix", "Nemo", "Pinóquio", "Pulp Fiction", "Rambo", "Ratatouille", "Shrek", "Star Wars", "Spiderman",
        "Titanic", "Toy Story", "Up", "Velozes e Furiosos", "WALL-E", "X-Men", "Zorro"
    ],
    "Ator": [
        "Al Pacino", "Arnold Schwarzenegger", "Angelina Jolie", "Brad Pitt", "Bruce Willis", "Caio Castro", "Christian Bale",
        "Denzel Washington", "Daniel Radcliffe", "Emilia Clarke", "Emma Watson", "Fábio Assunção", "George Clooney", "Harrison Ford",
        "Hugh Jackman", "Ian McKellen", "Johnny Depp", "Keanu Reeves", "Leonardo DiCaprio", "Marlon Brando", "Morgan Freeman",
        "Nicolas Cage", "Natalie Portman", "Orlando Bloom", "Penélope Cruz", "Robert Downey Jr", "Ryan Gosling", "Sylvester Stallone",
        "Tom Cruise", "Tom Hanks", "Will Smith", "Zac Efron"
    ],
    "Novela": [
        "Avenida Brasil", "Amor à Vida", "Bom Sucesso", "Carrossel", "Celebridade", "Duas Caras", "Escrava Isaura", "Fina Estampa",
        "Gabriela", "Haja Coração", "Império", "Jesus", "Kubanacan", "Laços de Família", "Mulheres Apaixonadas", "Novo Mundo",
        "O Clone", "Pantanal", "Chocolate com Pimenta", "Rebelde", "Roque Santeiro", "Senhora do Destino", "Terra Nostra", "Uga Uga",
        "Viver a Vida"
    ],
    "Personagem": [
        "Aladdin", "Ariel", "Batman", "Barbie", "Cinderela", "Coringa", "Dracula", "Elsa", "Frodo", "Goku", "Harry Potter",
        "Homem de Ferro", "Joker", "Katniss", "Luigi", "Mickey", "Naruto", "Odiseu", "Peter Pan", "Robin Hood", "Shrek", "Superman",
        "Tarzan", "Wolverine", "Zorro"
    ],
    "Capital": [
        "Argel", "Adis Abeba", "Atenas", "Brasília", "Bruxelas", "Buenos Aires", "Bujumbura", "Cairo", "Copenhaga", "Cabul", "Dublin",
        "Dakar", "Estocolmo", "Freetown", "Gaborone", "Harare", "Helsínquia", "Islamabad", "Jacarta", "Kiev", "Kigali", "Luanda",
        "Lisboa", "Londres", "Maputo", "Madrid", "Mascate", "Nairobi", "Nova Deli", "Oslo", "Paris", "Pequim", "Quito", "Roma",
        "Riad", "Seul", "Sana", "Tóquio", "Tunis", "Viena", "Vilnius", "Washington", "Zagreb"
    ],
    "Música": [
        "Amor de Minha Vida", "Asa Branca", "Bohemian Rhapsody", "Beat It", "Como Nossos Pais", "Despacito", "Evidências",
        "Faroeste Caboclo", "Garota de Ipanema", "Halo", "Imagine", "Jingle Bells", "Kiss", "Love of My Life", "Minha Estúpida",
        "Numb", "Oração", "Pensa em Mim", "Querida", "Roda Viva", "Shape of You", "Thriller", "Um Amor Puro", "Vira-Vira", "Yesterday"
    ],
    "Roupa": [
        "Anoraque", "Avental", "Blusa", "Bermuda", "Camisa", "Calça", "Casaco", "Cachecol", "Cinto", "Cardigã", "Gravata", "Gorro",
        "Jaqueta", "Jardineira", "Luvas", "Meias", "Pijama", "Paletó", "Saia", "Sobretudo", "Terno", "Touca", "Vestido", "Xale"
    ],
    "Parte do Corpo": [
        "Abdómen", "Antebraço", "Articulação", "Braço", "Boca", "Cérebro", "Coração", "Costas", "Dente", "Dedo", "Estômago", "Esófago",
        "Fígado", "Fronte", "Garganta", "Gengiva", "Haste", "Intestino", "Joelho", "Língua", "Mão", "Menton", "Nariz", "Nuca", "Olho",
        "Ouvido", "Pé", "Perna", "Pescoço", "Quadril", "Rim", "Seio", "Sobrancelha", "Testa", "Tornozelo", "Unha", "Útero", "Veia", "Vértebra"
    ],
    "Instrumento": [
        "Acordeão", "Alaúde", "Bateria", "Baixo", "Clarinete", "Contrabaixo", "Flauta", "Fagote", "Guitarra", "Gaita", "Harpa",
        "Lira", "Marimba", "Meia-lua", "Órgão", "Ocarina", "Piano", "Prato", "Saxofone", "Sino", "Tambor", "Teclado", "Triângulo",
        "Violão", "Violino", "Violoncelo", "Xilofone"
    ]
};

// Create folders if not exist
const dbDir = './Nome_Terra_ab';
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Generate an a.json to z.json database files
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

letters.forEach(letter => {
    const letterUpper = letter.toUpperCase();
    const fileData = {};

    CATEGORIES.forEach(cat => {
        const catList = rawDatabase[cat] || [];
        // Filter elements that start with this letter (ignoring case, accents)
        const matched = catList.filter(item => {
            const normalized = item.toString()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
            return normalized[0] === letter;
        });

        // Add some generic fallback words for testing purposes if list is empty
        if (matched.length === 0) {
            matched.push(`${letterUpper}a-teste`, `${letterUpper}e-teste`, `${letterUpper}o-teste`);
        }

        fileData[cat] = matched;
    });

    const filePath = path.join(dbDir, `${letter}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
    console.log(`Generated ${filePath}`);
});

console.log("Database generation finished successfully!");
