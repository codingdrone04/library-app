const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

let mongod;
let sequelizeInstance;

const setupDatabase = async () => {
  try {
    console.log('🚀 [SETUP] Démarrage des bases de données de test...');
    
    // ===== MONGODB MEMORY SERVER =====
    console.log('📚 [SETUP] Configuration MongoDB Memory Server...');
    
    mongod = await MongoMemoryServer.create({
      binary: {
        version: '6.0.9',
        downloadDir: './node_modules/.cache/mongodb-memory-server',
      },
      instance: {
        storageEngine: 'wiredTiger',
        dbName: 'library-test',
      },
    });

    const mongoUri = mongod.getUri();
    console.log('📊 MongoDB Memory Server URI:', mongoUri);

    // Connect mongoose to the in-memory database
    await mongoose.connect(mongoUri);
    console.log('✅ [SETUP] MongoDB Memory Server connecté');
    
    // ===== SQLITE EN MÉMOIRE POUR POSTGRESQL =====
    console.log('🐘 [SETUP] Configuration SQLite en mémoire (remplace PostgreSQL)...');
    
    sequelizeInstance = new Sequelize('sqlite::memory:', {
      logging: false, // Désactiver les logs SQL pendant les tests
      dialectOptions: {
        // Options SQLite
      }
    });
    
    // Tester la connexion
    await sequelizeInstance.authenticate();
    console.log('✅ [SETUP] SQLite en mémoire connecté');
    
    console.log('🎉 [SETUP] Toutes les bases de données sont prêtes');
    
    return { mongoUri, sequelizeInstance };
    
  } catch (error) {
    console.error('❌ [SETUP] Erreur:', error);
    throw error;
  }
};

const teardownDatabase = async () => {
  try {
    console.log('🧹 [TEARDOWN] Nettoyage des bases de données...');
    
    // Fermer SQLite
    if (sequelizeInstance) {
      await sequelizeInstance.close();
      console.log('✅ [TEARDOWN] SQLite fermé');
    }
    
    // Fermer MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ [TEARDOWN] MongoDB déconnecté');
    }
    
    // Arrêter MongoDB Memory Server
    if (mongod) {
      await mongod.stop();
      console.log('✅ [TEARDOWN] MongoDB Memory Server arrêté');
    }
    
    console.log('✅ [TEARDOWN] Terminé');
  } catch (error) {
    console.error('❌ [TEARDOWN] Erreur:', error);
  }
};

// Expose sequelize instance for tests
const getSequelizeInstance = () => sequelizeInstance;

module.exports = {
  setupDatabase,
  teardownDatabase,
  getSequelizeInstance
};