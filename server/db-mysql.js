import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db; // instance MySQL

export async function initDb() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL database");
    
    // Test de connexion
    await db.execute("SELECT 1");
    
    return db;
  } catch (error) {
    console.error("Error connecting to MySQL:", error);
    throw error;
  }
}

export async function upsertAnswer(key, value) {
  try {
    await db.execute(
      `INSERT INTO faq (questions, reponses, langue) VALUES (?, ?, 'fr')
       ON DUPLICATE KEY UPDATE reponses = VALUES(reponses)`,
      [key, value]
    );
  } catch (error) {
    console.error("Error upserting answer:", error);
    throw error;
  }
}

export async function getAllAnswers() {
  try {
    const [rows] = await db.execute(
      "SELECT questions AS question, reponses AS answer FROM faq WHERE langue = 'fr'"
    );
    return rows;
  } catch (error) {
    console.error("Error getting all answers:", error);
    throw error;
  }
}

export async function findBestAnswer(normalizedQuestion) {
  try {
    // Récupérer toutes les entrées FAQ et faire la normalisation côté JS
    const [rows] = await db.execute(
      "SELECT questions, reponses FROM faq WHERE langue = 'fr'"
    );

    const target = String(normalizedQuestion || "").toLowerCase();
    for (const row of rows) {
      const qNorm = normalize(String(row.questions || ""));
      const aNorm = normalize(String(row.reponses || ""));
      if (qNorm.includes(target) || aNorm.includes(target)) {
        return row.reponses;
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding best answer:", error);
    return null;
  }
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
  try {
    // Insérer d'abord l'utilisateur s'il n'existe pas
    if (userId) {
      await db.execute(
        "INSERT IGNORE INTO utilisateurs (id, nom, prenom) VALUES (?, 'User', 'Unknown')",
        [userId]
      );
    }

    // Insérer la conversation si elle n'existe pas
    let conversationId;
    const [convRows] = await db.execute(
      "SELECT id FROM conversation WHERE user_hach = ? LIMIT 1",
      [chatId]
    );
    
    if (convRows.length === 0) {
      const [result] = await db.execute(
        "INSERT INTO conversation (user_hach, canal, Languge, statut, Utili_id) VALUES (?, 'web', 'fr', 'active', ?)",
        [chatId, userId]
      );
      conversationId = result.insertId;
    } else {
      conversationId = convRows[0].id;
    }

    // Insérer le message
    await db.execute(
      `INSERT INTO messages (conversation_id, emetteur, texte, reponse_faq_id, horodatage)
       VALUES (?, ?, ?, ?, ?)`,
      [conversationId, role, text, matched ? 1 : null, timestamp]
    );
  } catch (error) {
    console.error("Error appending log:", error);
    // Ne pas faire échouer l'application pour les logs
  }
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

// Fonctions d'authentification adaptées pour la table utilisateurs
export async function authenticateUser(username, password) {
  try {
    const [rows] = await db.execute(
      "SELECT id, identifiant, password, nom, prenom FROM utilisateurs WHERE identifiant = ?",
      [username]
    );
    
    if (rows.length === 0) return null;
    
    const user = rows[0];
    const bcrypt = (await import("bcryptjs")).default;
    const isValid = bcrypt.compareSync(password, user.password);
    
    if (isValid) {
      // Retourner l'utilisateur avec les noms de colonnes attendus par l'application
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
    console.error("Error authenticating user:", error);
    return null;
  }
}

export async function createSession(userId) {
  try {
    const { randomUUID } = await import("crypto");
    const sessionId = randomUUID();
    
    // Laisser MySQL gérer les dates (compatibles DATETIME)
    await db.execute(
      "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [sessionId, userId]
    );
    
    return sessionId;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
}

// Export de la connexion pour les autres modules
export { db };
