/**
 * TypeScript Configuration Validation Tests
 * Comprehensive testing of tsconfig.json strict mode and compiler options
 * Validates all requirements for type-safe project setup
 */

import fs from 'fs';
import path from 'path';

describe('TypeScript Configuration', () => {
  let tsconfigPath: string;
  let tsconfigContent: Record<string, any>;

  beforeAll(() => {
    tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const rawContent = fs.readFileSync(tsconfigPath, 'utf-8');
    tsconfigContent = JSON.parse(rawContent);
  });

  describe('File Existence and Validity', () => {
    test('tsconfig.json exists', () => {
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    test('tsconfig.json is valid JSON', () => {
      expect(() => {
        const rawContent = fs.readFileSync(tsconfigPath, 'utf-8');
        JSON.parse(rawContent);
      }).not.toThrow();
    });

    test('tsconfig.json has compilerOptions', () => {
      expect(tsconfigContent).toHaveProperty('compilerOptions');
      expect(typeof tsconfigContent.compilerOptions).toBe('object');
    });
  });

  describe('Strict Mode Configuration', () => {
    test('strict mode is enabled', () => {
      expect(tsconfigContent.compilerOptions.strict).toBe(true);
    });

    test('noImplicitAny is enabled', () => {
      expect(tsconfigContent.compilerOptions.noImplicitAny).toBe(true);
    });

    test('strictNullChecks is enabled (via strict)', () => {
      // When strict: true, this is automatically enabled
      // Verify it's not explicitly disabled
      expect(
        tsconfigContent.compilerOptions.strictNullChecks !== false
      ).toBe(true);
    });

    test('strictFunctionTypes is enabled (via strict)', () => {
      expect(
        tsconfigContent.compilerOptions.strictFunctionTypes !== false
      ).toBe(true);
    });

    test('strictBindCallApply is enabled (via strict)', () => {
      expect(
        tsconfigContent.compilerOptions.strictBindCallApply !== false
      ).toBe(true);
    });

    test('strictPropertyInitialization is enabled (via strict)', () => {
      expect(
        tsconfigContent.compilerOptions.strictPropertyInitialization !== false
      ).toBe(true);
    });
  });

  describe('Compiler Options - Module and Target', () => {
    test('target is ES2020', () => {
      expect(tsconfigContent.compilerOptions.target).toBe('ES2020');
    });

    test('module is ESNext', () => {
      expect(tsconfigContent.compilerOptions.module).toBe('ESNext');
    });

    test('moduleResolution is node', () => {
      expect(tsconfigContent.compilerOptions.moduleResolution).toBe('node');
    });
  });

  describe('Compiler Options - Library Configuration', () => {
    test('lib includes ES2020', () => {
      expect(tsconfigContent.compilerOptions.lib).toContain('ES2020');
    });

    test('lib includes DOM', () => {
      expect(tsconfigContent.compilerOptions.lib).toContain('DOM');
    });

    test('lib includes DOM.Iterable', () => {
      expect(tsconfigContent.compilerOptions.lib).toContain('DOM.Iterable');
    });

    test('lib is array type', () => {
      expect(Array.isArray(tsconfigContent.compilerOptions.lib)).toBe(true);
    });
  });

  describe('Compiler Options - JSX Configuration', () => {
    test('jsx is set to react-jsx (React 17+)', () => {
      expect(tsconfigContent.compilerOptions.jsx).toBe('react-jsx');
    });
  });

  describe('Compiler Options - Strict Quality Checks', () => {
    test('noImplicitReturns is enabled', () => {
      expect(tsconfigContent.compilerOptions.noImplicitReturns).toBe(true);
    });

    test('noUnusedLocals is enabled', () => {
      expect(tsconfigContent.compilerOptions.noUnusedLocals).toBe(true);
    });

    test('noUnusedParameters is enabled', () => {
      expect(tsconfigContent.compilerOptions.noUnusedParameters).toBe(true);
    });

    test('forceConsistentCasingInFileNames is enabled', () => {
      expect(
        tsconfigContent.compilerOptions.forceConsistentCasingInFileNames
      ).toBe(true);
    });
  });

  describe('Compiler Options - Module and Interop', () => {
    test('esModuleInterop is enabled', () => {
      expect(tsconfigContent.compilerOptions.esModuleInterop).toBe(true);
    });

    test('allowSyntheticDefaultImports is enabled', () => {
      expect(tsconfigContent.compilerOptions.allowSyntheticDefaultImports).toBe(
        true
      );
    });

    test('skipLibCheck is enabled', () => {
      expect(tsconfigContent.compilerOptions.skipLibCheck).toBe(true);
    });

    test('resolveJsonModule is enabled', () => {
      expect(tsconfigContent.compilerOptions.resolveJsonModule).toBe(true);
    });
  });

  describe('Compiler Options - Declaration and Source Maps', () => {
    test('declaration is enabled', () => {
      expect(tsconfigContent.compilerOptions.declaration).toBe(true);
    });

    test('declarationMap is enabled', () => {
      expect(tsconfigContent.compilerOptions.declarationMap).toBe(true);
    });

    test('sourceMap is enabled', () => {
      expect(tsconfigContent.compilerOptions.sourceMap).toBe(true);
    });
  });

  describe('Compiler Options - Performance and Isolation', () => {
    test('incremental compilation is enabled', () => {
      expect(tsconfigContent.compilerOptions.incremental).toBe(true);
    });

    test('isolatedModules is enabled', () => {
      expect(tsconfigContent.compilerOptions.isolatedModules).toBe(true);
    });

    test('useDefineForClassFields is enabled', () => {
      expect(tsconfigContent.compilerOptions.useDefineForClassFields).toBe(
        true
      );
    });
  });

  describe('Path Aliases Configuration', () => {
    test('baseUrl is set to current directory', () => {
      expect(tsconfigContent.compilerOptions.baseUrl).toBe('.');
    });

    test('paths object exists', () => {
      expect(tsconfigContent.compilerOptions).toHaveProperty('paths');
      expect(typeof tsconfigContent.compilerOptions.paths).toBe('object');
    });

    test('@/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty('@/*');
      expect(tsconfigContent.compilerOptions.paths['@/*']).toEqual(['./*']);
    });

    test('@/components/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty(
        '@/components/*'
      );
      expect(tsconfigContent.compilerOptions.paths['@/components/*']).toEqual([
        './components/*',
      ]);
    });

    test('@/pages/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty('@/pages/*');
      expect(tsconfigContent.compilerOptions.paths['@/pages/*']).toEqual([
        './pages/*',
      ]);
    });

    test('@/lib/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty('@/lib/*');
      expect(tsconfigContent.compilerOptions.paths['@/lib/*']).toEqual([
        './lib/*',
      ]);
    });

    test('@/public/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty(
        '@/public/*'
      );
      expect(tsconfigContent.compilerOptions.paths['@/public/*']).toEqual([
        './public/*',
      ]);
    });

    test('@/tests/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty(
        '@/tests/*'
      );
      expect(tsconfigContent.compilerOptions.paths['@/tests/*']).toEqual([
        './tests/*',
      ]);
    });

    test('@/types/* alias is configured', () => {
      expect(tsconfigContent.compilerOptions.paths).toHaveProperty('@/types/*');
      expect(tsconfigContent.compilerOptions.paths['@/types/*']).toEqual([
        './types/*',
      ]);
    });

    test('all path aliases use consistent format', () => {
      const paths = tsconfigContent.compilerOptions.paths;
      Object.entries(paths).forEach(([_aliasKey, mappings]) => {
        expect(Array.isArray(mappings)).toBe(true);
        expect((mappings as string[]).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Include and Exclude Configuration', () => {
    test('include array exists', () => {
      expect(Array.isArray(tsconfigContent.include)).toBe(true);
      expect(tsconfigContent.include.length).toBeGreaterThan(0);
    });

    test('include contains next-env.d.ts', () => {
      expect(tsconfigContent.include).toContain('next-env.d.ts');
    });

    test('include contains wildcard TypeScript patterns', () => {
      const hasWildcardTs = tsconfigContent.include.some((item: string) =>
        item.includes('**/*.ts')
      );
      const hasWildcardTsx = tsconfigContent.include.some((item: string) =>
        item.includes('**/*.tsx')
      );
      expect(hasWildcardTs || hasWildcardTsx).toBe(true);
    });

    test('exclude array exists', () => {
      expect(Array.isArray(tsconfigContent.exclude)).toBe(true);
      expect(tsconfigContent.exclude.length).toBeGreaterThan(0);
    });

    test('exclude contains node_modules', () => {
      expect(tsconfigContent.exclude).toContain('node_modules');
    });

    test('exclude contains .next', () => {
      expect(tsconfigContent.exclude).toContain('.next');
    });

    test('exclude contains dist', () => {
      expect(tsconfigContent.exclude).toContain('dist');
    });
  });

  describe('Path Alias Directory Validation', () => {
    test('alias paths point to existing directories', () => {
      const aliasesToCheck = [
        'components',
        'pages',
        'lib',
        'public',
        'tests',
        'types',
      ];

      aliasesToCheck.forEach((aliasName) => {
        const dirPath = path.join(process.cwd(), aliasName);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe('TypeScript Configuration Quality Metrics', () => {
    test('configuration has at least 30 compiler options set', () => {
      const optionCount = Object.keys(
        tsconfigContent.compilerOptions
      ).length;
      expect(optionCount).toBeGreaterThanOrEqual(30);
    });

    test('configuration has proper include patterns', () => {
      expect(tsconfigContent.include.length).toBeGreaterThanOrEqual(3);
    });

    test('configuration has proper exclude patterns', () => {
      expect(tsconfigContent.exclude).toHaveLength(3);
    });

    test('all required strict options are properly configured', () => {
      const requiredOptions = [
        'strict',
        'noImplicitAny',
        'noImplicitReturns',
        'noUnusedLocals',
        'noUnusedParameters',
        'forceConsistentCasingInFileNames',
      ];

      requiredOptions.forEach((option) => {
        expect(tsconfigContent.compilerOptions[option]).toBe(true);
      });
    });

    test('module resolution is properly configured for monorepo', () => {
      expect(tsconfigContent.compilerOptions.moduleResolution).toBe('node');
      expect(tsconfigContent.compilerOptions.baseUrl).toBe('.');
      expect(
        tsconfigContent.compilerOptions.paths &&
          Object.keys(tsconfigContent.compilerOptions.paths).length > 0
      ).toBe(true);
    });
  });

  describe('Next.js Specific Configuration', () => {
    test('jsx configuration is compatible with Next.js 13+', () => {
      expect(tsconfigContent.compilerOptions.jsx).toMatch(/react-jsx|preserve/);
    });

    test('target is modern enough for Next.js', () => {
      const validTargets = ['ES2020', 'ES2021', 'ES2022', 'ESNext'];
      expect(validTargets).toContain(tsconfigContent.compilerOptions.target);
    });

    test('module is compatible with Next.js', () => {
      const validModules = ['ESNext', 'commonjs', 'esnext'];
      expect(validModules).toContain(
        tsconfigContent.compilerOptions.module.toLowerCase()
      );
    });
  });

  describe('Configuration Production Readiness', () => {
    test('all critical strict checks are enabled', () => {
      const criticalChecks = [
        'strict',
        'noImplicitAny',
        'esModuleInterop',
        'skipLibCheck',
        'forceConsistentCasingInFileNames',
        'resolveJsonModule',
      ];

      criticalChecks.forEach((check) => {
        expect(tsconfigContent.compilerOptions[check]).toBe(true);
      });
    });

    test('configuration has source maps for debugging', () => {
      expect(tsconfigContent.compilerOptions.sourceMap).toBe(true);
      expect(tsconfigContent.compilerOptions.declarationMap).toBe(true);
    });

    test('configuration has incremental builds for performance', () => {
      expect(tsconfigContent.compilerOptions.incremental).toBe(true);
    });

    test('configuration prevents unused code in strict mode', () => {
      expect(tsconfigContent.compilerOptions.noUnusedLocals).toBe(true);
      expect(tsconfigContent.compilerOptions.noUnusedParameters).toBe(true);
    });
  });
});
