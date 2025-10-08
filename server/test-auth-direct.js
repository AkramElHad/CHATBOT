import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function testAuthDirect() {
  let connection;
  
  try {
    console.log("🔐 Testing authentication directly...");
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bdd_nextjs',
      port: 3306
    });
    
    console.log("✅ Connected to bdd_nextjs database");

    // Test de l'authentification comme dans le code
    const username = "akram";
    const password = "akram123";
    
    console.log(`🔍 Searching for user: ${username}`);
    const [rows] = await connection.execute(
      "SELECT id, identifiant, password, nom, prenom FROM utilisateurs WHERE identifiant = ?",
      [username]
    );
    
    console.log(`📊 Found ${rows.length} users`);
    
    if (rows.length === 0) {
      console.log("❌ No user found");
      return;
    }
    
    const user = rows[0];
    console.log("👤 User details:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Identifiant: ${user.identifiant}`);
    console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    
    console.log(`🔐 Testing password: ${password}`);
    const isValid = bcrypt.compareSync(password, user.password);
    console.log(`✅ Password valid: ${isValid}`);
    
    if (isValid) {
      console.log("🎉 Authentication successful!");
      console.log("✅ User can login");
    } else {
      console.log("❌ Authentication failed");
      console.log("🔧 Let's check the password hash...");
      
      // Vérifier si le mot de passe est déjà haché
      const isAlreadyHashed = user.password.startsWith('$2');
      console.log(`🔍 Password already hashed: ${isAlreadyHashed}`);
      
      if (!isAlreadyHashed) {
        console.log("🔧 Hashing password...");
        const hash = bcrypt.hashSync(password, 10);
        await connection.execute(
          "UPDATE utilisateurs SET password = ? WHERE identifiant = ?",
          [hash, username]
        );
        console.log("✅ Password hashed and updated");
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAuthDirect();
