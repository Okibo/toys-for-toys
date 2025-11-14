/**
 * jest.config.js
 *
 * Jest configuration for toys-for-toys project
 * Handles TypeScript files, path aliases, and coverage collection
 */

module.exports = {
  // Use ts-jest preset to handle TypeScript files
  preset: 'ts-jest',

  // Test environment set to node (suitable for file system tests)
  testEnvironment: 'node',

  // Root directory for Jest to search from
  rootDir: '.',

  // Test file patterns - match both .test.ts and .test.tsx files
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx',
  ],

  // Module name mapper to handle TypeScript path aliases
  // Maps @/ aliases to their actual directory locations
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/components$': '<rootDir>/components',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/lib$': '<rootDir>/lib',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/app$': '<rootDir>/app',
    '^@/supabase/(.*)$': '<rootDir>/supabase/$1',
    '^@/supabase$': '<rootDir>/supabase',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '^@/public$': '<rootDir>/public',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/tests$': '<rootDir>/tests',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/pages$': '<rootDir>/pages',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    // Exclude test files, index files, and type definition files
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/build/**',
  ],

  // Test coverage thresholds (optional - can be adjusted as needed)
  // Uncomment to enforce coverage minimums
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50,
  //   },
  // },

  // Files and directories to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/build/',
    '/out/',
    '/tests/e2e/',
  ],

  // Setup files to run before tests
  setupFilesAfterEnv: [],

  // Transform files - ts-jest handles .ts and .tsx files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Override tsconfig.json for Jest
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Module file extensions to resolve
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Verbose output for better debugging
  verbose: true,

  // Timeout for tests (in milliseconds)
  testTimeout: 10000,
};
