const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// ✅ Utiliser module.exports.mochaHooks ou export direct
const setupDatabase = async () => {
  console.log('🚀 [SETUP] Démarrage MongoDB Memory Server...');
  
  try {
    // Déconnecter toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Créer MongoDB en mémoire
    mongod = await MongoMemoryServer.create({
      binary: {
        version: 'latest', // Laisse MongoDB Memory Server choisir
        downloadDir: './node_modules/.cache/mongodb-memory-server',
      },
      instance: {
        dbName: 'test-library',
        port: 27017, // Port fixe pour éviter les conflits
      }
    });

    const uri = mongod.getUri();
    console.log('📡 [SETUP] URI:', uri);

    // Connexion avec timeout plus généreux
    await mongoose.connect(uri, {
      bufferCommands: false,
      bufferMaxEntries: 0,
    });
    
    console.log('✅ [SETUP] MongoDB connecté! ReadyState:', mongoose.connection.readyState);
    
  } catch (error) {
    console.error('❌ [SETUP] Erreur:', error);
    throw error;
  }
};

const teardownDatabase = async () => {
  console.log('🧹 [TEARDOWN] Nettoyage...');
  
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('✅ [TEARDOWN] Terminé');
  } catch (error) {
    console.error('❌ [TEARDOWN] Erreur:', error);
  }
};

// ✅ Setup et teardown global corrects
beforeAll(setupDatabase, 120000);
afterAll(teardownDatabase, 30000);

// Export pour utilisation manuelle si besoin
module.exports = {
  setupDatabase,
  teardownDatabase
};