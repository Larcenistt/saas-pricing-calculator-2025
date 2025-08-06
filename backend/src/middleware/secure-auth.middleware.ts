import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { AppError } from '../utils/errors';
import { jwtConfig } from '../config/secrets';
import crypto from 'crypto';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

// Extended request interface
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  sessionId?: string;
}

// Token blacklist check
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklisted = await redis.get(`blacklist:${token}`);
  return blacklisted !== null;
};

// Session validation
const validateSession = async (sessionId: string, userId: string): Promise<boolean> => {
  const session = await redis.get(`session:${sessionId}`);
  if (!session) return false;
  
  const sessionData = JSON.parse(session);
  return sessionData.userId === userId;
};

// Rate limit check for authentication attempts
// Not currently used but available for future implementation
// const checkAuthRateLimit = async (identifier: string): Promise<void> => {
//   const key = `auth_attempts:${identifier}`;
//   const attempts = await redis.incr(key);
//   
//   if (attempts === 1) {
//     await redis.expire(key, 900); // 15 minutes
//   }
//   
//   if (attempts > 5) {
//     const ttl = await redis.ttl(key);
//     throw new AppError(
//       `Too many authentication attempts. Try again in ${Math.ceil(ttl / 60)} minutes`,
//       429
//     );
//   }
// };

// Clear rate limit on successful auth
const clearAuthRateLimit = async (identifier: string): Promise<void> => {
  await redis.del(`auth_attempts:${identifier}`);
};

// Main authentication middleware
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401);
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw error;
    }

    // Validate token type
    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', 401);
    }

    // Validate session if present
    if (decoded.sessionId) {
      const isValidSession = await validateSession(decoded.sessionId, decoded.userId);
      if (!isValidSession) {
        throw new AppError('Invalid or expired session', 401);
      }
    }

    // Get user from database
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

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    if (!user.emailVerified) {
      throw new AppError('Please verify your email address', 403);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    req.sessionId = decoded.sessionId;

    // Clear rate limit on successful authentication
    await clearAuthRateLimit(user.email);

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Resource ownership validation
export const validateOwnership = (resourceField: string = 'userId') => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      return next(new AppError('Resource ID required', 400));
    }

    // Admin can access any resource
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check ownership based on resource type
    const resource = await getResource(req.path, resourceId);
    if (!resource) {
      return next(new AppError('Resource not found', 404));
    }

    if (resource[resourceField] !== req.user.id) {
      return next(new AppError('Access denied', 403));
    }

    next();
  };
};

// Helper to get resource based on path
async function getResource(path: string, id: string): Promise<any> {
  if (path.includes('/calculations')) {
    return prisma.calculation.findUnique({ where: { id } });
  }
  if (path.includes('/teams')) {
    return prisma.team.findUnique({ where: { id } });
  }
  // Add more resource types as needed
  return null;
}

// Logout with token blacklisting
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.accessToken;

    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (accessToken) {
      // Decode to get expiry
      const decoded = jwt.decode(accessToken) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          // Blacklist the access token
          await redis.setex(`blacklist:${accessToken}`, ttl, '1');
        }
      }
    }

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Clear session if exists
    if (req.sessionId) {
      await redis.del(`session:${req.sessionId}`);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Session management
export const createSession = async (userId: string, metadata: any = {}): Promise<string> => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId,
    createdAt: new Date().toISOString(),
    ...metadata,
  };
  
  // Store session with 24 hour expiry
  await redis.setex(
    `session:${sessionId}`,
    86400,
    JSON.stringify(sessionData)
  );
  
  return sessionId;
};

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self)'
  );
  
  next();
};

// CSRF protection
export const csrfProtection = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  // Session-based CSRF validation disabled for now
  // Will need to implement session middleware first
  // const sessionCsrf = (req as any).session?.csrfToken;
  // if (!csrfToken || csrfToken !== sessionCsrf) {
  //   return next(new AppError('Invalid CSRF token', 403));
  // }
  
  // For now, just check if token exists
  if (!csrfToken) {
    return next(new AppError('CSRF token required', 403));
  }

  next();
};