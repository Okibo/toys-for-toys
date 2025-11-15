/**
 * Jest Setup Configuration
 *
 * This file runs before each test file and sets up:
 * - Custom matchers from jest-dom
 * - Global test utilities
 * - Environment variables for testing
 * - Mock setup for external services
 */

// Jest-DOM matchers for enhanced component testing
// Learn more: https://github.com/testing-library/jest-dom
try {
  require('@testing-library/jest-dom');
} catch (e) {
  // jest-dom is optional for projects that don't use React component testing
  console.warn('jest-dom not installed. Install @testing-library/jest-dom for enhanced matchers.');
}

// Setup environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

/**
 * Mock the next/router module for component tests
 * Components that depend on routing can use this mock
 */
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

/**
 * Mock the next/image module
 * Image components rely on this for optimized images
 */
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // Return a simple img element for testing
    // eslint-disable-next-line jsx-a11y/alt-text
    return require('react').createElement('img', props);
  },
}));

/**
 * Global test utilities and helpers
 */
global.testUtils = {
  /**
   * Create a mock Supabase client for testing
   */
  createMockSupabaseClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
    },
    on: jest.fn(),
    subscribe: jest.fn(),
  }),
};

/**
 * Suppress console errors and warnings in tests unless explicitly needed
 * This reduces noise in test output for known/expected errors
 */
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Filter out expected Next.js warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    // Filter out Supabase credential warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Supabase credentials not configured')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
