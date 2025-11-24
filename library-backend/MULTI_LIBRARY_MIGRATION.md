# Migration vers le système Multi-Bibliothèques

## 📋 Vue d'ensemble

L'application a été restructurée pour supporter **plusieurs bibliothèques indépendantes** au lieu d'une seule. Chaque bibliothèque possède ses propres livres, utilisateurs et emprunts.

## 🏗️ Architecture

### 1. Nouveau modèle `Library` (PostgreSQL)

**Fichier:** `src/models/Library.js`

**Champs:**
- `id` - Identifiant unique
- `name` - Nom de la bibliothèque (unique)
- `code` - Code court (unique, uppercase)
- `address` - Adresse
- `city` - Ville
- `phone` - Téléphone
- `email` - Email
- `settings` (JSONB) - Paramètres configurables:
  - `max_loans_per_user` - Nombre max de prêts par utilisateur
  - `loan_duration_days` - Durée du prêt en jours
  - `max_renewals` - Nombre max de renouvellements
  - `late_fee_per_day` - Frais de retard par jour
- `is_active` - Bibliothèque active/inactive

### 2. Modifications des modèles existants

#### User (PostgreSQL)
- **Ajout:** `library_id` (foreign key vers `libraries.id`, NOT NULL)
- **Relation:** User `belongsTo` Library

#### Book (MongoDB)
- **Ajout:** `library.library_id: Number` (référence PostgreSQL Library.id)
- **Index:** Ajout d'index sur `library.library_id` pour performance

#### Loan (PostgreSQL)
- **Ajout:** `library_id` (foreign key vers `libraries.id`, NOT NULL)
- **Relation:** Loan `belongsTo` Library
- **Index:** Ajout d'index sur `library_id` et `(library_id, status)`

### 3. Middleware `libraryContext`

**Fichier:** `src/middleware/libraryContext.js`

- Injecte automatiquement `req.library_id` et `req.library` dans toutes les requêtes
- Récupère les informations depuis le token JWT de l'utilisateur connecté
- Fournit `requireLibraryContext` pour forcer la présence d'un contexte

### 4. Nouvelles routes `/api/libraries`

**Fichier:** `src/routes/libraries.js`

- `GET /api/libraries` - Liste des bibliothèques (authentifié)
- `GET /api/libraries/:id` - Détails d'une bibliothèque
- `POST /api/libraries` - Créer une bibliothèque (admin only)
- `PUT /api/libraries/:id` - Mettre à jour une bibliothèque (admin only)
- `DELETE /api/libraries/:id` - Désactiver une bibliothèque (admin only)

### 5. Modifications des routes existantes

#### Books (`/api/books`)
- Filtrage automatique par `library_id` depuis le contexte user
- Support du paramètre `?library_id=X` pour filtrage explicite
- Validation : les livres ajoutés reçoivent automatiquement le `library_id` du user

#### Loans (`/api/loans`)
- Filtrage automatique par `library_id`
- Validation : un user ne peut emprunter que des livres de sa bibliothèque
- Durée de prêt et nombre de renouvellements basés sur les settings de la bibliothèque

#### Users (`/api/users`)
- Chaque utilisateur est associé à une bibliothèque

## 🔄 Migration des données

### Script de migration

**Fichier:** `scripts/migrate-to-multi-library.js`

**Exécution:**
```bash
cd library-backend
node scripts/migrate-to-multi-library.js
```

**Actions effectuées:**
1. Crée une bibliothèque "Bibliothèque Principale" (code: MAIN) si elle n'existe pas
2. Associe tous les utilisateurs existants à cette bibliothèque
3. Associe tous les emprunts existants à cette bibliothèque
4. Met à jour tous les livres MongoDB avec `library.library_id`

### Données créées par défaut

