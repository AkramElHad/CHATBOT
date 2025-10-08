import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function migrateToMySQL() {
  let connection;
  
  try {
    // Connexion à MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL database");

    // Créer les tables d'authentification si elles n'existent pas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Créer l'utilisateur par défaut
    const hash = bcrypt.hashSync("akram123", 10);
    await connection.execute(`
      INSERT IGNORE INTO users (username, password_hash, first_name, last_name) 
      VALUES ('akram', ?, 'Akram', 'Admin')
    `, [hash]);

    console.log("Migration completed successfully!");
    console.log("Default user created: akram / akram123");

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter la migration si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToMySQL()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateToMySQL };
