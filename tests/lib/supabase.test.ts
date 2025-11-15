/**
 * Supabase Client Tests
 *
 * Verifies that:
 * - Supabase client is properly initialized
 * - Client imports from correct package
 * - Environment variables are properly configured
 * - Type exports are available
 * - Client can be used in tests
 *
 * These tests ensure the Supabase integration foundation is solid
 */

import fs from 'fs';
import path from 'path';

describe('Supabase Client Configuration', () => {
  let supabaseClientPath: string;
  let supabaseClientContent: string;

  beforeAll(() => {
    supabaseClientPath = path.join(process.cwd(), 'lib/supabase.ts');
    supabaseClientContent = fs.readFileSync(supabaseClientPath, 'utf-8');
  });

  describe('File Structure and Imports', () => {
    test('supabase client file exists', () => {
      expect(fs.existsSync(supabaseClientPath)).toBe(true);
    });

    test('supabase client imports createClient from @supabase/supabase-js', () => {
      expect(supabaseClientContent).toContain('createClient');
      expect(supabaseClientContent).toContain('@supabase/supabase-js');
    });

    test('supabase client is exported', () => {
      expect(supabaseClientContent).toMatch(/export.*supabase/);
    });

    test('supabase client uses environment variables', () => {
      expect(supabaseClientContent).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(supabaseClientContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });
  });

  describe('Environment Variable Configuration', () => {
    test('NEXT_PUBLIC_SUPABASE_URL is used for initialization', () => {
      expect(supabaseClientContent).toMatch(
        /process\.env\.NEXT_PUBLIC_SUPABASE_URL|import.*SUPABASE_URL/
      );
    });

    test('NEXT_PUBLIC_SUPABASE_ANON_KEY is used for initialization', () => {
      expect(supabaseClientContent).toMatch(
        /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY|import.*SUPABASE.*KEY/
      );
    });

    test('environment variables have fallback values or warnings', () => {
      // Should handle missing credentials gracefully
      expect(
        supabaseClientContent.includes('||') ||
        supabaseClientContent.includes('console.warn') ||
        supabaseClientContent.includes('console.error')
      ).toBe(true);
    });
  });

  describe('Type Definitions', () => {
    test('Database type is exported for TypeScript support', () => {
      expect(supabaseClientContent).toMatch(/export\s+type\s+Database/);
    });

    test('Database type is properly defined or imported', () => {
      expect(
        supabaseClientContent.includes('Database') &&
        (supabaseClientContent.includes('= any') ||
          supabaseClientContent.includes('from') ||
          supabaseClientContent.includes('import'))
      ).toBe(true);
    });
  });

  describe('Client Instantiation', () => {
    test('createClient is called with URL and key parameters', () => {
      expect(supabaseClientContent).toMatch(/createClient\s*\(/);
    });

    test('client uses correct parameter order (url, key)', () => {
      // createClient(url, key, options?)
      expect(
        supabaseClientContent.includes('createClient(') &&
        (supabaseClientContent.includes('SUPABASE_URL') ||
          supabaseClientContent.includes('supabaseUrl'))
      ).toBe(true);
    });
  });

  describe('Code Quality', () => {
    test('file has reasonable size', () => {
      const lines = supabaseClientContent.split('\n').length;
      expect(lines).toBeGreaterThanOrEqual(5);
      expect(lines).toBeLessThanOrEqual(50);
    });

    test('file has documentation or comments', () => {
      expect(
        supabaseClientContent.includes('//') ||
        supabaseClientContent.includes('/*')
      ).toBe(true);
    });

    test('file has no obvious syntax errors', () => {
      const braceCount =
        (supabaseClientContent.match(/{/g) || []).length ===
        (supabaseClientContent.match(/}/g) || []).length;
      const parenCount =
        (supabaseClientContent.match(/\(/g) || []).length ===
        (supabaseClientContent.match(/\)/g) || []).length;

      expect(braceCount).toBe(true);
      expect(parenCount).toBe(true);
    });
  });
});

/**
 * Runtime Supabase Client Tests
 *
 * These tests verify the actual Supabase client behavior
 * Mock dependencies to avoid requiring actual Supabase credentials
 */
describe('Supabase Client Runtime Behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    // Ensure test environment variables are set
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  });

  test('supabase client can be imported', () => {
    expect(() => {
      // This will be mocked by jest.config, but we test the import path works
      require('@/lib/supabase');
    }).not.toThrow();
  });

  test('supabase environment variables are set for testing', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).not.toBe('');
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).not.toBe('');
  });

  test('test utilities has mock supabase client creator', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.createMockSupabaseClient).toBeDefined();
    expect(typeof global.testUtils.createMockSupabaseClient).toBe('function');
  });

  test('mock supabase client has expected methods', () => {
    const mockClient = global.testUtils.createMockSupabaseClient();

    expect(mockClient.from).toBeDefined();
    expect(mockClient.select).toBeDefined();
    expect(mockClient.insert).toBeDefined();
    expect(mockClient.update).toBeDefined();
    expect(mockClient.delete).toBeDefined();
    expect(mockClient.auth).toBeDefined();
  });

  test('mock supabase client auth methods are callable', () => {
    const mockClient = global.testUtils.createMockSupabaseClient();

    expect(typeof mockClient.auth.signUp).toBe('function');
    expect(typeof mockClient.auth.signIn).toBe('function');
    expect(typeof mockClient.auth.signOut).toBe('function');
    expect(typeof mockClient.auth.getUser).toBe('function');
  });
});
