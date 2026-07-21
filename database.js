const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'game.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create rooms table
      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          status TEXT DEFAULT 'LOBBY', -- LOBBY, PLAYING, REVEAL, ENDED
          active_master_index INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // Create players table
      db.run(`
        CREATE TABLE IF NOT EXISTS players (
          room_id TEXT,
          username TEXT,
          score INTEGER DEFAULT 0,
          submitted_prompt TEXT,
          user_image_base64 TEXT,
          evaluation_json TEXT,
          has_submitted INTEGER DEFAULT 0,
          PRIMARY KEY (room_id, username)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database tables successfully initialized.');
          resolve();
        }
      });
    });
  });
}

/**
 * Clean up rooms and records older than 1 day
 */
function purgeExpiredRooms() {
  return new Promise((resolve, reject) => {
    const oneDayAgo = "datetime('now', '-1 day')";
    db.serialize(() => {
      db.run(`DELETE FROM players WHERE room_id IN (SELECT id FROM rooms WHERE created_at < ${oneDayAgo})`, (err) => {
        if (err) return reject(err);
        db.run(`DELETE FROM rooms WHERE created_at < ${oneDayAgo}`, (err) => {
          if (err) return reject(err);
          console.log('Successfully purged expired rooms and player states (older than 24h).');
          resolve();
        });
      });
    });
  });
}

module.exports = {
  db,
  initDatabase,
  purgeExpiredRooms
};
