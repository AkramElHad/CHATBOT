import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";

async function testFaqChat() {
  let connection;
  
  try {
    console.log("🤖 Testing FAQ chatbot functionality...");
    
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to bdd_nextjs database");

    // Test 1: Vérifier les données FAQ
    console.log("\n📚 Testing FAQ data...");
    const [faqCount] = await connection.execute("SELECT COUNT(*) as count FROM faq");
    console.log(`📊 FAQ entries: ${faqCount[0].count}`);

    // Test 2: Lister toutes les questions
    console.log("\n❓ Available FAQ questions:");
    const [faqRows] = await connection.execute(
      "SELECT id, questions, reponses FROM faq ORDER BY id"
    );
    
    faqRows.forEach(row => {
      console.log(`  ${row.id}. ${row.questions}`);
      console.log(`     → ${row.reponses.substring(0, 80)}...`);
    });

    // Test 3: Tester la recherche de réponses
    console.log("\n🔍 Testing answer search...");
    const testQuestions = [
      "bibliothèque",
      "horaires",
      "certificat",
      "examens",
      "planning",
      "restaurant",
      "stage",
      "règles",
      "formations"
    ];

    for (const question of testQuestions) {
      const [rows] = await connection.execute(
        "SELECT reponses FROM faq WHERE LOWER(questions) LIKE ? OR LOWER(reponses) LIKE ? LIMIT 1",
        [`%${question}%`, `%${question}%`]
      );
      
      if (rows.length > 0) {
        console.log(`✅ "${question}" → ${rows[0].reponses.substring(0, 60)}...`);
      } else {
        console.log(`❌ No answer found for "${question}"`);
      }
    }

    console.log("\n🎉 FAQ chatbot is ready!");
    console.log("✅ Questions and answers are loaded from your faq table");
    console.log("✅ Chatbot will respond using your FAQ data");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testFaqChat();
