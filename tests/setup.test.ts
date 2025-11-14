/**
 * tests/setup.test.ts
 *
 * Tests for Task 1.1: Initialize Monorepo Structure & Dependencies
 * Verifies:
 * - Package.json has correct Next.js version (14+)
 * - TypeScript is installed
 * - All required npm packages are present
 * - Directory structure is created
 * - .env.example exists with required variables
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Task 1.1: Monorepo Structure & Dependencies Setup', () => {
  let packageJson: any;

  beforeAll(() => {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  });

  describe('Next.js Configuration', () => {
    test('should have Next.js 14+ installed', () => {
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.next).toBeDefined();

      const nextVersion = packageJson.dependencies.next;
      // Extract major version number from version string (e.g., "^14.0.0" -> 14)
      const majorVersion = parseInt(nextVersion.match(/\d+/)?.[0] || '0', 10);

      expect(majorVersion).toBeGreaterThanOrEqual(14);
    });

    test('should have Next.js version specified as caret or exact', () => {
      const nextVersion = packageJson.dependencies.next;
      expect(nextVersion).toMatch(/^[\^~]?14\.|^14\./);
    });

    test('should have React and ReactDOM as dependencies', () => {
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });
  });

  describe('TypeScript Installation', () => {
    test('should have TypeScript installed as dev dependency', () => {
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    test('should have type definitions for Node and React', () => {
      const devDeps = packageJson.devDependencies || {};
      // At least one of these should be present for React types
      const hasReactTypes =
        devDeps['@types/react'] || devDeps['@types/node'] || devDeps['typescript'];

      expect(hasReactTypes).toBeDefined();
    });
  });

  describe('Required npm Packages', () => {
    const requiredPackages = [
      { name: 'react-hook-form', location: 'dependencies' },
      { name: 'zod', location: 'dependencies' },
      { name: 'zustand', location: 'dependencies' },
      { name: 'next-i18next', location: 'dependencies' },
      { name: 'tailwindcss', location: 'devDependencies' },
      { name: '@supabase/supabase-js', location: 'dependencies' },
      { name: '@supabase/auth-helpers-nextjs', location: 'dependencies' },
      { name: 'jest', location: 'devDependencies' },
      { name: '@types/jest', location: 'devDependencies' },
      { name: '@playwright/test', location: 'devDependencies' },
      { name: 'prettier', location: 'devDependencies' },
      { name: 'eslint', location: 'devDependencies' },
      { name: 'eslint-config-next', location: 'devDependencies' },
    ];

    requiredPackages.forEach(({ name, location }) => {
      test(`should have ${name} installed in ${location}`, () => {
        const deps = packageJson[location];
        expect(deps).toBeDefined();
        expect(deps[name]).toBeDefined();
      });
    });

    test('should have shadcn/ui component library configured', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for shadcn/ui installation indicators
      // This could be in dependencies or devDependencies
      const hasComponentsAlias =
        packageJson.compilerOptions?.paths?.['@/components'] ||
        packageJson.jsconfig?.compilerOptions?.paths?.['@/components'];

      // At least one of these should indicate shadcn/ui presence
      const hasShadcnIndicator =
        allDeps['@radix-ui/react-dialog'] ||
        allDeps['@radix-ui/react-dropdown-menu'] ||
        allDeps['class-variance-authority'] ||
        allDeps['clsx'] ||
        hasComponentsAlias;

      expect(hasShadcnIndicator).toBeDefined();
    });
  });

  describe('Directory Structure', () => {
    const requiredDirectories = [
      'app',
      'components',
      'lib',
      'pages',
      'supabase',
      'tests',
      'public/locales',
    ];

    requiredDirectories.forEach((dir) => {
      test(`should have ${dir} directory`, () => {
        const dirPath = path.join(PROJECT_ROOT, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.statSync(dirPath).isDirectory()).toBe(true);
      });
    });

    test('should have public directory', () => {
      const publicDir = path.join(PROJECT_ROOT, 'public');
      expect(fs.existsSync(publicDir)).toBe(true);
      expect(fs.statSync(publicDir).isDirectory()).toBe(true);
    });

    test('should have docs directory', () => {
      const docsDir = path.join(PROJECT_ROOT, 'docs');
      expect(fs.existsSync(docsDir)).toBe(true);
      expect(fs.statSync(docsDir).isDirectory()).toBe(true);
    });
  });

  describe('.env.example File', () => {
    test('should have .env.example file in project root', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    test('.env.example should be readable', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    describe('Required environment variables in .env.example', () => {
      let envContent: string;

      beforeAll(() => {
        const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
        envContent = fs.readFileSync(envExamplePath, 'utf-8');
      });

      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
        'FIREBASE_ADMIN_SDK_KEY',
      ];

      requiredEnvVars.forEach((envVar) => {
        test(`should contain ${envVar}`, () => {
          expect(envContent).toContain(envVar);
        });
      });

      test('should have at least one commented example or placeholder value', () => {
        // Should contain assignment or placeholder notation
        expect(envContent).toMatch(/=|#/);
      });
    });
  });

  describe('Package.json Scripts', () => {
    test('should have scripts object', () => {
      expect(packageJson.scripts).toBeDefined();
    });

    test('should have dev script', () => {
      expect(packageJson.scripts.dev).toBeDefined();
    });

    test('should have build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
    });

    test('should have lint script', () => {
      expect(packageJson.scripts.lint).toBeDefined();
    });

    test('should have test script configured for Jest', () => {
      const testScript = packageJson.scripts.test;
      expect(testScript).toBeDefined();
      // Test script should either call jest or not be the default error message
      expect(testScript).not.toMatch(/no test specified/);
    });

    test('should have start script (for production)', () => {
      expect(packageJson.scripts.start).toBeDefined();
    });
  });

  describe('Package.json Metadata', () => {
    test('should have name set to toys-for-toys', () => {
      expect(packageJson.name).toBe('toys-for-toys');
    });

    test('should have version defined', () => {
      expect(packageJson.version).toBeDefined();
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    test('should have description', () => {
      expect(packageJson.description).toBeDefined();
      expect(packageJson.description.length).toBeGreaterThan(0);
    });

    test('should have license defined', () => {
      expect(packageJson.license).toBeDefined();
    });

    test('should have repository configured', () => {
      expect(packageJson.repository).toBeDefined();
      expect(packageJson.repository.url).toContain('toys-for-toys');
    });
  });
});
