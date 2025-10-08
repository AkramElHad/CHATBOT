import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function createAuthTables() {
  let connection;
  
  try {
    console.log("🔐 Creating authentication tables...");
    
    // Connexion à MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'chatbot_campus',
      port: 3306
    });
    
    console.log("✅ Connected to MySQL database");

    // Créer la table users
    console.log("📋 Creating users table...");
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
    console.log("✅ Users table created");

    // Créer la table sessions
    console.log("📋 Creating sessions table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Sessions table created");

    // Créer l'utilisateur par défaut
    console.log("👤 Creating default user...");
    const hash = bcrypt.hashSync("akram123", 10);
    await connection.execute(`
      INSERT IGNORE INTO users (username, password_hash, first_name, last_name) 
      VALUES ('akram', ?, 'Akram', 'Admin')
    `, [hash]);
    console.log("✅ Default user 'akram' created");

    // Vérifier les tables créées
    console.log("\n🔍 Verifying tables...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📋 Available tables:", tables.map(t => Object.values(t)[0]));

    // Vérifier l'utilisateur
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`👥 Users count: ${users[0].count}`);

    console.log("\n🎉 Authentication tables created successfully!");

  } catch (error) {
    console.error("❌ Creation failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAuthTables();
