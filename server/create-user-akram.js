import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function createUserAkram() {
  let connection;
  
  try {
    console.log("👤 Creating user 'akram' in bdd_nextjs...");
    
    // Connexion à votre base de données bdd_nextjs
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bdd_nextjs',
      port: 3306
    });
    
    console.log("✅ Connected to bdd_nextjs database");

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await connection.execute(
      "SELECT id, username FROM users WHERE username = 'akram'"
    );
    
    if (existingUsers.length > 0) {
      console.log("👤 User 'akram' already exists, updating password...");
      
      // Mettre à jour le mot de passe
      const hash = bcrypt.hashSync("akram123", 10);
      await connection.execute(
        "UPDATE users SET password_hash = ?, first_name = 'Akram', last_name = 'Admin' WHERE username = 'akram'",
        [hash]
      );
      console.log("✅ Password updated for user 'akram'");
    } else {
      console.log("👤 Creating new user 'akram'...");
      
      // Créer l'utilisateur
      const hash = bcrypt.hashSync("akram123", 10);
      await connection.execute(
        "INSERT INTO users (username, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)",
        ['akram', hash, 'Akram', 'Admin']
      );
      console.log("✅ User 'akram' created successfully");
    }

    // Vérifier l'utilisateur créé
    const [users] = await connection.execute(
      "SELECT id, username, first_name, last_name FROM users WHERE username = 'akram'"
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`✅ User verified: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    }

    // Vérifier le mot de passe
    const [testUser] = await connection.execute(
      "SELECT password_hash FROM users WHERE username = 'akram'"
    );
    
    if (testUser.length > 0) {
      const isValid = bcrypt.compareSync("akram123", testUser[0].password_hash);
      console.log(`🔐 Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }

    console.log("\n🎉 User 'akram' is ready!");
    console.log("📝 Login credentials:");
    console.log("   Username: akram");
    console.log("   Password: akram123");

  } catch (error) {
    console.error("❌ Failed to create user:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createUserAkram();
