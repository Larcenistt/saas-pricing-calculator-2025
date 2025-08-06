import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { generateTestUser, clearDatabase } from '../helpers/test-helpers';

describe('Auth Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let authToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await createApp();
    prisma = new PrismaClient();
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        company: 'Test Corp',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('email');
    });

    it('should enforce password requirements', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'weak',
        name: 'User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('password');
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'User',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toContain('already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user for login tests
      await generateTestUser(prisma, {
        email: 'testuser@example.com',
        password: 'TestPass123!',
        emailVerified: true,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPass123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should reject unverified email', async () => {
      await generateTestUser(prisma, {
        email: 'unverified@example.com',
        password: 'TestPass123!',
        emailVerified: false,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'TestPass123!',
        })
        .expect(403);

      expect(response.body.error).toContain('verify');
    });

    it('should update last login timestamp', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPass123!',
        })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: 'testuser@example.com' },
      });

      expect(user?.lastLogin).toBeTruthy();
      expect(new Date(user!.lastLogin!).getTime()).toBeCloseTo(
        Date.now(),
        -3
      );
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      const user = await generateTestUser(prisma, {
        email: 'refresh@example.com',
        password: 'TestPass123!',
        emailVerified: true,
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'TestPass123!',
        });

      authToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.accessToken).not.toBe(authToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    it('should reject expired refresh token', async () => {
      // Manually expire the token in database
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { expiresAt: new Date(Date.now() - 86400000) },
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toContain('expired');
    });

    it('should invalidate old refresh token after use', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Try to use the same refresh token again
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      const user = await generateTestUser(prisma, {
        email: 'logout@example.com',
        password: 'TestPass123!',
        emailVerified: true,
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'TestPass123!',
        });

      authToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should invalidate refresh token after logout', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to use refresh token after logout
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken: string;

    beforeEach(async () => {
      await generateTestUser(prisma, {
        email: 'reset@example.com',
        password: 'OldPass123!',
        emailVerified: true,
      });
    });

    it('should initiate password reset', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Check that reset token was saved
      const user = await prisma.user.findUnique({
        where: { email: 'reset@example.com' },
      });
      expect(user?.resetToken).toBeTruthy();
      resetToken = user!.resetToken!;
    });

    it('should reset password with valid token', async () => {
      // First, request reset
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      const user = await prisma.user.findUnique({
        where: { email: 'reset@example.com' },
      });
      resetToken = user!.resetToken!;

      // Then reset password
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ password: 'NewPass123!' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reset@example.com',
          password: 'NewPass123!',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });

    it('should not allow password reset with expired token', async () => {
      // Request reset and manually expire token
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      const user = await prisma.user.findUnique({
        where: { email: 'reset@example.com' },
      });
      resetToken = user!.resetToken!;

      await prisma.user.update({
        where: { email: 'reset@example.com' },
        data: { resetTokenExpiry: new Date(Date.now() - 3600000) },
      });

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ password: 'NewPass123!' })
        .expect(400);

      expect(response.body.error).toContain('expired');
    });
  });

  describe('Email Verification', () => {
    let verifyToken: string;

    beforeEach(async () => {
      const user = await generateTestUser(prisma, {
        email: 'verify@example.com',
        password: 'TestPass123!',
        emailVerified: false,
        emailVerifyToken: 'test-verify-token',
      });
      verifyToken = 'test-verify-token';
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${verifyToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const user = await prisma.user.findUnique({
        where: { email: 'verify@example.com' },
      });
      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerifyToken).toBeNull();
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email/invalid-token')
        .expect(400);

      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('Authentication Middleware', () => {
    beforeEach(async () => {
      const user = await generateTestUser(prisma, {
        email: 'auth@example.com',
        password: 'TestPass123!',
        emailVerified: true,
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'TestPass123!',
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/v1/user/profile')
        .expect(401);

      expect(response.body.error).toContain('No token provided');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject expired token', async () => {
      // Generate an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'test-id', type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toContain('expired');
    });
  });
});