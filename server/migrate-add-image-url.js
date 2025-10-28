const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Skapa databasanslutning
const dbPath = path.join(__dirname, 'quiz.db');
const db = new sqlite3.Database(dbPath);

console.log('Migrering: Lägger till image_url kolumn i questions-tabellen...');

db.serialize(() => {
  // Kolla om kolumnen redan finns
  db.all("PRAGMA table_info(questions)", [], (err, columns) => {
    if (err) {
      console.error('Fel vid läsning av tabellstruktur:', err);
      return;
    }

    const hasImageUrl = columns.some(col => col.name === 'image_url');
    
    if (hasImageUrl) {
      console.log('✓ Kolumnen image_url finns redan');
      db.close();
      return;
    }

    // Lägg till image_url kolumn
    db.run(`
      ALTER TABLE questions 
      ADD COLUMN image_url TEXT
    `, (err) => {
      if (err) {
        console.error('✗ Fel vid tillägg av image_url kolumn:', err);
      } else {
        console.log('✓ Kolumnen image_url har lagts till i questions-tabellen');
      }
      
      db.close();
    });
  });
});
