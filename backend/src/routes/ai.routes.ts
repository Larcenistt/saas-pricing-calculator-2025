import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { securityService, validationSchemas } from '../services/security.service';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const generateInsightsSchema = Joi.object({
  calculationId: Joi.string().uuid().required(),
  analysisType: Joi.string().valid('pricing', 'competitive', 'market', 'comprehensive').required(),
  context: Joi.object({
    industry: Joi.string().max(100).optional(),
    competitors: Joi.array().items(Joi.string().max(100)).max(10).optional(),
    businessStage: Joi.string().valid('startup', 'growth', 'scale', 'enterprise').optional(),
    targetMarket: Joi.string().max(100).optional()
  }).optional()
});

const batchAnalysisSchema = Joi.object({
  calculationIds: Joi.array().items(Joi.string().uuid()).min(1).max(5).required(),
  analysisTypes: Joi.array().items(Joi.string().valid('pricing', 'competitive', 'market', 'comprehensive')).min(1).required(),
  context: Joi.object({
    industry: Joi.string().max(100).optional(),
    competitors: Joi.array().items(Joi.string().max(100)).max(10).optional(),
    businessStage: Joi.string().valid('startup', 'growth', 'scale', 'enterprise').optional(),
    targetMarket: Joi.string().max(100).optional()
  }).optional()
});

/**
 * @route POST /api/v1/ai/insights
 * @desc Generate AI insights for a calculation
 * @access Private (Professional/Enterprise plans)
 */
router.post('/insights',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'ai',
    validateInput: generateInsightsSchema,
    permissions: ['ai']
  }),
  async (req: Request, res: Response) => {
    try {
      const { calculationId, analysisType, context } = req.body;
      
      logger.info(`Generating AI insights for calculation ${calculationId} (type: ${analysisType})`);
      
      const insights = await aiService.generateInsights(calculationId, analysisType, context);
      
      res.json({
        success: true,
        data: {
          insights,
          calculationId,
          analysisType,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('AI insights generation failed:', error);
      
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to generate AI insights',
        code: error.code || 'AI_GENERATION_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/v1/ai/batch-analysis
 * @desc Generate AI insights for multiple calculations
 * @access Private (Enterprise plan only)
 */
router.post('/batch-analysis',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'ai',
    validateInput: batchAnalysisSchema,
    permissions: ['ai', 'batch-analysis']
  }),
  async (req: Request, res: Response) => {
    try {
      const { calculationIds, analysisTypes, context } = req.body;
      
      // Check if user has enterprise plan for batch analysis
      if (req.user.subscription?.plan !== 'ENTERPRISE') {
        return res.status(403).json({
          success: false,
          error: 'Batch analysis requires Enterprise plan',
          code: 'PLAN_UPGRADE_REQUIRED'
        });
      }
      
      const results = [];
      
      for (const calculationId of calculationIds) {
        for (const analysisType of analysisTypes) {
          try {
            const insights = await aiService.generateInsights(calculationId, analysisType, context);
            results.push({
              calculationId,
              analysisType,
              insights,
              success: true
            });
          } catch (error: any) {
            results.push({
              calculationId,
              analysisType,
              success: false,
              error: error.message
            });
          }
        }
      }
      
      res.json({
        success: true,
        data: {
          results,
          processed: results.length,
          successful: results.filter(r => r.success).length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Batch AI analysis failed:', error);
      
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Batch analysis failed',
        code: error.code || 'BATCH_ANALYSIS_ERROR'
      });
    }
  }
);

/**
 * @route GET /api/v1/ai/usage
 * @desc Get AI usage statistics for the current user
 * @access Private
 */
router.get('/usage',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const monthlyUsage = await aiService.getMonthlyUsage(req.user.id);
      
      // Get budget limit based on subscription
      const budgetLimits = {
        FREE: 0,
        STARTER: 10,
        PROFESSIONAL: 50,
        ENTERPRISE: 200
      };
      
      const plan = req.user.subscription?.plan || 'FREE';
      const budgetLimit = budgetLimits[plan as keyof typeof budgetLimits];
      
      const usagePercentage = budgetLimit > 0 ? (monthlyUsage.totalCost / budgetLimit) * 100 : 0;
      
      res.json({
        success: true,
        data: {
          currentMonth: {
            totalCost: monthlyUsage.totalCost,
            requestCount: monthlyUsage.requestCount,
            budgetLimit,
            usagePercentage: Math.round(usagePercentage * 100) / 100,
            remainingBudget: Math.max(0, budgetLimit - monthlyUsage.totalCost)
          },
          plan,
          upgradeRequired: plan === 'FREE' && monthlyUsage.requestCount > 0
        }
      });

    } catch (error: any) {
      logger.error('AI usage retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI usage statistics'
      });
    }
  }
);

/**
 * @route GET /api/v1/ai/insights/:calculationId
 * @desc Get cached AI insights for a calculation
 * @access Private
 */
router.get('/insights/:calculationId',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { calculationId } = req.params;
      const { type } = req.query;
      
      if (type && typeof type === 'string') {
        // Get specific insight type
        const cached = await cacheService.getCachedAIResponse(calculationId, type);
        if (cached) {
          return res.json({
            success: true,
            data: cached,
            cached: true
          });
        }
      }
      
      // Get all insights for the calculation from database
      const insights = await aiService.prisma.aiInsight.findMany({
        where: { calculationId },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      
      const groupedInsights = insights.reduce((acc: any, insight: any) => {
        if (!acc[insight.insightType]) {
          acc[insight.insightType] = [];
        }
        
        acc[insight.insightType].push({
          id: insight.id,
          response: JSON.parse(insight.response),
          confidence: insight.confidence,
          tokensUsed: insight.tokensUsed,
          cost: insight.cost,
          createdAt: insight.createdAt
        });
        
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: groupedInsights,
        cached: false
      });

    } catch (error: any) {
      logger.error('AI insights retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI insights'
      });
    }
  }
);

/**
 * @route DELETE /api/v1/ai/cache
 * @desc Clear AI cache for user (admin only)
 * @access Private (Admin)
 */
router.delete('/cache',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    permissions: ['admin']
  }),
  async (req: Request, res: Response) => {
    try {
      const { userId, calculationId, all } = req.query;
      
      if (all === 'true') {
        await cacheService.clear('ai');
        logger.info(`Admin ${req.user.id} cleared all AI cache`);
      } else if (userId) {
        await cacheService.invalidate(`ai:*:user:${userId}`, { byTags: true });
        logger.info(`Admin ${req.user.id} cleared AI cache for user ${userId}`);
      } else if (calculationId) {
        await cacheService.invalidate(`ai:${calculationId}:*`);
        logger.info(`Admin ${req.user.id} cleared AI cache for calculation ${calculationId}`);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Specify userId, calculationId, or all=true'
        });
      }
      
      res.json({
        success: true,
        message: 'AI cache cleared successfully'
      });

    } catch (error: any) {
      logger.error('AI cache clearing failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to clear AI cache'
      });
    }
  }
);

export default router;