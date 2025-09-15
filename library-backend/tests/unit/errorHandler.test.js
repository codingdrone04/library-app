const errorHandler = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('devrait gérer les erreurs génériques', () => {
    const error = new Error('Test error');
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(console.error).toHaveBeenCalledWith(error);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server Error' });
  });

  test('devrait gérer les erreurs avec status personnalisé', () => {
    const error = new Error('Custom error');
    error.status = 404;
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server Error' });
  });
});
