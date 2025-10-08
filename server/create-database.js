import mysql from "mysql2/promise";

async function createDatabase() {
  let connection;
  
  try {
    // Connexion sans base de données spécifique
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });
    
    console.log("Connected to MySQL server");
    
    // Créer la base de données
    await connection.execute("CREATE DATABASE IF NOT EXISTS chatbot_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log("✅ Database 'chatbot_campus' created successfully");
    
    // Vérifier que la base de données existe
    const [databases] = await connection.execute("SHOW DATABASES");
    const dbExists = databases.some(db => db.Database === 'chatbot_campus');
    
    if (dbExists) {
      console.log("✅ Database verification successful");
    } else {
      console.log("❌ Database verification failed");
    }
    
  } catch (error) {
    console.error("❌ Database creation failed:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error("💡 MySQL server is not running");
      console.error("   Please start MySQL server first");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 Access denied - check username/password");
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();
