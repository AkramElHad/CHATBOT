# Migration vers MySQL

Ce document explique comment migrer l'application ESIC Chatbot de SQLite vers MySQL.

## Prérequis

1. **MySQL Server** installé et en cours d'exécution
2. **Base de données** `chatbot_campus` créée
3. **Utilisateur MySQL** avec les permissions appropriées

## Configuration

### 1. Créer la base de données MySQL

```sql
CREATE DATABASE chatbot_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `server/` avec :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=chatbot_campus
DB_PORT=3306
```

## Migration

### Option 1: Script automatique (Recommandé)

```bash
# Windows
start-with-mysql.bat

# PowerShell
.\start-with-mysql.ps1
```

### Option 2: Migration manuelle

1. **Importer les données MySQL** :
   ```bash
   cd server
   node import-mysql-data.js
   ```

2. **Créer les tables d'authentification** :
   ```bash
   node migrate-to-mysql.js
   ```

3. **Démarrer le serveur** :
   ```bash
   node index.js
   ```

## Nouvelles fonctionnalités

### Base de données FAQ enrichie

La base de données MySQL contient maintenant des données FAQ complètes avec :

- **Horaires de la bibliothèque**
- **Certificats de scolarité**
- **Planning des examens**
- **Services du restaurant universitaire**
- **Demandes de stage/alternance**
- **Règles de vie sur le campus**
- **Formations proposées par l'école**

### Structure des tables

- `faq` : Questions et réponses FAQ
- `users` : Utilisateurs authentifiés
- `sessions` : Sessions utilisateur
- `conversation` : Conversations utilisateur
- `messages` : Messages des conversations
- `feedback` : Retours utilisateur
- `contact` : Contacts des services
- `services` : Services du campus
- `utilisateurs` : Utilisateurs du système

## Vérification

1. **Test de connexion** : `http://localhost:4000/api/health`
2. **Test d'authentification** : Utilisez `akram` / `akram123`
3. **Test du chat** : Posez des questions sur l'ESIC

## Dépannage

### Erreur de connexion MySQL

- Vérifiez que MySQL est en cours d'exécution
- Vérifiez les paramètres de connexion dans `server/config.js`
- Vérifiez que la base de données `chatbot_campus` existe

### Erreur d'import

- Vérifiez que le fichier `chatbot_campus faq rempli.sql` existe
- Vérifiez les permissions MySQL
- Vérifiez que les tables n'existent pas déjà

## Retour à SQLite

Si vous voulez revenir à SQLite, modifiez `server/index.js` :

```javascript
// Remplacer
import { ... } from "./db-mysql.js";

// Par
import { ... } from "./db.js";
```
