const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Anslut till databasen
const dbPath = path.join(__dirname, 'quiz.db');
const db = new sqlite3.Database(dbPath);

console.log('Startar databasmigrering...');

db.serialize(() => {
  // Lägg till media_url kolumn om den inte finns
  db.run(`
    ALTER TABLE questions ADD COLUMN media_url TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Fel vid tillägg av media_url:', err.message);
    } else {
      console.log('✓ Kolumn media_url tillagd (eller fanns redan)');
    }
  });

  // Lägg till media_type kolumn om den inte finns
  db.run(`
    ALTER TABLE questions ADD COLUMN media_type TEXT DEFAULT 'none'
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Fel vid tillägg av media_type:', err.message);
    } else {
      console.log('✓ Kolumn media_type tillagd (eller fanns redan)');
    }
  });

  // Migrera befintliga image_url till media_url och media_type
  db.run(`
    UPDATE questions 
    SET media_url = image_url, media_type = 'image'
    WHERE image_url IS NOT NULL AND image_url != '' AND (media_url IS NULL OR media_url = '')
  `, (err) => {
    if (err) {
      console.error('Fel vid migrering av image_url:', err.message);
    } else {
      console.log('✓ Migrerade befintliga image_url till media_url');
    }
  });

  // Skapa media_files tabell
  db.run(`
    CREATE TABLE IF NOT EXISTS media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video')),
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Fel vid skapande av media_files tabell:', err.message);
    } else {
      console.log('✓ Tabell media_files skapad (eller fanns redan)');
    }

    // Stäng databasen efter att allt är klart
    db.close((err) => {
      if (err) {
        console.error('Fel vid stängning av databas:', err.message);
      } else {
        console.log('\n✅ Databasmigrering slutförd!');
      }
    });
  });
});
