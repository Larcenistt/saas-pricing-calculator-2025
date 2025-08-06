import { z } from 'zod';

// Auth validators
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
});

// Calculation validators
export const calculationInputSchema = z.object({
  currentPrice: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price too high'),
  competitorPrice: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price too high')
    .optional(),
  customers: z
    .number()
    .int('Customers must be a whole number')
    .positive('Customers must be positive')
    .max(10000000, 'Customer count too high'),
  churnRate: z
    .number()
    .min(0, 'Churn rate cannot be negative')
    .max(100, 'Churn rate cannot exceed 100%'),
  cac: z
    .number()
    .positive('CAC must be positive')
    .max(100000, 'CAC too high')
    .optional(),
  averageContractLength: z
    .number()
    .positive('Contract length must be positive')
    .max(120, 'Contract length too high')
    .optional(),
  expansionRevenue: z
    .number()
    .min(0, 'Expansion revenue cannot be negative')
    .max(100, 'Expansion revenue cannot exceed 100%')
    .optional(),
  marketSize: z
    .number()
    .positive('Market size must be positive')
    .optional(),
});

export const calculationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  inputs: calculationInputSchema,
});

// Team validators
export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  plan: z.enum(['TEAM', 'BUSINESS', 'ENTERPRISE']).optional(),
});

export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

// User profile validators
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

// API key validators
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  rateLimit: z.number().min(10).max(10000).optional(),
  expiresIn: z.number().min(1).max(365).optional(), // days
});

// Subscription validators
export const createSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  paymentMethodId: z.string().optional(),
});

// Pagination validators
export const paginationSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Search validators
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.record(z.any()).optional(),
});

// Export validators
export const exportSchema = z.object({
  format: z.enum(['pdf', 'csv', 'json', 'excel']),
  includeCharts: z.boolean().optional(),
  dateRange: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
});