import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve DB path relative to this file location to avoid process.cwd() pitfalls
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, "data");
const dbPath = path.join(dbDir, "app.db");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      ip TEXT,
      matched INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  // Migration pour ajouter les colonnes first_name et last_name si elles n'existent pas
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasFirstName = columns.some(col => col.name === 'first_name');
    const hasLastName = columns.some(col => col.name === 'last_name');
    
    if (!hasFirstName) {
      db.exec("ALTER TABLE users ADD COLUMN first_name TEXT DEFAULT ''");
    }
    if (!hasLastName) {
      db.exec("ALTER TABLE users ADD COLUMN last_name TEXT DEFAULT ''");
    }
  } catch (e) {
    // Ignore migration errors
  }
}

export function upsertAnswer(key, value) {
  const stmt = db.prepare(
    `INSERT INTO answers (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  );
  stmt.run(key, value);
}

export function getAllAnswers() {
  return db.prepare("SELECT key, value FROM answers").all();
}

export function findBestAnswer(normalizedQuestion) {
  const rows = getAllAnswers();
  for (const row of rows) {
    const k = normalize(row.key);
    if (normalizedQuestion.includes(k) || k.includes(normalizedQuestion)) {
      return row.value;
    }
  }
  return null;
}

export function appendLog({ question, ip, matched, timestamp }) {
  const stmt = db.prepare(
    `INSERT INTO logs (question, ip, matched, timestamp) VALUES (?, ?, ?, ?)`
  );
  stmt.run(question, ip || null, matched ? 1 : 0, timestamp);
}

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


