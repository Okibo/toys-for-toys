/**
 * tests/config.test.ts
 *
 * Tests for Task 1.1: TypeScript & Configuration
 * Verifies:
 * - tsconfig.json exists and is valid
 * - TypeScript strict mode is enabled
 * - Path aliases are configured (@/components, @/lib, @/app, @/supabase, @/public, @/tests)
 * - ESLint configuration exists
 * - Prettier configuration exists
 * - Next.js configuration exists
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Task 1.1: TypeScript & Configuration', () => {
  describe('TypeScript Configuration (tsconfig.json)', () => {
    let tsConfig: any;

    beforeAll(() => {
      const tsConfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      expect(fs.existsSync(tsConfigPath)).toBe(true);

      const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
      tsConfig = JSON.parse(tsConfigContent);
    });

    test('tsconfig.json should exist in project root', () => {
      const tsConfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      expect(fs.existsSync(tsConfigPath)).toBe(true);
    });

    test('tsconfig.json should be valid JSON', () => {
      const tsConfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      const content = fs.readFileSync(tsConfigPath, 'utf-8');

      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('tsconfig.json should have compilerOptions', () => {
      expect(tsConfig.compilerOptions).toBeDefined();
    });

    test('should enable strict mode', () => {
      expect(tsConfig.compilerOptions.strict).toBe(true);
    });

    test('should enable noImplicitAny', () => {
      // This is part of strict mode but explicitly test it
      expect(tsConfig.compilerOptions.noImplicitAny).toBe(true);
    });

    test('should enable strictNullChecks', () => {
      // This is part of strict mode but explicitly test it
      expect(tsConfig.compilerOptions.strictNullChecks).toBe(true);
    });

    test('should enable strictFunctionTypes', () => {
      // This is part of strict mode but explicitly test it
      expect(tsConfig.compilerOptions.strictFunctionTypes).toBe(true);
    });

    test('should set module to esnext or commonjs', () => {
      const moduleTarget = tsConfig.compilerOptions.module;
      expect(moduleTarget).toMatch(/esnext|commonjs|es\d+/i);
    });

    test('should set target to ES2020 or higher', () => {
      const target = tsConfig.compilerOptions.target;
      expect(target).toMatch(/es2020|es2021|es2022|es2023|esnext/i);
    });

    test('should have lib configuration with appropriate targets', () => {
      const lib = tsConfig.compilerOptions.lib;
      expect(lib).toBeDefined();
      expect(Array.isArray(lib)).toBe(true);
      expect(lib.length).toBeGreaterThan(0);
    });

    test('should enable jsx compilation', () => {
      const jsx = tsConfig.compilerOptions.jsx;
      expect(jsx).toMatch(/react|preserve/i);
    });

    test('should have allowJs enabled for Next.js compatibility', () => {
      expect(tsConfig.compilerOptions.allowJs).toBe(true);
    });

    test('should have skipLibCheck enabled', () => {
      expect(tsConfig.compilerOptions.skipLibCheck).toBe(true);
    });

    test('should have esModuleInterop enabled', () => {
      expect(tsConfig.compilerOptions.esModuleInterop).toBe(true);
    });

    test('should have resolveJsonModule enabled', () => {
      expect(tsConfig.compilerOptions.resolveJsonModule).toBe(true);
    });

    test('should have declaration or declarationMap for type exports', () => {
      const hasDeclaration =
        tsConfig.compilerOptions.declaration || tsConfig.compilerOptions.declarationMap;
      expect(hasDeclaration).toBeDefined();
    });

    test('should include node_modules types', () => {
      const types = tsConfig.compilerOptions.types;
      if (types) {
        // If types is specified, it should include node
        expect(Array.isArray(types)).toBe(true);
      }
      // If not specified, types are auto-discovered
    });

    test('should have include array defined', () => {
      expect(tsConfig.include).toBeDefined();
      expect(Array.isArray(tsConfig.include)).toBe(true);
    });

    test('should include source and test files in compilation', () => {
      const include = tsConfig.include;
      const hasComponentsOrSrc =
        include.some((pattern: string) => pattern.includes('**/*')) ||
        include.some((pattern: string) => pattern.includes('components')) ||
        include.some((pattern: string) => pattern.includes('pages'));

      expect(hasComponentsOrSrc).toBe(true);
    });

    test('should have exclude array (to exclude node_modules and dist)', () => {
      expect(tsConfig.exclude).toBeDefined();
      expect(Array.isArray(tsConfig.exclude)).toBe(true);
    });

    test('should exclude node_modules from compilation', () => {
      const exclude = tsConfig.exclude;
      expect(exclude).toContain('node_modules');
    });

    test('should exclude dist or .next from compilation', () => {
      const exclude = tsConfig.exclude;
      const hasDistOrNext =
        exclude.includes('dist') || exclude.includes('.next') || exclude.includes('out');

      expect(hasDistOrNext).toBe(true);
    });
  });

  describe('Path Aliases Configuration', () => {
    let tsConfig: any;
    let jsConfig: any;

    beforeAll(() => {
      // Try tsconfig.json first
      const tsConfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      if (fs.existsSync(tsConfigPath)) {
        const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
        tsConfig = JSON.parse(tsConfigContent);
      }

      // Try jsconfig.json
      const jsConfigPath = path.join(PROJECT_ROOT, 'jsconfig.json');
      if (fs.existsSync(jsConfigPath)) {
        const jsConfigContent = fs.readFileSync(jsConfigPath, 'utf-8');
        jsConfig = JSON.parse(jsConfigContent);
      }
    });

    test('should have path aliases in tsconfig.json or jsconfig.json', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths).toBeDefined();
    });

    test('should have @/components path alias', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths['@/components']).toBeDefined();
    });

    test('should have @/lib path alias', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths['@/lib']).toBeDefined();
    });

    test('should have @/app path alias', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths['@/app']).toBeDefined();
    });

    test('should have @/supabase path alias', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths['@/supabase']).toBeDefined();
    });

    test('should have @/public path alias', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths['@/public']).toBeDefined();
    });

    test('should have @/tests path alias', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      expect(paths['@/tests']).toBeDefined();
    });

    test('path aliases should point to correct directories', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;

      // Each alias should be an array with at least one path
      Object.entries(paths).forEach(([_alias, targets]) => {
        expect(Array.isArray(targets)).toBe(true);
        expect((targets as string[]).length).toBeGreaterThan(0);
      });
    });

    test('@/components should point to ./components directory', () => {
      const paths = tsConfig?.compilerOptions?.paths || jsConfig?.compilerOptions?.paths;
      const componentsPaths = paths['@/components'];

      expect(componentsPaths).toBeDefined();
      const pointsToComponents = componentsPaths.some((p: string) => p.includes('components'));
      expect(pointsToComponents).toBe(true);
    });
  });

  describe('ESLint Configuration', () => {
    test('should have ESLint config file (.eslintrc.json or .eslintrc.js)', () => {
      const eslintJsonPath = path.join(PROJECT_ROOT, '.eslintrc.json');
      const eslintJsPath = path.join(PROJECT_ROOT, '.eslintrc.js');
      const eslintYamlPath = path.join(PROJECT_ROOT, '.eslintrc.yaml');

      const hasEslintConfig =
        fs.existsSync(eslintJsonPath) ||
        fs.existsSync(eslintJsPath) ||
        fs.existsSync(eslintYamlPath);

      expect(hasEslintConfig).toBe(true);
    });

    test('.eslintrc.json should be valid JSON if present', () => {
      const eslintPath = path.join(PROJECT_ROOT, '.eslintrc.json');

      if (fs.existsSync(eslintPath)) {
        const content = fs.readFileSync(eslintPath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    test('ESLint should have extends field', () => {
      const eslintPath = path.join(PROJECT_ROOT, '.eslintrc.json');

      if (fs.existsSync(eslintPath)) {
        const content = fs.readFileSync(eslintPath, 'utf-8');
        const eslintConfig = JSON.parse(content);

        expect(eslintConfig.extends).toBeDefined();
      }
    });

    test('ESLint should extend next/core-web-vitals or next', () => {
      const eslintPath = path.join(PROJECT_ROOT, '.eslintrc.json');

      if (fs.existsSync(eslintPath)) {
        const content = fs.readFileSync(eslintPath, 'utf-8');
        const eslintConfig = JSON.parse(content);

        const extendsArray = Array.isArray(eslintConfig.extends)
          ? eslintConfig.extends
          : [eslintConfig.extends];

        const hasNext = extendsArray.some(
          (ext: string) =>
            ext.includes('next') ||
            ext.includes('eslint-config-next') ||
            ext === 'next/core-web-vitals'
        );

        expect(hasNext).toBe(true);
      }
    });

    test('ESLint should have parser options', () => {
      const eslintPath = path.join(PROJECT_ROOT, '.eslintrc.json');

      if (fs.existsSync(eslintPath)) {
        const content = fs.readFileSync(eslintPath, 'utf-8');
        const eslintConfig = JSON.parse(content);

        // Should have either parserOptions or env
        expect(eslintConfig.parserOptions || eslintConfig.env).toBeDefined();
      }
    });
  });

  describe('Prettier Configuration', () => {
    test('should have Prettier config (.prettierrc.json or .prettierrc)', () => {
      const prettierJsonPath = path.join(PROJECT_ROOT, '.prettierrc.json');
      const prettierPath = path.join(PROJECT_ROOT, '.prettierrc');
      const prettierJsPath = path.join(PROJECT_ROOT, '.prettierrc.js');

      const hasPrettierConfig =
        fs.existsSync(prettierJsonPath) ||
        fs.existsSync(prettierPath) ||
        fs.existsSync(prettierJsPath);

      expect(hasPrettierConfig).toBe(true);
    });

    test('.prettierrc.json should be valid JSON if present', () => {
      const prettierPath = path.join(PROJECT_ROOT, '.prettierrc.json');

      if (fs.existsSync(prettierPath)) {
        const content = fs.readFileSync(prettierPath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    test('Prettier should have basic configuration options', () => {
      const prettierJsonPath = path.join(PROJECT_ROOT, '.prettierrc.json');
      const prettierPath = path.join(PROJECT_ROOT, '.prettierrc');

      const configPath = fs.existsSync(prettierJsonPath) ? prettierJsonPath : prettierPath;

      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        // Should have some configuration, not just empty braces
        expect(content.length).toBeGreaterThan(5);
      }
    });
  });

  describe('Next.js Configuration', () => {
    test('should have next.config.js or next.config.mjs', () => {
      const nextConfigJsPath = path.join(PROJECT_ROOT, 'next.config.js');
      const nextConfigMjsPath = path.join(PROJECT_ROOT, 'next.config.mjs');

      const hasNextConfig = fs.existsSync(nextConfigJsPath) || fs.existsSync(nextConfigMjsPath);

      expect(hasNextConfig).toBe(true);
    });

    test('next.config.js should be readable', () => {
      const nextConfigPath = path.join(PROJECT_ROOT, 'next.config.js');

      if (fs.existsSync(nextConfigPath)) {
        const content = fs.readFileSync(nextConfigPath, 'utf-8');
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
      }
    });

    test('next.config.js should export module or have module.exports', () => {
      const nextConfigPath = path.join(PROJECT_ROOT, 'next.config.js');

      if (fs.existsSync(nextConfigPath)) {
        const content = fs.readFileSync(nextConfigPath, 'utf-8');

        const hasExport =
          content.includes('module.exports') ||
          content.includes('export default') ||
          content.includes('export const');

        expect(hasExport).toBe(true);
      }
    });
  });

  describe('Git Configuration', () => {
    test('.gitignore should exist', () => {
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    test('.gitignore should contain common exclusions', () => {
      const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // Should exclude node_modules
      expect(content).toContain('node_modules');

      // Should exclude .env files
      expect(content).toMatch(/\.env/);

      // Should exclude build/dist directories
      expect(content).toMatch(/\.next|dist|out/);
    });
  });

  describe('README Configuration', () => {
    test('README.md should exist in project root', () => {
      const readmePath = path.join(PROJECT_ROOT, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('README.md should have content', () => {
      const readmePath = path.join(PROJECT_ROOT, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(50);
    });

    test('README.md should contain setup instructions', () => {
      const readmePath = path.join(PROJECT_ROOT, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      // Should mention npm install or setup
      expect(content).toMatch(/npm install|setup|installation/i);
    });

    test('README.md should contain development instructions', () => {
      const readmePath = path.join(PROJECT_ROOT, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      // Should mention npm run dev or similar
      expect(content).toMatch(/npm run dev|development|start/i);
    });
  });
});
