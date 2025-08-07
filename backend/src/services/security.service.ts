import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Joi from 'joi';
import { prisma } from '../server';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Security event types
type SecurityEventType = 
  | 'blocked_ip_attempt'
  | 'authentication_failure' 
  | 'rate_limit_exceeded'
  | 'suspicious_activity_detected'
  | 'invalid_input_detected'
  | 'unauthorized_access_attempt';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: any;
  timestamp: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors?: Array<{ field: string; message: string }>;
  sanitizedInput?: any;
}

interface AuthResult {
  success: boolean;
  user?: any;
  tokenData?: any;
  error?: string;
}

class SecurityService {
  private ipBlacklist: Set<string> = new Set();
  private suspiciousActivityThresholds = {
    failedLoginAttempts: 5,
    rapidApiRequests: 100,
    multipleIpAddresses: 5,
    aiRequestsPerHour: 50
  };

  // Rate limiting configurations by endpoint type
  private rateLimitConfigs: Record<string, RateLimitConfig> = {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 min
    api: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 1000 requests per 15 min
    ai: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
    collaboration: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
    export: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute
    upload: { windowMs: 60 * 1000, maxRequests: 10 } // 10 requests per minute
  };

  constructor() {
    this.initializeSecurityMonitoring();
    logger.info('Security service initialized');
  }

  /**
   * Enhanced JWT authentication with security checks
   */
  async authenticateRequest(token: string, ipAddress: string, userAgent: string): Promise<AuthResult> {
    try {
      // Check for blocked IPs
      if (this.ipBlacklist.has(ipAddress)) {
        await this.logSecurityEvent('blocked_ip_attempt', {
          ipAddress,
          userAgent,
          details: { reason: 'IP in blacklist' }
        });
        throw new AppError('Access denied', 'BLOCKED_IP', 403);
      }

      // Validate and decode JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        algorithms: ['HS256'],
        issuer: 'saas-pricing-calculator',
        audience: 'api-users'
      }) as any;

      // Check if token is blacklisted (for logout functionality)
      const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
      if (isBlacklisted) {
        throw new AppError('Token revoked', 'TOKEN_BLACKLISTED', 401);
      }

