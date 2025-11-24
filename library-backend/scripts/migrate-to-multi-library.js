/**
 * Script de migration vers le système multi-bibliothèques
 *
 * Ce script :
 * 1. Crée une bibliothèque par défaut si elle n'existe pas
 * 2. Associe tous les utilisateurs existants à cette bibliothèque
 * 3. Associe tous les emprunts existants à cette bibliothèque
 * 4. Met à jour tous les livres MongoDB avec le library_id
 */

require('dotenv').config();
const connectMongoDB = require('../src/config/mongodb');
const connectPostgreSQL = require('../src/config/postgresql');
const createLibraryModel = require('../src/models/Library');
const createUserModel = require('../src/models/User');
const createLoanModel = require('../src/models/Loan');
const Book = require('../src/models/Book');

async function migrateToMultiLibrary() {
  try {
    console.log('🚀 Démarrage de la migration vers multi-bibliothèques...\n');

    // Connexion aux bases de données
    console.log('📚 Connexion à MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connecté !\n');

    console.log('🐘 Connexion à PostgreSQL...');
    const sequelize = await connectPostgreSQL();
    console.log('✅ PostgreSQL connecté !\n');

    // Initialiser les modèles
    const Library = createLibraryModel(sequelize);
    const User = createUserModel(sequelize);
    const Loan = createLoanModel(sequelize);

    // Relations
    Library.hasMany(User, { foreignKey: 'library_id', as: 'users' });
    Library.hasMany(Loan, { foreignKey: 'library_id', as: 'loans' });
    User.belongsTo(Library, { foreignKey: 'library_id', as: 'library' });
    User.hasMany(Loan, { foreignKey: 'user_id', as: 'loans' });
    Loan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Loan.belongsTo(Library, { foreignKey: 'library_id', as: 'library' });

    // Sync (sans alter pour éviter de perdre des données)
    await sequelize.sync();

    // ÉTAPE 1 : Créer ou récupérer la bibliothèque par défaut
    console.log('📖 ÉTAPE 1 : Bibliothèque par défaut');
    let defaultLibrary = await Library.findOne({ where: { code: 'MAIN' } });

    if (!defaultLibrary) {
      console.log('   Création de la bibliothèque principale...');
      defaultLibrary = await Library.create({
        name: 'Bibliothèque Principale',
        code: 'MAIN',
        address: '123 Rue des Livres',
        city: 'Paris',
        phone: '01 23 45 67 89',
        email: 'contact@bibliotheque.fr',
        settings: {
          max_loans_per_user: 5,
          loan_duration_days: 14,
          max_renewals: 2,
          late_fee_per_day: 0.50
        },
        is_active: true
      });
      console.log(`   ✅ Bibliothèque créée : ${defaultLibrary.name} (ID: ${defaultLibrary.id})`);
    } else {
      console.log(`   ✅ Bibliothèque existante : ${defaultLibrary.name} (ID: ${defaultLibrary.id})`);
    }

    const libraryId = defaultLibrary.id;
    console.log('');

    // ÉTAPE 2 : Migrer les utilisateurs
    console.log('👥 ÉTAPE 2 : Migration des utilisateurs');
    const usersWithoutLibrary = await User.findAll({
      where: {
        library_id: null
      }
    });

    if (usersWithoutLibrary.length > 0) {
      console.log(`   ${usersWithoutLibrary.length} utilisateur(s) sans bibliothèque trouvé(s)`);

      for (const user of usersWithoutLibrary) {
        user.library_id = libraryId;
        await user.save();
        console.log(`   ✅ ${user.username} → Bibliothèque #${libraryId}`);
      }
    } else {
      console.log('   ℹ️  Tous les utilisateurs ont déjà une bibliothèque');
    }
    console.log('');

    // ÉTAPE 3 : Migrer les emprunts
    console.log('📚 ÉTAPE 3 : Migration des emprunts');
    const loansWithoutLibrary = await Loan.findAll({
      where: {
        library_id: null
      }
    });

    if (loansWithoutLibrary.length > 0) {
      console.log(`   ${loansWithoutLibrary.length} emprunt(s) sans bibliothèque trouvé(s)`);

      for (const loan of loansWithoutLibrary) {
        loan.library_id = libraryId;
        await loan.save();
        console.log(`   ✅ Emprunt #${loan.id} → Bibliothèque #${libraryId}`);
      }
    } else {
      console.log('   ℹ️  Tous les emprunts ont déjà une bibliothèque');
    }
    console.log('');

    // ÉTAPE 4 : Migrer les livres MongoDB
    console.log('📕 ÉTAPE 4 : Migration des livres MongoDB');
    const booksWithoutLibraryId = await Book.find({
      'library.library_id': { $exists: false }
    });

    if (booksWithoutLibraryId.length > 0) {
      console.log(`   ${booksWithoutLibraryId.length} livre(s) sans library_id trouvé(s)`);

      for (const book of booksWithoutLibraryId) {
        if (!book.library) {
          book.library = {};
        }
        book.library.library_id = libraryId;
        await book.save();
        console.log(`   ✅ "${book.title}" → Bibliothèque #${libraryId}`);
      }
    } else {
      console.log('   ℹ️  Tous les livres ont déjà un library_id');
    }
    console.log('');

    // Statistiques finales
    console.log('📊 STATISTIQUES FINALES');
    const totalUsers = await User.count({ where: { library_id: libraryId } });
    const totalLoans = await Loan.count({ where: { library_id: libraryId } });
    const totalBooks = await Book.countDocuments({ 'library.library_id': libraryId });

    console.log(`   Bibliothèque : ${defaultLibrary.name}`);
    console.log(`   - Utilisateurs : ${totalUsers}`);
    console.log(`   - Emprunts : ${totalLoans}`);
    console.log(`   - Livres : ${totalBooks}`);
    console.log('');

    console.log('✅ Migration terminée avec succès !');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  }
}

// Lancer la migration
migrateToMultiLibrary();
