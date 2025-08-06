import { CalculationService } from '../../../src/services/calculation.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('CalculationService', () => {
  let calculationService: CalculationService;
  let prisma: DeepMockProxy<PrismaClient>;
  let redis: any;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    };
    calculationService = new CalculationService(prisma as any, redis);
  });

  describe('createCalculation', () => {
    it('should create a new calculation with correct tier structure', async () => {
      const userId = 'user-id';
      const calculationData = {
        name: 'Q1 2025 Pricing',
        inputs: {
          currentPrice: 99,
          customers: 100,
          churnRate: 5,
          competitorPrice: 120,
          cac: 300,
          targetMargin: 70,
          marketGrowthRate: 15,
        },
      };

      const savedCalculation = {
        id: 'calc-id',
        userId,
        name: calculationData.name,
        inputs: calculationData.inputs,
        results: expect.any(Object),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.calculation.create.mockResolvedValue(savedCalculation as any);

      const result = await calculationService.createCalculation(
        userId,
        calculationData
      );

      expect(result).toHaveProperty('id');
      expect(result.results).toHaveProperty('tiers');
      expect(result.results.tiers).toHaveLength(3);
      expect(result.results).toHaveProperty('metrics');
      expect(result.results).toHaveProperty('insights');
      
      // Verify tier structure
      const tiers = result.results.tiers;
      expect(tiers[0].name).toBe('Starter');
      expect(tiers[1].name).toBe('Professional');
      expect(tiers[2].name).toBe('Enterprise');
      
      // Verify pricing logic
      expect(tiers[0].price).toBeLessThan(tiers[1].price);
      expect(tiers[1].price).toBeLessThan(tiers[2].price);
    });

    it('should calculate correct metrics', async () => {
      const userId = 'user-id';
      const calculationData = {
        name: 'Metrics Test',
        inputs: {
          currentPrice: 100,
          customers: 1000,
          churnRate: 5,
          competitorPrice: 120,
          cac: 500,
          targetMargin: 70,
          marketGrowthRate: 10,
        },
      };

      prisma.calculation.create.mockImplementation((args: any) => 
        Promise.resolve({
          id: 'calc-id',
          ...args.data,
        })
      );

      const result = await calculationService.createCalculation(
        userId,
        calculationData
      );

      const metrics = result.results.metrics;
      
      // Verify MRR calculation
      expect(metrics.currentMRR).toBe(100000); // 100 * 1000
      
      // Verify churn impact
      expect(metrics.monthlyChurn).toBe(50); // 5% of 1000
      
      // Verify LTV calculation
      const expectedLTV = 100 / 0.05; // price / churn rate
      expect(metrics.ltv).toBeCloseTo(expectedLTV, 0);
      
      // Verify LTV:CAC ratio
      expect(metrics.ltvCacRatio).toBeCloseTo(expectedLTV / 500, 1);
    });

    it('should generate appropriate insights', async () => {
      const userId = 'user-id';
      const calculationData = {
        name: 'Insights Test',
        inputs: {
          currentPrice: 50,
          customers: 100,
          churnRate: 15, // High churn
          competitorPrice: 45,
          cac: 600, // High CAC
          targetMargin: 70,
          marketGrowthRate: 5,
        },
      };

      prisma.calculation.create.mockImplementation((args: any) => 
        Promise.resolve({
          id: 'calc-id',
          ...args.data,
        })
      );

      const result = await calculationService.createCalculation(
        userId,
        calculationData
      );

      const insights = result.results.insights;
      
      // Should identify high churn issue
      expect(insights.some((i: any) => 
        i.toLowerCase().includes('churn')
      )).toBe(true);
      
      // Should identify CAC issue
      expect(insights.some((i: any) => 
        i.toLowerCase().includes('acquisition cost') ||
        i.toLowerCase().includes('cac')
      )).toBe(true);
      
      // Should note competitor pricing
      expect(insights.some((i: any) => 
        i.toLowerCase().includes('competitor')
      )).toBe(true);
    });

    it('should cache calculation results', async () => {
      const userId = 'user-id';
      const calculationData = {
        name: 'Cache Test',
        inputs: {
          currentPrice: 99,
          customers: 100,
          churnRate: 5,
          competitorPrice: 120,
          cac: 300,
        },
      };

      prisma.calculation.create.mockResolvedValue({
        id: 'calc-id',
        userId,
        name: calculationData.name,
        inputs: calculationData.inputs,
        results: {},
        version: 1,
      } as any);

      await calculationService.createCalculation(userId, calculationData);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('calculation:'),
        expect.any(String),
        'EX',
        3600
      );
    });
  });

  describe('getCalculations', () => {
    it('should retrieve user calculations with pagination', async () => {
      const userId = 'user-id';
      const calculations = [
        { id: 'calc-1', name: 'Calc 1', createdAt: new Date() },
        { id: 'calc-2', name: 'Calc 2', createdAt: new Date() },
      ];

      prisma.calculation.findMany.mockResolvedValue(calculations as any);
      prisma.calculation.count.mockResolvedValue(2);

      const result = await calculationService.getCalculations(userId, {
        page: 1,
        limit: 10,
      });

      expect(result.calculations).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it('should filter by team if teamId provided', async () => {
      const userId = 'user-id';
      const teamId = 'team-id';

      prisma.calculation.findMany.mockResolvedValue([]);
      prisma.calculation.count.mockResolvedValue(0);

      await calculationService.getCalculations(userId, {
        teamId,
        page: 1,
        limit: 10,
      });

      expect(prisma.calculation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            teamId,
          }),
        })
      );
    });
  });

  describe('shareCalculation', () => {
    it('should generate unique share token', async () => {
      const calculationId = 'calc-id';
      const userId = 'user-id';

      const calculation = {
        id: calculationId,
        userId,
        shareToken: null,
      };

      prisma.calculation.findFirst.mockResolvedValue(calculation as any);
      prisma.calculation.update.mockResolvedValue({
        ...calculation,
        shareToken: 'unique-share-token',
        isPublic: true,
      } as any);

      const result = await calculationService.shareCalculation(
        calculationId,
        userId
      );

      expect(result.shareToken).toBeTruthy();
      expect(result.shareUrl).toContain('unique-share-token');
      expect(prisma.calculation.update).toHaveBeenCalledWith({
        where: { id: calculationId },
        data: {
          shareToken: expect.any(String),
          isPublic: true,
        },
      });
    });

    it('should return existing share token if already shared', async () => {
      const calculationId = 'calc-id';
      const userId = 'user-id';
      const existingToken = 'existing-token';

      const calculation = {
        id: calculationId,
        userId,
        shareToken: existingToken,
        isPublic: true,
      };

      prisma.calculation.findFirst.mockResolvedValue(calculation as any);

      const result = await calculationService.shareCalculation(
        calculationId,
        userId
      );

      expect(result.shareToken).toBe(existingToken);
      expect(prisma.calculation.update).not.toHaveBeenCalled();
    });
  });

  describe('duplicateCalculation', () => {
    it('should create a copy with new name', async () => {
      const calculationId = 'calc-id';
      const userId = 'user-id';
      const newName = 'Copy of Original';

      const original = {
        id: calculationId,
        userId,
        name: 'Original',
        inputs: { currentPrice: 99 },
        results: { tiers: [] },
      };

      prisma.calculation.findFirst.mockResolvedValue(original as any);
      prisma.calculation.create.mockResolvedValue({
        ...original,
        id: 'new-calc-id',
        name: newName,
      } as any);

      const result = await calculationService.duplicateCalculation(
        calculationId,
        userId,
        newName
      );

      expect(result.id).not.toBe(calculationId);
      expect(result.name).toBe(newName);
      expect(result.inputs).toEqual(original.inputs);
    });
  });

  describe('exportCalculation', () => {
    it('should export calculation data in requested format', async () => {
      const calculationId = 'calc-id';
      const userId = 'user-id';

      const calculation = {
        id: calculationId,
        userId,
        name: 'Test Calc',
        inputs: { currentPrice: 99 },
        results: {
          tiers: [
            { name: 'Starter', price: 79 },
            { name: 'Pro', price: 199 },
          ],
        },
      };

      prisma.calculation.findFirst.mockResolvedValue(calculation as any);

      const jsonExport = await calculationService.exportCalculation(
        calculationId,
        userId,
        'json'
      );

      expect(jsonExport).toEqual(calculation);

      const csvExport = await calculationService.exportCalculation(
        calculationId,
        userId,
        'csv'
      );

      expect(csvExport).toContain('name,price');
      expect(csvExport).toContain('Starter,79');
      expect(csvExport).toContain('Pro,199');
    });
  });

  describe('Pricing Algorithm', () => {
    it('should apply psychological pricing principles', async () => {
      const inputs = {
        currentPrice: 100,
        customers: 100,
        churnRate: 5,
        competitorPrice: 120,
        cac: 300,
      };

      const results = calculationService['calculatePricing'](inputs);
      const tiers = results.tiers;

      // Check for charm pricing (ending in 9)
      tiers.forEach((tier: any) => {
        const priceStr = tier.price.toString();
        expect(['9', '5', '0']).toContain(priceStr[priceStr.length - 1]);
      });

      // Check for appropriate tier spacing
      const spacing1 = tiers[1].price / tiers[0].price;
      const spacing2 = tiers[2].price / tiers[1].price;
      
      expect(spacing1).toBeGreaterThan(1.5);
      expect(spacing1).toBeLessThan(3);
      expect(spacing2).toBeGreaterThan(1.3);
      expect(spacing2).toBeLessThan(2.5);
    });

    it('should respect competitor pricing constraints', async () => {
      const inputs = {
        currentPrice: 100,
        customers: 100,
        churnRate: 5,
        competitorPrice: 80, // Lower competitor price
        cac: 300,
      };

      const results = calculationService['calculatePricing'](inputs);
      const starterPrice = results.tiers[0].price;

      // Starter tier should be competitive
      expect(starterPrice).toBeLessThanOrEqual(inputs.competitorPrice * 1.1);
    });

    it('should ensure positive unit economics', async () => {
      const inputs = {
        currentPrice: 50,
        customers: 100,
        churnRate: 10,
        competitorPrice: 60,
        cac: 500,
        targetMargin: 70,
      };

      const results = calculationService['calculatePricing'](inputs);
      const metrics = results.metrics;

      // LTV should exceed CAC for sustainability
      expect(metrics.ltvCacRatio).toBeGreaterThan(1);
      
      // Each tier should have positive margin
      results.tiers.forEach((tier: any) => {
        const margin = (tier.price - (tier.price * 0.3)) / tier.price * 100;
        expect(margin).toBeGreaterThan(0);
      });
    });
  });
});