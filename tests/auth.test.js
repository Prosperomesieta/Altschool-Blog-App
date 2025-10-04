const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Test database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogging_api_test';

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  const validUser = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should not register user with existing email', async () => {
      await User.create(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User with this email already exists');
    });

    it('should not register user with invalid email', async () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should not register user with short password', async () => {
      const invalidUser = { ...validUser, password: '123' };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should not register user with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
          // Missing first_name and last_name
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create(validUser);
    });

    it('should login user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Login successful');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should not login user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: validUser.password
        })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should not login user with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should not login user with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email
          // Missing password
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const user = await User.create(validUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      token = loginRes.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.first_name).toBe(validUser.first_name);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Access token is required');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401); 

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid token');
    });
  });

  describe('PATCH /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      await User.create(validUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      token = loginRes.body.token;
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith'
      };

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.data.user.first_name).toBe(updateData.first_name);
      expect(res.body.data.user.last_name).toBe(updateData.last_name);
    });

    it('should not update profile with password', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'Jane',
          password: 'newpassword'
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Password updates not allowed through this endpoint');
    });
  });
});