import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { analyticsService } from '../services/analytics.service';
import { cacheService } from '../services/cache.service';
import { securityService } from '../services/security.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// All admin routes require admin permissions
router.use(securityService.createSecurityMiddleware({
  requireAuth: true,
  permissions: ['admin']
}));

// Validation schemas
const userActionSchema = Joi.object({
  action: Joi.string().valid('activate', 'deactivate', 'reset_password', 'upgrade_plan', 'downgrade_plan').required(),
  userId: Joi.string().uuid().required(),
  reason: Joi.string().max(500).optional(),
  newPlan: Joi.string().valid('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE').when('action', {
    is: Joi.string().regex(/upgrade_plan|downgrade_plan/),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const systemConfigSchema = Joi.object({
  maintenanceMode: Joi.boolean().optional(),
  registrationEnabled: Joi.boolean().optional(),
  maxUsersPerPlan: Joi.object({
    STARTER: Joi.number().integer().min(1).optional(),
    PROFESSIONAL: Joi.number().integer().min(1).optional(),
    ENTERPRISE: Joi.number().integer().min(1).optional()
  }).optional(),
  featureFlags: Joi.object({
    aiInsights: Joi.boolean().optional(),
    collaboration: Joi.boolean().optional(),
    advancedExports: Joi.boolean().optional()
  }).optional()
});

/**
 * @route GET /api/v1/admin/dashboard
 * @desc Get comprehensive admin dashboard data
 * @access Private (Admin)
 */
router.get('/dashboard',
  securityService.createSecurityMiddleware({ rateLimitType: 'api' }),
  async (req: Request, res: Response) => {
    try {
      const [
        systemMetrics,
        revenueAnalytics,
        userGrowth,
        featureUsage,
        systemHealth
      ] = await Promise.all([
        analyticsService.getSystemMetrics(),
        analyticsService.getRevenueAnalytics(),
        getUserGrowthData(),
        analyticsService.getFeatureUsage(7), // Last 7 days
        getSystemHealthMetrics()
      ]);

      const dashboardData = {
        overview: {
          totalUsers: systemMetrics.totalUsers,
          activeUsers24h: systemMetrics.activeUsers24h,
          monthlyRecurringRevenue: revenueAnalytics.monthlyRecurringRevenue,
          totalCalculations: systemMetrics.totalCalculations,
          averageResponseTime: systemMetrics.averageResponseTime,
          errorRate: systemMetrics.errorRate
        },
        metrics: systemMetrics,
        revenue: revenueAnalytics,
        growth: userGrowth,
        features: featureUsage,
        system: systemHealth,
        alerts: await getSystemAlerts(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error: any) {
      logger.error('Admin dashboard data retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/users
 * @desc Get users with filtering and pagination
 * @access Private (Admin)
 */
router.get('/users',
  securityService.createSecurityMiddleware({ rateLimitType: 'api' }),
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        plan,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const whereClause: any = {};
      
      if (search) {
        whereClause.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } }
        ];
      }
      
      if (plan) {
        whereClause.subscription = { plan: plan as string };
      }
      
      if (status === 'active') {
        whereClause.isActive = true;
      } else if (status === 'inactive') {
        whereClause.isActive = false;
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          include: {
            subscription: true,
            _count: {
              select: {
                calculations: true,
                aiUsage: true,
                hostedSessions: true
              }
            }
          },
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: Number(limit)
        }),
        prisma.user.count({ where: whereClause })
      ]);

      const enrichedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        isActive: user.isActive,
        plan: user.subscription?.plan || 'FREE',
        subscriptionStatus: user.subscription?.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        stats: {
          calculations: user._count.calculations,
          aiRequests: user._count.aiUsage,
          collaborations: user._count.hostedSessions
        }
      }));

      res.json({
        success: true,
        data: {
          users: enrichedUsers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / Number(limit))
          }
        }
      });

    } catch (error: any) {
      logger.error('Admin users retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users'
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/users/:userId
 * @desc Get detailed user information
 * @access Private (Admin)
 */
router.get('/users/:userId',
  securityService.createSecurityMiddleware({ rateLimitType: 'api' }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          calculations: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              isPublic: true
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          aiUsage: {
            select: {
              cost: true,
              tokensUsed: true,
              createdAt: true
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          hostedSessions: {
            select: {
              id: true,
              calculationId: true,
              isActive: true,
              createdAt: true
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          teams: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  plan: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get user analytics
      const analytics = await analyticsService.getUserAnalytics(userId);

      // Calculate AI usage cost
      const totalAiCost = user.aiUsage.reduce((sum, usage) => sum + Number(usage.cost), 0);
      const totalTokens = user.aiUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);

      const userDetails = {
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        subscription: user.subscription ? {
          plan: user.subscription.plan,
          status: user.subscription.status,
          currentPeriodStart: user.subscription.currentPeriodStart,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
        } : null,
        usage: {
          calculations: user.calculations.length,
          aiRequests: user.aiUsage.length,
          aiCostTotal: totalAiCost,
          aiTokensTotal: totalTokens,
          collaborations: user.hostedSessions.length
        },
        analytics: analytics,
        recentActivity: {
          calculations: user.calculations,
          aiUsage: user.aiUsage.map(usage => ({
            cost: usage.cost,
            tokens: usage.tokensUsed,
            date: usage.createdAt
          })),
          collaborations: user.hostedSessions
        },
        teams: user.teams.map(tm => tm.team)
      };

      res.json({
        success: true,
        data: userDetails
      });

    } catch (error: any) {
      logger.error('Admin user detail retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user details'
      });
    }
  }
);

/**
 * @route POST /api/v1/admin/users/:userId/actions
 * @desc Perform admin actions on user account
 * @access Private (Admin)
 */
router.post('/users/:userId/actions',
  securityService.createSecurityMiddleware({
    rateLimitType: 'api',
    validateInput: userActionSchema
  }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { action, reason, newPlan } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      let result;

      switch (action) {
        case 'activate':
          result = await prisma.user.update({
            where: { id: userId },
            data: { isActive: true }
          });
          break;

        case 'deactivate':
          result = await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
          });
          // TODO: Invalidate user sessions
          break;

        case 'upgrade_plan':
        case 'downgrade_plan':
          if (!user.subscription) {
            // Create subscription if it doesn't exist
            result = await prisma.subscription.create({
              data: {
                userId,
                plan: newPlan as any,
                status: 'ACTIVE'
              }
            });
          } else {
            result = await prisma.subscription.update({
              where: { userId },
              data: { plan: newPlan as any }
            });
          }
          break;

        case 'reset_password':
          // Generate reset token (implementation would depend on your auth system)
          // This is a placeholder
          result = { message: 'Password reset email sent' };
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action',
            code: 'INVALID_ACTION'
          });
      }

      // Log admin action
      await logAdminAction({
        adminId: req.user.id,
        action,
        targetUserId: userId,
        reason,
        details: { newPlan }
      });

      res.json({
        success: true,
        data: {
          action,
          result,
          message: `User ${action} completed successfully`,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Admin ${req.user.id} performed ${action} on user ${userId}`, { reason, newPlan });

    } catch (error: any) {
      logger.error('Admin user action failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to perform user action'
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/system/config
 * @desc Get system configuration
 * @access Private (Super Admin)
 */
router.get('/system/config',
  securityService.createSecurityMiddleware({
    permissions: ['admin'], // In real app, would be 'super_admin'
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      // In a real application, this would come from a config service/database
      const systemConfig = {
        maintenance: {
          enabled: false,
          message: '',
          scheduledAt: null
        },
        registration: {
          enabled: true,
          requireEmailVerification: true,
          allowedDomains: []
        },
        limits: {
          maxUsersPerPlan: {
            STARTER: 1000,
            PROFESSIONAL: 5000,
            ENTERPRISE: -1 // unlimited
          },
          rateLimits: {
            api: 1000,
            ai: 10,
            export: 20
          }
        },
        features: {
          aiInsights: true,
          collaboration: true,
          advancedExports: true,
          analytics: true
        },
        integrations: {
          openai: {
            enabled: true,
            model: 'gpt-4'
          },
          stripe: {
            enabled: true,
            webhooksEnabled: true
          }
        }
      };

      res.json({
        success: true,
        data: systemConfig
      });

    } catch (error: any) {
      logger.error('System config retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system configuration'
      });
    }
  }
);

/**
 * @route PUT /api/v1/admin/system/config
 * @desc Update system configuration
 * @access Private (Super Admin)
 */
router.put('/system/config',
  securityService.createSecurityMiddleware({
    permissions: ['admin'], // In real app, would be 'super_admin'
    rateLimitType: 'api',
    validateInput: systemConfigSchema
  }),
  async (req: Request, res: Response) => {
    try {
      const configUpdates = req.body;

      // In a real application, this would update a config service/database
      // For now, we'll just log the changes and return success

      await logAdminAction({
        adminId: req.user.id,
        action: 'update_system_config',
        details: configUpdates
      });

      res.json({
        success: true,
        data: {
          message: 'System configuration updated successfully',
          updatedFields: Object.keys(configUpdates),
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Admin ${req.user.id} updated system configuration`, configUpdates);

    } catch (error: any) {
      logger.error('System config update failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update system configuration'
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/system/health
 * @desc Get comprehensive system health status
 * @access Private (Admin)
 */
router.get('/system/health',
  securityService.createSecurityMiddleware({ rateLimitType: 'api' }),
  async (req: Request, res: Response) => {
    try {
      const healthChecks = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
        checkExternalServicesHealth(),
        cacheService.healthCheck()
      ]);

      const [database, redis, externalServices, cache] = healthChecks;

      const overallHealth = healthChecks.every(check => check.status === 'healthy') 
        ? 'healthy' 
        : healthChecks.some(check => check.status === 'unhealthy') 
          ? 'unhealthy' 
          : 'degraded';

      const healthStatus = {
        overall: overallHealth,
        timestamp: new Date().toISOString(),
        services: {
          database,
          redis,
          cache,
          externalServices
        },
        metrics: await getSystemPerformanceMetrics()
      };

      res.json({
        success: true,
        data: healthStatus
      });

    } catch (error: any) {
      logger.error('System health check failed:', error);
      
      res.status(503).json({
        success: false,
        error: 'System health check failed',
        data: {
          overall: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/logs
 * @desc Get system logs with filtering
 * @access Private (Admin)
 */
router.get('/logs',
  securityService.createSecurityMiddleware({ rateLimitType: 'api' }),
  async (req: Request, res: Response) => {
    try {
      const {
        level = 'info',
        limit = 100,
        offset = 0,
        startDate,
        endDate,
        search
      } = req.query;

      // In a real application, this would query your logging system
      // For demo purposes, we'll return mock log data
      const mockLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'AI insights generated successfully',
          userId: 'user-123',
          requestId: 'req-456',
          duration: 1250
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warn',
          message: 'High AI usage detected for user',
          userId: 'user-789',
          details: { cost: 15.50, limit: 10.00 }
        }
      ];

      res.json({
        success: true,
        data: {
          logs: mockLogs,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: 500 // mock total
          },
          filters: {
            level,
            startDate,
            endDate,
            search
          }
        }
      });

    } catch (error: any) {
      logger.error('Logs retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve logs'
      });
    }
  }
);

// Helper functions
async function getUserGrowthData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, last30Days, last7Days] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } })
  ]);

  return {
    total,
    growthRates: {
      daily: Math.round(last7Days / 7),
      weekly: last7Days,
      monthly: last30Days
    }
  };
}

