const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./quiz.db');

console.log('\n=== Kontrollerar databas-schema ===\n');

db.all('PRAGMA table_info(questions)', (err, cols) => {
  if (err) {
    console.error('Fel:', err);
    db.close();
    return;
  }
  
  console.log('Kolumner i questions-tabellen:');
  cols.forEach(c => {
    console.log(`  - ${c.name} (${c.type})`);
  });
  
  console.log('\n=== Kontrollerar frågor med bilder ===\n');
  
  db.all('SELECT id, question, image_url FROM questions WHERE image_url IS NOT NULL', (err, rows) => {
    if (err) {
      console.error('Fel:', err);
    } else if (rows.length === 0) {
      console.log('Inga frågor med bilder hittades.');
    } else {
      console.log(`Hittade ${rows.length} frågor med bilder:`);
      rows.forEach(row => {
        console.log(`\n  ID: ${row.id}`);
        console.log(`  Fråga: ${row.question}`);
        console.log(`  Bild-URL: ${row.image_url}`);
      });
    }
    
    db.close();
  });
});
