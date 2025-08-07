import NodeCache from 'node-cache';
import { redisClient } from '../config/redis';
import { prisma } from '../server';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For organized invalidation
  priority?: 'low' | 'medium' | 'high';
  namespace?: string; // For key organization
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keyCount: number;
  memoryUsage: number;
}

class CacheService {
  private localCache: NodeCache;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly LOCAL_CACHE_TTL = 300; // 5 minutes for local cache
  private stats = {
    hits: 0,
    misses: 0,
    redisHits: 0,
    redisMisses: 0
  };

  constructor() {
    // Local in-memory cache for hot data
    this.localCache = new NodeCache({
      stdTTL: this.LOCAL_CACHE_TTL,
      checkperiod: 60,
      maxKeys: 1000,
      useClones: false // Better performance, but be careful with mutations
    });

    // Cache event listeners for monitoring
    this.localCache.on('set', (key, value) => {
      logger.debug(`Local cache SET: ${key}`);
    });

    this.localCache.on('del', (key) => {
      logger.debug(`Local cache DEL: ${key}`);
    });

    this.localCache.on('expired', (key, value) => {
      logger.debug(`Local cache EXPIRED: ${key}`);
    });

    logger.info('Cache service initialized with local and Redis layers');
  }

  /**
   * Get value from cache (L1: Local, L2: Redis, L3: Database if applicable)
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options.namespace);

    try {
      // L1: Try local cache first
      const localValue = this.localCache.get<T>(fullKey);
      if (localValue !== undefined) {
        this.stats.hits++;
        logger.debug(`Cache HIT (local): ${fullKey}`);
        return localValue;
      }

      // L2: Try Redis cache
      const redisValue = await redisClient.get(fullKey);
      if (redisValue) {
        this.stats.redisHits++;
        const parsed = JSON.parse(redisValue) as T;
        
        // Populate local cache for hot data
        this.localCache.set(fullKey, parsed, Math.min(this.LOCAL_CACHE_TTL, options.ttl || this.DEFAULT_TTL));
        
        logger.debug(`Cache HIT (Redis): ${fullKey}`);
        return parsed;
      }

      // Cache miss
      this.stats.misses++;
      logger.debug(`Cache MISS: ${fullKey}`);
      return null;

    } catch (error) {
      logger.error(`Cache GET error for key ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache (both local and Redis)
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.buildKey(key, options.namespace);
    const ttl = options.ttl || this.DEFAULT_TTL;

    try {
      // Set in Redis with TTL
      await redisClient.setex(fullKey, ttl, JSON.stringify(value));
      
      // Set in local cache with shorter TTL
      const localTTL = Math.min(this.LOCAL_CACHE_TTL, ttl);
      this.localCache.set(fullKey, value, localTTL);

      // Store cache metadata in database if tags provided
      if (options.tags && options.tags.length > 0) {
        await this.storeCacheMetadata(fullKey, options.tags, ttl);
      }

      logger.debug(`Cache SET: ${fullKey} (TTL: ${ttl}s)`);

    } catch (error) {
      logger.error(`Cache SET error for key ${fullKey}:`, error);
    }
  }

  /**
   * Delete specific cache entry
   */
  async del(key: string, namespace?: string): Promise<void> {
    const fullKey = this.buildKey(key, namespace);

    try {
      // Remove from both caches
      await Promise.all([
        redisClient.del(fullKey),
        this.localCache.del(fullKey)
      ]);

      // Remove from database metadata
      await prisma.cacheEntry.deleteMany({
        where: { key: fullKey }
      });

      logger.debug(`Cache DEL: ${fullKey}`);

    } catch (error) {
      logger.error(`Cache DEL error for key ${fullKey}:`, error);
    }
  }

