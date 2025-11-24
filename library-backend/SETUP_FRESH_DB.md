# Configuration avec bases de données vierges

## 🎯 Contexte

Ce guide est pour un **premier démarrage** avec des bases de données PostgreSQL et MongoDB **complètement vierges**.

Pas besoin de migrations complexes ! Le serveur créera automatiquement toutes les tables et données initiales.

## 📋 Pré-requis

### 1. PostgreSQL en cours d'exécution

Vérifiez que PostgreSQL tourne :
```bash
# Via Docker (exemple)
docker ps | grep postgres

# Ou service local
pg_isready -U your_user
```

### 2. MongoDB en cours d'exécution

Vérifiez que MongoDB tourne :
```bash
# Via Docker (exemple)
docker ps | grep mongo

# Ou service local
mongosh --eval "db.version()"
```

### 3. Variables d'environnement configurées

Fichier `.env` dans `library-backend/` :

```env
# PostgreSQL (nouvelle DB distante)
POSTGRES_HOST=IP_BOX_POTE
POSTGRES_PORT=5432
POSTGRES_USER=library_user
POSTGRES_PASSWORD=votre_mot_de_passe
POSTGRES_DB=library_db

# MongoDB (nouvelle DB distante)
MONGO_URI=mongodb://IP_BOX_POTE:27017/library_db
# Ou avec authentification :
# MONGO_URI=mongodb://username:password@IP_BOX_POTE:27017/library_db

# JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=24h

# Environnement
NODE_ENV=development
PORT=3000
```

## 🚀 Premier démarrage

### 1. Installer les dépendances

```bash
cd library-backend
npm install
```

### 2. Démarrer le serveur

```bash
npm start
```

**C'est tout !** 🎉

Le serveur va automatiquement :

1. ✅ Se connecter à PostgreSQL et MongoDB
2. ✅ Créer toutes les tables PostgreSQL :
   - `libraries` (avec settings JSONB)
   - `users` (avec library_id NOT NULL)
   - `loans` (avec library_id NOT NULL)
3. ✅ Créer les index nécessaires
4. ✅ Créer la bibliothèque par défaut "Bibliothèque Principale"
5. ✅ Créer les utilisateurs par défaut :
   - **admin** / admin (administrateur)
   - **user** / user (utilisateur normal)
6. ✅ Démarrer l'API sur le port 3000

### Sortie attendue

```
🚀 Démarrage du serveur Library API...
📚 Connexion à MongoDB...
✅ MongoDB connecté !
🐘 Connexion à PostgreSQL...
✅ PostgreSQL connecté !
📊 Initialisation des modèles...
📋 Tables synchronisées !
🏛️ Création de la bibliothèque principale par défaut...
✅ Bibliothèque créée: Bibliothèque Principale
👨‍💼 Création de l'admin par défaut...
✅ Admin créé: admin / admin
👤 Création de l'utilisateur par défaut...
✅ Utilisateur créé: user / user

🎉 ========================================
📚 Library API Server is running!
🌐 Port: 3000
🔗 Local: http://localhost:3000
📊 Health: http://localhost:3000/health
🔧 Environment: development
🐘 PostgreSQL: Connected
📚 MongoDB: Connected
👥 Comptes par défaut créés
========================================
```

## ✅ Vérifier que tout fonctionne

### 1. Health check

```bash
curl http://localhost:3000/health
```

Devrait retourner :
```json
{
  "status": "OK",
  "message": "Library API is running! 📚",
  "timestamp": "2025-01-24T...",
  "environment": "development"
}
```

### 2. Se connecter

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Devrait retourner un token JWT et les infos du user avec `library_id: 1`.

### 3. Lister les bibliothèques

```bash
curl http://localhost:3000/api/libraries \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

Devrait retourner :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bibliothèque Principale",
      "code": "MAIN",
      "address": "123 Rue des Livres",
      "city": "Paris",
      "is_active": true
    }
  ]
}
```

## 📊 Structure créée

### PostgreSQL

```
libraries
├── id: 1
├── name: "Bibliothèque Principale"
├── code: "MAIN"
└── settings: {
    max_loans_per_user: 5,
    loan_duration_days: 14,
    max_renewals: 2,
    late_fee_per_day: 0.50
}

users
├── id: 1, username: "admin", library_id: 1, role: "admin"
└── id: 2, username: "user", library_id: 1, role: "user"

loans
└── (vide au départ)
```

### MongoDB

```
books (collection vide au départ)
```

## 🎯 Prochaines étapes

### 1. Ajouter des livres

Via l'interface frontend ou l'API :

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Le Seigneur des Anneaux",
    "authors": ["J.R.R. Tolkien"],
    "location": "A-SF-001",
    "condition": "good"
  }'
```

Le livre sera automatiquement associé à la bibliothèque de l'utilisateur connecté (library_id: 1).

### 2. Créer d'autres bibliothèques

```bash
curl -X POST http://localhost:3000/api/libraries \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bibliothèque Municipale de Lyon",
    "code": "MUNI-LYON",
    "city": "Lyon",
    "settings": {
      "max_loans_per_user": 3,
      "loan_duration_days": 21
    }
  }'
```

### 3. Créer des utilisateurs pour d'autres bibliothèques

Il faudra modifier temporairement la route `/api/auth/register` pour accepter `library_id` en paramètre, ou créer les users via l'admin.

## 🔧 Résolution de problèmes

### Erreur : "Cannot connect to PostgreSQL"

- Vérifiez que PostgreSQL tourne sur la box
- Vérifiez l'IP et le port dans `.env`
- Vérifiez que le firewall autorise la connexion
- Testez la connexion : `psql -h IP_BOX -U library_user -d library_db`

### Erreur : "Cannot connect to MongoDB"

- Vérifiez que MongoDB tourne sur la box
- Vérifiez l'URI dans `.env`
- Testez la connexion : `mongosh "mongodb://IP_BOX:27017/library_db"`

### Erreur : "library_id cannot be null"

Cette erreur ne devrait PLUS se produire avec des DB vierges, car :
- Le modèle Library est créé en premier
- La bibliothèque par défaut est créée immédiatement
- Les users sont créés avec `library_id: defaultLibrary.id`

Si vous voyez cette erreur, c'est qu'il reste des données d'avant. Solution :

```sql
-- PostgreSQL : Vider toutes les tables
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS libraries CASCADE;

-- Puis redémarrer le serveur
```

```javascript
// MongoDB : Vider la collection books
db.books.drop()
```

## 📚 Ressources

- **Documentation API** : [MULTI_LIBRARY_MIGRATION.md](MULTI_LIBRARY_MIGRATION.md)
- **Architecture complète** : Voir fichier principal
- **Routes disponibles** : `GET http://localhost:3000/` pour la liste

## 🎊 C'est parti !

Votre application multi-bibliothèques est prête à l'emploi !

Les nouveaux livres, users et emprunts seront automatiquement associés aux bibliothèques via le système de contexte (`libraryContext` middleware).
