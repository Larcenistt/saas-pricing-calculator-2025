import { AuthService } from '../../../src/services/auth.service';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('argon2');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  
  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    authService = new AuthService(prisma as any);
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'SecurePass123',
        name: 'New User',
        company: 'Test Corp',
      };

      const hashedPassword = 'hashed-password';
      const newUser = {
        id: 'new-user-id',
        email: userData.email,
        name: userData.name,
        company: userData.company,
        passwordHash: hashedPassword,
        role: 'USER',
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(userData.email);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          passwordHash: hashedPassword,
        }),
      });
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123',
        name: 'User',
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: userData.email,
      } as any);

      await expect(authService.register(userData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'User',
      };

      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should authenticate user with correct credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'CorrectPassword123',
      };

      const user = {
        id: 'user-id',
        email: loginData.email,
        passwordHash: 'hashed-password',
        emailVerified: true,
        isActive: true,
        lastLogin: null,
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      prisma.user.update.mockResolvedValue(user as any);

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(argon2.verify).toHaveBeenCalledWith(
        user.passwordHash,
        loginData.password
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      const user = {
        id: 'user-id',
        email: loginData.email,
        passwordHash: 'hashed-password',
        emailVerified: true,
        isActive: true,
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should reject unverified email', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'CorrectPassword',
      };

      const user = {
        id: 'user-id',
        email: loginData.email,
        passwordHash: 'hashed-password',
        emailVerified: false,
        isActive: true,
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Please verify your email'
      );
    });

    it('should reject inactive account', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'CorrectPassword',
      };

      const user = {
        id: 'user-id',
        email: loginData.email,
        passwordHash: 'hashed-password',
        emailVerified: true,
        isActive: false,
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(loginData)).rejects.toThrow(
        'Account is deactivated'
      );
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const decoded = {
        userId: 'user-id',
        type: 'refresh',
      };

      const user = {
        id: 'user-id',
        email: 'user@example.com',
        role: 'USER',
      };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 86400000),
      } as any);
      prisma.user.findUnique.mockResolvedValue(user as any);
      (jwt.sign as jest.Mock).mockReturnValue('new-token');

      const result = await authService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwt.verify).toHaveBeenCalledWith(
        refreshToken,
        expect.any(String)
      );
    });

    it('should reject expired refresh token', async () => {
      const refreshToken = 'expired-token';
      const decoded = {
        userId: 'user-id',
        type: 'refresh',
      };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: refreshToken,
        userId: 'user-id',
        expiresAt: new Date(Date.now() - 86400000), // Expired
      } as any);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Refresh token expired'
      );
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const email = 'user@example.com';
      const user = {
        id: 'user-id',
        email,
        name: 'User',
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue(user as any);

      const result = await authService.forgotPassword(email);

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email },
        data: {
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        },
      });
    });

    it('should not reveal if email does not exist', async () => {
      const email = 'nonexistent@example.com';
      
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.forgotPassword(email);

      expect(result).toBe(true); // Returns true to not reveal user existence
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewSecurePass123';
      const hashedPassword = 'new-hashed-password';

      const user = {
        id: 'user-id',
        email: 'user@example.com',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000), // Valid for 1 hour
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.update.mockResolvedValue(user as any);

      const result = await authService.resetPassword(token, newPassword);

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    });

    it('should reject expired reset token', async () => {
      const token = 'expired-reset-token';
      const newPassword = 'NewSecurePass123';

      const user = {
        id: 'user-id',
        email: 'user@example.com',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() - 3600000), // Expired
      };

      prisma.user.findUnique.mockResolvedValue(user as any);

      await expect(
        authService.resetPassword(token, newPassword)
      ).rejects.toThrow('Reset token has expired');
    });

    it('should reject invalid reset token', async () => {
      const token = 'invalid-token';
      const newPassword = 'NewSecurePass123';

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword(token, newPassword)
      ).rejects.toThrow('Invalid reset token');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const token = 'valid-verify-token';
      const user = {
        id: 'user-id',
        email: 'user@example.com',
        emailVerifyToken: token,
        emailVerified: false,
      };

      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue({
        ...user,
        emailVerified: true,
        emailVerifyToken: null,
      } as any);

      const result = await authService.verifyEmail(token);

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifyToken: null,
        },
      });
    });

    it('should reject invalid verification token', async () => {
      const token = 'invalid-token';

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.verifyEmail(token)).rejects.toThrow(
        'Invalid verification token'
      );
    });
  });
});