  /**
   * Invalidate cache entries by pattern or tags
   */
  async invalidate(pattern: string, options: { byTags?: boolean } = {}): Promise<number> {
    try {
      let keysToDelete: string[] = [];

      if (options.byTags) {
        // Find keys by tags in database
        const cacheEntries = await prisma.cacheEntry.findMany({
          where: { tags: { has: pattern } },
          select: { key: true }
        });
        keysToDelete = cacheEntries.map(entry => entry.key);
      } else {
        // Find keys by Redis pattern
        keysToDelete = await redisClient.keys(pattern);
      }

      if (keysToDelete.length === 0) return 0;

      // Delete from Redis
      if (keysToDelete.length > 0) {
        await redisClient.del(...keysToDelete);
      }

      // Delete from local cache
      keysToDelete.forEach(key => this.localCache.del(key));

      // Clean up database metadata
      await prisma.cacheEntry.deleteMany({
        where: { key: { in: keysToDelete } }
      });

      logger.info(`Cache invalidated ${keysToDelete.length} keys with pattern: ${pattern}`);
      return keysToDelete.length;

    } catch (error) {
      logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set pattern - execute function if not cached
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function to get data
    const value = await fetchFunction();
    
    // Cache the result
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Specialized caching methods for different data types
   */
  
  // AI Response Caching
  async cacheAIResponse(
    calculationId: string,
    analysisType: string,
    response: any,
    tokensUsed: number
  ): Promise<void> {
    const ttl = this.getAICacheTTL(tokensUsed);
    const key = `ai:${calculationId}:${analysisType}`;
    
    await this.set(key, {
      response,
      tokensUsed,
      cachedAt: new Date().toISOString()
    }, {
      ttl,
      tags: ['ai', `calc:${calculationId}`, `type:${analysisType}`],
      namespace: 'ai'
    });
  }

  async getCachedAIResponse(calculationId: string, analysisType: string): Promise<any> {
    const key = `ai:${calculationId}:${analysisType}`;
    return this.get(key, { namespace: 'ai' });
  }

  // Calculation Result Caching
  async cacheCalculationResult(calculationId: string, result: any): Promise<void> {
    const key = `calc:result:${calculationId}`;
    await this.set(key, result, {
      ttl: 3600, // 1 hour
      tags: ['calculation', `calc:${calculationId}`],
      namespace: 'calculation'
    });
  }

  async getCachedCalculationResult(calculationId: string): Promise<any> {
    const key = `calc:result:${calculationId}`;
    return this.get(key, { namespace: 'calculation' });
  }

  // User Session Caching
  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    const key = `session:${userId}`;
    await this.set(key, sessionData, {
      ttl: 900, // 15 minutes
      tags: ['session', `user:${userId}`],
      namespace: 'session'
    });
  }

  async getCachedUserSession(userId: string): Promise<any> {
    const key = `session:${userId}`;
    return this.get(key, { namespace: 'session' });
  }

  // Template Caching
  async cacheTemplate(templateId: string, template: any): Promise<void> {
    const key = `template:${templateId}`;
    await this.set(key, template, {
      ttl: 21600, // 6 hours
      tags: ['template', `template:${templateId}`, `industry:${template.industry}`],
      namespace: 'template'
    });
  }

  async cacheTemplatesByIndustry(industry: string, templates: any[]): Promise<void> {
    const key = `templates:industry:${industry}`;
    await this.set(key, templates, {
      ttl: 21600, // 6 hours
      tags: ['template', `industry:${industry}`],
      namespace: 'template'
    });
  }

  // Benchmarks Caching
  async cacheBenchmarks(industry: string, benchmarks: any): Promise<void> {
    const key = `benchmarks:${industry}`;
    await this.set(key, benchmarks, {
      ttl: 43200, // 12 hours
      tags: ['benchmarks', `industry:${industry}`],
      namespace: 'benchmarks'
    });
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(): Promise<void> {
    try {
      logger.info('Starting cache warming...');

      // Warm popular templates
      const popularTemplates = await prisma.template.findMany({
        where: { isPublic: true },
        orderBy: { usageCount: 'desc' },
        take: 10
      });

      for (const template of popularTemplates) {
        await this.cacheTemplate(template.id, template);
      }

      // Warm industry benchmarks (mock data - replace with actual benchmark service)
      const industries = ['B2B SaaS', 'E-commerce', 'Fintech', 'Healthcare'];
      for (const industry of industries) {
        const benchmarks = await this.generateIndustryBenchmarks(industry);
        await this.cacheBenchmarks(industry, benchmarks);
      }

      logger.info('Cache warming completed');

    } catch (error) {
      logger.error('Cache warming error:', error);
    }
  }

  /**
   * Cache statistics and monitoring
   */
  async getStats(): Promise<CacheStats> {
    const localStats = this.localCache.getStats();
    const redisInfo = await redisClient.info('memory');
    
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      keyCount: localStats.keys + await this.getRedisKeyCount(),
      memoryUsage: this.parseRedisMemoryUsage(redisInfo)
    };
  }

  /**
   * Cache health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test local cache
      const testKey = 'health:check';
      const testValue = { timestamp: Date.now() };
      this.localCache.set(testKey, testValue);
      const localResult = this.localCache.get(testKey);

      // Test Redis cache
      await redisClient.set('health:check', JSON.stringify(testValue));
      const redisResult = await redisClient.get('health:check');

      // Clean up test keys
      this.localCache.del(testKey);
      await redisClient.del('health:check');

      const isHealthy = localResult && redisResult && 
        JSON.parse(redisResult).timestamp === testValue.timestamp;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          localCache: !!localResult,
          redisCache: !!redisResult,
          stats: await this.getStats()
        }
      };

    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Clear all cache data
   */
  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        await this.invalidate(`${namespace}:*`);
      } else {
        // Clear local cache
        this.localCache.flushAll();
        
        // Clear Redis cache
        await redisClient.flushall();
        
        // Clear database cache metadata
        await prisma.cacheEntry.deleteMany();
      }

