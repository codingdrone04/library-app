const app = require('./app');
const connectMongoDB = require('./config/mongodb');
const connectPostgreSQL = require('./config/postgresql');
const createLibraryModel = require('./models/Library');
const createUserModel = require('./models/User');
const createLoanModel = require('./models/Loan');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur Library API...');
    
    console.log('📚 Connexion à MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connecté !');
    
    console.log('🐘 Connexion à PostgreSQL...');
    const sequelize = await connectPostgreSQL();
    console.log('✅ PostgreSQL connecté !');
    
    console.log('📊 Initialisation des modèles...');
    const Library = createLibraryModel(sequelize);
    const User = createUserModel(sequelize);
    const Loan = createLoanModel(sequelize);

    // Relations Library
    Library.hasMany(User, { foreignKey: 'library_id', as: 'users' });
    Library.hasMany(Loan, { foreignKey: 'library_id', as: 'loans' });

    // Relations User
    User.belongsTo(Library, { foreignKey: 'library_id', as: 'library' });
    User.hasMany(Loan, { foreignKey: 'user_id', as: 'loans' });

    // Relations Loan
    Loan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Loan.belongsTo(Library, { foreignKey: 'library_id', as: 'library' });

    app.locals.models = { Library, User, Loan };

    // Synchroniser les tables (création automatique si elles n'existent pas)
    // ⚠️ alter: true modifie les tables existantes pour ajouter les colonnes manquantes
    await sequelize.sync({ alter: true });
    console.log('📋 Tables synchronisées !');

    // Créer bibliothèque par défaut si aucune n'existe
    let defaultLibrary = await Library.findOne({ where: { code: 'MAIN' } });
    if (!defaultLibrary) {
      console.log('🏛️ Création de la bibliothèque principale par défaut...');
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
      console.log('✅ Bibliothèque créée: Bibliothèque Principale');
    }

    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      console.log('👨‍💼 Création de l\'admin par défaut...');
      await User.create({
        firstname: 'Admin',
        lastname: 'System',
        username: 'admin',
        email: 'admin@library.com',
        password_hash: 'admin',
        role: 'admin',
        library_id: defaultLibrary.id
      });
      console.log('✅ Admin créé: admin / admin');
    }

    const userExists = await User.findOne({ where: { username: 'user' } });
    if (!userExists) {
      console.log('👤 Création de l\'utilisateur par défaut...');
      await User.create({
        firstname: 'John',
        lastname: 'Doe',
        username: 'user',
        email: 'user@library.com',
        password_hash: 'user',
        role: 'user',
        library_id: defaultLibrary.id
      });
      console.log('✅ Utilisateur créé: user / user');
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
    🎉 ========================================
    📚 Library API Server is running!
    🌐 Port: ${PORT}
    🔗 Local: http://localhost:${PORT}
    📊 Health: http://localhost:${PORT}/health
    🔧 Environment: ${process.env.NODE_ENV || 'development'}
    🐘 PostgreSQL: Connected
    📚 MongoDB: Connected
    👥 Comptes par défaut créés
    ========================================
      `);
    });

    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('💤 Server closed.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();// CI/CD test
// Test CI/CD with ubuntu-22.04
// Testing deployment only
