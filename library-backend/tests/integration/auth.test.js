describe('Authentication API', () => {
    test('POST /auth/login should return token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin' })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });