import { Router, Request, Response } from 'express';
import { exportService } from '../services/export.service';
import { securityService, validationSchemas } from '../services/security.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const exportOptionsSchema = Joi.object({
  calculationId: Joi.string().uuid().required(),
  format: Joi.string().valid('pdf', 'excel', 'csv', 'json').required(),
  includeAIInsights: Joi.boolean().default(false),
  includeBenchmarks: Joi.boolean().default(false),
  includeCharts: Joi.boolean().default(false),
  template: Joi.string().valid('standard', 'professional', 'executive').default('standard'),
  branding: Joi.object({
    companyName: Joi.string().max(100).optional(),
    logo: Joi.string().uri().optional(),
    colors: Joi.object({
      primary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
    }).optional()
  }).optional()
});

const batchExportSchema = Joi.object({
  calculationIds: Joi.array().items(Joi.string().uuid()).min(1).max(10).required(),
  format: Joi.string().valid('pdf', 'excel', 'zip').required(),
  includeAIInsights: Joi.boolean().default(false),
  includeBenchmarks: Joi.boolean().default(false),
  includeCharts: Joi.boolean().default(false),
  template: Joi.string().valid('standard', 'professional', 'executive').default('standard')
});

/**
 * @route POST /api/v1/export/single
 * @desc Export single calculation in specified format
 * @access Private (Starter+ plans)
 */
router.post('/single',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'export',
    validateInput: exportOptionsSchema,
    permissions: ['export']
  }),
  async (req: Request, res: Response) => {
    try {
      const { calculationId, format, ...options } = req.body;
      
      let result: Buffer | string | object;
      let contentType: string;
      let filename: string;

      // Generate export based on format
      switch (format) {
        case 'pdf':
          result = await exportService.exportToPDF(calculationId, req.user.id, { format, ...options });
          contentType = 'application/pdf';
          filename = `calculation-${calculationId}.pdf`;
          break;

        case 'excel':
          result = await exportService.exportToExcel(calculationId, req.user.id, { format, ...options });
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `calculation-${calculationId}.xlsx`;
          break;

        case 'csv':
          result = await exportService.exportToCSV(calculationId, req.user.id, { format, ...options });
          contentType = 'text/csv';
          filename = `calculation-${calculationId}.csv`;
          break;

        case 'json':
          result = await exportService.exportToJSON(calculationId, req.user.id, { format, ...options });
          contentType = 'application/json';
          filename = `calculation-${calculationId}.json`;
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Unsupported export format',
            code: 'INVALID_FORMAT'
          });
      }

      // Set appropriate headers and send response
      if (format === 'json') {
        res.json({
          success: true,
          data: result,
          metadata: {
            calculationId,
            format,
            exportedAt: new Date().toISOString(),
            options: options
          }
        });
      } else {
        res.set({
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, no-cache',
          'X-Export-Format': format,
          'X-Calculation-Id': calculationId
        });

        if (Buffer.isBuffer(result)) {
          res.send(result);
        } else {
          res.send(result as string);
        }
      }

      logger.info(`Export completed: ${format} for calculation ${calculationId} by user ${req.user.id}`);

    } catch (error: any) {
      logger.error('Export failed:', error);
      
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Export failed',
        code: error.code || 'EXPORT_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/v1/export/batch
 * @desc Export multiple calculations (Professional+ plans)
 * @access Private (Professional+ plans)
 */
router.post('/batch',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'export',
    validateInput: batchExportSchema,
    permissions: ['export', 'batch-export']
  }),
  async (req: Request, res: Response) => {
    try {
      const { calculationIds, format, ...options } = req.body;
      
      // Check plan limitations
      if (req.user.subscription?.plan === 'STARTER' && calculationIds.length > 3) {
        return res.status(403).json({
          success: false,
          error: 'Starter plan limited to 3 calculations per batch export',
          code: 'PLAN_LIMITATION'
        });
      }

      const result = await exportService.batchExport(
        calculationIds, 
        req.user.id, 
        format as any, 
        { format, ...options }
      );

      const filename = `batch-export-${Date.now()}.${format === 'zip' ? 'zip' : format}`;
      const contentType = format === 'zip' ? 'application/zip' : 
                         format === 'pdf' ? 'application/pdf' : 
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
        'X-Export-Format': format,
        'X-Calculation-Count': calculationIds.length.toString()
      });

      res.send(result);

      logger.info(`Batch export completed: ${format} for ${calculationIds.length} calculations by user ${req.user.id}`);

    } catch (error: any) {
      logger.error('Batch export failed:', error);
      
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Batch export failed',
        code: error.code || 'BATCH_EXPORT_ERROR'
      });
    }
  }
);

/**
 * @route GET /api/v1/export/templates
 * @desc Get available export templates and options
 * @access Private
 */
router.get('/templates',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const templates = {
        standard: {
          name: 'Standard Report',
          description: 'Basic calculation export with inputs and results',
          features: ['Calculation details', 'Basic formatting'],
          availableFormats: ['pdf', 'excel', 'csv', 'json'],
          requiredPlan: 'STARTER'
        },
        professional: {
          name: 'Professional Report',
          description: 'Enhanced report with charts and benchmarks',
          features: ['Calculation details', 'Industry benchmarks', 'Professional formatting', 'Charts and graphs'],
          availableFormats: ['pdf', 'excel'],
          requiredPlan: 'PROFESSIONAL'
        },
        executive: {
          name: 'Executive Summary',
          description: 'High-level executive summary with key insights',
          features: ['Executive summary', 'Key metrics', 'AI insights', 'Custom branding'],
          availableFormats: ['pdf'],
          requiredPlan: 'ENTERPRISE'
        }
      };

      const userPlan = req.user.subscription?.plan || 'FREE';
      const planHierarchy = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
      const userPlanIndex = planHierarchy.indexOf(userPlan);

      // Filter templates based on user plan
      const availableTemplates = Object.entries(templates).reduce((acc: any, [key, template]) => {
        const requiredPlanIndex = planHierarchy.indexOf(template.requiredPlan);
        if (userPlanIndex >= requiredPlanIndex) {
          acc[key] = template;
        }
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          templates: availableTemplates,
          userPlan,
          exportLimits: {
            singleExports: userPlan === 'FREE' ? 0 : 50,
            batchExports: userPlan === 'STARTER' ? 3 : userPlan === 'PROFESSIONAL' ? 10 : 25,
            aiInsights: ['PROFESSIONAL', 'ENTERPRISE'].includes(userPlan),
            customBranding: userPlan === 'ENTERPRISE'
          }
        }
      });

    } catch (error: any) {
      logger.error('Failed to get export templates:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve export templates'
      });
    }
  }
);

/**
 * @route GET /api/v1/export/history
 * @desc Get user's export history
 * @access Private
 */
router.get('/history',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { limit = 20, offset = 0, format, days = 30 } = req.query;
      
      const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
      
      // Get export events from analytics
      const exportEvents = await req.prisma.analyticsEvent.findMany({
        where: {
          userId: req.user.id,
          eventType: { startsWith: 'user:export' },
          createdAt: { gte: startDate },
          ...(format && { eventData: { path: ['format'], equals: format } })
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        select: {
          id: true,
          eventType: true,
          eventData: true,
          createdAt: true
        }
      });

      const history = exportEvents.map(event => ({
        id: event.id,
        format: event.eventData?.format,
        calculationId: event.eventData?.calculationId,
        template: event.eventData?.template || 'standard',
        includeAI: event.eventData?.includeAI || false,
        exportedAt: event.createdAt,
        type: event.eventData?.count ? 'batch' : 'single',
        count: event.eventData?.count || 1
      }));

      // Get total count
      const total = await req.prisma.analyticsEvent.count({
        where: {
          userId: req.user.id,
          eventType: { startsWith: 'user:export' },
          createdAt: { gte: startDate }
        }
      });

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + history.length < total
          },
          summary: {
            totalExports: total,
            period: `${days} days`,
            formats: await this.getFormatBreakdown(req.user.id, startDate)
          }
        }
      });

    } catch (error: any) {
      logger.error('Failed to get export history:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve export history'
      });
    }
  }
);

/**
 * @route GET /api/v1/export/usage
 * @desc Get export usage statistics
 * @access Private
 */
router.get('/usage',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

      const usage = await req.prisma.analyticsEvent.groupBy({
        by: ['eventData'],
        where: {
          userId: req.user.id,
          eventType: { startsWith: 'user:export' },
          createdAt: { gte: startDate }
        },
        _count: true
      });

      const formatBreakdown = usage.reduce((acc: any, item) => {
        const format = item.eventData?.format || 'unknown';
        acc[format] = (acc[format] || 0) + item._count;
        return acc;
      }, {});

      const totalExports = Object.values(formatBreakdown).reduce((sum: number, count: any) => sum + count, 0);
      
      // Get plan limits
      const planLimits = {
        FREE: { single: 0, batch: 0 },
        STARTER: { single: 50, batch: 3 },
        PROFESSIONAL: { single: 200, batch: 10 },
        ENTERPRISE: { single: -1, batch: 25 } // -1 = unlimited
      };

      const userPlan = req.user.subscription?.plan || 'FREE';
      const limits = planLimits[userPlan as keyof typeof planLimits];

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          totalExports,
          formatBreakdown,
          limits: {
            singleExports: limits.single,
            batchExports: limits.batch,
            unlimited: limits.single === -1
          },
          usage: {
            singleExports: totalExports, // Simplified for demo
            batchExports: usage.filter(u => u.eventData?.count > 1).length,
            remainingSingle: limits.single === -1 ? -1 : Math.max(0, limits.single - totalExports),
            remainingBatch: limits.batch === -1 ? -1 : Math.max(0, limits.batch - usage.filter(u => u.eventData?.count > 1).length)
          }
        }
      });

    } catch (error: any) {
      logger.error('Failed to get export usage:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve export usage statistics'
      });
    }
  }
);

// Helper method for format breakdown
async function getFormatBreakdown(userId: string, startDate: Date): Promise<Record<string, number>> {
  // This would be implemented as needed
  return { pdf: 5, excel: 3, csv: 2 };
}

export default router;