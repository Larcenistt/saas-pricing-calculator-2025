import OpenAI from 'openai';
import { prisma } from '../server';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import crypto from 'crypto';
import Bottleneck from 'bottleneck';

export interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
  impact: {
    revenue?: string;
    conversion?: string;
    retention?: string;
  };
  difficulty: 'low' | 'medium' | 'high';
  timeline: string;
  metrics: string[];
}

export interface CalculationInput {
  currentPrice: number;
  customers: number;
  churnRate: number;
  cac?: number;
  averageContractLength?: number;
  expansionRevenue?: number;
  marketSize?: number;
}

export interface AIContext {
  industry?: string;
  competitors?: string[];
  businessStage?: string;
  targetMarket?: string;
}

export type AnalysisType = 'pricing' | 'competitive' | 'market' | 'comprehensive';

class AIService {
  private openai: OpenAI;
  private rateLimiter: Bottleneck;
  private readonly CACHE_TTL = 86400; // 24 hours
  private readonly MAX_RETRIES = 3;
  
  // AI cost per token (as of Jan 2024)
  private readonly PRICING = {
    'gpt-4': { input: 0.00003, output: 0.00006 },
    'gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 }
  };

  // Budget limits per subscription plan
  private readonly BUDGET_LIMITS = {
    FREE: 0,           // No AI features
    STARTER: 10,       // $10/month AI budget
    PROFESSIONAL: 50,  // $50/month AI budget  
    ENTERPRISE: 200    // $200/month AI budget
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Rate limiting: 100 requests per minute to respect OpenAI limits
    this.rateLimiter = new Bottleneck({
      reservoir: 100,
      reservoirRefreshAmount: 100,
      reservoirRefreshInterval: 60 * 1000, // 1 minute
      maxConcurrent: 10,
      minTime: 100 // 100ms between requests
    });

    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured. AI features will be disabled.');
    }
  }

  /**
   * Generate AI insights for a calculation
   */
  async generateInsights(
    calculationId: string,
    analysisType: AnalysisType,
    context?: AIContext
  ): Promise<AIInsight[]> {
    const startTime = Date.now();

    try {
      // Get calculation data
      const calculation = await prisma.calculation.findUnique({
        where: { id: calculationId },
        include: { user: true }
      });

      if (!calculation) {
        throw new AppError('Calculation not found', 404);
      }

      // Check user budget
      await this.validateBudget(calculation.userId);

      // Check cache first
      const cacheKey = this.buildCacheKey(calculationId, analysisType, context);
      const cached = await this.getCachedInsight(cacheKey);
      if (cached) {
        logger.info(`AI insight cache hit for calculation ${calculationId}`);
        return cached;
      }

      // Generate prompt
      const prompt = this.buildPrompt(calculation.inputs as CalculationInput, analysisType, context);
      
      // Make OpenAI API call with rate limiting
      const response = await this.rateLimiter.schedule(() =>
        this.executeWithRetry(async () => {
          return await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt(analysisType)
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500,
            top_p: 0.9
          });
        })
      );

      const responseTime = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokensUsed, 'gpt-4');

      // Parse AI response
      const insights = await this.parseAIResponse(
        response.choices[0].message.content || '',
        analysisType
      );

      // Cache results
      await this.cacheInsight(cacheKey, insights);

      // Save to database for audit and cost tracking
      await this.saveInsightsToDatabase(calculationId, insights, {
        tokensUsed,
        cost,
        responseTime,
        prompt
      });

      // Track usage for cost management
      await this.recordUsage({
        userId: calculation.userId,
        calculationId,
        requestType: analysisType,
        tokensUsed,
        cost,
        responseTime
      });

      logger.info(`AI insights generated for calculation ${calculationId} in ${responseTime}ms`);
      return insights;

    } catch (error) {
      logger.error('AI insight generation failed:', error);
      
      // Return fallback insights if AI fails
      if (error instanceof AppError) {
        throw error;
      }
      
      return this.generateFallbackInsights(analysisType);
    }
  }

  /**
   * Validate user's AI budget
   */
  private async validateBudget(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      throw new AppError('AI features require an active subscription', 403);
    }

    const plan = user.subscription.plan;
    const budgetLimit = this.BUDGET_LIMITS[plan];

    if (budgetLimit === 0) {
      throw new AppError('AI features not included in your current plan', 403);
    }

    // Get current month usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyUsage = await prisma.aiUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: monthStart }
      },
      _sum: { cost: true }
    });

    const currentCost = Number(monthlyUsage._sum.cost) || 0;

    if (currentCost >= budgetLimit) {
      throw new AppError(`Monthly AI budget of $${budgetLimit} exceeded`, 403);
    }

    // Warn if approaching limit (80%)
    if (currentCost > budgetLimit * 0.8) {
      logger.warn(`User ${userId} approaching AI budget limit: $${currentCost}/$${budgetLimit}`);
    }
  }

  /**
   * Build cache key for AI responses
   */
  private buildCacheKey(calculationId: string, analysisType: string, context?: AIContext): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const hash = crypto.createHash('md5').update(calculationId + analysisType + contextStr).digest('hex');
    return `ai:insight:${hash}`;
  }

  /**
   * Get cached AI insight
   */
  private async getCachedInsight(cacheKey: string): Promise<AIInsight[] | null> {
    try {
      const cached = await redisClient.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.warn('Failed to get AI insight from cache:', error);
      return null;
    }
  }

  /**
   * Cache AI insight
   */
  private async cacheInsight(cacheKey: string, insights: AIInsight[]): Promise<void> {
    try {
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(insights));
    } catch (error) {
      logger.warn('Failed to cache AI insight:', error);
    }
  }

  /**
   * Build context-aware prompt for AI
   */
  private buildPrompt(inputs: CalculationInput, type: AnalysisType, context?: AIContext): string {
    const baseContext = `
Analyze this SaaS pricing calculation with expert-level insights:

Business Metrics:
- Monthly Price: $${inputs.currentPrice}
- Customer Count: ${inputs.customers}
- Monthly Churn Rate: ${inputs.churnRate}%
- Customer Acquisition Cost: $${inputs.cac || 'Not provided'}
- Average Contract Length: ${inputs.averageContractLength || 'Not provided'} months
- Monthly Expansion Revenue: ${inputs.expansionRevenue || 0}%
- Total Addressable Market: $${inputs.marketSize || 'Not provided'}

${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.competitors ? `Key Competitors: ${context.competitors.join(', ')}` : ''}
${context?.businessStage ? `Business Stage: ${context.businessStage}` : ''}
${context?.targetMarket ? `Target Market: ${context.targetMarket}` : ''}
    `;

    const typeSpecificPrompts = {
      pricing: `
Focus on pricing optimization opportunities:
1. Analyze current pricing vs industry benchmarks
2. Identify psychological pricing principles to apply
3. Recommend price testing strategies
4. Assess price elasticity and revenue impact
5. Suggest tiered pricing structures
      `,
      competitive: `
Provide competitive analysis insights:
1. Position against competitor pricing
2. Identify differentiation opportunities
3. Recommend competitive responses
4. Analyze value proposition gaps
5. Suggest market positioning strategy
      `,
      market: `
Evaluate market penetration and growth strategies:
1. Assess market sizing and opportunity
2. Identify customer segment opportunities  
3. Recommend expansion strategies
4. Analyze barriers to growth
5. Suggest customer acquisition improvements
      `,
      comprehensive: `
Provide comprehensive business analysis:
1. Overall business health assessment
2. Key optimization opportunities
3. Strategic recommendations
4. Risk factors and mitigation
5. Implementation roadmap with priorities
      `
    };

    return `${baseContext}

${typeSpecificPrompts[type]}

Provide actionable insights in JSON format with this structure:
{
  "insights": [
    {
      "title": "Brief insight title",
      "description": "Detailed description of the insight",
      "confidence": 0.85,
      "recommendations": ["Specific actionable recommendation 1", "Specific actionable recommendation 2"],
      "impact": {
        "revenue": "Expected revenue impact",
        "conversion": "Expected conversion impact",
        "retention": "Expected retention impact"
      },
      "difficulty": "low|medium|high",
      "timeline": "Implementation timeline",
      "metrics": ["Key metrics to track"]
    }
  ]
}`;
  }

  /**
   * Get system prompt for different analysis types
   */
  private getSystemPrompt(type: AnalysisType): string {
    const prompts = {
      pricing: `You are an expert SaaS pricing strategist with 15+ years of experience. 
               Analyze pricing data and provide actionable insights based on:
               - Behavioral economics and pricing psychology
               - SaaS industry benchmarks and best practices  
               - Customer lifetime value optimization
               - Competitive positioning strategies
               Respond only in valid JSON format with specific, measurable recommendations.`,
      
      competitive: `You are a competitive intelligence analyst specializing in SaaS markets.
                    Provide strategic insights based on:
                    - Market positioning and differentiation
                    - Competitive response strategies
                    - Value proposition optimization
                    - Customer acquisition advantages
                    Focus on actionable recommendations with clear success metrics.`,
      
      market: `You are a SaaS market expansion specialist with expertise in:
               - Total addressable market analysis
               - Customer segmentation strategies
               - Market penetration tactics
               - Growth opportunity identification
               Provide data-driven insights with implementation roadmaps.`,

      comprehensive: `You are a senior SaaS business consultant with comprehensive expertise in:
                      - Strategic business analysis
                      - Revenue optimization
                      - Market positioning
                      - Operational excellence
                      Provide holistic insights covering all aspects of SaaS business growth.`
    };

    return prompts[type];
  }

  /**
   * Parse AI response and structure insights
   */
  private async parseAIResponse(content: string, type: AnalysisType): Promise<AIInsight[]> {
    try {
      // Extract JSON from AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and structure insights
      return parsed.insights.map((insight: any, index: number) => ({
        id: crypto.randomUUID(),
        type,
        title: insight.title || `${type} Insight ${index + 1}`,
        description: insight.description || '',
        confidence: Math.min(Math.max(insight.confidence || 0.7, 0), 1),
        recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : [],
        impact: insight.impact || {},
        difficulty: ['low', 'medium', 'high'].includes(insight.difficulty) ? insight.difficulty : 'medium',
        timeline: insight.timeline || '2-4 weeks',
        metrics: Array.isArray(insight.metrics) ? insight.metrics : []
      }));
    } catch (error) {
      logger.warn('Failed to parse AI response:', error);
      // Fallback to rule-based insights
      return this.generateFallbackInsights(type);
    }
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(type: AnalysisType): AIInsight[] {
    const baseInsights = {
      pricing: [
        {
          id: crypto.randomUUID(),
          type,
          title: 'Price Point Analysis',
          description: 'Your current pricing may benefit from psychological pricing principles.',
          confidence: 0.6,
          recommendations: ['Consider ending prices in 9 or 7', 'Test tiered pricing structure'],
          impact: { revenue: 'Potential 5-15% increase' },
          difficulty: 'low' as const,
          timeline: '1-2 weeks',
          metrics: ['Conversion rate', 'Average revenue per user']
        }
      ],
      competitive: [
        {
          id: crypto.randomUUID(),
          type,
          title: 'Market Position',
          description: 'Analyze your competitive positioning for optimization opportunities.',
          confidence: 0.6,
          recommendations: ['Research competitor pricing', 'Identify unique value propositions'],
          impact: { conversion: 'Better market positioning' },
          difficulty: 'medium' as const,
          timeline: '2-3 weeks',
          metrics: ['Market share', 'Competitive win rate']
        }
      ],
      market: [
        {
          id: crypto.randomUUID(),
          type,
          title: 'Growth Opportunities',
          description: 'Explore market expansion and customer acquisition strategies.',
          confidence: 0.6,
          recommendations: ['Identify new customer segments', 'Optimize acquisition channels'],
          impact: { revenue: 'Expand addressable market' },
          difficulty: 'high' as const,
          timeline: '1-3 months',
          metrics: ['Customer acquisition cost', 'Market penetration']
        }
      ],
      comprehensive: [
        {
          id: crypto.randomUUID(),
          type,
          title: 'Business Health Check',
          description: 'Overall business metrics suggest areas for optimization.',
          confidence: 0.7,
          recommendations: ['Focus on retention metrics', 'Optimize pricing strategy'],
          impact: { revenue: 'Holistic improvement', retention: 'Reduce churn' },
          difficulty: 'medium' as const,
          timeline: '1-2 months',
          metrics: ['Monthly recurring revenue', 'Customer lifetime value']
        }
      ]
    };

    return baseInsights[type] || [];
  }

  /**
   * Execute OpenAI API call with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        if (attempt === this.MAX_RETRIES) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn(`AI API call attempt ${attempt} failed, retrying in ${delay}ms...`);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Calculate cost for AI API usage
   */
  private calculateCost(tokens: number, model: string): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING];
    if (!pricing) return 0;

    // Estimate 70% input, 30% output tokens
    const inputTokens = Math.floor(tokens * 0.7);
    const outputTokens = tokens - inputTokens;

    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }

  /**
   * Save insights to database for audit trail
   */
  private async saveInsightsToDatabase(
    calculationId: string,
    insights: AIInsight[],
    metadata: {
      tokensUsed: number;
      cost: number;
      responseTime: number;
      prompt: string;
    }
  ): Promise<void> {
    try {
      for (const insight of insights) {
        await prisma.aiInsight.create({
          data: {
            calculationId,
            insightType: insight.type,
            prompt: metadata.prompt,
            response: JSON.stringify(insight),
            confidence: insight.confidence,
            tokensUsed: metadata.tokensUsed,
            cost: metadata.cost
          }
        });
      }
    } catch (error) {
      logger.error('Failed to save insights to database:', error);
    }
  }

  /**
   * Record AI usage for cost tracking
   */
  private async recordUsage(usage: {
    userId: string;
    calculationId: string;
    requestType: string;
    tokensUsed: number;
    cost: number;
    responseTime: number;
  }): Promise<void> {
    try {
      await prisma.aiUsage.create({
        data: {
          userId: usage.userId,
          calculationId: usage.calculationId,
          requestType: usage.requestType,
          tokensUsed: usage.tokensUsed,
          cost: usage.cost,
          responseTime: usage.responseTime
        }
      });

      // Update monthly usage metrics in Redis
      const monthKey = `ai:usage:${usage.userId}:${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      await redisClient.incrby(monthKey, Math.round(usage.cost * 1000)); // Store as cents
      await redisClient.expire(monthKey, 86400 * 32); // 32 days expiry
    } catch (error) {
      logger.error('Failed to record AI usage:', error);
    }
  }

  /**
   * Get user's monthly AI usage
   */
  async getMonthlyUsage(userId: string): Promise<{ totalCost: number; requestCount: number }> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const usage = await prisma.aiUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: monthStart }
      },
      _sum: { cost: true },
      _count: true
    });

    return {
      totalCost: Number(usage._sum.cost) || 0,
      requestCount: usage._count || 0
    };
  }
}

export const aiService = new AIService();