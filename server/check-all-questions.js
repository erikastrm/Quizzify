const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./quiz.db');

db.all('SELECT id, question, image_url FROM questions ORDER BY id DESC LIMIT 5', (err, rows) => {
  if (err) {
    console.error('Fel:', err);
  } else {
    console.log('Senaste 5 frågorna:');
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
