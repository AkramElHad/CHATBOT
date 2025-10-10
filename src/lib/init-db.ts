import { initializeDatabase } from "./db";

let isInitialized = false;

export async function ensureDatabaseInitialized() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
    } catch (error) {
      console.error("❌ Échec de l'initialisation de la base de données:", error);
      throw error;
    }
  }
}
