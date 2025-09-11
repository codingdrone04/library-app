process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Base de données de test
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_test';
process.env.POSTGRES_DATABASE = 'library_test';
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';

// Configuration API
process.env.PORT = '3001'; // Port différent pour les tests

// Configuration CORS
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Désactiver les logs pendant les tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}