Au démarrage du serveur ([server.js:41-94](library-backend/src/server.js#L41-L94)):
- Bibliothèque "Bibliothèque Principale" (code: MAIN)
- Utilisateur admin (admin/admin) associé à cette bibliothèque
- Utilisateur test (user/user) associé à cette bibliothèque

## 🔐 Sécurité et isolation

### Règles de filtrage

1. **Utilisateurs réguliers** : Ne voient QUE les données de leur bibliothèque
2. **Admins** : Peuvent voir toutes les bibliothèques mais filtrage par défaut
3. **Isolation stricte** : Impossible d'emprunter un livre d'une autre bibliothèque

### Middleware de sécurité

Le middleware `libraryContext` ([src/middleware/libraryContext.js](library-backend/src/middleware/libraryContext.js)):
- Extrait automatiquement `library_id` du token JWT
- Injecte dans `req.library_id` pour toutes les routes
- Fournit les settings de la bibliothèque dans `req.library_settings`

## 📱 Frontend

### Modifications API

**Fichier:** `src/services/api.js`

Nouvelles méthodes:
- `getLibraries()` - Récupérer toutes les bibliothèques
- `getLibraryById(id)` - Détails d'une bibliothèque
- `createLibrary(data)` - Créer une bibliothèque (admin)
- `updateLibrary(id, data)` - Modifier une bibliothèque (admin)

### AuthContext

**Fichier:** `src/context/AuthContext.jsx`

Nouvelles méthodes:
- `getLibraryId()` - Récupère le library_id de l'utilisateur
- `getLibrary()` - Récupère les infos complètes de la bibliothèque

### Utilisation

```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, getLibraryId, getLibrary } = useAuth();

  const libraryId = getLibraryId(); // Ex: 1
  const library = getLibrary(); // Ex: { id: 1, name: "Bibliothèque Principale", ... }

  // Les requêtes API filtrent automatiquement par library_id
};
```

## 🚀 Utilisation

### Créer une nouvelle bibliothèque

```bash
curl -X POST http://localhost:3000/api/libraries \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bibliothèque Municipale",
    "code": "MUNI",
    "address": "456 Avenue des Livres",
    "city": "Lyon",
    "phone": "04 12 34 56 78",
    "email": "contact@biblio-muni.fr",
    "settings": {
      "max_loans_per_user": 3,
      "loan_duration_days": 21,
      "max_renewals": 1,
      "late_fee_per_day": 1.0
    }
  }'
```

### Créer un utilisateur pour une bibliothèque spécifique

Lors de l'inscription, le `library_id` doit être fourni (ou le user sera associé à sa bibliothèque actuelle).

## 🔍 Index et performance

### Index ajoutés

**PostgreSQL:**
- `users.library_id` (foreign key index automatique)
- `loans.library_id`
- `loans (library_id, status)` (index composite)

**MongoDB:**
- `books.library.library_id` (index simple)
- `books (library.library_id, status)` (index composite)

## ⚠️ Points importants

1. **Migration obligatoire** : Exécuter le script de migration avant utilisation
2. **Compatibilité** : Les données existantes sont préservées et migrées automatiquement
3. **Isolation** : Aucune fuite de données entre bibliothèques
4. **Performance** : Index optimisés pour les requêtes multi-bibliothèques
5. **Settings dynamiques** : Chaque bibliothèque peut avoir ses propres règles de prêt

## 📝 Relations

```
Library (PostgreSQL)
  ├── hasMany Users
  └── hasMany Loans

User (PostgreSQL)
  ├── belongsTo Library
  └── hasMany Loans

Loan (PostgreSQL)
  ├── belongsTo User
  └── belongsTo Library

Book (MongoDB)
  └── library.library_id → references Library.id
```

## 🧪 Tests

Pour tester le système multi-bibliothèques:

1. Créer plusieurs bibliothèques (admin)
2. Créer des utilisateurs pour chaque bibliothèque
3. Ajouter des livres avec chaque utilisateur
4. Vérifier que chaque utilisateur ne voit que ses livres
5. Tester les emprunts inter-bibliothèques (doivent échouer)

## 📚 Ressources

- [Documentation PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Mongoose Schema](https://mongoosejs.com/docs/guide.html)
- [Sequelize Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)
