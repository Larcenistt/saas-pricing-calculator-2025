import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { redis } from '../config/redis';

const prisma = new PrismaClient();

interface CalculationInput {
  currentPrice: number;
  competitorPrice?: number;
  customers: number;
  churnRate: number;
  cac?: number;
  averageContractLength?: number;
  expansionRevenue?: number;
  marketSize?: number;
}

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  targetCustomers: string;
  projectedRevenue: number;
  confidence: number;
}

interface CalculationResult {
  tiers: PricingTier[];
  projectedRevenue: {
    monthly: number;
    annual: number;
    growth: number;
  };
  insights: {
    pricePosition: string;
    optimizationPotential: number;
    riskLevel: string;
    recommendations: string[];
  };
  metrics: {
    ltv: number;
    cac: number;
    ltvcac: number;
    paybackPeriod: number;
    mrr: number;
    arr: number;
  };
}

export class CalculationService {
  private calculateOptimalPrice(inputs: CalculationInput): number {
    const { currentPrice, competitorPrice, customers, churnRate } = inputs;
    
    // Base calculation logic
    let optimalPrice = currentPrice;
    
    // Factor in competitor pricing if available
    if (competitorPrice) {
      const competitorFactor = competitorPrice > currentPrice ? 1.1 : 0.95;
      optimalPrice = currentPrice * competitorFactor;
    }
    
    // Adjust based on churn rate
    if (churnRate < 5) {
      optimalPrice *= 1.15; // Low churn = pricing power
    } else if (churnRate > 10) {
      optimalPrice *= 0.9; // High churn = price sensitive
    }
    
    // Market size adjustment
    if (inputs.marketSize && inputs.marketSize > 1000000) {
      optimalPrice *= 1.05; // Large market = slightly higher price
    }
    
    return Math.round(optimalPrice * 100) / 100;
  }

  private generatePricingTiers(basePrice: number, inputs: CalculationInput): PricingTier[] {
    const tiers: PricingTier[] = [
      {
        name: 'Starter',
        price: Math.round(basePrice * 0.6 * 100) / 100,
        features: [
          'Up to 10 users',
          'Basic features',
          'Email support',
          'Monthly billing'
        ],
        targetCustomers: 'Small teams and startups',
        projectedRevenue: Math.round(basePrice * 0.6 * inputs.customers * 0.5),
        confidence: 85
      },
      {
        name: 'Professional',
        price: basePrice,
        features: [
          'Up to 50 users',
          'Advanced features',
          'Priority support',
          'Custom integrations',
          'Annual billing discount'
        ],
        targetCustomers: 'Growing businesses',
        projectedRevenue: Math.round(basePrice * inputs.customers * 0.35),
        confidence: 90
      },
      {
        name: 'Enterprise',
        price: Math.round(basePrice * 2.5 * 100) / 100,
        features: [
          'Unlimited users',
          'All features',
          'Dedicated support',
          'Custom development',
          'SLA guarantee',
          'On-premise option'
        ],
        targetCustomers: 'Large organizations',
        projectedRevenue: Math.round(basePrice * 2.5 * inputs.customers * 0.15),
        confidence: 75
      }
    ];
    
    return tiers;
  }

  private calculateMetrics(inputs: CalculationInput, optimalPrice: number) {
    const monthlyRevenue = optimalPrice * inputs.customers;
    const annualRevenue = monthlyRevenue * 12;
    
    // Calculate LTV (Lifetime Value)
    const monthlyChurnRate = inputs.churnRate / 100;
    const averageLifetime = monthlyChurnRate > 0 ? 1 / monthlyChurnRate : 24; // Cap at 24 months
    const ltv = optimalPrice * Math.min(averageLifetime, 24);
    
    // CAC (Customer Acquisition Cost)
    const cac = inputs.cac || optimalPrice * 3; // Default to 3x monthly price
    
    // LTV:CAC Ratio
    const ltvcac = cac > 0 ? ltv / cac : 0;
    
    // Payback Period
    const paybackPeriod = cac / optimalPrice;
    
    return {
      ltv: Math.round(ltv),
      cac: Math.round(cac),
      ltvcac: Math.round(ltvcac * 10) / 10,
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      mrr: Math.round(monthlyRevenue),
      arr: Math.round(annualRevenue)
    };
  }

  private generateInsights(inputs: CalculationInput, optimalPrice: number) {
    const priceDiff = ((optimalPrice - inputs.currentPrice) / inputs.currentPrice) * 100;
    const recommendations: string[] = [];
    
    // Price position analysis
    let pricePosition = 'Optimally Priced';
    if (priceDiff > 20) {
      pricePosition = 'Significantly Underpriced';
      recommendations.push('Consider gradual price increases over 3-6 months');
    } else if (priceDiff > 10) {
      pricePosition = 'Moderately Underpriced';
      recommendations.push('Implement price increase with grandfathering for existing customers');
    } else if (priceDiff < -10) {
      pricePosition = 'Potentially Overpriced';
      recommendations.push('Review value proposition and consider promotional pricing');
    }
    
    // Churn-based recommendations
    if (inputs.churnRate > 10) {
      recommendations.push('High churn rate detected - focus on retention before price optimization');
      recommendations.push('Implement customer success program to reduce churn');
    } else if (inputs.churnRate < 3) {
      recommendations.push('Excellent retention - strong pricing power opportunity');
      recommendations.push('Consider premium tier for power users');
    }
    
    // CAC recommendations
    if (inputs.cac) {
      const ltvcac = (optimalPrice * 12) / inputs.cac;
      if (ltvcac < 3) {
        recommendations.push('LTV:CAC ratio below optimal - focus on reducing acquisition costs');
      } else if (ltvcac > 5) {
        recommendations.push('Strong unit economics - consider scaling acquisition');
      }
    }
    
    // Risk assessment
    let riskLevel = 'Low';
    if (priceDiff > 30 || inputs.churnRate > 15) {
      riskLevel = 'High';
    } else if (priceDiff > 20 || inputs.churnRate > 10) {
      riskLevel = 'Medium';
    }
    
    return {
      pricePosition,
      optimizationPotential: Math.round(Math.abs(priceDiff)),
      riskLevel,
      recommendations: recommendations.slice(0, 5) // Limit to top 5 recommendations
    };
  }

