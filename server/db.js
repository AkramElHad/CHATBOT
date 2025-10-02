import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, "data");
const dbPath = path.join(dbDir, "app.db");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db; // instance async

export async function initDb() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Active les clés étrangères et journalisation WAL
  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA foreign_keys = ON;");

  await ensureSchema();
  return db;
}

async function ensureSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT,
      user_id INTEGER,
      role TEXT,
      text TEXT,
      ip TEXT,
      matched INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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

  // Migration pour logs
  try {
    const columns = await db.all("PRAGMA table_info(logs)");
    const colNames = columns.map((c) => c.name);

    if (!colNames.includes("chat_id")) {
      await db.exec("ALTER TABLE logs ADD COLUMN chat_id TEXT");
    }
    if (!colNames.includes("user_id")) {
      await db.exec("ALTER TABLE logs ADD COLUMN user_id INTEGER");
    }
    if (!colNames.includes("role")) {
      await db.exec("ALTER TABLE logs ADD COLUMN role TEXT DEFAULT 'user'");
    }
    if (!colNames.includes("text")) {
      await db.exec("ALTER TABLE logs ADD COLUMN text TEXT DEFAULT ''");
    }
  } catch (e) {
    console.error("Migration logs échouée:", e);
  }
}

export async function upsertAnswer(key, value) {
  await db.run(
    `INSERT INTO answers (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [key, value]
  );
}

export async function getAllAnswers() {
  return await db.all("SELECT key, value FROM answers");
}

export async function findBestAnswer(normalizedQuestion) {
  const rows = await getAllAnswers();
  for (const row of rows) {
    const k = normalize(row.key);
    if (normalizedQuestion.includes(k) || k.includes(normalizedQuestion)) {
      return row.value;
    }
  }
  return null;
}

export async function appendLog({
  chatId,
  userId,
  role,
  text,
  ip,
  matched,
  timestamp,
}) {
  await db.run(
    `INSERT INTO logs (chat_id, user_id, role, text, ip, matched, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [chatId, userId, role, text, ip || null, matched ? 1 : 0, timestamp]
  );
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

// ✅ exports explicites
export { db, ensureSchema };
