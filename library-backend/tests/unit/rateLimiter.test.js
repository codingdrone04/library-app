const rateLimiter = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  test('devrait passer la requête sans limitation', () => {
    rateLimiter(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
  });
});