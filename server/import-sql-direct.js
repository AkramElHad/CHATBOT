import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importSQLDirect() {
  let connection;
  
  try {
    console.log("📥 Importing SQL data directly...");
    
    // Connexion à MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'chatbot_campus',
      port: 3306
    });
    
    console.log("✅ Connected to MySQL database");

    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, "..", "chatbot_campus faq rempli.sql");
    console.log("📄 Reading SQL file:", sqlFilePath);
    
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    console.log("✅ SQL file read successfully");
    
    // Diviser le contenu en requêtes individuelles
    const queries = sqlContent
      .split(";")
      .map(query => query.trim())
      .filter(query => 
        query.length > 0 && 
        !query.startsWith("--") && 
        !query.startsWith("/*") &&
        !query.startsWith("/*!") &&
        !query.includes("SET @") &&
        !query.includes("LOCK TABLES") &&
        !query.includes("UNLOCK TABLES") &&
        !query.includes("ALTER TABLE") &&
        !query.includes("/*!40101") &&
        !query.includes("/*!40103") &&
        !query.includes("/*!40014") &&
        !query.includes("/*!40111")
      );

    console.log(`📊 Found ${queries.length} SQL queries to execute`);

    // Exécuter chaque requête
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.trim()) {
        try {
          await connection.execute(query);
          successCount++;
          console.log(`✅ Query ${i + 1}/${queries.length} executed successfully`);
        } catch (error) {
          errorCount++;
          // Ignorer les erreurs de tables existantes et autres erreurs non critiques
          if (!error.message.includes("already exists") && 
              !error.message.includes("Duplicate entry") &&
              !error.message.includes("Unknown table") &&
              !error.message.includes("doesn't exist")) {
            console.warn(`⚠ Warning on query ${i + 1}:`, error.message);
            console.warn(`   Query: ${query.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`✅ Successful queries: ${successCount}`);
    console.log(`⚠ Errors (ignored): ${errorCount}`);
    
    // Vérifier que les tables ont été créées
    console.log("\n🔍 Verifying tables...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📋 Created tables:", tables.map(t => Object.values(t)[0]));
    
    // Vérifier les données FAQ
    if (tables.some(t => Object.values(t)[0] === 'faq')) {
      const [faqCount] = await connection.execute("SELECT COUNT(*) as count FROM faq");
      console.log(`📚 FAQ entries: ${faqCount[0].count}`);
    }

    console.log("\n🎉 SQL import completed successfully!");

  } catch (error) {
    console.error("❌ Import failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importSQLDirect();
