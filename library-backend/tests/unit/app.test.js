const request = require('supertest');
const app = require('../../src/app');

describe('App Configuration', () => {
  test('GET / devrait retourner les informations de l\'API', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('message', '📚 Library Management API');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('endpoints');
    expect(response.body.endpoints).toHaveProperty('auth', '/api/auth');
    expect(response.body.endpoints).toHaveProperty('books', '/api/books');
  });

  test('GET /health devrait retourner le statut OK', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message', 'Library API is running! 📚');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
  });

  test('GET /nonexistent devrait retourner 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Route not found');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Cannot GET /nonexistent');
    expect(response.body).toHaveProperty('availableRoutes');
  });

  test('POST /nonexistent devrait retourner 404 avec la bonne méthode', async () => {
    const response = await request(app)
      .post('/nonexistent')
      .expect(404);

    expect(response.body.message).toContain('Cannot POST /nonexistent');
  });
});