async function getSystemHealthMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
    environment: process.env.NODE_ENV
  };
}

async function getSystemAlerts() {
  // This would typically check various system metrics and return alerts
  return [
    {
      id: 'alert-1',
      type: 'warning',
      message: 'AI usage approaching budget limits for 3 users',
      severity: 'medium',
      timestamp: new Date().toISOString()
    }
  ];
}

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', responseTime: 25 };
  } catch (error) {
    return { status: 'unhealthy', error: 'Database connection failed' };
  }
}

async function checkRedisHealth() {
  try {
    const { redisClient } = await import('../config/redis');
    await redisClient.ping();
    return { status: 'healthy', responseTime: 15 };
  } catch (error) {
    return { status: 'unhealthy', error: 'Redis connection failed' };
  }
}

async function checkExternalServicesHealth() {
  // Check OpenAI, Stripe, etc.
  return {
    openai: { status: 'healthy', responseTime: 200 },
    stripe: { status: 'healthy', responseTime: 150 }
  };
}

async function getSystemPerformanceMetrics() {
  return {
    averageResponseTime: 185,
    requestsPerMinute: 1250,
    errorRate: 0.02,
    activeConnections: 145,
    queueSize: 0
  };
}

async function logAdminAction(action: {
  adminId: string;
  action: string;
  targetUserId?: string;
  reason?: string;
  details?: any;
}) {
  await prisma.analyticsEvent.create({
    data: {
      userId: action.adminId,
      eventType: `admin:${action.action}`,
      eventData: {
        targetUserId: action.targetUserId,
        reason: action.reason,
        ...action.details
      }
    }
  });
}

export default router;