import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { securityService } from '../services/security.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const trackEventSchema = Joi.object({
  eventType: Joi.string().max(100).required(),
  eventData: Joi.object().optional(),
  sessionId: Joi.string().max(255).optional(),
  metadata: Joi.object().optional()
});

const queryParamsSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

/**
 * @route POST /api/v1/analytics/track
 * @desc Track custom analytics event
 * @access Private
 */
router.post('/track',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    validateInput: trackEventSchema
  }),
  async (req: Request, res: Response) => {
    try {
      const { eventType, eventData, sessionId, metadata } = req.body;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      await analyticsService.trackEvent({
        userId: req.user.id,
        eventType,
        eventData,
        sessionId,
        ipAddress,
        userAgent,
        metadata
      });

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });

    } catch (error: any) {
      logger.error('Event tracking failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to track event'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/user
 * @desc Get user analytics for current user
 * @access Private
 */
router.get('/user',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      
      const validation = queryParamsSchema.validate({ days });
      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.details
        });
      }

      const analytics = await analyticsService.getUserAnalytics(req.user.id, Number(days));
      
      res.json({
        success: true,
        data: analytics
      });

    } catch (error: any) {
      logger.error('User analytics retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user analytics'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/user/:userId
 * @desc Get user analytics for specific user (admin only)
 * @access Private (Admin)
 */
router.get('/user/:userId',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    permissions: ['admin']
  }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;
      
      const validation = queryParamsSchema.validate({ days });
      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.details
        });
      }

      const analytics = await analyticsService.getUserAnalytics(userId, Number(days));
      
      res.json({
        success: true,
        data: analytics
      });

    } catch (error: any) {
      logger.error('User analytics retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user analytics'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/system
 * @desc Get system-wide analytics metrics (admin only)
 * @access Private (Admin)
 */
router.get('/system',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    permissions: ['admin']
  }),
  async (req: Request, res: Response) => {
    try {
      const systemMetrics = await analyticsService.getSystemMetrics();
      
      res.json({
        success: true,
        data: systemMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('System metrics retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system metrics'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/revenue
 * @desc Get revenue analytics (admin only)
 * @access Private (Admin)
 */
router.get('/revenue',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    permissions: ['admin']
  }),
  async (req: Request, res: Response) => {
    try {
      const revenueAnalytics = await analyticsService.getRevenueAnalytics();
      
      res.json({
        success: true,
        data: revenueAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Revenue analytics retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve revenue analytics'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/features
 * @desc Get feature usage analytics
 * @access Private (Professional/Enterprise plans)
 */
router.get('/features',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    permissions: ['analytics']
  }),
  async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      
      const validation = queryParamsSchema.validate({ days });
      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.details
        });
      }

      const featureUsage = await analyticsService.getFeatureUsage(Number(days));
      
      // Calculate percentages
      const totalUsage = Object.values(featureUsage).reduce((sum, count) => sum + count, 0);
      const featurePercentages = Object.entries(featureUsage).map(([feature, count]) => ({
        feature,
        count,
        percentage: totalUsage > 0 ? Math.round((count / totalUsage) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        data: {
          usage: featureUsage,
          breakdown: featurePercentages,
          totalEvents: totalUsage,
          period: {
            days: Number(days),
            startDate: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });

    } catch (error: any) {
      logger.error('Feature usage analytics retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve feature usage analytics'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/funnel
 * @desc Get conversion funnel analytics (admin only)
 * @access Private (Admin)
 */
router.get('/funnel',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    permissions: ['admin']
  }),
  async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      
      const validation = queryParamsSchema.validate({ days });
      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.details
        });
      }

      const funnelData = await analyticsService.getConversionFunnel(Number(days));
      
      res.json({
        success: true,
        data: {
          ...funnelData,
          period: {
            days: Number(days),
            startDate: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        }
      });

    } catch (error: any) {
      logger.error('Conversion funnel retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversion funnel data'
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/dashboard
 * @desc Get dashboard analytics summary
 * @access Private
 */
router.get('/dashboard',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const userAnalytics = await analyticsService.getUserAnalytics(req.user.id);
      
      // Get system metrics if user is admin
      let systemMetrics = null;
      if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
        systemMetrics = await analyticsService.getSystemMetrics();
      }

      const dashboardData = {
        user: {
          totalCalculations: userAnalytics.totalCalculations,
          totalAiRequests: userAnalytics.totalAiRequests,
          totalCollaborations: userAnalytics.totalCollaborations,
          engagementScore: userAnalytics.engagementScore,
          mostUsedFeatures: userAnalytics.mostUsedFeatures,
          lastActivityAt: userAnalytics.lastActivityAt
        },
        system: systemMetrics ? {
          totalUsers: systemMetrics.totalUsers,
          activeUsers24h: systemMetrics.activeUsers24h,
          totalCalculations: systemMetrics.totalCalculations,
          calculations24h: systemMetrics.calculations24h,
          averageResponseTime: systemMetrics.averageResponseTime,
          errorRate: systemMetrics.errorRate
        } : null
      };
      
      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Dashboard analytics retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard analytics'
      });
    }
  }
);

/**
 * @route POST /api/v1/analytics/activity
 * @desc Track user activity (convenience endpoint)
 * @access Private
 */
router.post('/activity',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { activity, metadata = {} } = req.body;
      
      if (!activity || typeof activity !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Activity parameter is required'
        });
      }

      await analyticsService.trackUserActivity(req.user.id, activity, {
        ...metadata,
        timestamp: Date.now(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
      
      res.json({
        success: true,
        message: 'User activity tracked successfully'
      });

    } catch (error: any) {
      logger.error('User activity tracking failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to track user activity'
      });
    }
  }
);

export default router;