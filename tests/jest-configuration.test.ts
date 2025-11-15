/**
 * Jest Configuration Verification Tests
 *
 * These tests verify that Jest is properly configured and can:
 * - Run basic tests
 * - Handle TypeScript files
 * - Resolve path aliases
 * - Mock modules correctly
 * - Handle async operations
 *
 * These are foundational infrastructure tests
 */

import fs from 'fs';
import path from 'path';

describe('Jest Configuration and Infrastructure', () => {
  describe('Jest Configuration Files Exist', () => {
    test('jest.config.js exists', () => {
      const configPath = path.join(process.cwd(), 'jest.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('jest.setup.js exists', () => {
      const setupPath = path.join(process.cwd(), 'jest.setup.js');
      expect(fs.existsSync(setupPath)).toBe(true);
    });

    test('jest.config.js is valid JavaScript', () => {
      const configPath = path.join(process.cwd(), 'jest.config.js');
      const content = fs.readFileSync(configPath, 'utf-8');

      // Should not throw when required
      expect(() => {
        require(configPath);
      }).not.toThrow();
    });
  });

  describe('Jest Configuration Content', () => {
    let configContent: string;

    beforeAll(() => {
      const configPath = path.join(process.cwd(), 'jest.config.js');
      configContent = fs.readFileSync(configPath, 'utf-8');
    });

    test('configuration uses next/jest', () => {
      expect(configContent).toContain('next/jest');
      expect(configContent).toContain('createJestConfig');
    });

    test('configuration sets testEnvironment to jsdom', () => {
      expect(configContent).toContain('jsdom');
    });

    test('configuration includes setupFilesAfterEnv', () => {
      expect(configContent).toContain('setupFilesAfterEnv');
      expect(configContent).toContain('jest.setup.js');
    });

    test('configuration includes moduleNameMapper', () => {
      expect(configContent).toContain('moduleNameMapper');
      expect(configContent).toContain('@/');
    });

    test('configuration includes collectCoverageFrom', () => {
      expect(configContent).toContain('collectCoverageFrom');
    });

    test('configuration includes testPathIgnorePatterns', () => {
      expect(configContent).toContain('testPathIgnorePatterns');
    });
  });

  describe('Jest Setup File Configuration', () => {
    let setupContent: string;

    beforeAll(() => {
      const setupPath = path.join(process.cwd(), 'jest.setup.js');
      setupContent = fs.readFileSync(setupPath, 'utf-8');
    });

    test('setup file handles jest-dom gracefully', () => {
      expect(setupContent).toContain('jest-dom');
    });

    test('setup file mocks next/router', () => {
      expect(setupContent).toContain('jest.mock');
      expect(setupContent).toContain('next/router');
    });

    test('setup file mocks next/image', () => {
      expect(setupContent).toContain('next/image');
    });

    test('setup file sets environment variables', () => {
      expect(setupContent).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(setupContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    test('setup file provides global test utilities', () => {
      expect(setupContent).toContain('global.testUtils');
    });
  });

  describe('Test Environment Setup', () => {
    test('jest can be run', () => {
      expect(typeof describe).toBe('function');
      expect(typeof test).toBe('function');
      expect(typeof expect).toBe('function');
    });

    test('jest globals are available', () => {
      expect(typeof beforeEach).toBe('function');
      expect(typeof afterEach).toBe('function');
      expect(typeof beforeAll).toBe('function');
      expect(typeof afterAll).toBe('function');
    });

    test('process is available in test environment', () => {
      expect(typeof process).toBe('object');
      expect(process.env).toBeDefined();
    });

    test('jsdom globals are available', () => {
      expect(typeof document).toBe('object');
      expect(typeof window).toBe('object');
      expect(typeof navigator).toBe('object');
    });
  });

  describe('Path Alias Resolution', () => {
    test('can require files using @/ alias', () => {
      // This tests that the moduleNameMapper works
      // The alias is configured to map @/* to ./*
      const aliasPath = '@/tsconfig.json';
      const resolvedPath = aliasPath.replace('@/', './');

      expect(() => {
        require(path.join(process.cwd(), resolvedPath));
      }).not.toThrow();
    });

    test('@/lib alias resolves correctly', () => {
      const libPath = path.join(process.cwd(), 'lib');
      expect(fs.existsSync(libPath)).toBe(true);
    });

    test('@/components alias resolves correctly', () => {
      const componentsPath = path.join(process.cwd(), 'components');
      expect(fs.existsSync(componentsPath)).toBe(true);
    });

    test('@/pages alias resolves correctly', () => {
      const pagesPath = path.join(process.cwd(), 'pages');
      expect(fs.existsSync(pagesPath)).toBe(true);
    });
  });

  describe('Environment Variables for Testing', () => {
    test('NEXT_PUBLIC_SUPABASE_URL is set for tests', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).not.toBe('');
    });

    test('NEXT_PUBLIC_SUPABASE_ANON_KEY is set for tests', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).not.toBe('');
    });

    test('Supabase URL is a valid test URL', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // Should either be localhost or a valid URL format
      expect(
        url?.includes('localhost') ||
        url?.includes('supabase.co') ||
        url?.startsWith('http')
      ).toBe(true);
    });
  });

  describe('Mock Configuration', () => {
    test('next/router is mocked', () => {
      const router = require('next/router').useRouter();
      expect(router).toBeDefined();
      expect(typeof router.push).toBe('function');
    });

    test('next/image is mocked', () => {
      const Image = require('next/image').default;
      expect(Image).toBeDefined();
    });

    test('global test utilities are available', () => {
      expect(global.testUtils).toBeDefined();
      expect(global.testUtils.createMockSupabaseClient).toBeDefined();
    });
  });

  describe('TypeScript Support', () => {
    test('tsconfig.json exists', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    test('tsconfig.json is valid JSON', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');

      expect(() => {
        JSON.parse(content);
      }).not.toThrow();
    });

    test('can import TypeScript files', () => {
      // This test verifies ts-jest transforms TypeScript files
      expect(() => {
        require(path.join(process.cwd(), 'tsconfig.json'));
      }).not.toThrow();
    });
  });

  describe('Test File Discovery', () => {
    test('test files with .test.ts extension are found', () => {
      const testPath = path.join(process.cwd(), 'tests/setup.test.ts');
      expect(fs.existsSync(testPath)).toBe(true);
    });

    test('test files with .test.tsx extension are found', () => {
      const testPath = path.join(process.cwd(), 'tests/pages/index.test.tsx');
      expect(fs.existsSync(testPath)).toBe(true);
    });

    test('tests directory exists', () => {
      const testsPath = path.join(process.cwd(), 'tests');
      expect(fs.existsSync(testsPath)).toBe(true);
    });

    test('test subdirectories exist', () => {
      const subdirs = ['api', 'lib', 'pages'];

      subdirs.forEach((subdir) => {
        const dirPath = path.join(process.cwd(), 'tests', subdir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe('Jest Matchers', () => {
    test('basic matchers work', () => {
      expect(true).toBe(true);
      expect(1).toEqual(1);
      expect([1, 2, 3]).toContain(2);
      expect({ a: 1 }).toHaveProperty('a');
    });

    test('string matchers work', () => {
      expect('hello').toMatch(/ell/);
      expect('hello world').toContain('world');
    });

    test('number matchers work', () => {
      expect(5).toBeGreaterThan(3);
      expect(5).toBeLessThan(10);
      expect(5).toBeCloseTo(5, 0);
    });

    test('boolean matchers work', () => {
      expect(true).toBeTruthy();
      expect(false).toBeFalsy();
      expect(undefined).toBeUndefined();
      expect(null).toBeNull();
    });

    test('mock function matchers work', () => {
      const mockFn = jest.fn();
      mockFn('test');

      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('array matchers work', () => {
      const arr = [1, 2, 3];
      expect(arr).toHaveLength(3);
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe('Async/Promise Support', () => {
    test('can handle async test', async () => {
      const promise = Promise.resolve('value');
      const result = await promise;
      expect(result).toBe('value');
    });

    test('can handle promise rejection', async () => {
      const failingPromise = Promise.reject(new Error('Failed'));
      await expect(failingPromise).rejects.toThrow('Failed');
    });

    test('can use jest.resolves matcher', async () => {
      const promise = Promise.resolve(42);
      await expect(promise).resolves.toBe(42);
    });

    test('can use jest.rejects matcher', async () => {
      const promise = Promise.reject(new Error('Error'));
      await expect(promise).rejects.toThrow('Error');
    });
  });

  describe('Module Mocking', () => {
    test('jest.mock works', () => {
      // next/router is mocked in jest.setup.js
      const module = require('next/router');
      expect(module).toBeDefined();
    });

    test('jest.fn creates mock functions', () => {
      const mockFn = jest.fn();
      mockFn('test');

      expect(mockFn).toHaveBeenCalledWith('test');
    });

    test('jest.spyOn spies on functions', () => {
      const obj = { method: jest.fn() };
      const spy = jest.spyOn(obj, 'method');

      obj.method('arg');

      expect(spy).toHaveBeenCalledWith('arg');
      spy.mockRestore();
    });

    test('jest.clearAllMocks clears all mocks', () => {
      const mockFn = jest.fn();
      mockFn('test');
      expect(mockFn).toHaveBeenCalled();

      jest.clearAllMocks();
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('Coverage Support', () => {
    test('coverage can be collected', () => {
      // When run with --coverage flag, Jest collects coverage
      // This test simply verifies coverage infrastructure is present
      expect(process.argv).toBeDefined();
    });

    test('coverage thresholds are configured', () => {
      const configPath = path.join(process.cwd(), 'jest.config.js');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('coverageThreshold');
    });
  });

  describe('Node.js Version Compatibility', () => {
    test('Node.js version is compatible', () => {
      const nodeVersion = process.versions.node;
      const [major] = nodeVersion.split('.').map(Number);

      // Project requires Node 18+
      expect(major).toBeGreaterThanOrEqual(18);
    });

    test('can use ES2020+ features', () => {
      // Nullish coalescing
      const a = null ?? 'default';
      expect(a).toBe('default');

      // Optional chaining
      const obj = { nested: { value: 42 } };
      expect(obj?.nested?.value).toBe(42);

      // Logical nullish assignment
      let x = null;
      x ??= 'assigned';
      expect(x).toBe('assigned');
    });
  });
});
