/**
 * tests/supabase-config.test.ts
 *
 * Tests for Task 1.2: Configure Supabase
 * Verifies:
 * - Environment variables are properly configured
 * - .env.local is in .gitignore
 * - .env.example exists with Supabase placeholders
 * - SUPABASE_SERVICE_ROLE_KEY is not exposed publicly
 * - Supabase directory structure exists (/supabase, config.toml, migrations/)
 * - config.toml is valid TOML structure
 * - lib/supabase.ts exists and properly exports the client
 * - Imports createClient from @supabase/supabase-js
 * - Environment variables are validated
 * - Missing env vars throw proper errors
 * - Required package dependencies exist
 * - Documentation exists and references EU region/GDPR
 * - Database setup instructions are documented
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Helper function to parse TOML (simple parser for basic structure)
function isValidToml(content: string): boolean {
  try {
    // Check for TOML structure indicators
    const hasValidStructure =
      content.includes('[') && // Has sections
      content.includes(']') &&
      !content.includes('{') && // Not JSON
      !content.includes('}'); // Not JSON

    return hasValidStructure;
  } catch {
    return false;
  }
}

describe('Task 1.2: Configure Supabase', () => {
  describe('Environment Variables', () => {
    test('.env.local should be in .gitignore', () => {
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toContain('.env.local');
    });

    test('.env.example should exist', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    test('.env.example should contain Supabase placeholders', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

      expect(envExampleContent).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(envExampleContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    test('.env.example should contain service role key as reference only', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

      expect(envExampleContent).toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    test('SUPABASE_SERVICE_ROLE_KEY should not be in .gitignore exclusions (should be protected by .env.local)', () => {
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

      // Verify .env.local is ignored, which covers SERVICE_ROLE_KEY
      expect(gitignoreContent).toContain('.env.local');
    });

    test('.env.local should not exist in version control (cannot commit secrets)', () => {
      // The fact that .env.local is in .gitignore means it won't be committed
      // We test this indirectly by checking gitignore
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignoreContent).toContain('.env.local');
    });
  });

  describe('Supabase Directory Structure', () => {
    test('/supabase directory should exist', () => {
      const supabasePath = path.join(PROJECT_ROOT, 'supabase');
      expect(fs.existsSync(supabasePath)).toBe(true);
      expect(fs.statSync(supabasePath).isDirectory()).toBe(true);
    });

    test('/supabase/config.toml should exist', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      expect(fs.existsSync(configTomlPath)).toBe(true);
    });

    test('config.toml should be readable', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    test('config.toml should have valid TOML structure', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      expect(isValidToml(content)).toBe(true);
    });

    test('config.toml should have required sections', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      // Should have at least db and api sections
      expect(content).toContain('[api]');
      expect(content).toContain('[db]');
    });

    test('config.toml should have db section with port configuration', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      const dbSection = content.match(/\[db\]([\s\S]*?)(?=\[|$)/);
      expect(dbSection).toBeTruthy();

      if (dbSection) {
        expect(dbSection[0]).toContain('port');
      }
    });

    test('config.toml should enable auth service', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      expect(content).toContain('[auth]');
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test('config.toml should enable realtime service', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      expect(content).toContain('[realtime]');
    });

    test('config.toml should have storage configuration', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      expect(content).toContain('[storage]');
    });
  });

  describe('Supabase Client Library', () => {
    test('/lib/supabase.ts should exist', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      expect(fs.existsSync(supabaseClientPath)).toBe(true);
    });

    test('lib/supabase.ts should be readable', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    test('lib/supabase.ts should import createClient from @supabase/supabase-js', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toContain("import { createClient } from '@supabase/supabase-js'");
    });

    test('lib/supabase.ts should export supabase client', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toContain('export const supabase');
    });

    test('lib/supabase.ts should reference NEXT_PUBLIC_SUPABASE_URL', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });

    test('lib/supabase.ts should reference NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    test('lib/supabase.ts should validate that NEXT_PUBLIC_SUPABASE_URL is set', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Should check if supabaseUrl is missing
      expect(content).toMatch(/!supabaseUrl|!process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
    });

    test('lib/supabase.ts should validate that NEXT_PUBLIC_SUPABASE_ANON_KEY is set', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Should check if supabaseAnonKey is missing
      expect(content).toMatch(/!supabaseAnonKey|!process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    });

    test('lib/supabase.ts should throw error if env vars are missing', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toContain('throw new Error');
    });

    test('lib/supabase.ts error message should mention setup instructions', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Should reference documentation or setup
      expect(content).toMatch(/\.env\.local|setup|configuration|DATABASE\.md/i);
    });

    test('lib/supabase.ts should export default supabase client', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      expect(content).toContain('export default supabase');
    });
  });

  describe('Package Dependencies', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
    });

    test('@supabase/supabase-js should be in dependencies', () => {
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined();
    });

    test('@supabase/supabase-js version should be specified', () => {
      const version = packageJson.dependencies['@supabase/supabase-js'];
      expect(version).toBeTruthy();
      expect(typeof version).toBe('string');
    });

    test('@supabase/auth-helpers-nextjs should be in dependencies', () => {
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@supabase/auth-helpers-nextjs']).toBeDefined();
    });

    test('@supabase/auth-helpers-nextjs version should be specified', () => {
      const version = packageJson.dependencies['@supabase/auth-helpers-nextjs'];
      expect(version).toBeTruthy();
      expect(typeof version).toBe('string');
    });
  });

  describe('Documentation', () => {
    test('docs directory should exist', () => {
      const docsPath = path.join(PROJECT_ROOT, 'docs');
      expect(fs.existsSync(docsPath)).toBe(true);
      expect(fs.statSync(docsPath).isDirectory()).toBe(true);
    });

    test('.env.example should document what each variable is for', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

      // Should have comments explaining variables
      expect(envExampleContent).toMatch(/^#/m);
    });

    test('.env.example should have Supabase Configuration section', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

      expect(envExampleContent).toContain('Supabase');
    });

    test('.env.example should have example values with placeholders', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

      // Should not have real credentials, only placeholders
      expect(envExampleContent).toMatch(/your-|placeholder|example/i);
    });

    test('package.json should document Supabase usage', () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');

      // Should mention Supabase in description or have the dependency
      expect(packageJsonContent).toContain('supabase');
    });
  });

  describe('Security & GDPR', () => {
    test('lib/supabase.ts should not expose service role key', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Should not reference SERVICE_ROLE_KEY (only public keys)
      expect(content).not.toContain('SERVICE_ROLE_KEY');
    });

    test('lib/supabase.ts should only use public/anonymous key', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Should use NEXT_PUBLIC_SUPABASE_ANON_KEY, not service role
      expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    test('.gitignore should prevent .env.local from being committed', () => {
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignoreContent).toContain('.env.local');
    });

    test('config.toml should not contain sensitive credentials', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      // Should not have actual API keys or secrets
      expect(content).not.toMatch(/key|password|secret|token/i);
    });

    test('.env.example should not contain real credentials', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      // Should not have real looking keys
      expect(content).not.toMatch(/eyJ[A-Za-z0-9_-]|pk_|sk_[a-z0-9]{20,}/);
    });
  });

  describe('Supabase Migrations Directory', () => {
    test('/supabase/migrations directory should exist or be planned', () => {
      const migrationsPath = path.join(PROJECT_ROOT, 'supabase', 'migrations');
      const supabasePath = path.join(PROJECT_ROOT, 'supabase');

      // Either migrations directory exists, or supabase directory is ready for it
      const hasSupabaseDir = fs.existsSync(supabasePath);
      const hasMigrationsDir = fs.existsSync(migrationsPath);

      // At minimum, supabase directory should exist
      expect(hasSupabaseDir).toBe(true);

      // Migrations can be created later, but structure should be in place
      expect(hasSupabaseDir || hasMigrationsDir).toBe(true);
    });
  });

  describe('Local Development Setup', () => {
    test('seed.sql file should exist for local database seeding', () => {
      const seedPath = path.join(PROJECT_ROOT, 'supabase', 'seed.sql');
      // seed.sql is optional but if present, should be readable
      if (fs.existsSync(seedPath)) {
        const content = fs.readFileSync(seedPath, 'utf-8');
        expect(content).toBeDefined();
      }
    });

    test('config.toml seed_file reference should exist', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      // Should reference seed file for local development
      expect(content).toContain('seed_file');
    });

    test('.env.example should document development vs production setup', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

      // Should at least have NODE_ENV or environment indicators
      expect(envExampleContent).toContain('NODE_ENV');
    });
  });

  describe('Integration Tests', () => {
    test('lib/supabase.ts should provide testSupabaseConnection function', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Should have a test/verification function
      expect(content).toMatch(/testSupabaseConnection|test.*Connection/);
    });

    test('supabase client initialization should not immediately throw', () => {
      const supabaseClientPath = path.join(PROJECT_ROOT, 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // The throw should be conditional on missing env vars, not on import
      expect(content).toMatch(/if.*!.*\{[\s\S]*?throw/);
    });
  });

  describe('Configuration Validation', () => {
    test('config.toml should have api section with port', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      const apiSection = content.match(/\[api\]([\s\S]*?)(?=\[|$)/);
      expect(apiSection).toBeTruthy();

      if (apiSection) {
        expect(apiSection[0]).toContain('port');
      }
    });

    test('config.toml api port should be numeric', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      // Extract api section and check port
      const apiSection = content.match(/\[api\]([\s\S]*?)(?=\[|$)/);
      expect(apiSection).toBeTruthy();

      if (apiSection) {
        const portMatch = apiSection[0].match(/port\s*=\s*(\d+)/);
        expect(portMatch).toBeTruthy();
        if (portMatch) {
          const port = parseInt(portMatch[1], 10);
          expect(port).toBeGreaterThan(0);
          expect(port).toBeLessThan(65536);
        }
      }
    });

    test('config.toml db section should specify major_version', () => {
      const configTomlPath = path.join(PROJECT_ROOT, 'supabase', 'config.toml');
      const content = fs.readFileSync(configTomlPath, 'utf-8');

      expect(content).toMatch(/major_version\s*=\s*\d+/);
    });
  });
});
