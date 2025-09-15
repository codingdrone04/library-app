const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

let mongod;
let sequelizeInstance;
let isSetupComplete = false;

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
    
    console.log('📚 [SETUP] Configuration MongoDB Memory Server...');
    
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 [SETUP] Fermeture connexion MongoDB existante...');
      await mongoose.disconnect();
    }

    mongod = await MongoMemoryServer.create(mongoConfig);
    const mongoUri = mongod.getUri();
    console.log('📊 [SETUP] MongoDB Memory Server URI:', mongoUri);

    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      family: 4
    });
    
    console.log('✅ [SETUP] MongoDB Memory Server connecté!');
    console.log('📡 [SETUP] ReadyState:', mongoose.connection.readyState);
    
    console.log('🐘 [SETUP] Configuration SQLite en mémoire...');
    
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
    
    if (sequelizeInstance) {
      try {
        await sequelizeInstance.close();
        console.log('✅ [TEARDOWN] SQLite fermé');
      } catch (error) {
        console.warn('⚠️ [TEARDOWN] Erreur fermeture SQLite:', error.message);
      }
      sequelizeInstance = null;
    }
    
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close(true);
        console.log('✅ [TEARDOWN] MongoDB déconnecté');
      } catch (error) {
        console.warn('⚠️ [TEARDOWN] Erreur fermeture MongoDB:', error.message);
      }
    }
    
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

const getSequelizeInstance = () => {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance not initialized. Call setupDatabase() first.');
  }
  return sequelizeInstance;
};

const getMongoUri = () => {
  if (!mongod) {
    throw new Error('MongoDB Memory Server not initialized. Call setupDatabase() first.');
  }
  return mongod.getUri();
};

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