import { prisma } from '../server';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface AnalyticsEvent {
  userId?: string;
  eventType: string;
  eventData?: any;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface UserAnalytics {
  userId: string;
  totalCalculations: number;
  totalAiRequests: number;
  totalCollaborations: number;
  avgCalculationTime: number;
  mostUsedFeatures: string[];
  lastActivityAt: Date;
  engagementScore: number;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalCalculations: number;
  calculations24h: number;
  aiRequestsTotal: number;
  aiRequests24h: number;
  collaborationSessions: number;
  collaborationSessionsActive: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  customerLifetimeValue: number;
  planDistribution: Record<string, number>;
  upgradeConversionRate: number;
}

class AnalyticsService {
  private readonly REAL_TIME_WINDOW = 60 * 1000; // 1 minute
  private readonly BATCH_SIZE = 100;
  
  constructor() {
    this.initializeAnalytics();
    logger.info('Analytics service initialized');
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store in database for long-term analysis
      await prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          eventData: event.eventData as any,
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        }
      });

      // Store in Redis for real-time analytics
      const timestamp = Date.now();
      const eventKey = `analytics:${event.eventType}:${timestamp}`;
      await redisClient.setex(eventKey, 86400, JSON.stringify({ // 24 hours TTL
        ...event,
        timestamp
      }));

      // Update real-time counters
      await this.updateRealTimeMetrics(event);

      logger.debug(`Analytics event tracked: ${event.eventType}`);

    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track user activity
   */
  async trackUserActivity(
    userId: string, 
    activity: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: `user:${activity}`,
      eventData: metadata,
      metadata
    });

    // Update user's last activity
    await this.updateUserLastActivity(userId);
  }

  /**
   * Track calculation events
   */
  async trackCalculation(
    userId: string,
    calculationId: string,
    action: 'created' | 'updated' | 'deleted' | 'shared',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: `calculation:${action}`,
      eventData: {
        calculationId,
        ...metadata
      }
    });
  }

  /**
   * Track AI usage
   */
  async trackAIUsage(
    userId: string,
    analysisType: string,
    tokensUsed: number,
    cost: number,
    responseTime: number
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'ai:request',
      eventData: {
        analysisType,
        tokensUsed,
        cost,
        responseTime
      }
    });
  }

  /**
   * Track collaboration events
   */
  async trackCollaboration(
    userId: string,
    sessionId: string,
    action: 'created' | 'joined' | 'left' | 'updated',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: `collaboration:${action}`,
      eventData: {
        sessionId,
        ...metadata
      }
    });
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string, days = 30): Promise<UserAnalytics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const [
        totalCalculations,
        aiUsage,
        collaborations,
        events,
        user
      ] = await Promise.all([
        // Total calculations
        prisma.calculation.count({
          where: { 
            userId, 
            createdAt: { gte: startDate } 
          }
        }),

        // AI usage
        prisma.aiUsage.findMany({
          where: { 
            userId, 
            createdAt: { gte: startDate } 
          }
        }),

        // Collaborations
        prisma.collaborationSession.count({
          where: {
            OR: [
              { hostId: userId },
              { participants: { some: { userId } } }
            ],
            createdAt: { gte: startDate }
          }
        }),

        // Recent events for feature usage
        prisma.analyticsEvent.findMany({
          where: {
            userId,
            createdAt: { gte: startDate }
          },
          select: {
            eventType: true,
            createdAt: true
          }
        }),

        // User info
        prisma.user.findUnique({
          where: { id: userId },
          select: { lastLogin: true }
        })
      ]);

      // Calculate most used features
      const featureUsage = events.reduce((acc: Record<string, number>, event) => {
        const feature = event.eventType.split(':')[0];
        acc[feature] = (acc[feature] || 0) + 1;
        return acc;
      }, {});

      const mostUsedFeatures = Object.entries(featureUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([feature]) => feature);

      // Calculate engagement score (0-100)
      const engagementScore = this.calculateEngagementScore({
        totalCalculations,
        aiRequests: aiUsage.length,
        collaborations,
        eventCount: events.length,
        days
      });

      return {
        userId,
        totalCalculations,
        totalAiRequests: aiUsage.length,
        totalCollaborations: collaborations,
        avgCalculationTime: this.calculateAverageCalculationTime(events),
        mostUsedFeatures,
        lastActivityAt: user?.lastLogin || new Date(0),
        engagementScore
      };

    } catch (error) {
      logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const [
        totalUsers,
        activeUsers24h,
        activeUsers7d,
        activeUsers30d,
        totalCalculations,
        calculations24h,
        aiRequestsTotal,
        aiRequests24h,
        collaborationSessions,
        collaborationSessionsActive
      ] = await Promise.all([
        prisma.user.count(),
        this.getActiveUsersCount(oneDayAgo),
        this.getActiveUsersCount(sevenDaysAgo),
        this.getActiveUsersCount(thirtyDaysAgo),
        prisma.calculation.count(),
        prisma.calculation.count({ where: { createdAt: { gte: oneDayAgo } } }),
        prisma.aiUsage.count(),
        prisma.aiUsage.count({ where: { createdAt: { gte: oneDayAgo } } }),
        prisma.collaborationSession.count(),
        prisma.collaborationSession.count({ 
          where: { 
            isActive: true,
            expiresAt: { gt: now }
          }
        })
      ]);

      // Get performance metrics from Redis if available
      const averageResponseTime = await this.getAverageResponseTime();
      const errorRate = await this.getErrorRate();

      return {
        totalUsers,
        activeUsers24h,
        activeUsers7d,
        activeUsers30d,
        totalCalculations,
        calculations24h,
        aiRequestsTotal,
        aiRequests24h,
        collaborationSessions,
        collaborationSessionsActive,
        averageResponseTime,
        errorRate
      };

    } catch (error) {
      logger.error('Failed to get system metrics:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    try {
      const [subscriptions, planDistribution] = await Promise.all([
        prisma.subscription.findMany({
          where: { status: 'ACTIVE' },
          include: { user: true }
        }),
        prisma.subscription.groupBy({
          by: ['plan'],
          where: { status: 'ACTIVE' },
          _count: true
        })
      ]);

      // Calculate revenue metrics
      const planPricing = {
        FREE: 0,
        STARTER: 29,
        PROFESSIONAL: 99,
        ENTERPRISE: 299
      };

      const monthlyRevenue = subscriptions.reduce((total, sub) => {
        return total + (planPricing[sub.plan as keyof typeof planPricing] || 0);
      }, 0);

      const planDist = planDistribution.reduce((acc: Record<string, number>, item) => {
        acc[item.plan] = item._count;
        return acc;
      }, {});

      // Calculate churn rate (simplified - last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const cancelledSubscriptions = await prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: { gte: thirtyDaysAgo }
        }
      });

      const churnRate = subscriptions.length > 0 ? 
        (cancelledSubscriptions / subscriptions.length) * 100 : 0;

      // Simplified customer lifetime value calculation
      const averageRevenue = monthlyRevenue / (subscriptions.length || 1);
      const customerLifetimeValue = averageRevenue * 12; // Assume 1 year average

      return {
        totalRevenue: monthlyRevenue * 12, // Annual revenue projection
        monthlyRecurringRevenue: monthlyRevenue,
        churnRate,
        customerLifetimeValue,
        planDistribution: planDist,
        upgradeConversionRate: await this.calculateUpgradeConversionRate()
      };

    } catch (error) {
      logger.error('Failed to get revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get feature usage analytics
   */
  async getFeatureUsage(days = 30): Promise<Record<string, number>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const events = await prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: startDate } },
        _count: true
      });

      return events.reduce((acc: Record<string, number>, event) => {
        acc[event.eventType] = event._count;
        return acc;
      }, {});

    } catch (error) {
      logger.error('Failed to get feature usage:', error);
      return {};
    }
  }

  /**
   * Get conversion funnel analytics
   */
  async getConversionFunnel(days = 30): Promise<{
    visitors: number;
    signups: number;
    activations: number;
    subscriptions: number;
    conversionRates: {
      visitorToSignup: number;
      signupToActivation: number;
      activationToSubscription: number;
    };
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const [visitors, signups, activations, subscriptions] = await Promise.all([
        prisma.analyticsEvent.count({
          where: {
            eventType: 'user:visit',
            createdAt: { gte: startDate }
          }
        }),
        prisma.user.count({
          where: { createdAt: { gte: startDate } }
        }),
        prisma.calculation.count({
          where: {
            user: { createdAt: { gte: startDate } }
          }
        }),
        prisma.subscription.count({
          where: {
            status: 'ACTIVE',
            createdAt: { gte: startDate }
          }
        })
      ]);

      const conversionRates = {
        visitorToSignup: visitors > 0 ? (signups / visitors) * 100 : 0,
        signupToActivation: signups > 0 ? (activations / signups) * 100 : 0,
        activationToSubscription: activations > 0 ? (subscriptions / activations) * 100 : 0
      };

      return {
        visitors,
        signups,
        activations,
        subscriptions,
        conversionRates
      };

    } catch (error) {
      logger.error('Failed to get conversion funnel:', error);
      throw error;
    }
  }

  // Private helper methods

  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    const timestamp = Math.floor(Date.now() / 60000) * 60000; // Round to minute
    const key = `realtime:${event.eventType}:${timestamp}`;
    
    await redisClient.incr(key);
    await redisClient.expire(key, 3600); // 1 hour TTL
  }

  private async updateUserLastActivity(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      logger.warn('Failed to update user last activity:', error);
    }
  }

  private async getActiveUsersCount(since: Date): Promise<number> {
    return prisma.user.count({
      where: {
        lastLogin: { gte: since }
      }
    });
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      const key = 'metrics:avg_response_time';
      const cached = await redisClient.get(key);
      return cached ? parseFloat(cached) : 200; // Default 200ms
    } catch {
      return 200;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const key = 'metrics:error_rate';
      const cached = await redisClient.get(key);
      return cached ? parseFloat(cached) : 0.01; // Default 1%
    } catch {
      return 0.01;
    }
  }

  private calculateEngagementScore(data: {
    totalCalculations: number;
    aiRequests: number;
    collaborations: number;
    eventCount: number;
    days: number;
  }): number {
    const { totalCalculations, aiRequests, collaborations, eventCount, days } = data;
    
    // Weighted engagement score
    const calculationScore = Math.min(totalCalculations * 10, 40); // Max 40 points
    const aiScore = Math.min(aiRequests * 5, 20); // Max 20 points
    const collaborationScore = Math.min(collaborations * 15, 30); // Max 30 points
    const activityScore = Math.min(eventCount / days, 10); // Max 10 points per day

    return Math.round(calculationScore + aiScore + collaborationScore + activityScore);
  }

  private calculateAverageCalculationTime(events: any[]): number {
    const calculationEvents = events.filter(e => 
      e.eventType === 'calculation:created' || e.eventType === 'calculation:updated'
    );
    
    if (calculationEvents.length === 0) return 0;
    
    // This would need more sophisticated tracking in practice
    return 120; // Default 2 minutes
  }

  private async calculateUpgradeConversionRate(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const [freeUsers, upgradedUsers] = await Promise.all([
        prisma.user.count({
          where: {
            subscription: { plan: 'FREE' },
            createdAt: { lte: thirtyDaysAgo }
          }
        }),
        prisma.subscription.count({
          where: {
            plan: { not: 'FREE' },
            createdAt: { gte: thirtyDaysAgo }
          }
        })
      ]);

      return freeUsers > 0 ? (upgradedUsers / freeUsers) * 100 : 0;

    } catch (error) {
      logger.error('Failed to calculate upgrade conversion rate:', error);
      return 0;
    }
  }

  private initializeAnalytics(): void {
    // Start background job to aggregate analytics data
    setInterval(async () => {
      try {
        await this.aggregateAnalyticsData();
      } catch (error) {
        logger.error('Analytics aggregation failed:', error);
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    logger.info('Analytics aggregation job started');
  }

  private async aggregateAnalyticsData(): Promise<void> {
    // Aggregate real-time data into longer-term metrics
    // This would include moving averages, trend calculations, etc.
    logger.debug('Aggregating analytics data...');
  }
}

export const analyticsService = new AnalyticsService();