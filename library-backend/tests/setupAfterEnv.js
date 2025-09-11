beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Nettoyage des timers après chaque test
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Nettoyer les variables d'environnement ajoutées pendant les tests
    delete process.env.TEST_TEMP_VAR;
  });
  
  // ✅ Configuration des timeouts globaux
  jest.setTimeout(30000);
  
  // ✅ Gestion des erreurs async non gérées pendant les tests
  const originalUncaughtException = process.listeners('uncaughtException');
  const originalUnhandledRejection = process.listeners('unhandledRejection');
  
  beforeAll(() => {
    // Ajouter des gestionnaires spécifiques aux tests
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception pendant les tests:', error);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection pendant les tests:', reason);
    });
  });
  
  afterAll(() => {
    // Remettre les gestionnaires originaux
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    
    originalUncaughtException.forEach(listener => {
      process.on('uncaughtException', listener);
    });
    
    originalUnhandledRejection.forEach(listener => {
      process.on('unhandledRejection', listener);
    });
  });
  
  // ✅ Helpers globaux pour les tests
  global.testHelpers = {
    // Helper pour attendre les opérations async
    wait: (ms = 10) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Helper pour créer des IDs MongoDB valides
    createObjectId: () => require('mongoose').Types.ObjectId(),
    
    // Helper pour créer des dates de test
    createTestDate: (daysOffset = 0) => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date;
    }
  };
  
  // ✅ Extensions Jest personnalisées
  expect.extend({
    toBeValidObjectId(received) {
      const mongoose = require('mongoose');
      const pass = mongoose.Types.ObjectId.isValid(received);
      
      if (pass) {
        return {
          message: () => `expected ${received} not to be a valid ObjectId`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid ObjectId`,
          pass: false,
        };
      }
    },
    
    toBeValidEmail(received) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const pass = emailRegex.test(received);
      
      if (pass) {
        return {
          message: () => `expected ${received} not to be a valid email`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be a valid email`,
          pass: false,
        };
      }
    }
  });