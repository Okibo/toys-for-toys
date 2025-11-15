/**
 * Project Setup Verification Tests
 * Verifies that the Next.js project is properly initialized
 */

describe('Project Setup', () => {
  test('TypeScript config exists', () => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'tsconfig.json');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('Next.js config exists', () => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'next.config.js');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('Package.json exists with required dependencies', () => {
    const fs = require('fs');
    const path = require('path');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson.dependencies).toHaveProperty('@supabase/supabase-js');
    expect(packageJson.dependencies).toHaveProperty('next');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');
    expect(packageJson.devDependencies).toHaveProperty('@types/node');
    expect(packageJson.devDependencies).toHaveProperty('@types/react');
  });

  test('Required directories exist', () => {
    const fs = require('fs');
    const path = require('path');

    const directories = [
      'components',
      'pages',
      'pages/api',
      'lib',
      'public',
      'supabase',
      'tests',
      'styles',
      'types',
    ];

    directories.forEach((dir) => {
      const dirPath = path.join(process.cwd(), dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  test('API health endpoint exists', () => {
    const fs = require('fs');
    const path = require('path');
    const healthPath = path.join(process.cwd(), 'pages/api/health.ts');
    expect(fs.existsSync(healthPath)).toBe(true);
  });

  test('Index page exists', () => {
    const fs = require('fs');
    const path = require('path');
    const indexPath = path.join(process.cwd(), 'pages/index.tsx');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  test('Supabase client is configured', () => {
    const fs = require('fs');
    const path = require('path');
    const supabasePath = path.join(process.cwd(), 'lib/supabase.ts');
    expect(fs.existsSync(supabasePath)).toBe(true);

    const content = fs.readFileSync(supabasePath, 'utf-8');
    expect(content).toContain('createClient');
    expect(content).toContain('@supabase/supabase-js');
  });
});
