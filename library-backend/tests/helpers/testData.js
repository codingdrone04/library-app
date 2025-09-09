function createTestBook(overrides = {}) {
    return {
      title: 'Livre de Test',
      authors: ['Auteur Test'],
      description: 'Description test',
      status: 'available',
      library: {
        location: 'A-1',
        condition: 'good',
        librarian: 'admin'
      },
      ...overrides
    };
  }
  
  function createTestUser(overrides = {}) {
    return {
      firstname: 'John',
      lastname: 'Doe',
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'motdepassehashe',
      role: 'user',
      ...overrides
    };
  }
  
  module.exports = {
    createTestBook,
    createTestUser
  };