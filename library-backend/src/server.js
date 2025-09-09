const app = require('./app');
const connectMongoDB = require('./config/mongodb');
const connectPostgreSQL = require('./config/postgresql');
const createUserModel = require('./models/User');

const PORT = process.env.PORT || 3000;

// Fonction pour démarrer le serveur
async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur Library API...');
    
    // Connexion MongoDB (pour les livres)
    console.log('📚 Connexion à MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connecté !');
    
    // Connexion PostgreSQL (pour les utilisateurs et emprunts)
    console.log('🐘 Connexion à PostgreSQL...');
    const sequelize = await connectPostgreSQL();
    console.log('✅ PostgreSQL connecté !');
    
    // Initialiser les modèles
    console.log('📊 Initialisation des modèles...');
    const User = createUserModel(sequelize);
    
    // Rendre les modèles disponibles pour les routes
    app.locals.models = { User };
    
    // Synchroniser les tables
    await sequelize.sync({ alter: true });
    console.log('📋 Tables synchronisées !');
    
    // Créer un utilisateur admin par défaut
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      console.log('👨‍💼 Création de l\'admin par défaut...');
      await User.create({
        firstname: 'Admin',
        lastname: 'System',
        username: 'admin',
        email: 'admin@library.com',
        password_hash: 'admin',
        role: 'admin'
      });
      console.log('✅ Admin créé: admin / admin');
    }

    // Créer un utilisateur normal par défaut
    const userExists = await User.findOne({ where: { username: 'user' } });
    if (!userExists) {
      console.log('👤 Création de l\'utilisateur par défaut...');
      await User.create({
        firstname: 'John',
        lastname: 'Doe',
        username: 'user',
        email: 'user@library.com',
        password_hash: 'user',
        role: 'user'
      });
      console.log('✅ Utilisateur créé: user / user');
    }
    
    // Démarrage du serveur
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

    // Gestion gracieuse de l'arrêt
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

// Démarrer le serveur
startServer();