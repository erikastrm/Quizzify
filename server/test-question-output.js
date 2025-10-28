const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./quiz.db');

// Simulera vad som händer när en fråga visas
db.get('SELECT * FROM questions WHERE id = 12', (err, question) => {
  if (err) {
    console.error('Fel:', err);
    db.close();
    return;
  }

  if (!question) {
    console.log('Fråga hittades inte');
    db.close();
    return;
  }

  // Detta är vad som skickas till klienterna (från server.js)
  const questionForPlayers = {
    id: question.id,
    question: question.question,
    options: {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d
    },
    timeLimit: question.time_limit,
    category: question.category,
    difficulty: question.difficulty,
    image_url: question.image_url
  };

  console.log('Data som skickas till spelare:');
  console.log(JSON.stringify(questionForPlayers, null, 2));
  
  console.log('\nHar image_url?', !!questionForPlayers.image_url);
  console.log('image_url värde:', questionForPlayers.image_url);

  db.close();
});
