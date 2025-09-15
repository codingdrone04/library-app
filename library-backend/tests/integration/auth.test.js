const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, teardownDatabase, getSequelizeInstance } = require('../setup');
const createUserModel = require('../../src/models/User');

describe('Authentication API Complete Tests', () => {
  let server;
  let User;
  let sequelize;

  beforeAll(async () => {
    console.log('🔐 Setup Auth Tests...');
    
    await setupDatabase();
    
    sequelize = getSequelizeInstance();
    User = createUserModel(sequelize);
    
    app.locals.models = { User };
    
    await sequelize.sync({ force: true });
    
    server = app.listen(0);
    
    console.log('✅ Auth test environment ready');
  }, 60000);

  afterAll(async () => {
    console.log('🧹 Cleaning up auth tests...');
    
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    
    await teardownDatabase();
    
    console.log('✅ Auth tests cleanup complete');
  }, 30000);

  beforeEach(async () => {
    if (User) {
      await User.destroy({ where: {}, truncate: true });
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

      const user = await User.findOne({ where: { username: userData.username } });
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(userData.password);
      expect(await user.validatePassword(userData.password)).toBe(true);
    });

    test('should reject duplicate username', async () => {
      const userData = {
        firstname: 'First',
        lastname: 'User',
        username: 'duplicate',
        email: 'first@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

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

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

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
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate email format', async () => {
      const userData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser2',
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
        lastname: 'Role',
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
        lastname: 'Test',
        username: 'librariantest',
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
      await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Login',
          lastname: 'Test',
          username: 'logintest',
          email: 'login@example.com',
          password: 'password123'
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
          username: 'login@example.com',
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
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should update last_login timestamp', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      
      const user = await User.findOne({ where: { username: 'logintest' } });
      expect(user.last_login).toBeTruthy();
    });
  });

  describe('GET /api/auth/me', () => {
    let userToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Me',
          lastname: 'Test',
          username: 'metest',
          email: 'me@example.com',
          password: 'password123'
        });
      
      userToken = registerResponse.body.data.token;
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
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 999, username: 'expired', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' }
      );

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
        { userId: 999999, username: 'fake', role: 'user' },
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
      await User.update(
        { is_active: false },
        { where: { username: 'metest' } }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Security', () => {
    test('tokens should have proper structure', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Token',
          lastname: 'Test',
          username: 'tokentest',
          email: 'token@example.com',
          password: 'password123'
        });

      const token = response.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBeDefined();
      expect(decoded.username).toBe('tokentest');
      expect(decoded.role).toBe('user');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('tokens should expire', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Expire',
          lastname: 'Test',
          username: 'expiretest',
          email: 'expire@example.com',
          password: 'password123'
        });

      const token = response.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });
});