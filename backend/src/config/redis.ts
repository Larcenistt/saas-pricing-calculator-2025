import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis;

export const initializeRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  // Test connection
  try {
    await redis.ping();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export { redis };