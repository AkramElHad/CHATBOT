import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function setupBddNextjs() {
  let connection;
  
  try {
    console.log("🔧 Setting up bdd_nextjs database...");
    
    // Connexion à MySQL avec la base bdd_nextjs
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bdd_nextjs',
      port: 3306
    });
    
    console.log("✅ Connected to bdd_nextjs database");

    // Vérifier les tables existantes
    console.log("📋 Checking existing tables...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📋 Available tables:", tables.map(t => Object.values(t)[0]));

    // Vérifier les données FAQ
    const [faqCount] = await connection.execute("SELECT COUNT(*) as count FROM faq");
    console.log(`📚 FAQ entries: ${faqCount[0].count}`);

    // Créer la table users si elle n'existe pas
    console.log("👤 Creating users table...");
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
    console.log("✅ Users table ready");

    // Créer la table sessions si elle n'existe pas
    console.log("🔐 Creating sessions table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Sessions table ready");

    // Créer l'utilisateur par défaut
    console.log("👤 Creating default user...");
    const hash = bcrypt.hashSync("akram123", 10);
    await connection.execute(`
      INSERT IGNORE INTO users (username, password_hash, first_name, last_name) 
      VALUES ('akram', ?, 'Akram', 'Admin')
    `, [hash]);
    console.log("✅ Default user 'akram' created");

    // Vérifier les tables finales
    console.log("\n🔍 Final verification...");
    const [finalTables] = await connection.execute("SHOW TABLES");
    console.log("📋 All tables:", finalTables.map(t => Object.values(t)[0]));

    const [usersCount] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`👥 Users count: ${usersCount[0].count}`);

    console.log("\n🎉 bdd_nextjs setup completed successfully!");
    console.log("✅ FAQ data is available");
    console.log("✅ Authentication system is ready");
    console.log("✅ Default user: akram / akram123");

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupBddNextjs();
