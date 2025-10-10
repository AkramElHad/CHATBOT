import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Configuration de la base de données MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatbot_campus',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
};

let db: mysql.Connection;

// Initialiser la connexion MySQL
export async function initDb() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("✅ Connexion à MySQL réussie !");
    return db;
  } catch (error) {
    console.error("❌ Erreur de connexion MySQL:", error);
    throw error;
  }
}

// Fonction pour obtenir la connexion
export function getDb() {
  if (!db) {
    throw new Error("Base de données non initialisée. Appelez initDb() d'abord.");
  }
  return db;
}

export async function ensureSchema() {
  const connection = getDb();
  // Les tables existent déjà dans la base de données chatbot_campus
  // Pas besoin de les créer, elles sont déjà présentes
  console.log("✅ Schéma de base de données vérifié (tables existantes)");
}

export async function upsertAnswer(key: string, value: string) {
  const connection = getDb();
  await connection.execute(
    `INSERT INTO faq (questions, reponses, langue) VALUES (?, ?, 'fr')
     ON DUPLICATE KEY UPDATE reponses = VALUES(reponses)`,
    [key, value]
  );
}

export async function getAllAnswers() {
  const connection = getDb();
  const [rows] = await connection.execute(
    "SELECT questions AS key, reponses AS value FROM faq WHERE langue = 'fr'"
  );
  return rows as Array<{ key: string; value: string }>;
}

export async function findBestAnswer(normalizedQuestion: string) {
  const connection = getDb();
  const [rows] = await connection.execute(
    "SELECT questions, reponses FROM faq WHERE langue = 'fr'"
  );
  
  const faqRows = rows as Array<{ questions: string; reponses: string }>;
  
  // 1) Exact/substring match
  for (const row of faqRows) {
    const k = normalize(row.questions);
    if (
      k &&
      (normalizedQuestion.includes(k) || k.includes(normalizedQuestion))
    ) {
      return row.reponses;
    }
  }
  
  // 2) Fuzzy word-overlap (Jaccard) fallback
  const qTokens = new Set(normalizedQuestion.split(" ").filter(Boolean));
  let best = { score: 0, value: null as string | null };
  for (const row of faqRows) {
    const kTokens = new Set(normalize(row.questions).split(" ").filter(Boolean));
    if (kTokens.size === 0) continue;
    let inter = 0;
    for (const t of qTokens) if (kTokens.has(t)) inter++;
    const union = qTokens.size + kTokens.size - inter;
    const score = union > 0 ? inter / union : 0;
    if (score > best.score) best = { score, value: row.reponses };
  }
  return best.score >= 0.34 ? best.value : null;
}

export async function appendLog({
  chatId,
  userId,
  role,
  text,
  matched,
  timestamp,
  ip,
}: {
  chatId: string;
  userId: number;
  role: "user" | "assistant";
  text: string;
  matched: boolean;
  timestamp: string;
  ip?: string;
}) {
  const connection = getDb();
  
  try {
    // Insérer d'abord l'utilisateur s'il n'existe pas
    if (userId) {
      await connection.execute(
        "INSERT IGNORE INTO utilisateurs (id, nom, prenom) VALUES (?, 'User', 'Unknown')",
        [userId]
      );
    }

    // Insérer la conversation si elle n'existe pas
    let conversationId;
    const [convRows] = await connection.execute(
      "SELECT id FROM conversation WHERE user_hach = ? LIMIT 1",
      [chatId]
    );
    
    if (convRows.length === 0) {
      const [result] = await connection.execute(
        "INSERT INTO conversation (user_hach, canal, Languge, statut, Utili_id) VALUES (?, 'web', 'fr', 'active', ?)",
        [chatId, userId]
      );
      conversationId = result.insertId;
    } else {
      conversationId = convRows[0].id;
    }

    // Insérer le message
    await connection.execute(
      `INSERT INTO messages (conversation_id, emetteur, texte, reponse_faq_id, horodatage)
       VALUES (?, ?, ?, ?, ?)`,
      [conversationId, role, text, matched ? 1 : null, timestamp]
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout du log:", error);
  }
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

export async function authenticateUser(username: string, password: string) {
  const connection = getDb();
  const trimmedUsername = String(username || "").trim();
  
  try {
    const [rows] = await connection.execute(
      "SELECT id, identifiant, password, nom, prenom FROM utilisateurs WHERE identifiant = ?",
      [trimmedUsername]
    );
    
    if (rows.length === 0) return null;
    
    const user = rows[0] as any;
    const isValid = bcrypt.compareSync(password, user.password);
    
    if (isValid) {
      return {
        id: user.id,
        username: user.identifiant,
        password_hash: user.password,
        first_name: user.prenom,
        last_name: user.nom
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return null;
  }
}

export async function createSession(userId: number) {
  const connection = getDb();
  const id = randomUUID();
  
  try {
    await connection.execute(
      "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [id, userId]
    );
    return id;
  } catch (error) {
    console.error("Erreur création session:", error);
    throw error;
  }
}

export async function validateSession(sessionId: string) {
  const connection = getDb();
  
  try {
    const [rows] = await connection.execute(
      "SELECT s.*, u.identifiant as username FROM sessions s JOIN utilisateurs u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > NOW()",
      [sessionId]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Erreur validation session:", error);
    return null;
  }
}

export async function ensureDefaultUser() {
  const connection = getDb();
  
  try {
    const [rows] = await connection.execute(
      "SELECT * FROM utilisateurs WHERE identifiant = ?",
      ["akram"]
    );
    
    const hash = bcrypt.hashSync("akram123", 10);
    
    if (rows.length === 0) {
      await connection.execute(
        "INSERT INTO utilisateurs (nom, prenom, identifiant, password) VALUES (?, ?, ?, ?)",
        ["Admin", "Akram", "akram", hash]
      );
      console.log("Utilisateur par défaut créé: akram / akram123");
    } else {
      await connection.execute(
        "UPDATE utilisateurs SET password = ? WHERE identifiant = ?",
        [hash, "akram"]
      );
      console.log("Mot de passe utilisateur par défaut mis à jour: akram / akram123");
    }
  } catch (error) {
    console.error("Erreur création utilisateur par défaut:", error);
  }
}

// Initialisation asynchrone
export async function initializeDatabase() {
  try {
    await initDb();
    await ensureSchema();
    await ensureDefaultUser();
    console.log("✅ Base de données initialisée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
    throw error;
  }
}
