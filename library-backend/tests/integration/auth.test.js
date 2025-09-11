const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, teardownDatabase } = require('../setup');
const connectPostgreSQL = require('../../src/config/postgresql');
const createUserModel = require('../../src/models/User');

describe('Authentication API Complete Tests', () => {
  let server;
  let sequelize;
  let User;

  beforeAll(async () => {
    console.log('🔐 Setup Auth Tests...');
    
    // Setup MongoDB Memory Server (pour les livres)
    await setupDatabase();
    
    // Setup PostgreSQL pour les utilisateurs
    sequelize = await connectPostgreSQL();
    User = createUserModel(sequelize);
    
    // Synchroniser les tables
    await sequelize.sync({ force: true }); // force: true pour recréer les tables
    
    // Rendre les modèles disponibles pour l'app
    app.locals.models = { User };
    
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
    
    // Close PostgreSQL connection
    if (sequelize) {
      await sequelize.close();
    }
    
    // Teardown MongoDB
    await teardownDatabase();
    
    console.log('✅ Auth tests cleanup complete');
  }, 30000);

  beforeEach(async () => {
    // Clean up users before each test using Sequelize
    if (User) {
      await User.destroy({ where: {}, force: true });
    }
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      console.log('Registration response:', response.status, response.body);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.token).toBeDefined();
    });

    test('should hash password before storing', async () => {
      const userData = {
        firstname: 'Hash',
        lastname: 'Test',
        username: 'hashtest',
        email: 'hash@example.com',
        password: 'plainpassword'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      // Check the database directly
      const user = await User.findOne({ where: { username: userData.username } });
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(userData.password);
      
      // Test password validation
      const isValid = await user.validatePassword(userData.password);
      expect(isValid).toBe(true);
    });

    test('should reject duplicate username', async () => {
      const userData = {
        firstname: 'First',
        lastname: 'User',
        username: 'duplicate',
        email: 'first@example.com',
        password: 'password123'
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

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should reject duplicate email', async () => {
      const userData = {
        firstname: 'First',
        lastname: 'User',
        username: 'firstemail',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const duplicateUser = {
        ...userData,
        username: 'secondemail'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        username: 'incomplete'
        // missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate email format', async () => {
      const userData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should set default role to user', async () => {
      const userData = {
        firstname: 'Default',
        lastname: 'User',
        username: 'defaultrole',
        email: 'default@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('user');
    });

    test('should allow librarian role', async () => {
      const userData = {
        firstname: 'Librarian',
        lastname: 'User',
        username: 'librarian',
        email: 'librarian@example.com',
        password: 'password123',
        role: 'librarian'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('librarian');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await User.create({
        firstname: 'Login',
        lastname: 'Test',
        username: 'logintest',
        email: 'login@example.com',
        password_hash: 'password123' // Will be hashed by the model hook
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
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('logintest');
    });

    test('should login with email instead of username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'login@example.com', // Using email
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should require both username and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest'
          // password missing
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should update last_login timestamp', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        })
        .expect(200);

      const user = await User.findOne({ where: { username: 'logintest' } });
      expect(user.last_login).toBeDefined();
      expect(new Date(user.last_login)).toBeInstanceOf(Date);
      expect(new Date(user.last_login).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;
    let testUser;

    beforeEach(async () => {
      // Create and login a user to get token
      testUser = await User.create({
        firstname: 'Me',
        lastname: 'Test',
        username: 'metest',
        email: 'me@example.com',
        password_hash: 'password123'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'metest',
          password: 'password123'
        });
      
      userToken = loginResponse.body.data.token;
    });

    test('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      console.log('Me response:', response.status, response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('metest');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject expired token', async () => {
      // Create a token with very short expiration
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' } // Expires immediately
      );

      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject token for non-existent user', async () => {
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { userId: 99999, username: 'fake' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject token for inactive user', async () => {
      // Deactivate the user
      await testUser.update({ is_active: false });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Security', () => {
    test('tokens should have proper structure', async () => {
      const userData = {
        firstname: 'Token',
        lastname: 'Test',
        username: 'tokentest',
        email: 'token@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      
      const token = response.body.data.token;
      expect(token).toBeDefined();
      
      // Verify token structure (JWT has 3 parts separated by dots)
      const tokenParts = token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Decode token payload (without verification for testing)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      expect(decoded.userId).toBeDefined();
      expect(decoded.username).toBe(userData.username);
      expect(decoded.exp).toBeDefined(); // Should have expiration
    });

    test('tokens should expire', async () => {
      // This test verifies that tokens include expiration claims
      // Actual expiration testing is done in the "should reject expired token" test
      
      const userData = {
        firstname: 'Expire',
        lastname: 'Test',
        username: 'expiretest',
        email: 'expire@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const token = response.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });
});