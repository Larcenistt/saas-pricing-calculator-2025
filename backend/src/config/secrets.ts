import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema for validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Redis
  REDIS_URL: z.string().min(1, 'Redis URL is required'),
  REDIS_TTL: z.string().transform(Number).default('3600'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Refresh secret must be at least 32 characters'),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SUCCESS_URL: z.string().url().optional(),
  CANCEL_URL: z.string().url().optional(),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().optional(),
  
  // AWS (Optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
});

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      console.error('❌ Invalid environment variables:', missingVars);
      console.error('Details:', error.errors);
      process.exit(1);
    }
    throw error;
  }
};

// Export validated config
export const config = parseEnv();

// Security checks for production
if (config.NODE_ENV === 'production') {
  // Ensure strong secrets
  if (config.JWT_SECRET.length < 64) {
    console.error('❌ JWT_SECRET must be at least 64 characters in production');
    process.exit(1);
  }
  
  if (config.JWT_REFRESH_SECRET.length < 64) {
    console.error('❌ JWT_REFRESH_SECRET must be at least 64 characters in production');
    process.exit(1);
  }
  
  // Ensure HTTPS
  if (!config.FRONTEND_URL.startsWith('https://')) {
    console.warn('⚠️ FRONTEND_URL should use HTTPS in production');
  }
  
  // Ensure Stripe is configured
  if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ Stripe configuration is required in production');
    process.exit(1);
  }
}

// Helper to check if we're in production
export const isProduction = () => config.NODE_ENV === 'production';
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isTest = () => config.NODE_ENV === 'test';

// Export individual config sections for convenience
export const dbConfig = {
  url: config.DATABASE_URL,
};

export const redisConfig = {
  url: config.REDIS_URL,
  ttl: config.REDIS_TTL,
};

export const jwtConfig = {
  secret: config.JWT_SECRET,
  refreshSecret: config.JWT_REFRESH_SECRET,
  expiresIn: config.JWT_EXPIRE,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRE,
};

export const stripeConfig = {
  secretKey: config.STRIPE_SECRET_KEY,
  webhookSecret: config.STRIPE_WEBHOOK_SECRET,
  priceId: config.STRIPE_PRICE_ID,
};

export const emailConfig = {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  from: config.EMAIL_FROM,
};

export const securityConfig = {
  bcryptRounds: config.BCRYPT_ROUNDS,
  rateLimitWindow: config.RATE_LIMIT_WINDOW,
  rateLimitMax: config.RATE_LIMIT_MAX,
  corsOrigin: config.FRONTEND_URL,
};