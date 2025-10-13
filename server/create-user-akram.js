import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function createUserAkram() {
  let connection;
  
  try {
    console.log("👤 Creating user 'akram' in chatbot_campus...");
    
    // Connexion à votre base de données chatbot_campus
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'chatbot_campus',
      port: 3306
    });
    
    console.log("✅ Connected to chatbot_campus database");

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await connection.execute(
      "SELECT id, identifiant FROM utilisateurs WHERE identifiant = 'akram'"
    );
    
    if (existingUsers.length > 0) {
      console.log("👤 User 'akram' already exists, updating password...");
      
      // Mettre à jour le mot de passe
      const hash = bcrypt.hashSync("akram123", 10);
      await connection.execute(
        "UPDATE utilisateurs SET password = ?, prenom = 'Akram', nom = 'Admin' WHERE identifiant = 'akram'",
        [hash]
      );
      console.log("✅ Password updated for user 'akram'");
    } else {
      console.log("👤 Creating new user 'akram'...");
      
      // Créer l'utilisateur
      const hash = bcrypt.hashSync("akram123", 10);
      await connection.execute(
        "INSERT INTO utilisateurs (identifiant, password, prenom, nom) VALUES (?, ?, ?, ?)",
        ['akram', hash, 'Akram', 'Admin']
      );
      console.log("✅ User 'akram' created successfully");
    }

    // Vérifier l'utilisateur créé
    const [users] = await connection.execute(
      "SELECT id, identifiant, prenom, nom FROM utilisateurs WHERE identifiant = 'akram'"
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`✅ User verified: ${user.prenom} ${user.nom} (ID: ${user.id})`);
    }

    // Vérifier le mot de passe
    const [testUser] = await connection.execute(
      "SELECT password FROM utilisateurs WHERE identifiant = 'akram'"
    );
    
    if (testUser.length > 0) {
      const isValid = bcrypt.compareSync("akram123", testUser[0].password);
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
