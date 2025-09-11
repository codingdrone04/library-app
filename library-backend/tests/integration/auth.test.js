const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { setupDatabase, teardownDatabase } = require('../setup');

describe('Authentication API Complete Tests', () => {
  let server;

  beforeAll(async () => {
    console.log('🔐 Setup Auth Tests...');
    
    // Start MongoDB Memory Server
    await setupDatabase();
    
    // Start the Express server
    server = app.listen(0); // Use port 0 for random available port
    
    console.log('✅ Auth test environment ready');
  }, 60000);

  afterAll(async () => {
    console.log('🧹 Cleaning up auth tests...');
    
    // Close the server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    
    // Teardown database
    await teardownDatabase();
    
    console.log('✅ Auth tests cleanup complete');
  }, 30000);

  beforeEach(async () => {
    // Clean up users before each test using mongoose directly
    try {
      await mongoose.connection.db.collection('users').deleteMany({});
    } catch (error) {
      console.log('No users collection to clean up');
    }
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      console.log('Registration response:', response.status, response.body);
      
      // Adjust expectations based on your actual API response
      expect(response.status).toBe(201);
      expect(response.body.user?.username).toBe(userData.username);
    });

    test('should hash password before storing', async () => {
      const userData = {
        username: 'hashtest',
        email: 'hash@example.com',
        password: 'plainpassword',
        firstName: 'Hash',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      // Check the database directly
      const user = await mongoose.connection.db.collection('users').findOne({ username: userData.username });
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(userData.password);
    });

    test('should reject duplicate username', async () => {
      const userData = {
        username: 'duplicate',
        email: 'first@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create second user with same username
      const duplicateUser = {
        ...userData,
        email: 'second@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'password123',
          firstName: 'Login',
          lastName: 'Test'
        });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      console.log('Login response:', response.status, response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;

    beforeEach(async () => {
      // Create and login a user to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'metest',
          email: 'me@example.com',
          password: 'password123',
          firstName: 'Me',
          lastName: 'Test'
        });
      
      userToken = registerResponse.body.token;
    });

    test('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      console.log('Me response:', response.status, response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('metest');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});