  async calculate(userId: string, inputs: CalculationInput, name?: string) {
    try {
      // Calculate optimal pricing
      const optimalPrice = this.calculateOptimalPrice(inputs);
      const tiers = this.generatePricingTiers(optimalPrice, inputs);
      const metrics = this.calculateMetrics(inputs, optimalPrice);
      const insights = this.generateInsights(inputs, optimalPrice);
      
      // Calculate projected revenue
      const totalMonthlyRevenue = tiers.reduce((sum, tier) => sum + tier.projectedRevenue, 0);
      const previousRevenue = inputs.currentPrice * inputs.customers;
      const growthRate = ((totalMonthlyRevenue - previousRevenue) / previousRevenue) * 100;
      
      const results: CalculationResult = {
        tiers,
        projectedRevenue: {
          monthly: totalMonthlyRevenue,
          annual: totalMonthlyRevenue * 12,
          growth: Math.round(growthRate)
        },
        insights,
        metrics
      };
      
      // Save calculation to database
      const calculation = await prisma.calculation.create({
        data: {
          userId,
          name: name || `Calculation ${new Date().toLocaleDateString()}`,
          inputs: inputs as any,
          results: results as any,
        }
      });
      
      // Cache results in Redis for quick retrieval
      await redis.setex(
        `calculation:${calculation.id}`,
        3600, // 1 hour
        JSON.stringify({ inputs, results })
      );
      
      // Track analytics event
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventType: 'CALCULATION_CREATED',
          eventData: {
            calculationId: calculation.id,
            optimizationPotential: insights.optimizationPotential
          }
        }
      });
      
      logger.info(`Calculation created for user ${userId}`);
      
      return {
        id: calculation.id,
        ...results
      };
    } catch (error) {
      logger.error('Calculation error:', error);
      throw new AppError('Failed to perform calculation', 500);
    }
  }

  async getCalculations(userId: string, teamId?: string) {
    const where = teamId 
      ? { OR: [{ userId }, { teamId }] }
      : { userId };
    
    const calculations = await prisma.calculation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        shareToken: true,
        results: true
      }
    });
    
    return calculations;
  }

  async getCalculation(id: string, userId: string) {
    // Try to get from cache first
    const cached = await redis.get(`calculation:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const calculation = await prisma.calculation.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { team: { members: { some: { userId } } } }
        ]
      }
    });
    
    if (!calculation) {
      throw new AppError('Calculation not found', 404);
    }
    
    // Cache for future requests
    await redis.setex(
      `calculation:${id}`,
      3600,
      JSON.stringify(calculation)
    );
    
    return calculation;
  }

  async updateCalculation(id: string, userId: string, updates: Partial<CalculationInput>, name?: string) {
    const calculation = await this.getCalculation(id, userId);
    
    // Recalculate with new inputs
    const newInputs = { ...calculation.inputs, ...updates };
    const newResults = await this.calculate(userId, newInputs, name);
    
    // Create new version
    const version = calculation.version + 1;
    
    await prisma.calculationVersion.create({
      data: {
        calculationId: id,
        version: calculation.version,
        inputs: calculation.inputs,
        results: calculation.results,
        changedById: userId,
        changeNote: 'Updated calculation parameters'
      }
    });
    
    // Update main calculation
    const updated = await prisma.calculation.update({
      where: { id },
      data: {
        inputs: newInputs as any,
        results: newResults as any,
        version,
        name
      }
    });
    
    // Invalidate cache
    await redis.del(`calculation:${id}`);
    
    return updated;
  }

  async deleteCalculation(id: string, userId: string) {
    await this.getCalculation(id, userId); // Verify ownership
    
    await prisma.calculation.delete({
      where: { id }
    });
    
    // Clear cache
    await redis.del(`calculation:${id}`);
    
    logger.info(`Calculation ${id} deleted by user ${userId}`);
  }

  async shareCalculation(id: string, userId: string) {
    await this.getCalculation(id, userId); // Verify ownership
    
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    const updated = await prisma.calculation.update({
      where: { id },
      data: {
        isPublic: true,
        shareToken
      }
    });
    
    return {
      shareUrl: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
      shareToken
    };
  }

  async getSharedCalculation(shareToken: string) {
    const calculation = await prisma.calculation.findUnique({
      where: { shareToken },
      select: {
        id: true,
        name: true,
        inputs: true,
        results: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            company: true
          }
        }
      }
    });
    
    if (!calculation || !calculation.isPublic) {
      throw new AppError('Shared calculation not found', 404);
    }
    
    return calculation;
  }

  async getCalculationVersions(id: string, userId: string) {
    // Verify ownership first
    await this.getCalculation(id, userId);
    
    const versions = await prisma.calculationVersion.findMany({
      where: { calculationId: id },
      orderBy: { version: 'desc' },
      include: {
        changedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return versions;
  }
}