      // Validate user is still active
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { subscription: true }
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 'USER_INACTIVE', 401);
      }

      // Check for suspicious activity
      await this.checkSuspiciousActivity(decoded.sub, ipAddress, userAgent);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return {
        success: true,
        user,
        tokenData: decoded
      };

    } catch (error) {
      await this.logSecurityEvent('authentication_failure', {
        ipAddress,
        userAgent,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          token: token ? 'present' : 'missing'
        }
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Authentication failed', 'AUTH_FAILED', 401);
    }
  }

  /**
   * Comprehensive input validation and sanitization
   */
  validateInput(input: any, schema: Joi.ObjectSchema): ValidationResult {
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return {
        isValid: false,
        errors
      };
    }

    // Additional security checks
    const securityChecks = this.performSecurityChecks(value);
    if (!securityChecks.isValid) {
      return securityChecks;
    }

    return {
      isValid: true,
      sanitizedInput: value
    };
  }

  /**
   * Advanced rate limiting with different strategies
   */
  async checkRateLimit(
    identifier: string,
    type: keyof typeof this.rateLimitConfigs,
    req: Request
  ): Promise<{ allowed: boolean; limit: number; current: number; resetTime: number }> {
    const config = this.rateLimitConfigs[type];
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    const key = `ratelimit:${type}:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    try {
      const current = await redisClient.incr(windowKey);
      
      if (current === 1) {
        // First request in this window, set expiry
        await redisClient.expire(windowKey, Math.ceil(config.windowMs / 1000));
      }

      const allowed = current <= config.maxRequests;
      
      if (!allowed) {
        await this.logSecurityEvent('rate_limit_exceeded', {
          identifier,
          type,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          details: {
            current,
            limit: config.maxRequests,
            window: config.windowMs
          }
        });

        // Apply temporary restrictions for excessive violations
        if (current > config.maxRequests * 2) {
          await this.applyTemporaryRestrictions(identifier, req.ip);
        }
      }

      return {
        allowed,
        limit: config.maxRequests,
        current,
        resetTime: windowStart + config.windowMs
      };

    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Fail open - allow the request if Redis is down
      return {
        allowed: true,
        limit: config.maxRequests,
        current: 0,
        resetTime: now + config.windowMs
      };
    }
  }

  /**
   * Detect and handle suspicious activity patterns
   */
  private async checkSuspiciousActivity(userId: string, ipAddress: string, userAgent?: string): Promise<void> {
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    const windowStart = now - timeWindow;

    try {
      // Get recent security events for this user
      const recentEvents = await this.getRecentSecurityEvents(userId, windowStart);
      
      const suspiciousPatterns = [
        // Multiple failed login attempts
        {
          condition: recentEvents.filter(e => e.type === 'authentication_failure').length >= this.suspiciousActivityThresholds.failedLoginAttempts,
          severity: 'high' as const,
          reason: 'multiple_auth_failures'
        },
        // Rapid API requests
        {
          condition: recentEvents.filter(e => e.type === 'rate_limit_exceeded').length >= 5,
          severity: 'medium' as const,
          reason: 'excessive_api_usage'
        },
        // Multiple IP addresses
        {
          condition: new Set(recentEvents.map(e => e.ipAddress)).size >= this.suspiciousActivityThresholds.multipleIpAddresses,
          severity: 'medium' as const,
          reason: 'multiple_ip_addresses'
        },
        // Excessive AI usage
        {
          condition: await this.checkExcessiveAIUsage(userId, windowStart),
          severity: 'high' as const,
          reason: 'excessive_ai_usage'
        }
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.condition) {
          await this.handleSuspiciousActivity(userId, ipAddress, pattern, userAgent);
        }
      }

    } catch (error) {
      logger.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Handle detected suspicious activity
   */
  private async handleSuspiciousActivity(
    userId: string,
    ipAddress: string,
    pattern: { severity: 'low' | 'medium' | 'high'; reason: string },
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent('suspicious_activity_detected', {
      userId,
      ipAddress,
      userAgent,
      details: {
        pattern: pattern.reason,
        severity: pattern.severity
      }
    });

    switch (pattern.severity) {
      case 'high':
        // Temporary IP block (1 hour)
        this.ipBlacklist.add(ipAddress);
        setTimeout(() => this.ipBlacklist.delete(ipAddress), 60 * 60 * 1000);
        
        // Invalidate all user sessions
        await this.invalidateUserSessions(userId);
        
        // Send alert to security team
        await this.sendSecurityAlert({
          type: 'high_risk_activity',
          userId,
          ipAddress,
          reason: pattern.reason,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'medium':
        // Reduce rate limits temporarily
        await this.applyTemporaryRestrictions(userId, ipAddress);
        break;
        
      case 'low':
        // Just log for monitoring
        logger.warn(`Low-level suspicious activity detected for user ${userId}: ${pattern.reason}`);
        break;
    }
  }

  /**
   * Apply temporary security restrictions
   */
  private async applyTemporaryRestrictions(identifier: string, ipAddress?: string): Promise<void> {
    const restrictionKey = `restrictions:${identifier}`;
    const restrictionData = {
      appliedAt: Date.now(),
      reason: 'suspicious_activity',
      ipAddress
    };

    await redisClient.setex(restrictionKey, 3600, JSON.stringify(restrictionData)); // 1 hour
    logger.warn(`Temporary restrictions applied to ${identifier}`);
  }

  /**
   * Data encryption for sensitive information
   */
  encryptSensitiveData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag ? cipher.getAuthTag() : Buffer.alloc(0);
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  /**
   * Decrypt sensitive data
   */
  decryptSensitiveData(encryptedData: string): string {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    if (authTag) {
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    }
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Security middleware factory
   */
  createSecurityMiddleware(options: {
    rateLimitType?: keyof typeof this.rateLimitConfigs;
    requireAuth?: boolean;
    validateInput?: Joi.ObjectSchema;
    permissions?: string[];
  } = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || '';

        // Rate limiting
        if (options.rateLimitType) {
          const identifier = req.user?.id || ipAddress;
          const rateLimit = await this.checkRateLimit(identifier, options.rateLimitType, req);
          
          // Add rate limit headers
          res.set({
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, rateLimit.limit - rateLimit.current).toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          });

          if (!rateLimit.allowed) {
            return res.status(429).json({
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            });
          }
        }

        // Authentication
        if (options.requireAuth) {
          const authHeader = req.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
              error: 'Authentication required',
              code: 'AUTH_REQUIRED'
            });
          }

          const token = authHeader.substring(7);
          const authResult = await this.authenticateRequest(token, ipAddress, userAgent);
          
          if (!authResult.success) {
            return res.status(401).json({
              error: authResult.error || 'Authentication failed',
              code: 'AUTH_FAILED'
            });
          }

          req.user = authResult.user;
          req.tokenData = authResult.tokenData;
        }

        // Input validation
        if (options.validateInput) {
          const validation = this.validateInput(req.body, options.validateInput);
          if (!validation.isValid) {
            await this.logSecurityEvent('invalid_input_detected', {
              ipAddress,
              userAgent,
              userId: req.user?.id,
              details: {
                errors: validation.errors,
                endpoint: req.path
              }
            });

            return res.status(400).json({
              error: 'Invalid input',
              code: 'VALIDATION_ERROR',
              details: validation.errors
            });
          }

          req.body = validation.sanitizedInput;
        }

        // Permission checks
        if (options.permissions && req.user) {
          const hasPermission = await this.checkUserPermissions(req.user.id, options.permissions);
          if (!hasPermission) {
            await this.logSecurityEvent('unauthorized_access_attempt', {
              ipAddress,
              userAgent,
              userId: req.user.id,
              details: {
                requiredPermissions: options.permissions,
                endpoint: req.path
              }
            });

            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'PERMISSION_DENIED'
            });
          }
        }

        next();

      } catch (error) {
        logger.error('Security middleware error:', error);
        
        if (error instanceof AppError) {
          return res.status(error.statusCode || 500).json({
            error: error.message,
            code: error.code || 'SECURITY_ERROR'
          });
        }

        return res.status(500).json({
          error: 'Internal security error',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  }

  // Private helper methods

  private performSecurityChecks(input: any): ValidationResult {
    // Check for common injection patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi
    ];

    const inputStr = JSON.stringify(input);
    for (const pattern of dangerousPatterns) {
      if (pattern.test(inputStr)) {
        return {
          isValid: false,
          errors: [{ field: 'security', message: 'Potentially malicious input detected' }]
        };
      }
    }

    return { isValid: true };
  }

  private async checkExcessiveAIUsage(userId: string, windowStart: number): Promise<boolean> {
    try {
      const aiUsage = await prisma.aiUsage.count({
        where: {
          userId,
          createdAt: { gte: new Date(windowStart) }
        }
      });

      return aiUsage >= this.suspiciousActivityThresholds.aiRequestsPerHour;
    } catch {
      return false;
    }
  }

  private async getRecentSecurityEvents(userId: string, windowStart: number): Promise<SecurityEvent[]> {
    // This would typically query a security events table
    // For now, return empty array - implement based on your security logging needs
    return [];
  }

  private async checkUserPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        teams: {
          include: { team: true }
        }
      }
    });

    if (!user) return false;

    // Basic permission checking - implement based on your permission model
    const userPermissions = this.getUserPermissions(user);
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  private getUserPermissions(user: any): string[] {
    const permissions = ['read'];

    if (user.subscription?.plan !== 'FREE') {
      permissions.push('write', 'export');
    }

    if (['PROFESSIONAL', 'ENTERPRISE'].includes(user.subscription?.plan)) {
      permissions.push('ai', 'collaboration', 'analytics');
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      permissions.push('admin');
    }

    return permissions;
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    // Add all user's JTIs to blacklist
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    // In a real implementation, you'd also blacklist active JWTs
    logger.info(`All sessions invalidated for user ${userId}`);
  }

  private async logSecurityEvent(
    type: SecurityEventType,
    data: {
      userId?: string;
      ipAddress: string;
      userAgent?: string;
      details: any;
    }
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        type,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details,
        timestamp: Date.now()
      };

      // Store in Redis for immediate access
      const eventKey = `security:events:${Date.now()}-${Math.random()}`;
      await redisClient.setex(eventKey, 7 * 24 * 3600, JSON.stringify(event)); // 7 days

      // Store in database for long-term analysis
      await prisma.analyticsEvent.create({
        data: {
          userId: data.userId,
          eventType: `security:${type}`,
          eventData: event as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });

    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  private async sendSecurityAlert(alert: any): Promise<void> {
    // Implement your alerting mechanism (email, Slack, Discord, etc.)
    logger.error('SECURITY ALERT:', alert);
    
    // Example: Send to monitoring service
    // await notificationService.sendSecurityAlert(alert);
  }

  private initializeSecurityMonitoring(): void {
    // Clean up expired blacklist entries periodically
    setInterval(() => {
      // IP blacklist cleanup is handled by setTimeout in handleSuspiciousActivity
    }, 60 * 1000); // Every minute

    logger.info('Security monitoring initialized');
  }
}

// Validation schemas for common inputs
export const validationSchemas = {
  calculationInput: Joi.object({
    currentPrice: Joi.number().min(0).max(1000000).required(),
    customers: Joi.number().integer().min(1).max(1000000).required(),
    churnRate: Joi.number().min(0).max(100).required(),
    cac: Joi.number().min(0).max(100000).optional(),
    averageContractLength: Joi.number().min(1).max(120).optional(),
    expansionRevenue: Joi.number().min(0).max(1000).optional(),
    marketSize: Joi.number().min(0).max(1000000000).optional()
  }),

  userRegistration: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(128).required(),
    name: Joi.string().max(255).optional(),
    company: Joi.string().max(255).optional()
  }),

  teamInvitation: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('MEMBER', 'ADMIN', 'VIEWER').default('MEMBER')
  }),

  templateCreate: Joi.object({
    name: Joi.string().max(255).required(),
    industry: Joi.string().max(100).required(),
    description: Joi.string().max(1000).optional(),
    inputs: Joi.object().required(),
    benchmarks: Joi.object().optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
  })
};

export const securityService = new SecurityService();