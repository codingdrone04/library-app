const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

let mongod;
let sequelize;

const setupDatabase = async () => {
  try {
    console.log('🚀 [SETUP] Démarrage des bases de données de test...');
    
    // === MONGODB MEMORY SERVER ===
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
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ [SETUP] MongoDB Memory Server connecté');

    // === POSTGRESQL IN-MEMORY ===
    console.log('🐘 [SETUP] Configuration PostgreSQL en mémoire...');
    
    // Use SQLite for testing (in-memory database)
    sequelize = new Sequelize('sqlite::memory:', {
      dialect: 'sqlite',
      logging: false, // Set to console.log to see SQL queries
      define: {
        timestamps: true,
        underscored: false, // Use camelCase instead of snake_case
      },
    });

    // Test the connection
    await sequelize.authenticate();
    console.log('✅ [SETUP] SQLite en mémoire connecté');

    console.log('🎉 [SETUP] Toutes les bases de données sont prêtes');
    
    return { mongod, sequelize };
  } catch (error) {
    console.error('❌ [SETUP] Erreur:', error);
    throw error;
  }
};

const teardownDatabase = async () => {
  try {
    console.log('🧹 [TEARDOWN] Nettoyage des bases de données...');
    
    // Close PostgreSQL/SQLite connection
    if (sequelize) {
      await sequelize.close();
      console.log('✅ [TEARDOWN] SQLite fermé');
    }
    
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ [TEARDOWN] MongoDB déconnecté');
    }
    
    // Stop MongoDB Memory Server
    if (mongod) {
      await mongod.stop();
      console.log('✅ [TEARDOWN] MongoDB Memory Server arrêté');
    }
    
    console.log('✅ [TEARDOWN] Terminé');
  } catch (error) {
    console.error('❌ [TEARDOWN] Erreur:', error);
  }
};

// Helper function to get a fresh sequelize instance for tests
const getTestSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return sequelize;
};

// Helper function to get mongoose connection
const getTestMongoose = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected. Call setupDatabase() first.');
  }
  return mongoose;
};

// Create test database with models
const setupTestModels = async () => {
  try {
    console.log('📋 [SETUP] Création des modèles de test...');
    
    if (!sequelize) {
      throw new Error('Sequelize not initialized');
    }
    
    // Import user model
    const createUserModel = require('../src/models/User');
    const User = createUserModel(sequelize);
    
    // Sync all models (create tables)
    await sequelize.sync({ force: true });
    console.log('✅ [SETUP] Tables PostgreSQL créées');
    
    return { User, sequelize };
  } catch (error) {
    console.error('❌ [SETUP] Erreur création modèles:', error);
    throw error;
  }
};

// Clean all test data
const cleanTestData = async () => {
  try {
    console.log('🧹 [CLEANUP] Nettoyage des données de test...');
    
    // Clean PostgreSQL data
    if (sequelize) {
      const models = Object.keys(sequelize.models);
      for (const modelName of models) {
        await sequelize.models[modelName].destroy({ 
          where: {}, 
          force: true,
          truncate: true 
        });
      }
      console.log('✅ [CLEANUP] Données PostgreSQL nettoyées');
    }
    
    // Clean MongoDB data
    if (mongoose.connection.readyState === 1) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
      console.log('✅ [CLEANUP] Données MongoDB nettoyées');
    }
    
  } catch (error) {
    console.error('❌ [CLEANUP] Erreur:', error);
    throw error;
  }
};

// Test configuration for different environments
const getTestConfig = () => {
  return {
    mongodb: {
      uri: mongod ? mongod.getUri() : null,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    postgresql: {
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing',
      expiresIn: '1h'
    }
  };
};

module.exports = {
  setupDatabase,
  teardownDatabase,
  setupTestModels,
  cleanTestData,
  getTestSequelize,
  getTestMongoose,
  getTestConfig,
};