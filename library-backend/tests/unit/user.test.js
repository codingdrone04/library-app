describe('User Model', () => {
    test('should hash password before saving', async () => {
      const user = await User.create({
        firstname: 'Test',
        lastname: 'User', 
        username: 'testuser',
        email: 'test@test.com',
        password_hash: 'plaintext'
      });
      
      expect(user.password_hash).not.toBe('plaintext');
      expect(await user.validatePassword('plaintext')).toBe(true);
    });
  });