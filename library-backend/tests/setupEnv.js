process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-very-long-and-secure';
process.env.JWT_EXPIRES_IN = '1h';

// Base de données de test
process.env.MONGODB_URI = 'mongodb://localhost:27017/library_test_memory';
process.env.POSTGRES_DATABASE = 'library_test';
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';

// Configuration API
process.env.PORT = '0'; // Port aléatoire pour éviter les conflits

// Configuration CORS
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';

// Désactiver les logs pendant les tests mais garder les erreurs critiques
const originalConsole = { ...console };

if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  // Garder console.error pour le debugging
  console.error = originalConsole.error;
  console.info = jest.fn();
  console.debug = jest.fn();
}

// ✅ Gestionnaire d'erreurs global pour les tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// ✅ SUPPRIMÉ: afterEach car il n'est pas disponible dans ce contexte
// Les hooks afterEach doivent être dans les fichiers de test individuels