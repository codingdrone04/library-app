module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testTimeout: 60000,
  maxWorkers: 1,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js',
    // Exclure les fichiers de configuration
    '!src/config/local.js'
  ],
  coverageThreshold: {
    global: {
      // ✅ Seuils plus réalistes pour commencer
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testSequencer: '<rootDir>/tests/testSequencer.js',
  
  // ✅ Améliorer les rapports de couverture
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // ✅ Ignorer certains patterns pour les tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  // ✅ Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/setupEnv.js']
};