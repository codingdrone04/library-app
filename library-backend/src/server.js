const app = require('./app');
const connectMongoDB = require('./config/mongodb');
const connectPostgreSQL = require('./config/postgresql'); // ← CHANGEMENT ICI

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
    await connectPostgreSQL(); // ← CHANGEMENT ICI
    console.log('✅ PostgreSQL connecté !');
    
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

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received. Shutting down gracefully...');
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

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Démarrer le serveur
startServer();