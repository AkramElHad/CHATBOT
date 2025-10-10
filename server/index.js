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
  authenticateUser,
  createSession,
  getAllAnswers,
} from "./db-mysql.js";
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

    const [sessionRows] = await db.execute(
      "SELECT s.*, u.identifiant as username FROM sessions s JOIN utilisateurs u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > NOW()",
      [sid]
    );
    if (sessionRows.length === 0) return res.status(401).json({ error: "Session invalide" });
    const session = sessionRows[0];

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

// Retourne les questions/réponses de la table FAQ (utilisées comme suggestions)
app.get("/api/faq", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    if (!sid) return res.status(401).json({ error: "Non authentifié" });

    // Vérifier que la session est valide
    const [sessionRows] = await db.execute(
      "SELECT s.id FROM sessions s WHERE s.id = ? AND s.expires_at > NOW()",
      [sid]
    );
    if (sessionRows.length === 0)
      return res.status(401).json({ error: "Session invalide" });

    const rows = await getAllAnswers();
    // rows: [{ question, answer }]
    return res.json({ faq: rows });
  } catch (e) {
    console.error("Erreur /api/faq:", e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.execute("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// Route pour récupérer l'historique des conversations
app.get("/api/history", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    if (!sid) return res.status(401).json({ error: "Non authentifié" });

    // Vérifier que la session est valide
    const [sessionRows] = await db.execute(
      "SELECT s.id, s.user_id, u.identifiant as username FROM sessions s JOIN utilisateurs u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > NOW()",
      [sid]
    );
    if (sessionRows.length === 0) return res.status(401).json({ error: "Session invalide" });

    const session = sessionRows[0];

    // Récupérer toutes les conversations de l'utilisateur
    const [conversations] = await db.execute(
      "SELECT id, user_hach FROM conversation WHERE Utili_id = ? ORDER BY id DESC",
      [session.user_id]
    );

    const chats = [];

    // Pour chaque conversation, récupérer les messages
    for (const conv of conversations) {
      const [messages] = await db.execute(
        "SELECT id, emetteur as role, texte as text, horodatage as timestamp FROM messages WHERE conversation_id = ? ORDER BY horodatage ASC",
        [conv.id]
      );

      if (messages.length > 0) {
        // Utiliser l'horodatage du premier message comme date de début
        const startedAt = messages[0] ? messages[0].timestamp : new Date().toISOString();
        
        chats.push({
          chatId: conv.user_hach,
          startedAt: startedAt,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role === 'bot' ? 'assistant' : msg.role,
            text: msg.text
          }))
        });
      }
    }

    return res.json({ chats });
  } catch (e) {
    console.error("Erreur /api/history:", e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- AUTH ---

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    console.log("🔐 Login attempt:", { username, password: password ? "***" : "empty" });
    
    if (!username || !password)
      return res.status(400).json({ error: "Identifiants requis" });

    const user = await authenticateUser(username, password);
    console.log("👤 User authentication result:", user ? "SUCCESS" : "FAILED");
    
    if (!user) return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });

    const sessionId = await createSession(user.id);
    console.log("🎫 Session created:", sessionId);

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sid", sessionId, {
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
    if (sid) await db.execute("DELETE FROM sessions WHERE id=?", [sid]);
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

    const [rows] = await db.execute("SELECT id FROM utilisateurs WHERE identifiant=?", [
      username,
    ]);
    return res.json({ exists: rows.length > 0 });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/auth/status", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sid = cookies.sid;
    
    if (!sid) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const [rows] = await db.execute(
      "SELECT s.id, s.user_id, s.expires_at, u.identifiant, u.prenom, u.nom FROM sessions s JOIN utilisateurs u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > NOW()",
      [sid]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Session expirée" });
    }

    return res.json({ 
      authenticated: true, 
      user: {
        id: rows[0].user_id,
        username: rows[0].identifiant,
        firstName: rows[0].prenom,
        lastName: rows[0].nom
      }
    });
  } catch (e) {
    console.error("Erreur vérification session:", e);
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

    const [existingRows] = await db.execute("SELECT id FROM utilisateurs WHERE identifiant=?", [
      username.trim(),
    ]);
    if (existingRows.length > 0)
      return res.status(409).json({ error: "Identifiant déjà utilisé" });

    const hash = bcrypt.hashSync(password, 10);
    await db.execute(
      "INSERT INTO utilisateurs (identifiant, password, prenom, nom) VALUES (?, ?, ?, ?)",
      [
        username.trim(),
        hash,
        firstName.trim(),
        lastName.trim(),
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

  // Seed user akram/akram123 dans la table utilisateurs
  try {
    const [existingRows] = await db.execute("SELECT * FROM utilisateurs WHERE identifiant=?", [
      "akram",
    ]);
    const hash = bcrypt.hashSync("akram123", 10);
    if (existingRows.length === 0) {
      await db.execute(
        "INSERT INTO utilisateurs (identifiant, password, prenom, nom) VALUES (?, ?, ?, ?)",
        ["akram", hash, "Akram", "Admin"]
      );
      console.log("Seeded default user: akram / akram123");
    } else {
      await db.execute(
        "UPDATE utilisateurs SET password=?, prenom=?, nom=? WHERE id=?",
        [hash, "Akram", "Admin", existingRows[0].id]
      );
      console.log("Updated default user password: akram / akram123");
    }
  } catch (error) {
    console.error("Error seeding user:", error);
  }

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
    console.log("Using MySQL database with FAQ data");
  });
};

startServer();
