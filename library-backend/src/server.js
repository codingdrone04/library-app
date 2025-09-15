const app = require('./app');
const connectMongoDB = require('./config/mongodb');
const connectPostgreSQL = require('./config/postgresql');
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
    const User = createUserModel(sequelize);
    const Loan = createLoanModel(sequelize);

    User.hasMany(Loan, { foreignKey: 'user_id', as: 'loans' });
    Loan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    
    app.locals.models = { User, Loan };
    
    await sequelize.sync({ alter: true });
    console.log('📋 Tables synchronisées !');
    
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

startServer();