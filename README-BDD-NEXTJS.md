# ESIC Chatbot - Configuration bdd_nextjs

## ✅ Configuration terminée

Votre application ESIC Chatbot utilise maintenant **uniquement** votre base de données `bdd_nextjs` importée via phpMyAdmin.

## 🗄️ Base de données utilisée

- **Nom** : `bdd_nextjs`
- **Source** : Importée via phpMyAdmin depuis `chatbot_campus faq rempli.sql`
- **Tables** : `faq`, `users`, `sessions`, `contact`, `services`, `utilisateurs`, etc.
- **Données FAQ** : 8 questions/réponses sur l'ESIC

## 🚀 Démarrage de l'application

### Option 1 - Script automatique (Recommandé)
```bash
# Windows
start-bdd-nextjs.bat

# PowerShell
.\start-bdd-nextjs.ps1
```

### Option 2 - Démarrage manuel
```bash
# Terminal 1 - Backend
cd server
node index.js

# Terminal 2 - Frontend
npm run dev
```

## 🔐 Connexion

- **URL Frontend** : http://localhost:3000
- **URL Backend** : http://localhost:4000
- **Identifiants** : `akram` / `akram123`

## 📚 Données FAQ disponibles

1. **Horaires de la bibliothèque** (8h-20h en semaine, 9h-17h le samedi)
2. **Certificats de scolarité** (contact: scolarite@esic.fr)
3. **Planning des examens** (semestre 1: semaine du 19 janvier 2025)
4. **Planning des cours** (disponible sur Teams)
5. **Services du restaurant universitaire** (3,30€ menu complet)
6. **Demandes de stage/alternance** (convention via scolarité)
7. **Règles de vie sur le campus** (respect, non-fumeur, etc.)
8. **Formations proposées** (BTS, Masters en cybersécurité, data science)

## 🔧 Configuration

- **Base de données** : `bdd_nextjs` (votre base phpMyAdmin)
- **Host** : localhost:3306
- **User** : root
- **Password** : (vide)

## ✅ Vérification

1. **Backend** : http://localhost:4000/api/health
2. **Authentification** : Connexion avec `akram` / `akram123`
3. **Chat** : Posez des questions sur l'ESIC

## 🎯 Avantages

- ✅ **Données centralisées** : Tout dans votre base `bdd_nextjs`
- ✅ **Pas de données temporaires** : Suppression des fichiers temporaires
- ✅ **Gestion via phpMyAdmin** : Vous pouvez modifier les données facilement
- ✅ **FAQ complète** : 8 questions/réponses sur l'ESIC
- ✅ **Authentification** : Système de connexion fonctionnel

Votre chatbot ESIC est maintenant prêt avec votre base de données phpMyAdmin ! 🎓✨
