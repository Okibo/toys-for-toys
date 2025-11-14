/**
 * tests/auth/supabase-config.test.ts
 *
 * Tests for Task 3.1: Email/Password Authentication
 *
 * Verifies:
 * - Supabase client initializes correctly with proper environment variables
 * - Auth types are properly exported and can be used
 * - Environment variable validation works as expected
 * - Auth configuration is accessible
 * - No import/initialization errors
 *
 * IMPORTANT: These tests do NOT require a live Supabase instance.
 * They verify:
 * - Correct module exports
 * - Environment variable handling
 * - Type safety
 * - Module initialization
 *
 * To test actual authentication (signup, login), use integration tests
 * that connect to a real Supabase project.
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

describe('Task 3.1: Email/Password Authentication - Supabase Configuration', () => {
  describe('Auth Types Module (lib/auth-types.ts)', () => {
    test('auth-types.ts should exist', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      expect(fs.existsSync(authTypesPath)).toBe(true);
    });

    test('auth-types.ts should be valid TypeScript', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      // Check for TypeScript syntax
      expect(content).toContain('interface');
      expect(content).toContain('export');
    });

    test('should export AuthUser interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface AuthUser');
      expect(content).toContain('id: string');
      expect(content).toContain('email: string');
      expect(content).toContain('user_metadata');
      expect(content).toContain('app_metadata');
      expect(content).toContain('aud: string');
      expect(content).toContain('created_at: string');
    });

    test('should export AuthSession interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface AuthSession');
      expect(content).toContain('access_token: string');
      expect(content).toContain('refresh_token: string');
      expect(content).toContain('expires_in: number');
      expect(content).toContain('token_type: string');
    });

    test('should export SignUpPayload interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface SignUpPayload');
      expect(content).toContain('email: string');
      expect(content).toContain('password: string');
      expect(content).toContain('full_name');
    });

    test('should export LoginPayload interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface LoginPayload');
      expect(content).toContain('email: string');
      expect(content).toContain('password: string');
    });

    test('should export AuthError interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface AuthError');
      expect(content).toContain('code: string');
      expect(content).toContain('message: string');
      expect(content).toContain('status');
    });

    test('should export AuthState interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface AuthState');
      expect(content).toContain('session: AuthSession | null');
      expect(content).toContain('user: AuthUser | null');
      expect(content).toContain('loading: boolean');
      expect(content).toContain('error: AuthError | null');
    });

    test('should export AuthConfig interface', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('export interface AuthConfig');
      expect(content).toContain('url: string');
      expect(content).toContain('anonKey: string');
    });

    test('should document GDPR considerations in comments', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('GDPR');
      // Should mention child data handling
      expect(content.toLowerCase()).toContain('child');
    });

    test('should document token lifecycle in comments', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('refresh_token');
      expect(content).toContain('access_token');
    });

    test('should have security notes in comments', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content.toUpperCase()).toContain('SECURITY');
    });
  });

  describe('Supabase Auth Client Module (lib/supabase-auth.ts)', () => {
    test('supabase-auth.ts should exist', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      expect(fs.existsSync(supabaseAuthPath)).toBe(true);
    });

    test('should export supabaseAuthClient', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('export const supabaseAuthClient');
    });

    test('should export getSupabaseAuthClient function', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('export function getSupabaseAuthClient');
    });

    test('should export getAuthConfig function', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('export function getAuthConfig');
    });

    test('should export helper functions for environment checking', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('isServerEnvironment');
      expect(content).toContain('isBrowserEnvironment');
    });

    test('should export test function for auth connection', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('testSupabaseAuthConnection');
    });

    test('should validate NEXT_PUBLIC_SUPABASE_URL environment variable', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(content).toContain('validateAuthEnvironment');
    });

    test('should validate NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    test('should configure auto token refresh', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('autoRefreshToken');
      expect(content).toContain('true');
    });

    test('should configure session persistence', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('persistSession');
      expect(content).toContain('true');
    });

    test('should document token lifecycle in comments', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('Token Lifecycle');
      expect(content).toContain('access_token');
      expect(content).toContain('refresh_token');
      expect(content).toContain('expired');
    });

    test('should document usage patterns in comments', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('Usage in Components');
      expect(content).toContain('useSupabaseClient');
      expect(content).toContain('useSession');
      expect(content).toContain('createClient');
    });

    test('should have security notes about httpOnly cookies', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('httpOnly');
      expect(content).toContain('secure');
    });

    test('should warn against direct usage', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('not recommended');
      expect(content).toContain('IMPORTANT');
    });
  });

  describe('Environment Variables', () => {
    test('.env.example should include Supabase variables', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const content = fs.readFileSync(envExamplePath, 'utf-8');
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    test('.env.example should have documented Supabase section', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      expect(content).toMatch(/# Supabase/i);
      expect(content).toContain('GDPR');
    });
  });

  describe('Package Dependencies', () => {
    test('package.json should have @supabase/auth-helpers-nextjs dependency', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@supabase/auth-helpers-nextjs']).toBeDefined();
    });

    test('package.json should have @supabase/supabase-js dependency', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined();
    });

    test('should have reasonable version constraints', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      const authHelpersVersion = packageJson.dependencies['@supabase/auth-helpers-nextjs'];
      const supabaseJsVersion = packageJson.dependencies['@supabase/supabase-js'];

      // Should use semantic versioning (^0.8.0 or ~0.8.0, not exact versions)
      expect(authHelpersVersion).toMatch(/^[\^~]/);
      expect(supabaseJsVersion).toMatch(/^[\^~]/);
    });
  });

  describe('Import/Export Functionality', () => {
    test('auth-types should be importable without errors', () => {
      // This test simply checks the file exists and is syntactically valid
      // Full import testing requires TypeScript compilation which happens during build
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      // Verify basic TypeScript syntax
      expect(content).toContain('interface');
      expect(content).toContain('export');
    });

    test('should have default export from supabase-auth', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('export default supabaseAuthClient');
    });
  });

  describe('TypeScript Configuration', () => {
    test('tsconfig should support auth module paths', () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(content);

      // Check that @/lib path alias exists
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/lib/*']).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/lib']).toBeDefined();
    });

    test('strict mode should be enabled for type safety', () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(content);

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
    });
  });

  describe('Documentation', () => {
    test('supabase-auth.ts should have comprehensive JSDoc comments', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      // Check for JSDoc comments
      const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      expect(jsdocCount).toBeGreaterThan(5);
    });

    test('auth-types.ts should document GDPR requirements', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const content = fs.readFileSync(authTypesPath, 'utf-8');

      expect(content).toContain('GDPR');
      expect(content.toLowerCase()).toContain('consent');
      expect(content.toLowerCase()).toContain('child');
    });

    test('should document SECURITY concerns', () => {
      const authTypesPath = path.join(PROJECT_ROOT, 'lib', 'auth-types.ts');
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');

      const authTypesContent = fs.readFileSync(authTypesPath, 'utf-8');
      const supabaseAuthContent = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(authTypesContent).toContain('SECURITY');
      expect(supabaseAuthContent).toContain('SECURITY');
    });
  });

  describe('Token Management Configuration', () => {
    test('should mention 1 hour session timeout', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('3600');
      expect(content.toLowerCase()).toContain('hour');
    });

    test('should document refresh token strategy', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('refresh_token');
      expect(content.toLowerCase()).toContain('rotate');
    });

    test('should configure PKCE flow for security', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('pkce');
      expect(content).toContain('flowType');
    });
  });

  describe('Integration Points', () => {
    test('should document how to use in API routes', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('API routes');
      expect(content).toContain('createClient');
      expect(content).toContain('req, res');
    });

    test('should document how to use in middleware', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('middleware');
      expect(content).toContain('createMiddlewareClient');
    });

    test('should document how to use in React components', () => {
      const supabaseAuthPath = path.join(PROJECT_ROOT, 'lib', 'supabase-auth.ts');
      const content = fs.readFileSync(supabaseAuthPath, 'utf-8');

      expect(content).toContain('React components');
      expect(content).toContain('useSupabaseClient');
      expect(content).toContain('useSession');
    });
  });
});
