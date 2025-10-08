import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function checkAkram() {
  let connection;
  
  try {
    console.log("🔍 Checking akram user...");
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bdd_nextjs',
      port: 3306
    });
    
    console.log("✅ Connected to bdd_nextjs database");

    // Vérifier l'utilisateur akram
    const [users] = await connection.execute(
      "SELECT id, identifiant, password, prenom, nom FROM utilisateurs WHERE identifiant = 'akram'"
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log("👤 User found:");
      console.log(`  ID: ${user.id}`);
      console.log(`  Identifiant: ${user.identifiant}`);
      console.log(`  Prénom: ${user.prenom}`);
      console.log(`  Nom: ${user.nom}`);
      console.log(`  Password: ${user.password ? 'SET' : 'NULL'}`);
      
      // Tester le mot de passe
      const isValid = bcrypt.compareSync("akram123", user.password);
      console.log(`🔐 Password test: ${isValid ? 'VALID' : 'INVALID'}`);
      
      if (!isValid) {
        console.log("🔧 Fixing password...");
        const hash = bcrypt.hashSync("akram123", 10);
        await connection.execute(
          "UPDATE utilisateurs SET password = ? WHERE identifiant = 'akram'",
          [hash]
        );
        console.log("✅ Password updated");
      }
    } else {
      console.log("❌ User 'akram' not found");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAkram();
