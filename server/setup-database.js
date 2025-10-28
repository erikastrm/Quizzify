const bcrypt = require('bcryptjs');
const { initializeDatabase, questions, admin } = require('./models/database');

/**
 * Setup-script för att initiera databasen med exempel-data
 */

async function setupDatabase() {
  try {
    console.log('Initierar databas...');
    
    // Skapa tabeller
    await initializeDatabase();
    console.log('✓ Databas-tabeller skapade');

    // Skapa standard admin-användare
    const adminUsername = 'admin';
    const adminPassword = 'quiz123'; // Ändra detta i produktion!
    
    const existingAdmin = await admin.findByUsername(adminUsername);
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await admin.create(adminUsername, passwordHash);
      console.log(`✓ Admin-användare skapad: ${adminUsername} / ${adminPassword}`);
    } else {
      console.log('✓ Admin-användare finns redan');
    }

    // Lägg till exempel-frågor
    const exampleQuestions = [
      {
        question: "Vilket är det största landet i världen?",
        option_a: "Kina",
        option_b: "USA",
        option_c: "Ryssland",
        option_d: "Kanada",
        correct_answer: "C",
        time_limit: 30,
        category: "Geografi",
        difficulty: "easy"
      },
      {
        question: "Vem skrev boken '1984'?",
        option_a: "George Orwell",
        option_b: "Aldous Huxley",
        option_c: "Ray Bradbury",
        option_d: "Margaret Atwood",
        correct_answer: "A",
        time_limit: 25,
        category: "Litteratur",
        difficulty: "medium"
      },
      {
        question: "Vilket år landade människan första gången på månen?",
        option_a: "1967",
        option_b: "1968",
        option_c: "1969",
        option_d: "1970",
        correct_answer: "C",
        time_limit: 20,
        category: "Historia",
        difficulty: "easy"
      },
      {
        question: "Vad kallas processen där växter omvandlar solljus till energi?",
        option_a: "Respiration",
        option_b: "Fotosyntes",
        option_c: "Oxidation",
        option_d: "Fermentation",
        correct_answer: "B",
        time_limit: 25,
        category: "Naturvetenskap",
        difficulty: "medium"
      },
      {
        question: "Vilket programmeringsspråk används för att skapa denna quiz-app?",
        option_a: "Python",
        option_b: "Java",
        option_c: "JavaScript",
        option_d: "C++",
        correct_answer: "C",
        time_limit: 15,
        category: "Teknik",
        difficulty: "easy"
      },
      {
        question: "Hur många strängar har en standard-gitarr?",
        option_a: "4",
        option_b: "5",
        option_c: "6",
        option_d: "7",
        correct_answer: "C",
        time_limit: 20,
        category: "Musik",
        difficulty: "easy"
      },
      {
        question: "Vilket är det kemiska tecknet för guld?",
        option_a: "Go",
        option_b: "Au",
        option_c: "Ag",
        option_d: "Gd",
        correct_answer: "B",
        time_limit: 30,
        category: "Kemi",
        difficulty: "medium"
      },
      {
        question: "I vilken sport används termen 'hole in one'?",
        option_a: "Bowling",
        option_b: "Tennis",
        option_c: "Golf",
        option_d: "Dart",
        correct_answer: "C",
        time_limit: 15,
        category: "Sport",
        difficulty: "easy"
      },
      {
        question: "Vilket organ i kroppen producerar insulin?",
        option_a: "Lever",
        option_b: "Njurar",
        option_c: "Bukspottkörteln",
        option_d: "Mjälte",
        correct_answer: "C",
        time_limit: 25,
        category: "Medicin",
        difficulty: "medium"
      },
      {
        question: "Vilken planet är närmast solen?",
        option_a: "Venus",
        option_b: "Mars",
        option_c: "Merkurius",
        option_d: "Jorden",
        correct_answer: "C",
        time_limit: 20,
        category: "Astronomi",
        difficulty: "easy"
      },
      {
        question: "Vilket land representeras av denna flagga?",
        option_a: "Norge",
        option_b: "Sverige",
        option_c: "Finland",
        option_d: "Danmark",
        correct_answer: "B",
        time_limit: 15,
        category: "Geografi",
        difficulty: "easy",
        image_url: "https://flagcdn.com/w320/se.png"
      },
      {
        question: "Vilken frukt visas på bilden?",
        option_a: "Äpple",
        option_b: "Päron",
        option_c: "Apelsin",
        option_d: "Mango",
        correct_answer: "C",
        time_limit: 15,
        category: "Mat",
        difficulty: "easy",
        image_url: "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400&h=300&fit=crop"
      },
      {
        question: "Vilket djur är detta?",
        option_a: "Hund",
        option_b: "Katt",
        option_c: "Kanin",
        option_d: "Räv",
        correct_answer: "B",
        time_limit: 10,
        category: "Djur",
        difficulty: "easy",
        image_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop"
      }
    ];

    // Kontrollera om vi redan har frågor
    const existingQuestions = await questions.getAll();
    if (existingQuestions.length === 0) {
      console.log('Lägger till exempel-frågor...');
      for (const question of exampleQuestions) {
        await questions.create(question);
      }
      console.log(`✓ ${exampleQuestions.length} exempel-frågor tillagda`);
    } else {
      console.log(`✓ Databas innehåller redan ${existingQuestions.length} frågor`);
    }

    console.log('\n🎉 Databas-setup komplett!');
    console.log('\nFör att starta servern:');
    console.log('cd server && npm start');
    console.log('\nAdmin-inloggning:');
    console.log(`Användarnamn: ${adminUsername}`);
    console.log(`Lösenord: ${adminPassword}`);
    console.log('\n⚠️  VIKTIGT: Ändra admin-lösenordet i produktion!');

  } catch (error) {
    console.error('❌ Fel vid databas-setup:', error);
    process.exit(1);
  }
}

// Kör setup om scriptet körs direkt
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };