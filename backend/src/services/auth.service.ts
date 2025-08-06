import { PrismaClient, User } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../utils/errors';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';

const prisma = new PrismaClient();
const emailService = new EmailService();

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  company?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRE || '15m',
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });
  }

  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const passwordHash = await argon2.hash(data.password);

    // Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        company: data.company,
        emailVerifyToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        createdAt: true,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailVerifyToken);

    // Log registration event
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: 'USER_REGISTERED',
        eventData: {
          email: user.email,
          company: user.company,
        },
      },
    });

    logger.info(`New user registered: ${user.email}`);

    return {
      user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, data.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Cache user session in Redis
    await redis.setex(
      `session:${user.id}`,
      15 * 60, // 15 minutes
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    );

    // Log login event
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: 'USER_LOGIN',
        eventData: {
          ip: data.ip || 'unknown',
          userAgent: data.userAgent || 'unknown',
        },
      },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(refreshToken: string) {
    try {
      // Delete refresh token from database
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      // Clear Redis session if exists
      const decoded = jwt.decode(refreshToken) as TokenPayload;
      if (decoded?.userId) {
        await redis.del(`session:${decoded.userId}`);
      }

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    logger.info(`Email verified for user: ${user.email}`);
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, reset instructions have been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset requested for: ${user.email}`);

    return { message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    logger.info(`Password reset successful for: ${user.email}`);
  }
}