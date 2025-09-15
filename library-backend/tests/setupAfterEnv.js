beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    
    delete process.env.TEST_TEMP_VAR;
  });
  
  jest.setTimeout(30000);
  
  const originalUncaughtException = process.listeners('uncaughtException');
  const originalUnhandledRejection = process.listeners('unhandledRejection');
  
  beforeAll(() => {
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception pendant les tests:', error);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection pendant les tests:', reason);
    });
  });
  
  afterAll(() => {
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    
    originalUncaughtException.forEach(listener => {
      process.on('uncaughtException', listener);
    });
    
    originalUnhandledRejection.forEach(listener => {
      process.on('unhandledRejection', listener);
    });
  });
  
  global.testHelpers = {
    wait: (ms = 10) => new Promise(resolve => setTimeout(resolve, ms)),
    
    createObjectId: () => require('mongoose').Types.ObjectId(),
    
    createTestDate: (daysOffset = 0) => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date;
    }
  };
  
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