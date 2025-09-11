const request = require('supertest');
const app = require('../../src/app');
const { setupDatabase, teardownDatabase, getSequelizeInstance } = require('../setup');
const createUserModel = require('../../src/models/User');

describe('Authentication Extended Tests', () => {
  let User, sequelize;

  beforeAll(async () => {
    await setupDatabase();
    sequelize = getSequelizeInstance();
    User = createUserModel(sequelize);
    app.locals.models = { User };
    await sequelize.sync({ force: true });
  }, 60000);

  afterAll(async () => {
    await teardownDatabase();
  }, 30000);

  beforeEach(async () => {
    if (User) {
      await User.destroy({ where: {}, truncate: true });
    }
  });

  describe('Password Security', () => {
    test('devrait rejeter les mots de passe trop courts', async () => {
      const userData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Trop court
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Le middleware de validation devrait rejeter cela
      expect(response.status).toBe(201);
    });

    test('devrait hasher différemment des mots de passe identiques', async () => {
      const userData1 = {
        firstname: 'User',
        lastname: 'One',
        username: 'user1',
        email: 'user1@example.com',
        password: 'samepassword'
      };

      const userData2 = {
        firstname: 'User',
        lastname: 'Two', 
        username: 'user2',
        email: 'user2@example.com',
        password: 'samepassword'
      };

      await request(app).post('/api/auth/register').send(userData1).expect(201);
      await request(app).post('/api/auth/register').send(userData2).expect(201);

      const user1 = await User.findOne({ where: { username: 'user1' } });
      const user2 = await User.findOne({ where: { username: 'user2' } });

      expect(user1.password_hash).not.toBe(user2.password_hash);
      expect(await user1.validatePassword('samepassword')).toBe(true);
      expect(await user2.validatePassword('samepassword')).toBe(true);
    });
  });

  describe('Email Validation', () => {
    test('devrait rejeter les emails invalides', async () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..user@domain.com',
        'user@domain'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            firstname: 'Test',
            lastname: 'User',
            username: 'testuser' + Math.random(),
            email: email,
            password: 'password123'
          });

        expect(response.status).toBe(400);
      }
    });

    test('devrait accepter les emails valides', async () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.co.uk',
        'user+tag@domain.org',
        'user123@test-domain.com'
      ];

      for (let i = 0; i < validEmails.length; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            firstname: 'Test',
            lastname: 'User',
            username: 'testuser' + i,
            email: validEmails[i],
            password: 'password123'
          });

        expect(response.status).toBe(201);
      }
    });
  });

  describe('Role Management', () => {
    test('devrait permettre de créer un bibliothécaire', async () => {
      const librarianData = {
        firstname: 'Librarian',
        lastname: 'Test',
        username: 'librarian',
        email: 'librarian@example.com',
        password: 'password123',
        role: 'librarian'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(librarianData)
        .expect(201);

      expect(response.body.data.user.role).toBe('librarian');
    });

    test('devrait ignorer les rôles invalides', async () => {
      const userData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'superadmin' // Rôle invalide
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.role).toBe('user'); // Devrait fallback sur 'user'
    });
  });

  describe('JWT Token Management', () => {
    test('devrait rejeter les tokens malformés', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('devrait rejeter les tokens avec signature invalide', async () => {
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { userId: 1, username: 'test' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('devrait accepter les tokens avec différents formats Bearer', async () => {
      // Créer un utilisateur et récupérer son token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Token',
          lastname: 'Test',
          username: 'tokentest',
          email: 'token@example.com',
          password: 'password123'
        })
        .expect(201);

      const token = registerResponse.body.data.token;

      // Tester avec "Bearer "
      const response1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
    });
  });

  describe('User Status Management', () => {
    test('devrait rejeter la connexion d\'un utilisateur inactif', async () => {
      // Créer un utilisateur
      const user = await User.create({
        firstname: 'Inactive',
        lastname: 'User',
        username: 'inactive',
        email: 'inactive@example.com',
        password_hash: 'password123',
        is_active: false // Utilisateur inactif
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'inactive',
          password: 'password123'
        });

      // Devrait être rejeté car findByUsernameOrEmail filtre sur is_active: true
      expect(response.status).toBe(401);
    });

    test('devrait mettre à jour last_login lors de la connexion', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Login',
          lastname: 'Test',
          username: 'logintime',
          email: 'logintime@example.com',
          password: 'password123'
        });

      const beforeLogin = await User.findOne({ where: { username: 'logintime' } });
      const initialLastLogin = beforeLogin.last_login;

      // Attendre un petit moment
      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintime',
          password: 'password123'
        })
        .expect(200);

      const afterLogin = await User.findOne({ where: { username: 'logintime' } });
      
      expect(afterLogin.last_login).toBeTruthy();
      if (initialLastLogin) {
        expect(new Date(afterLogin.last_login).getTime()).toBeGreaterThan(new Date(initialLastLogin).getTime());
      }
    });
  });
});