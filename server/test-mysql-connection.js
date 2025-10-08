import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";

async function testMySQLConnection() {
  let connection;
  
  try {
    console.log("Testing MySQL connection...");
    console.log("Config:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Successfully connected to MySQL!");
    
    // Test simple query
    const [rows] = await connection.execute("SELECT 1 as test");
    console.log("✅ Test query successful:", rows);
    
    // Vérifier si la base de données existe
    const [databases] = await connection.execute("SHOW DATABASES");
    const dbExists = databases.some(db => db.Database === dbConfig.database);
    
    if (dbExists) {
      console.log(`✅ Database '${dbConfig.database}' exists`);
    } else {
      console.log(`❌ Database '${dbConfig.database}' does not exist`);
      console.log("Available databases:", databases.map(db => db.Database));
    }
    
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error("💡 MySQL server is not running or not accessible");
      console.error("   Please start MySQL server or check the connection settings");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 Access denied - check username/password");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("💡 Database does not exist - please create it first");
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMySQLConnection();
