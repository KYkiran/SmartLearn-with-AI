const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const UserProgress = require('../../src/models/UserProgress');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    const validUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      role: 'student'
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.name).toBe(validUser.name);
      expect(res.body.data.user.role).toBe(validUser.role);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();

      // Check if user was created in database
      const user = await User.findOne({ email: validUser.email });
      expect(user).toBeTruthy();
      expect(user.isEmailVerified).toBe(false);

      // Check if user progress was created
      const userProgress = await UserProgress.findOne({ user: user._id });
      expect(userProgress).toBeTruthy();
    });

    it('should not register user with invalid email', async () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should not register user with weak password', async () => {
      const invalidUser = { ...validUser, password: '123' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      // Create user first
      await User.create(validUser);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        role: 'student'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();

      // Check if lastLoginAt was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLoginAt).toBeDefined();
    });

    it('should not login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    it('should not login inactive user', async () => {
      user.isActive = false;
      await user.save();

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/auth/me', () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        role: 'student'
      });
      token = user.generateAuthToken();
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should not get user without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('should not get user with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        role: 'student'
      });
      token = user.generateAuthToken();
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        preferences: {
          learningStyle: 'visual',
          difficultyLevel: 'intermediate'
        }
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(updateData.name);
      expect(res.body.data.user.bio).toBe(updateData.bio);
      expect(res.body.data.user.preferences.learningStyle).toBe(updateData.preferences.learningStyle);
    });

    it('should not update with invalid data', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'A', // Too short
          preferences: {
            learningStyle: 'invalid'
          }
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        role: 'student'
      });
      token = user.generateAuthToken();
    });

    it('should change password successfully', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('changed successfully');

      // Verify old password doesn't work
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(401);

      // Verify new password works
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        })
        .expect(200);
    });

    it('should not change password with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('incorrect');
    });

    it('should not change password with weak new password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'weak'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });
});
