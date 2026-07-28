const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'game.db');

// Ensure target directory exists (useful when mounting to /app/data via GCS volume)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create rooms table
      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          status TEXT DEFAULT 'LOBBY', -- LOBBY, PLAYING, REVEAL, GALLERY, ENDED
          game_mode TEXT DEFAULT 'GAME1', -- GAME1 (Image Prompting), GAME2 (Keep Koopa LLM)
          active_master_index INTEGER DEFAULT 0,
          created_by_email TEXT DEFAULT 'anonymous@google.com',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Create players table
      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          room_id TEXT,
          username TEXT,
          score INTEGER DEFAULT 0,
          accumulated_score INTEGER DEFAULT 0,
          submitted_prompt TEXT,
          user_image_base64 TEXT,
          evaluation_json TEXT,
          game2_state_json TEXT,
          has_submitted INTEGER DEFAULT 0,
          PRIMARY KEY (room_id, username)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Perform safe column migrations if existing database table is present
          db.run("ALTER TABLE rooms ADD COLUMN game_mode TEXT DEFAULT 'GAME1'", () => {});
          db.run("ALTER TABLE rooms ADD COLUMN created_by_email TEXT DEFAULT 'anonymous@google.com'", () => {});
          db.run("ALTER TABLE players ADD COLUMN accumulated_score INTEGER DEFAULT 0", () => {});
          db.run("ALTER TABLE players ADD COLUMN game2_state_json TEXT", () => {});
          
          console.log('Database tables successfully initialized and schema updated.');
          resolve();
        }
      });
    });
  });
}

/**
 * Clean up heavy player payloads and images for rooms older than 1 day,
 * while preserving room creation records indefinitely for analytics.
 */
function purgeExpiredRooms() {
  return new Promise((resolve, reject) => {
    const oneDayAgo = "datetime('now', '-1 day')";
    db.serialize(() => {
      // Purge heavy player submission payloads and image base64s from expired rooms
      db.run(`DELETE FROM players WHERE room_id IN (SELECT id FROM rooms WHERE created_at < ${oneDayAgo})`, (err) => {
        if (err) return reject(err);
        console.log('Successfully purged heavy player submission states for expired rooms (>24h).');
        console.log('Room creation records preserved permanently for analytics.');
        resolve();
      });
    });
  });
}

module.exports = {
  db,
  initDatabase,
  purgeExpiredRooms
};
