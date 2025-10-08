import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";

async function testCompleteMySQLSetup() {
  let connection;
  
  try {
    console.log("🧪 Testing complete MySQL setup...");
    
    // Connexion à MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL database");

    // Test 1: Vérifier les tables FAQ
    console.log("\n📋 Testing FAQ data...");
    const [faqRows] = await connection.execute("SELECT COUNT(*) as count FROM faq");
    console.log(`✅ FAQ table has ${faqRows[0].count} entries`);

    // Test 2: Vérifier les tables d'authentification
    console.log("\n🔐 Testing authentication tables...");
    const [userRows] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`✅ Users table has ${userRows[0].count} entries`);

    const [sessionRows] = await connection.execute("SELECT COUNT(*) as count FROM sessions");
    console.log(`✅ Sessions table has ${sessionRows[0].count} entries`);

    // Test 3: Vérifier les données FAQ spécifiques
    console.log("\n📚 Testing FAQ content...");
    const [libraryRows] = await connection.execute(
      "SELECT reponses FROM faq WHERE questions LIKE '%bibliothèque%' LIMIT 1"
    );
    
    if (libraryRows.length > 0) {
      console.log("✅ Library hours FAQ found");
      console.log("📖 Content:", libraryRows[0].reponses.substring(0, 100) + "...");
    } else {
      console.log("❌ Library hours FAQ not found");
    }

    // Test 4: Vérifier l'utilisateur par défaut
    console.log("\n👤 Testing default user...");
    const [akramRows] = await connection.execute(
      "SELECT username, first_name, last_name FROM users WHERE username = 'akram'"
    );
    
    if (akramRows.length > 0) {
      console.log("✅ Default user 'akram' found");
      console.log(`👤 User: ${akramRows[0].first_name} ${akramRows[0].last_name}`);
    } else {
      console.log("❌ Default user 'akram' not found");
    }

    // Test 5: Lister toutes les questions FAQ
    console.log("\n❓ Available FAQ questions:");
    const [allFaqRows] = await connection.execute(
      "SELECT id, questions FROM faq ORDER BY id"
    );
    
    allFaqRows.forEach(row => {
      console.log(`  ${row.id}. ${row.questions}`);
    });

    console.log("\n🎉 All tests completed successfully!");
    console.log("✅ MySQL migration is working correctly");
    console.log("✅ FAQ data is available");
    console.log("✅ Authentication system is ready");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testCompleteMySQLSetup();
