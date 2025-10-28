const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Skapa databasanslutning
const dbPath = path.join(__dirname, '../quiz.db');
const db = new sqlite3.Database(dbPath);

/**
 * Initiera databas-tabeller
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabell för frågor
      db.run(`
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          option_d TEXT NOT NULL,
          correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
          time_limit INTEGER DEFAULT 30,
          category TEXT,
          difficulty TEXT DEFAULT 'medium',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabell för spelhistorik
      db.run(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ended_at DATETIME,
          total_players INTEGER DEFAULT 0,
          total_questions INTEGER DEFAULT 0,
          winner_name TEXT,
          winner_score INTEGER
        )
      `);

      // Tabell för spelarresultat per session
      db.run(`
        CREATE TABLE IF NOT EXISTS player_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          player_name TEXT NOT NULL,
          final_score INTEGER DEFAULT 0,
          questions_answered INTEGER DEFAULT 0,
          correct_answers INTEGER DEFAULT 0,
          FOREIGN KEY (session_id) REFERENCES game_sessions(id)
        )
      `);

      // Tabell för admin-användare
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Databasoperationer för frågor
 */
const questionOperations = {
  // Hämta alla frågor
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, question, option_a, option_b, option_c, option_d, 
               correct_answer, time_limit, category, difficulty, created_at, image_url
        FROM questions 
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Hämta fråga med ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM questions WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Skapa ny fråga
  create: (questionData) => {
    return new Promise((resolve, reject) => {
      const { question, option_a, option_b, option_c, option_d, correct_answer, time_limit, category, difficulty, image_url } = questionData;
      
      db.run(`
        INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer, time_limit, category, difficulty, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [question, option_a, option_b, option_c, option_d, correct_answer, time_limit || 30, category, difficulty || 'medium', image_url || null], 
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...questionData });
      });
    });
  },

  // Uppdatera fråga
  update: (id, questionData) => {
    return new Promise((resolve, reject) => {
      const { question, option_a, option_b, option_c, option_d, correct_answer, time_limit, category, difficulty, image_url } = questionData;
      
      db.run(`
        UPDATE questions 
        SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, 
            correct_answer = ?, time_limit = ?, category = ?, difficulty = ?, image_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [question, option_a, option_b, option_c, option_d, correct_answer, time_limit, category, difficulty, image_url || null, id], 
      function(err) {
        if (err) reject(err);
        else resolve({ id, changes: this.changes });
      });
    });
  },

  // Ta bort fråga
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM questions WHERE id = ?`, [id], function(err) {
        if (err) reject(err);
        else resolve({ id, changes: this.changes });
      });
    });
  },

  // Hämta slumpmässiga frågor för quiz
  getRandom: (limit = 10) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM questions 
        ORDER BY RANDOM() 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

/**
 * Databasoperationer för spelsessioner
 */
const gameSessionOperations = {
  // Skapa ny spelsession
  create: (playerCount = 0) => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO game_sessions (total_players)
        VALUES (?)
      `, [playerCount], function(err) {
        if (err) reject(err);
        else resolve({ sessionId: this.lastID });
      });
    });
  },

  // Avsluta spelsession
  end: (sessionId, winnerData, totalQuestions) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE game_sessions 
        SET ended_at = CURRENT_TIMESTAMP, total_questions = ?, winner_name = ?, winner_score = ?
        WHERE id = ?
      `, [totalQuestions, winnerData?.name, winnerData?.score, sessionId], function(err) {
        if (err) reject(err);
        else resolve({ sessionId, changes: this.changes });
      });
    });
  },

  // Hämta senaste spelsessioner
  getRecent: (limit = 10) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM game_sessions 
        WHERE ended_at IS NOT NULL
        ORDER BY started_at DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

/**
 * Databasoperationer för admin-användare
 */
const adminOperations = {
  // Hitta admin med användarnamn
  findByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM admin_users WHERE username = ?
      `, [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Skapa ny admin-användare
  create: (username, passwordHash) => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO admin_users (username, password_hash)
        VALUES (?, ?)
      `, [username, passwordHash], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, username });
      });
    });
  },

  // Uppdatera senaste inloggning
  updateLastLogin: (id) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE admin_users 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [id], function(err) {
        if (err) reject(err);
        else resolve({ id, changes: this.changes });
      });
    });
  }
};

// Exportera databas och operationer
module.exports = {
  db,
  initializeDatabase,
  questions: questionOperations,
  gameSessions: gameSessionOperations,
  admin: adminOperations
};