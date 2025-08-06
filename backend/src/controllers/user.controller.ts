import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';
import { updateProfileSchema } from '../utils/validators';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
          subscription: true,
          _count: {
            select: {
              calculations: true,
              teams: true,
            },
          },
        },
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validatedData = updateProfileSchema.parse(req.body);
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          role: true,
        },
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        throw new AppError('Current and new passwords are required', 400);
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const isPasswordValid = await argon2.verify(user.passwordHash, currentPassword);
      
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }
      
      const newPasswordHash = await argon2.hash(newPassword);
      
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });
      
      // Invalidate all refresh tokens for security
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      
      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { password } = req.body;
      
      if (!password) {
        throw new AppError('Password is required to delete account', 400);
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const isPasswordValid = await argon2.verify(user.passwordHash, password);
      
      if (!isPasswordValid) {
        throw new AppError('Password is incorrect', 401);
      }
      
      // Soft delete - mark as inactive
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      
      logger.info(`Account deleted for user: ${user.email}`);
      
      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getApiKeys(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          lastUsed: true,
          usageCount: true,
          rateLimit: true,
          expiresAt: true,
          createdAt: true,
        },
      });
      
      res.json({
        success: true,
        data: apiKeys,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async createApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, rateLimit, expiresIn } = req.body;
      
      if (!name) {
        throw new AppError('API key name is required', 400);
      }
      
      // Generate API key
      const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
        : null;
      
      const created = await prisma.apiKey.create({
        data: {
          userId,
          name,
          keyHash,
          rateLimit: rateLimit || 1000,
          expiresAt,
        },
      });
      
      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: {
          id: created.id,
          name: created.name,
          apiKey, // Only returned once
          expiresAt: created.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const apiKey = await prisma.apiKey.findFirst({
        where: { id, userId },
      });
      
      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }
      
      await prisma.apiKey.update({
        where: { id },
        data: { isActive: false },
      });
      
      res.json({
        success: true,
        message: 'API key deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}