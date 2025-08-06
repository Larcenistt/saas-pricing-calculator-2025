import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

// Custom Redis store for rate limiting
class RedisStore {
  private prefix: string;
  private windowMs: number;

  constructor(windowMs: number) {
    this.prefix = 'rate_limit:';
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;
    const ttl = Math.ceil(this.windowMs / 1000);
    
    const multi = redis.multi();
    multi.incr(redisKey);
    multi.expire(redisKey, ttl);
    
    const results = await multi.exec();
    const totalHits = results?.[0]?.[1] as number || 1;
    
    const resetTime = new Date(Date.now() + this.windowMs);
    
    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await redis.decr(redisKey);
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await redis.del(redisKey);
  }
}

// Default rate limiter for general API endpoints
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000),
  skip: (req: Request) => {
    // Skip rate limiting for certain paths or authenticated admins
    if (req.path === '/health') return true;
    if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') return true;
    return false;
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(15 * 60 * 1000),
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: req.rateLimit?.resetTime,
      },
    });
  },
});

// API key rate limiter (higher limits for paid users)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: async (req: Request) => {
    // Get rate limit from API key configuration
    if (req.headers['x-api-key']) {
      const apiKey = req.headers['x-api-key'] as string;
      const limit = await redis.get(`api_key_limit:${apiKey}`);
      return limit ? parseInt(limit) : 100;
    }
    return 10; // Default for no API key
  },
  keyGenerator: (req: Request) => {
    // Use API key as the rate limit key if provided
    return req.headers['x-api-key'] as string || req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`API rate limit exceeded for key: ${req.headers['x-api-key'] || req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        message: 'API rate limit exceeded',
        code: 'API_RATE_LIMIT_EXCEEDED',
        retryAfter: req.rateLimit?.resetTime,
      },
    });
  },
});