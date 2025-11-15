/**
 * ESLint and Prettier Configuration Validation Tests
 *
 * This test suite validates that:
 * 1. ESLint configuration is valid JSON and contains required plugins
 * 2. Prettier configuration is valid JSON
 * 3. Configurations are compatible (no formatting/linting conflicts)
 * 4. Required rules are present and properly configured
 */

const fs = require('fs');
const path = require('path');

describe('Code Quality Configuration Validation', () => {
  const projectRoot = path.resolve(__dirname, '../../');

  describe('ESLint Configuration', () => {
    let eslintConfig;

    beforeAll(() => {
      const eslintPath = path.join(projectRoot, '.eslintrc.json');
      const configContent = fs.readFileSync(eslintPath, 'utf-8');
      eslintConfig = JSON.parse(configContent);
    });

    it('should have valid JSON syntax', () => {
      expect(eslintConfig).toBeDefined();
      expect(typeof eslintConfig).toBe('object');
    });

    it('should extend next/core-web-vitals', () => {
      expect(eslintConfig.extends).toBeDefined();
      const extendsArray = Array.isArray(eslintConfig.extends)
        ? eslintConfig.extends
        : [eslintConfig.extends];
      expect(extendsArray).toContain('next/core-web-vitals');
    });

    it('should have parser configured as @typescript-eslint/parser', () => {
      expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
    });

    it('should have required plugins', () => {
      expect(eslintConfig.plugins).toBeDefined();
      expect(Array.isArray(eslintConfig.plugins)).toBe(true);
      expect(eslintConfig.plugins).toContain('@typescript-eslint');
      expect(eslintConfig.plugins).toContain('react');
      expect(eslintConfig.plugins).toContain('react-hooks');
    });

    it('should have rules object defined', () => {
      expect(eslintConfig.rules).toBeDefined();
      expect(typeof eslintConfig.rules).toBe('object');
    });

    it('should have react-hooks/rules-of-hooks rule enabled', () => {
      expect(eslintConfig.rules['react-hooks/rules-of-hooks']).toBe('error');
    });

    it('should have react-hooks/exhaustive-deps rule enabled', () => {
      expect(eslintConfig.rules['react-hooks/exhaustive-deps']).toBe('warn');
    });

    it('should warn on console usage', () => {
      expect(eslintConfig.rules['no-console']).toBe('warn');
    });

    it('should error on unused variables', () => {
      const rule = eslintConfig.rules['@typescript-eslint/no-unused-vars'];
      expect(Array.isArray(rule)).toBe(true);
      expect(rule[0]).toBe('error');
      // Should have options to ignore variables prefixed with underscore
      expect(rule[1]).toHaveProperty('argsIgnorePattern');
      expect(rule[1]).toHaveProperty('varsIgnorePattern');
    });

    it('should warn on explicit any', () => {
      expect(eslintConfig.rules['@typescript-eslint/no-explicit-any']).toBe('warn');
    });

    it('should disable no-unescaped-entities rule (Next.js specific)', () => {
      expect(eslintConfig.rules['react/no-unescaped-entities']).toBe('off');
    });

    it('should configure parserOptions for TypeScript', () => {
      expect(eslintConfig.parserOptions).toBeDefined();
      expect(eslintConfig.parserOptions.ecmaVersion).toBe('latest');
      expect(eslintConfig.parserOptions.sourceType).toBe('module');
      expect(eslintConfig.parserOptions.ecmaFeatures).toBeDefined();
      expect(eslintConfig.parserOptions.ecmaFeatures.jsx).toBe(true);
    });

    it('should configure environment for browser and node', () => {
      expect(eslintConfig.env).toBeDefined();
      expect(eslintConfig.env.browser).toBe(true);
      expect(eslintConfig.env.node).toBe(true);
      expect(eslintConfig.env.es2021).toBe(true);
    });

    it('should error on missing semicolons', () => {
      expect(eslintConfig.rules.semi).toBe('error');
    });

    it('should error on var usage', () => {
      expect(eslintConfig.rules['no-var']).toBe('error');
    });

    it('should error on loose equality', () => {
      expect(Array.isArray(eslintConfig.rules.eqeqeq)).toBe(true);
      expect(eslintConfig.rules.eqeqeq[0]).toBe('error');
    });
  });

  describe('Prettier Configuration', () => {
    let prettierConfig;

    beforeAll(() => {
      const prettierPath = path.join(projectRoot, '.prettierrc.json');
      const configContent = fs.readFileSync(prettierPath, 'utf-8');
      prettierConfig = JSON.parse(configContent);
    });

    it('should have valid JSON syntax', () => {
      expect(prettierConfig).toBeDefined();
      expect(typeof prettierConfig).toBe('object');
    });

    it('should have printWidth set to 100', () => {
      expect(prettierConfig.printWidth).toBe(100);
    });

    it('should have tabWidth set to 2', () => {
      expect(prettierConfig.tabWidth).toBe(2);
    });

    it('should not use tabs', () => {
      expect(prettierConfig.useTabs).toBe(false);
    });

    it('should use semicolons', () => {
      expect(prettierConfig.semi).toBe(true);
    });

    it('should use single quotes for JS/TS', () => {
      expect(prettierConfig.singleQuote).toBe(true);
    });

    it('should use trailing commas in ES5', () => {
      expect(prettierConfig.trailingComma).toBe('es5');
    });

    it('should use bracket spacing', () => {
      expect(prettierConfig.bracketSpacing).toBe(true);
    });

    it('should always use arrow parens', () => {
      expect(prettierConfig.arrowParens).toBe('always');
    });

    it('should not use JSX bracket same line', () => {
      expect(prettierConfig.jsxBracketSameLine).toBe(false);
    });

    it('should not use JSX single quotes', () => {
      expect(prettierConfig.jsxSingleQuote).toBe(false);
    });
  });

  describe('Ignore Files', () => {
    it('should have .eslintignore file', () => {
      const eslintIgnorePath = path.join(projectRoot, '.eslintignore');
      expect(fs.existsSync(eslintIgnorePath)).toBe(true);
    });

    it('should have .prettierignore file', () => {
      const prettierIgnorePath = path.join(projectRoot, '.prettierignore');
      expect(fs.existsSync(prettierIgnorePath)).toBe(true);
    });
  });

  describe('Configuration Compatibility', () => {
    let eslintConfig;
    let prettierConfig;

    beforeAll(() => {
      const eslintPath = path.join(projectRoot, '.eslintrc.json');
      eslintConfig = JSON.parse(fs.readFileSync(eslintPath, 'utf-8'));

      const prettierPath = path.join(projectRoot, '.prettierrc.json');
      prettierConfig = JSON.parse(fs.readFileSync(prettierPath, 'utf-8'));
    });

    it('should have compatible quote styles', () => {
      // ESLint and Prettier should both enforce single quotes
      expect(Array.isArray(eslintConfig.rules['@typescript-eslint/quotes'])).toBe(true);
      expect(eslintConfig.rules['@typescript-eslint/quotes'][0]).toBe('error');
      expect(eslintConfig.rules['@typescript-eslint/quotes'][1]).toBe('single');
      expect(prettierConfig.singleQuote).toBe(true);
    });

    it('should have compatible semicolon settings', () => {
      expect(eslintConfig.rules.semi).toBe('error');
      expect(prettierConfig.semi).toBe(true);
    });

    it('should have compatible trailing comma settings', () => {
      expect(Array.isArray(eslintConfig.rules['comma-dangle'])).toBe(true);
      expect(eslintConfig.rules['comma-dangle'][0]).toBe('error');
      expect(eslintConfig.rules['comma-dangle'][1]).toBe('es5');
      expect(prettierConfig.trailingComma).toBe('es5');
    });

    it('should have prettier plugin in ESLint', () => {
      const extendsArray = Array.isArray(eslintConfig.extends)
        ? eslintConfig.extends
        : [eslintConfig.extends];
      expect(extendsArray).toContain('prettier');
    });
  });

  describe('Package.json Lint Scripts', () => {
    let packageJson;

    beforeAll(() => {
      const packagePath = path.join(projectRoot, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    });

    it('should have lint script', () => {
      expect(packageJson.scripts.lint).toBeDefined();
      expect(typeof packageJson.scripts.lint).toBe('string');
      expect(packageJson.scripts.lint).toContain('eslint');
    });

    it('should have lint:fix script', () => {
      expect(packageJson.scripts['lint:fix']).toBeDefined();
      expect(typeof packageJson.scripts['lint:fix']).toBe('string');
      expect(packageJson.scripts['lint:fix']).toContain('eslint');
      expect(packageJson.scripts['lint:fix']).toContain('--fix');
    });

    it('should have format script', () => {
      expect(packageJson.scripts.format).toBeDefined();
      expect(typeof packageJson.scripts.format).toBe('string');
      expect(packageJson.scripts.format).toContain('prettier');
    });

    it('should have format:check script', () => {
      expect(packageJson.scripts['format:check']).toBeDefined();
      expect(typeof packageJson.scripts['format:check']).toBe('string');
      expect(packageJson.scripts['format:check']).toContain('prettier');
      expect(packageJson.scripts['format:check']).toContain('--check');
    });
  });
});
