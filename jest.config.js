/**
 * Jest Configuration for Toy-for-Toy
 *
 * Comprehensive Jest setup with:
 * - Next.js support via next/jest
 * - TypeScript support via ts-jest
 * - jsdom test environment for React component testing
 * - Path aliases from tsconfig.json
 * - Coverage configuration for quality gates
 * - Custom test matchers via jest-dom
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment for DOM-based testing
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapping for path aliases (matches tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },

  // Module directories for resolution
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Paths to ignore during test discovery
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],

  // Patterns to match test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Transform configuration for TypeScript and JavaScript
  // Using Next.js built-in TypeScript support via next/jest
  // transform: {},

  // Coverage collection configuration
  collectCoverageFrom: [
    'pages/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/.coverage/**',
    '!**/coverage/**',
    '!pages/_app.tsx',
    '!pages/_document.tsx',
    '!pages/_error.tsx',
  ],

  // Coverage thresholds for quality gates
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