      logger.info(`Cache cleared${namespace ? ` for namespace: ${namespace}` : ' completely'}`);

    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  // Private helper methods

  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private getAICacheTTL(tokensUsed: number): number {
    // Longer cache for expensive AI requests
    if (tokensUsed > 1000) return 86400; // 24 hours
    if (tokensUsed > 500) return 43200;  // 12 hours  
    return 21600; // 6 hours default
  }

  private async storeCacheMetadata(key: string, tags: string[], ttl: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      await prisma.cacheEntry.upsert({
        where: { key },
        create: {
          key,
          value: '', // We don't store the actual value in DB
          tags,
          expiresAt
        },
        update: {
          tags,
          expiresAt,
          hitCount: { increment: 1 }
        }
      });
    } catch (error) {
      // Non-critical error - log but don't throw
      logger.warn('Failed to store cache metadata:', error);
    }
  }

  private async getRedisKeyCount(): Promise<number> {
    try {
      const info = await redisClient.info('keyspace');
      const match = info.match(/keys=(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  private parseRedisMemoryUsage(info: string): number {
    try {
      const match = info.match(/used_memory:(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  private async generateIndustryBenchmarks(industry: string): Promise<any> {
    // Mock benchmarks - replace with real data source
    const benchmarks = {
      'B2B SaaS': {
        averageChurn: 0.055, // 5.5%
        medianCAC: 500,
        averageContractLength: 12,
        medianARR: 50000,
        expansionRate: 1.15
      },
      'E-commerce': {
        averageChurn: 0.12, // 12%
        medianCAC: 75,
        averageContractLength: 3,
        medianARR: 10000,
        expansionRate: 1.05
      },
      'Fintech': {
        averageChurn: 0.08, // 8%
        medianCAC: 250,
        averageContractLength: 6,
        medianARR: 25000,
        expansionRate: 1.10
      },
      'Healthcare': {
        averageChurn: 0.04, // 4%
        medianCAC: 800,
        averageContractLength: 24,
        medianARR: 100000,
        expansionRate: 1.20
      }
    };

    return benchmarks[industry as keyof typeof benchmarks] || benchmarks['B2B SaaS'];
  }
}

export const cacheService = new CacheService();