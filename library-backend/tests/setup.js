const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

let mongod;
let sequelizeInstance;
let isSetupComplete = false;

// Configuration MongoDB Memory Server simplifiée
const mongoConfig = {
  binary: {
    version: '6.0.9',
    downloadDir: './node_modules/.cache/mongodb-memory-server',
  },
  instance: {
    storageEngine: 'wiredTiger',
    dbName: 'library-test-' + Date.now(),
  }
};

const setupDatabase = async () => {
  try {
    if (isSetupComplete) {
      console.log('🔄 [SETUP] Bases déjà configurées, réutilisation...');
      return { mongoUri: mongod?.getUri(), sequelizeInstance };
    }

    console.log('🚀 [SETUP] Démarrage des bases de données de test...');
    
    // ===== MONGODB MEMORY SERVER =====
    console.log('📚 [SETUP] Configuration MongoDB Memory Server...');
    
    // Nettoyer toute connexion MongoDB existante
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 [SETUP] Fermeture connexion MongoDB existante...');
      await mongoose.disconnect();
    }

    // Créer nouvelle instance MongoDB Memory Server
    mongod = await MongoMemoryServer.create(mongoConfig);
    const mongoUri = mongod.getUri();
    console.log('📊 [SETUP] MongoDB Memory Server URI:', mongoUri);

    // ✅ CORRECTION: Options Mongoose simplifiées et compatibles
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      family: 4
      // ✅ SUPPRIMÉ: bufferCommands et bufferMaxEntries (deprecated)
    });
    
    console.log('✅ [SETUP] MongoDB Memory Server connecté!');
    console.log('📡 [SETUP] ReadyState:', mongoose.connection.readyState);
    
    // ===== SQLITE EN MÉMOIRE POUR POSTGRESQL =====
    console.log('🐘 [SETUP] Configuration SQLite en mémoire...');
    
    // ✅ CORRECTION: URL SQLite correcte
    sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      pool: {
        max: 3,
        min: 1,
        idle: 10000,
        acquire: 10000
      },
      retry: {
        max: 3
      }
    });
    
    // Tester la connexion avec retry
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await sequelizeInstance.authenticate();
        console.log('✅ [SETUP] SQLite en mémoire connecté');
        break;
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ [SETUP] Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    isSetupComplete = true;
    console.log('🎉 [SETUP] Toutes les bases de données sont prêtes');
    
    return { mongoUri, sequelizeInstance };
    
  } catch (error) {
    console.error('❌ [SETUP] Erreur:', error);
    await teardownDatabase();
    throw error;
  }
};

const teardownDatabase = async () => {
  try {
    console.log('🧹 [TEARDOWN] Nettoyage des bases de données...');
    
    // Fermer SQLite
    if (sequelizeInstance) {
      try {
        await sequelizeInstance.close();
        console.log('✅ [TEARDOWN] SQLite fermé');
      } catch (error) {
        console.warn('⚠️ [TEARDOWN] Erreur fermeture SQLite:', error.message);
      }
      sequelizeInstance = null;
    }
    
    // ✅ CORRECTION: Fermeture forcée de MongoDB
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close(true);
        console.log('✅ [TEARDOWN] MongoDB déconnecté');
      } catch (error) {
        console.warn('⚠️ [TEARDOWN] Erreur fermeture MongoDB:', error.message);
      }
    }
    
    // Arrêter MongoDB Memory Server
    if (mongod) {
      try {
        await mongod.stop({ doCleanup: true, force: true });
        console.log('✅ [TEARDOWN] MongoDB Memory Server arrêté');
      } catch (error) {
        console.warn('⚠️ [TEARDOWN] Erreur arrêt MongoDB Memory Server:', error.message);
      }
      mongod = null;
    }
    
    isSetupComplete = false;
    console.log('✅ [TEARDOWN] Terminé');
  } catch (error) {
    console.error('❌ [TEARDOWN] Erreur:', error);
    mongod = null;
    sequelizeInstance = null;
    isSetupComplete = false;
  }
};

// Expose sequelize instance pour les tests
const getSequelizeInstance = () => {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance not initialized. Call setupDatabase() first.');
  }
  return sequelizeInstance;
};

// Expose MongoDB URI pour les tests
const getMongoUri = () => {
  if (!mongod) {
    throw new Error('MongoDB Memory Server not initialized. Call setupDatabase() first.');
  }
  return mongod.getUri();
};

// ✅ CORRECTION: Gestionnaires d'événements améliorés
let isExiting = false;

const gracefulShutdown = async (signal) => {
  if (isExiting) return;
  isExiting = true;
  
  console.log(`\n🛑 [SIGNAL] ${signal} reçu, nettoyage...`);
  await teardownDatabase();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Nettoyage en cas d'erreur non gérée
process.on('uncaughtException', async (error) => {
  console.error('💥 [ERROR] Exception non gérée:', error);
  await teardownDatabase();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 [ERROR] Rejection non gérée:', reason);
  await teardownDatabase();
  process.exit(1);
});

module.exports = {
  setupDatabase,
  teardownDatabase,
  getSequelizeInstance,
  getMongoUri
};