import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
});

// Global test teardown
afterAll(() => {
  // Cleanup after all tests
});

// Mock external dependencies that shouldn't be called during tests
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line no-console
  console.log = jest.fn();
  // eslint-disable-next-line no-console
  console.debug = jest.fn();
  // eslint-disable-next-line no-console
  console.info = jest.fn();
}
