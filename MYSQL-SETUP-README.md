# Configuration MySQL - Chatbot Campus

## ✅ Configuration terminée avec succès !

Votre application chatbot est maintenant configurée pour utiliser la base de données MySQL `chatbot_campus`.

## 📋 Résumé des modifications

### 1. Base de données
- **Nom** : `chatbot_campus`
- **Type** : MySQL
- **Tables** : `utilisateurs`, `faq`, `conversation`, `messages`, `sessions`

### 2. Fichiers modifiés
- `src/lib/db.ts` - Migration de SQLite vers MySQL
- `src/lib/init-db.ts` - Nouveau fichier d'initialisation
- `src/app/api/*/route.ts` - Mise à jour des routes API
- `server/config.js` - Configuration MySQL
- `server/db-mysql.js` - Fonctions MySQL

### 3. Données importées
- ✅ 19 entrées FAQ en français
- ✅ Utilisateur par défaut créé
- ✅ Table sessions créée

## 🔐 Identifiants de connexion

**Utilisateur par défaut :**
- **Nom d'utilisateur** : `akram`
- **Mot de passe** : `akram123`

## 🚀 Comment démarrer l'application

1. **Créer le fichier d'environnement** (si pas déjà fait) :
   ```bash
   # Dans le dossier server/
   cp env.example .env
   ```

2. **Vérifier la configuration MySQL** dans `server/.env` :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=chatbot_campus
   DB_PORT=3306
   ```

3. **Démarrer l'application Next.js** :
   ```bash
   npm run dev
   ```

## 📊 Structure de la base de données

### Table `utilisateurs`
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `nom` (VARCHAR(120))
- `prenom` (VARCHAR(120))
- `identifiant` (VARCHAR(190))
- `password` (VARCHAR(90))

### Table `faq`
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `questions` (TEXT)
- `reponses` (TEXT)
- `langue` (VARCHAR(10))

### Table `conversation`
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `user_hach` (VARCHAR(255))
- `canal` (VARCHAR(50))
- `Languge` (VARCHAR(10))
- `statut` (VARCHAR(20))
- `Utili_id` (INT)

### Table `messages`
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `conversation_id` (INT)
- `emetteur` (VARCHAR(20))
- `texte` (TEXT)
- `reponse_faq_id` (INT)
- `horodatage` (DATETIME)

### Table `sessions`
- `id` (VARCHAR(36), PRIMARY KEY)
- `user_id` (INT)
- `created_at` (DATETIME)
- `expires_at` (DATETIME)

## 🔧 Fonctionnalités testées

- ✅ Connexion à MySQL
- ✅ Authentification utilisateur
- ✅ Gestion des sessions
- ✅ Recherche dans la FAQ
- ✅ Logs de conversation
- ✅ Création automatique des conversations
- ✅ Sauvegarde des messages

## 🎯 Prochaines étapes

1. **Personnaliser les questions/réponses** dans la table `faq`
2. **Ajouter d'autres utilisateurs** si nécessaire
3. **Configurer les variables d'environnement** pour la production
4. **Tester l'interface utilisateur** avec `npm run dev`

---

**🎉 Votre chatbot est maintenant prêt à fonctionner avec MySQL !**
