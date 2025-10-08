import { authenticateUser, initDb } from "./db-mysql.js";

async function testServerAuth() {
  try {
    console.log("🔐 Testing server authentication function...");
    
    // Initialiser la base de données d'abord
    console.log("🔌 Initializing database...");
    await initDb();
    console.log("✅ Database initialized");
    
    const username = "akram";
    const password = "akram123";
    
    console.log(`🔍 Testing: ${username} / ${password}`);
    
    const user = await authenticateUser(username, password);
    
    if (user) {
      console.log("✅ Authentication SUCCESS!");
      console.log("👤 User data:", {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      });
    } else {
      console.log("❌ Authentication FAILED!");
      console.log("🔍 User not found or password incorrect");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testServerAuth();
