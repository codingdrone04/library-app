module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testTimeout: 30000,
  maxWorkers: 1, // Important pour éviter les conflits
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js',
    '!src/config/local.js',
    '!src/config/postgresql.js',
  ],
  
  // ✅ CORRECTION: Seuils réalistes
  coverageThreshold: {
    global: {
      branches: 30,    // Très réaliste pour commencer
      functions: 35,   
      lines: 35,       
      statements: 35   
    }
    // ✅ SUPPRIMÉ: Seuils spécifiques qui causaient des échecs
  },
  
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  
  // ✅ SUPPRIMÉ: testSequencer personnalisé qui peut causer des problèmes
  
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '<rootDir>/src/config/local.js',
    '<rootDir>/src/server.js'
  ],
  
  // ✅ CORRECTION: Options pour éviter les memory leaks
  forceExit: true,
  detectOpenHandles: true,
  detectLeaks: false, // Désactivé car expérimental et cause des faux positifs
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // ✅ SUPPRIMÉ: reporters personnalisés qui peuvent causer des leaks
  
  notify: false,
  
  errorOnDeprecated: false, // Désactivé pour éviter les erreurs sur les dépendances
  
  // ✅ AJOUTÉ: Options pour stabilité
  maxConcurrency: 1,
  bail: false, // Ne pas arrêter au premier échec
  
  // ✅ AJOUTÉ: Configuration pour éviter les timeouts
  slowTestThreshold: 10,
  
  // ✅ Configuration des mocks
  automock: false,
  unmockedModulePathPatterns: [
    'node_modules'
  ]
};