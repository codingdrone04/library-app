function createTestBook(overrides = {}) {
    return {
      title: 'Livre de Test',
      authors: ['Auteur Test'],
      description: 'Description test',
      status: 'available',
      library: {
        library_id: 1,
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
      library_id: 1,
      ...overrides
    };
  }
  
  module.exports = {
    createTestBook,
    createTestUser
  };