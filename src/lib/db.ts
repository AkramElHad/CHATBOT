import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import os from "os";

// Ensure a stable absolute path for dev server
const projectRoot = process.cwd();
const dbDir = path.join(projectRoot, "server", "data");
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
      user_id INTEGER,
      matched INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
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
  // Lightweight migrations for existing installations
  try {
    const cols = db.prepare("PRAGMA table_info('logs')").all() as Array<{ name: string }>;
    const hasUserId = cols.some((c) => c.name === "user_id");
    if (!hasUserId) {
      db.exec("ALTER TABLE logs ADD COLUMN user_id INTEGER");
    }
  } catch {}
}

export function upsertAnswer(key: string, value: string) {
  const stmt = db.prepare(
    `INSERT INTO answers (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  );
  stmt.run(key, value);
}

export function getAllAnswers() {
  return db.prepare("SELECT key, value FROM answers").all();
}

export function findBestAnswer(normalizedQuestion: string) {
  // Safety: ensure seeds are present (idempotent)
  try { seedAnswers(); } catch {}
  let rows = getAllAnswers();
  // Fallback to JSON seed if table empty for any reason
  if (!rows || rows.length === 0) {
    try {
      const jsonPath = path.join(dbDir, "answers.json");
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const obj = JSON.parse(raw) as Record<string, string>;
        Object.entries(obj).forEach(([k, v]) => upsertAnswer(k, v));
        rows = getAllAnswers();
      }
    } catch {}
  }
  // 1) Exact/substring match
  for (const row of rows) {
    const k = normalize(row.key);
    if (k && (normalizedQuestion.includes(k) || k.includes(normalizedQuestion))) {
      return row.value;
    }
  }
  // 2) Fuzzy word-overlap (Jaccard) fallback
  const qTokens = new Set(normalizedQuestion.split(" ").filter(Boolean));
  let best = { score: 0, value: null as string | null };
  for (const row of rows) {
    const kTokens = new Set(normalize(row.key).split(" ").filter(Boolean));
    if (kTokens.size === 0) continue;
    let inter = 0;
    for (const t of qTokens) if (kTokens.has(t)) inter++;
    const union = qTokens.size + kTokens.size - inter;
    const score = union > 0 ? inter / union : 0;
    if (score > best.score) best = { score, value: row.value };
  }
  return best.score >= 0.34 ? best.value : null;
}

export function appendLog({ question, ip, matched, timestamp, userId }: {
  question: string;
  ip?: string;
  matched: boolean;
  timestamp: string;
  userId?: number;
}) {
  const stmt = db.prepare(
    `INSERT INTO logs (question, ip, user_id, matched, timestamp) VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(question, ip || null, userId ?? null, matched ? 1 : 0, timestamp);
}

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function authenticateUser(username: string, password: string) {
  const trimmedUsername = String(username || "").trim();
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(trimmedUsername);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return null;
  return user;
}

export function createSession(userId: number) {
  const id = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    id,
    userId,
    now.toISOString(),
    expires.toISOString()
  );
  return id;
}

export function validateSession(sessionId: string) {
  return db.prepare("SELECT s.*, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > ?").get(sessionId, new Date().toISOString());
}

export function ensureDefaultUser() {
  try {
    const existing = db.prepare("SELECT * FROM users WHERE username=?").get("akram");
    const hash = bcrypt.hashSync("akram123", 10);
    if (!existing) {
      db.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)").run("akram", hash, new Date().toISOString());
      console.log("Seeded default user: akram / akram123");
    } else {
      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash, existing.id);
      console.log("Updated default user password: akram / akram123");
    }
  } catch {}
}

// Initialize database
ensureSchema();
ensureDefaultUser();

function seedAnswers() {
  const seedAnswers: Record<string, string> = {
    // Q/R de base
    "horaires bibliotheque": "La bibliothèque est ouverte du lundi au vendredi de 8h à 18h.",
    "horaires resto u": "Le restaurant universitaire est ouvert de 11h30 à 14h et de 18h30 à 20h.",
    "contact scolarite": "Vous pouvez contacter la scolarité à scolarite@campus.fr ou au 01 23 45 67 89.",
    "reglement": "Le règlement intérieur est disponible sur l'intranet du campus.",
    "dates importantes": "Les examens débutent le 15 juin. Les inscriptions ferment le 30 septembre.",
    "formations": "Nous proposons des formations en Informatique, Gestion, Droit et Design.",

    // Variantes et synonymes pour une meilleure couverture
    "horaires campus": "Le campus est accessible de 7h30 à 21h du lundi au vendredi.",
    "horaires scolarite": "Le service scolarité est ouvert de 9h à 12h30 et de 13h30 à 17h.",
    "contact bibliotheque": "Bibliothèque: bibliotheque@campus.fr, poste 204.",
    "wifi campus": "Réseau Wi‑Fi: CAMPUS-WIFI. Authentifiez-vous avec vos identifiants étudiants.",
    "carte etudiante": "La carte étudiante est délivrée par la scolarité. En cas de perte, déclaration à l'accueil puis réédition (10€).",
    "parking": "Le parking étudiants se situe au sous-sol B. Accès avec la carte étudiante de 7h à 21h.",
    "resto u tarifs": "Tarif étudiant menu Resto U: 3,30€ (ticket RU ou paiement sans contact).",
    "bourses": "Les bourses Crous se demandent sur messervices.etudiant.gouv.fr pendant la campagne DSE.",
    "stages": "Le service carrières accompagne vos stages: careers@campus.fr. Convention obligatoire avant le début.",
    "absences": "Toute absence doit être justifiée sous 48h sur l'ENT rubrique 'Absences'.",
    "rattrapage": "Les rattrapages ont lieu en juillet. L'inscription se fait sur l'ENT deux semaines avant.",
    "vacances": "Calendrier académique: vacances d'hiver semaine 8, printemps semaine 15.",
    "inscriptions": "Réinscriptions ouvertes du 1er juin au 31 juillet via l'ENT, onglet Scolarité.",
  };
  Object.entries(seedAnswers).forEach(([key, value]) => upsertAnswer(key, value));
}

// Run once on import
try { seedAnswers(); } catch {}
