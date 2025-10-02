import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import sanitizeHtml from "sanitize-html";
import { fileURLToPath } from "url";
import {
  initDb,
  db,
  upsertAnswer,
  findBestAnswer,
  appendLog,
  normalize,
} from "./db.js";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    );
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// Limiter
const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/chat", limiter);

const dataDir = path.join(__dirname, "data");
const answersPath = path.join(dataDir, "answers.json");

// --- ROUTES ---

app.post("/api/chat", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    if (!sid) return res.status(401).json({ error: "Non authentifié" });

    const session = await db.get(
      "SELECT s.*, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > ?",
      [sid, new Date().toISOString()]
    );
    if (!session) return res.status(401).json({ error: "Session invalide" });

    const unsafe = String(req.body?.question || "");
    const sanitized = sanitizeHtml(unsafe, {
      allowedTags: [],
      allowedAttributes: {},
    });
    const q = normalize(sanitized);
    if (!q) return res.status(400).json({ error: "Question vide" });

    const found = await findBestAnswer(q);
    const response = found || "Je n’ai pas encore la réponse à cette question.";

    await appendLog({
      chatId: randomUUID(),
      userId: session.user_id,
      role: "user",
      text: sanitized,
      ip: req.ip,
      matched: Boolean(found),
      timestamp: new Date().toISOString(),
    });

    return res.json({ answer: response });
  } catch (e) {
    console.error("Erreur /api/chat:", e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.get("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// --- AUTH ---

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (!username || !password)
      return res.status(400).json({ error: "Identifiants requis" });

    const user = await db.get("SELECT * FROM users WHERE username=?", [
      username,
    ]);
    if (!user) return res.status(401).json({ error: "Identifiant incorrect" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });

    const id = randomUUID();
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.run(
      "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
      [id, user.id, now.toISOString(), expires.toISOString()]
    );

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sid", id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      })
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("Erreur login:", e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    if (sid) await db.run("DELETE FROM sessions WHERE id=?", [sid]);
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sid", "", { path: "/", maxAge: 0 })
    );
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/auth/check-user", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    if (!username) return res.status(400).json({ error: "Identifiant requis" });

    const user = await db.get("SELECT id FROM users WHERE username=?", [
      username,
    ]);
    return res.json({ exists: !!user });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, username, password } = req.body;
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !username?.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ error: "Tous les champs sont obligatoires" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mot de passe trop court" });
    }

    const existing = await db.get("SELECT id FROM users WHERE username=?", [
      username.trim(),
    ]);
    if (existing)
      return res.status(409).json({ error: "Identifiant déjà utilisé" });

    const hash = bcrypt.hashSync(password, 10);
    await db.run(
      "INSERT INTO users (username, password_hash, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        username.trim(),
        hash,
        firstName.trim(),
        lastName.trim(),
        new Date().toISOString(),
      ]
    );

    return res.json({ success: true });
  } catch (e) {
    console.error("Erreur signup:", e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- BOOTSTRAP ---

const startServer = async () => {
  await initDb();

  try {
    const answersRaw = fs.readFileSync(answersPath, "utf-8");
    const answersJson = JSON.parse(answersRaw);
    for (const [k, v] of Object.entries(answersJson)) {
      await upsertAnswer(String(k), String(v));
    }
  } catch {}

  // Seed user akram/akram123
  try {
    const existing = await db.get("SELECT * FROM users WHERE username=?", [
      "akram",
    ]);
    const hash = bcrypt.hashSync("akram123", 10);
    if (!existing) {
      await db.run(
        "INSERT INTO users (username, password_hash, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?)",
        ["akram", hash, "Akram", "Admin", new Date().toISOString()]
      );
      console.log("Seeded default user: akram / akram123");
    } else {
      await db.run(
        "UPDATE users SET password_hash=?, first_name=?, last_name=? WHERE id=?",
        [hash, "Akram", "Admin", existing.id]
      );
      console.log("Updated default user password: akram / akram123");
    }
  } catch {}

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
  });
};

startServer();
