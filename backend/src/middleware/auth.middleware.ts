import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Check if user session exists in Redis (for faster validation)
    const cachedSession = await redis.get(`session:${decoded.userId}`);
    
    if (cachedSession) {
      req.user = JSON.parse(cachedSession);
      return next();
    }
    
    // If not in cache, check database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });
    
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }
    
    if (!user.emailVerified) {
      throw new AppError('Email not verified', 403);
    }
    
    // Set user in request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    // Cache session for future requests
    await redis.setex(
      `session:${user.id}`,
      15 * 60, // 15 minutes
      JSON.stringify(req.user)
    );
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
    
    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.warn('Optional auth failed:', error);
    next();
  }
};