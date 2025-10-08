import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importMySQLData() {
  let connection;
  
  try {
    // Connexion à MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL database");

    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, "..", "chatbot_campus faq rempli.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    
    // Diviser le contenu en requêtes individuelles
    const queries = sqlContent
      .split(";")
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith("--") && !query.startsWith("/*"));

    console.log(`Found ${queries.length} SQL queries to execute`);

    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.trim()) {
        try {
          await connection.execute(query);
          console.log(`✓ Executed query ${i + 1}/${queries.length}`);
        } catch (error) {
          // Ignorer les erreurs de tables existantes
          if (!error.message.includes("already exists") && !error.message.includes("Duplicate entry")) {
            console.warn(`⚠ Warning on query ${i + 1}:`, error.message);
          }
        }
      }
    }

    console.log("✅ MySQL data import completed successfully!");
    console.log("📊 FAQ data is now available in the database");

  } catch (error) {
    console.error("❌ Import failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter l'import si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  importMySQLData()
    .then(() => {
      console.log("Import script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Import script failed:", error);
      process.exit(1);
    });
}

export { importMySQLData };
