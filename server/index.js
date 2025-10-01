import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import sanitizeHtml from "sanitize-html";
import { fileURLToPath } from "url";
import { db, ensureSchema, upsertAnswer, findBestAnswer, appendLog, normalize } from "./db.js";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Minimal, explicit CORS for localhost and 127.0.0.1 with credentials
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  console.log("CORS request from:", origin, "to:", req.path);
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    // eslint-disable-next-line no-console
    console.log("CORS preflight:", req.method, req.path, "Origin:", req.headers.origin);
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

// Rate limit: 5 requêtes / 30s par IP
const limiter = rateLimit({ windowMs: 30 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
app.use("/api/chat", limiter);

const dataDir = path.join(__dirname, "data");
const answersPath = path.join(dataDir, "answers.json");
const logsPath = path.join(dataDir, "logs.json");

function ensureSeedFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(answersPath)) {
    const seed = {
      "horaires bibliotheque": "La bibliothèque est ouverte du lundi au vendredi de 8h à 18h.",
      "horaires resto u": "Le restaurant universitaire est ouvert de 11h30 à 14h et de 18h30 à 20h.",
      "contact scolarite": "Vous pouvez contacter la scolarité à scolarite@campus.fr ou au 01 23 45 67 89.",
      "reglement": "Le règlement intérieur est disponible sur l'intranet du campus.",
      "dates importantes": "Les examens débutent le 15 juin. Les inscriptions ferment le 30 septembre.",
      "formations": "Nous proposons des formations en Informatique, Gestion, Droit et Design."
    };
    fs.writeFileSync(answersPath, JSON.stringify(seed, null, 2), "utf-8");
  }
  if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, JSON.stringify([], null, 2), "utf-8");
}

ensureSeedFiles();
ensureSchema();

// One-time migration from JSON files to SQLite
try {
  const answersRaw = fs.readFileSync(answersPath, "utf-8");
  const answersJson = JSON.parse(answersRaw);
  Object.entries(answersJson).forEach(([key, value]) => upsertAnswer(String(key), String(value)));
} catch {}

// JSON log file remains optional; DB is the source of truth now

app.post("/api/chat", (req, res) => {
  try {
    // Auth guard
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    if (!sid) return res.status(401).json({ error: "Non authentifié" });
    const session = db.prepare("SELECT s.*, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > ?").get(sid, new Date().toISOString());
    if (!session) return res.status(401).json({ error: "Session invalide" });

    const unsafe = String(req.body?.question || "");
    const sanitized = sanitizeHtml(unsafe, { allowedTags: [], allowedAttributes: {} });
    const q = normalize(sanitized);
    if (!q) return res.status(400).json({ error: "Question vide" });

    const found = findBestAnswer(q);
    const response = found || "Je n’ai pas encore la réponse à cette question.";
    appendLog({ question: sanitized, ip: req.ip, matched: Boolean(found), timestamp: new Date().toISOString() });
    return res.json({ answer: response });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/health", (_req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// Auth endpoints
app.post("/api/auth/login", (req, res) => {
  try {
    // eslint-disable-next-line no-console
    console.log("POST /api/auth/login from", req.headers.origin);
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (!username || !password) return res.status(400).json({ error: "Identifiants requis" });

    const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
    if (!user) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });

    const id = randomUUID();
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
    db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
      id,
      user.id,
      now.toISOString(),
      expires.toISOString()
    );

    res.setHeader("Set-Cookie", cookie.serialize("sid", id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    }));
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    if (sid) db.prepare("DELETE FROM sessions WHERE id=?").run(sid);
    res.setHeader("Set-Cookie", cookie.serialize("sid", "", { path: "/", maxAge: 0 }));
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Check if user exists endpoint
app.post("/api/auth/check-user", (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    if (!username) return res.status(400).json({ error: "Identifiant requis" });

    const user = db.prepare("SELECT id FROM users WHERE username=?").get(username);
    if (user) {
      return res.status(200).json({ exists: true });
    }
    return res.status(404).json({ exists: false });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Signup endpoint
app.post("/api/auth/signup", (req, res) => {
  try {
    const { firstName, lastName, username, password } = req.body;
    
    if (!firstName?.trim() || !lastName?.trim() || !username?.trim() || !password) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Vérifier si l'utilisateur existe déjà
    const existing = db.prepare("SELECT id FROM users WHERE username=?").get(username.trim());
    if (existing) {
      return res.status(409).json({ error: "Cet identifiant est déjà utilisé" });
    }

    // Créer le nouvel utilisateur
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, first_name, last_name, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      username.trim(),
      hash,
      firstName.trim(),
      lastName.trim(),
      new Date().toISOString()
    );

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Ensure default user exists: akram / akram123
try {
  const existing = db.prepare("SELECT * FROM users WHERE username=?").get("akram");
  const hash = bcrypt.hashSync("akram123", 10);
  if (!existing) {
    db.prepare("INSERT INTO users (username, password_hash, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?)").run("akram", hash, "Akram", "Admin", new Date().toISOString());
    // eslint-disable-next-line no-console
    console.log("Seeded default user: akram / akram123");
  } else {
    // Mettre à jour l'utilisateur existant avec les nouveaux champs
    db.prepare("UPDATE users SET password_hash=?, first_name=?, last_name=? WHERE id=?").run(hash, "Akram", "Admin", existing.id);
    // eslint-disable-next-line no-console
    console.log("Updated default user password: akram / akram123");
  }
} catch {}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});


