process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-very-long-and-secure';
process.env.JWT_EXPIRES_IN = '1h';

process.env.MONGODB_URI = 'mongodb://localhost:27017/library_test_memory';
// PostgreSQL - will be created dynamically by test setup
// Use current user for local PostgreSQL connection
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';

process.env.PORT = '0';

process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';

const originalConsole = { ...console };

if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error;
  console.info = jest.fn();
  console.debug = jest.fn();
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});