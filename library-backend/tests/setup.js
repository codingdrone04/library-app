const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

let mongod;
let sequelizeInstance;
let isSetupComplete = false;

const PREFERRED_MONGO_VERSIONS = [
  process.env.MONGO_BINARY_VERSION,
  '6.0.8',
  '6.0.7',
  '5.0.14'
].filter(Boolean);

const getMongoConfig = (version) => ({
  binary: {
    version,
    downloadDir: './node_modules/.cache/mongodb-memory-server',
  },
  instance: {
    storageEngine: 'wiredTiger',
    dbName: 'library-test-' + Date.now(),
  }
});

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

    let lastError = null;
    for (const version of PREFERRED_MONGO_VERSIONS) {
      try {
        console.log(`🔄 [SETUP] Tentative avec MongoDB version ${version}...`);
        mongod = await MongoMemoryServer.create(getMongoConfig(version));
        const mongoUri = mongod.getUri();
        console.log('📊 [SETUP] MongoDB Memory Server URI:', mongoUri);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [SETUP] Échec avec version ${version}:`, error.message);
        if (mongod) {
          try { await mongod.stop(); } catch (e) {}
          mongod = null;
        }
      }
    }

    if (lastError) {
      throw new Error(`Failed to start MongoDB Memory Server with any version: ${lastError.message}`);
    }

    const mongoUri = mongod.getUri();

    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      family: 4
    });
    
    console.log('✅ [SETUP] MongoDB Memory Server connecté!');
    console.log('📡 [SETUP] ReadyState:', mongoose.connection.readyState);

    console.log('🐘 [SETUP] Configuration PostgreSQL local...');

    // Connect to default postgres database first to create test database
    const pgUser = (process.env.POSTGRES_USER && process.env.POSTGRES_USER.trim() !== '' && process.env.POSTGRES_USER.trim()) || process.env.USER || 'postgres';
    const pgPassword = (process.env.POSTGRES_PASSWORD && process.env.POSTGRES_PASSWORD.trim() !== '' && process.env.POSTGRES_PASSWORD.trim()) || '';

    const tempSequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      username: pgUser,
      password: pgPassword,
      database: 'postgres',
      logging: false
    });

    const testDbName = `library_test_${Date.now()}`;

    try {
      // Create test database
      await tempSequelize.query(`CREATE DATABASE ${testDbName};`);
      await tempSequelize.close();

      // Connect to the new test database
      sequelizeInstance = new Sequelize({
        dialect: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        username: pgUser,
        password: pgPassword,
        database: testDbName,
        logging: false
      });

      await sequelizeInstance.authenticate();
      console.log('✅ [SETUP] PostgreSQL local connecté:', testDbName);
    } catch (error) {
      console.error('❌ [SETUP] Erreur connexion PostgreSQL:', error.message);
      await tempSequelize.close().catch(() => {});
      throw error;
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

    let testDbName = null;
    if (sequelizeInstance) {
      try {
        testDbName = sequelizeInstance.config.database;
        await sequelizeInstance.close();
        console.log('✅ [TEARDOWN] PostgreSQL fermé');

        // Drop the test database
        if (testDbName && testDbName.startsWith('library_test_')) {
          const pgUser = (process.env.POSTGRES_USER && process.env.POSTGRES_USER.trim()) || process.env.USER || 'postgres';
          const pgPassword = (process.env.POSTGRES_PASSWORD && process.env.POSTGRES_PASSWORD.trim()) || '';

          const cleanupSequelize = new Sequelize({
            dialect: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            username: pgUser,
            password: pgPassword,
            database: 'postgres',
            logging: false
          });

          await cleanupSequelize.query(`DROP DATABASE IF EXISTS ${testDbName};`);
          await cleanupSequelize.close();
          console.log('✅ [TEARDOWN] Base de test PostgreSQL supprimée:', testDbName);
        }
      } catch (error) {
        console.warn('⚠️ [TEARDOWN] Erreur fermeture PostgreSQL:', error.message);
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