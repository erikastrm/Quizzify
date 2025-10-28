const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./quiz.db');

db.all('SELECT id, question, image_url FROM questions WHERE question LIKE "%film%"', (err, rows) => {
  if (err) {
    console.error('Fel:', err);
  } else {
    console.log('Frågor som innehåller "film":');
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
