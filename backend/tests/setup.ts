import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

// Mock Prisma
jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Mock Redis
jest.mock('../src/config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn(),
  },
}));

// Setup global test utilities
global.testUtils = {
  generateTestUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    role: 'USER',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  generateTestCalculation: () => ({
    id: 'test-calc-id',
    userId: 'test-user-id',
    name: 'Test Calculation',
    inputs: {
      currentPrice: 99,
      customers: 100,
      churnRate: 5,
      competitorPrice: 120,
      cac: 300,
    },
    results: {
      tiers: [],
      metrics: {},
      insights: [],
    },
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  generateAuthTokens: () => ({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  }),
};

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockReset(prisma);
});

// Close connections after all tests
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});