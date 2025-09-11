const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { Sequelize } = require('sequelize');
const createUserModel = require('../../src/models/User');

describe('User Model', () => {
  let sequelize;
  let User;

  beforeAll(async () => {
    // Créer une instance SQLite en mémoire pour les tests
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    // Créer le modèle User
    User = createUserModel(sequelize);
    
    // Synchroniser la base de données
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Nettoyer les données avant chaque test
    await User.destroy({ where: {} });
  });

  test('should hash password before saving', async () => {
    const user = await User.create({
      firstname: 'Test',
      lastname: 'User', 
      username: 'testuser',
      email: 'test@test.com',
      password_hash: 'plaintext'
    });
    
    expect(user.password_hash).not.toBe('plaintext');
    expect(user.password_hash).toBeDefined();
    expect(await user.validatePassword('plaintext')).toBe(true);
  });

  test('should validate email format', async () => {
    const invalidUser = {
      firstname: 'Test',
      lastname: 'User',
      username: 'testuser2',
      email: 'invalid-email',
      password_hash: 'password123'
    };

    await expect(User.create(invalidUser)).rejects.toThrow();
  });

  test('should not allow duplicate username', async () => {
    await User.create({
      firstname: 'First',
      lastname: 'User',
      username: 'duplicate',
      email: 'first@test.com',
      password_hash: 'password123'
    });

    const duplicateUser = {
      firstname: 'Second',
      lastname: 'User',
      username: 'duplicate',
      email: 'second@test.com',
      password_hash: 'password123'
    };

    await expect(User.create(duplicateUser)).rejects.toThrow();
  });

  test('should find user by username or email', async () => {
    const user = await User.create({
      firstname: 'Find',
      lastname: 'Test',
      username: 'findtest',
      email: 'find@test.com',
      password_hash: 'password123'
    });

    const foundByUsername = await User.findByUsernameOrEmail('findtest');
    const foundByEmail = await User.findByUsernameOrEmail('find@test.com');

    expect(foundByUsername.id).toBe(user.id);
    expect(foundByEmail.id).toBe(user.id);
  });
});