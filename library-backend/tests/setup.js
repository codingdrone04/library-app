const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

const setupDatabase = async () => {
  try {
    console.log('🚀 [SETUP] Démarrage MongoDB Memory Server...');
    
    // Create MongoDB in memory with proper configuration
    mongod = await MongoMemoryServer.create({
      binary: {
        version: '6.0.9', // Use a specific stable version instead of 'latest'
        downloadDir: './node_modules/.cache/mongodb-memory-server',
      },
      instance: {
        storageEngine: 'wiredTiger', // Use wiredTiger instead of ephemeralForTest
        dbName: 'library-test',
      },
    });

    const mongoUri = mongod.getUri();
    console.log('📊 MongoDB Memory Server URI:', mongoUri);

    // Connect mongoose to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ [SETUP] MongoDB Memory Server démarré');
  } catch (error) {
    console.error('❌ [SETUP] Erreur:', error);
    throw error;
  }
};

const teardownDatabase = async () => {
  try {
    console.log('🧹 [TEARDOWN] Nettoyage...');
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('✅ [TEARDOWN] Terminé');
  } catch (error) {
    console.error('❌ [TEARDOWN] Erreur:', error);
  }
};

module.exports = {
  setupDatabase,
  teardownDatabase,
};