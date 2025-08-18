import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';

/**
 * Create a testing module with common providers
 */
export const createTestingModule = async (options: {
  providers?: ModuleMetadata['providers'];
  controllers?: ModuleMetadata['controllers'];
  imports?: ModuleMetadata['imports'];
}) => {
  const { providers = [], controllers = [], imports = [] } = options;

  return await Test.createTestingModule({
    imports,
    controllers,
    providers,
  }).compile();
};

/**
 * Mock factory for Prisma Service
 */
export const createMockPrismaService = () => ({
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Add other model mocks as needed
});

/**
 * Mock factory for ConfigService
 */
export const createMockConfigService = (config: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => config[key]),
  getOrThrow: jest.fn((key: string) => {
    if (!(key in config)) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return config[key];
  }),
});

/**
 * Mock factory for JwtService
 */
export const createMockJwtService = () => ({
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
});

/**
 * Mock factory for Logger
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Common test data factory
 */
export const createTestUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed_password',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Helper to mock environment variables
 */
export const mockEnvironment = (env: Record<string, string>) => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};
