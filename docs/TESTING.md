# Testing Guide

This document provides comprehensive guidance on running tests in the Toy-for-Toy project, including unit tests, database tests, and E2E tests.

## Test Structure

The project uses the following testing strategy:

- **Unit Tests**: React components, utilities, and hooks (`tests/unit/` or collocated with components)
- **Database Tests**: Schema validation and RLS policy tests (`tests/database/`)
- **E2E Tests**: User workflows and integration tests (`tests/e2e/`)

### Test Files

- Unit/Integration: `**/__tests__/**/*.ts`, `**/?(*.)+(spec|test).ts`
- Database: `tests/database/**/*.test.ts` (Requires local Supabase instance)
- E2E: `tests/e2e/**` (Runs with Playwright)

## Local Development

### Running All Tests Locally

When developing locally, you have access to the full Supabase instance (after `npx supabase start`), so you can run all tests:

```bash
npm test                  # Runs all tests (unit + database)
npm run test:watch       # Watch mode for all tests
npm run test:coverage    # All tests with coverage report
```

### Running Specific Test Types

```bash
# Unit tests only (no database required)
npm run test:unit

# Database tests only (requires: npx supabase start)
npm run test:database

# Database tests with extended timeout
npm run test:database -- --testTimeout=60000

# Watch mode for database tests
npm run test:database -- --watch

# Specific test file
npm test -- core-tables.test.ts
npm test -- -- --testNamePattern="UUID generation"
```

## CI/CD Environment

GitHub Actions automatically skips database tests because they require a local Supabase instance running on `localhost:54321`, which is not available in CI.

### GitHub Actions Workflow

The CI pipeline in `.github/workflows/ci.yml`:

1. Installs dependencies
2. Runs linting
3. Builds the project
4. **Runs unit tests only** (database tests skipped via `CI=true` environment variable)

### Why Database Tests Are Skipped in CI

Database tests in `tests/database/` are designed to:

- Connect to a local Supabase instance running on `http://localhost:54321`
- Test schema integrity, RLS policies, and database views
- Require database state setup

These tests cannot run in CI because:

- GitHub Actions runners don't have a local Supabase instance
- Database tests need real database connections and state management
- Starting a full Supabase stack in CI would significantly slow down builds

### CI Test Filtering

**Environment Variable Detection:**

```javascript
// jest.config.js
const isCI = process.env.CI === 'true';

testPathIgnorePatterns: [
  // ... other patterns
  ...(isCI ? ['/tests/database/'] : []), // Skip in CI only
];
```

**GitHub Actions automatically sets** `CI=true`, triggering the filter.

## Test Commands Reference

| Command                 | Purpose                                     | Requires Supabase | CI-Compatible |
| ----------------------- | ------------------------------------------- | ----------------- | ------------- |
| `npm test`              | Run all tests locally                       | Yes               | No            |
| `npm run test:unit`     | Run unit tests only                         | No                | Yes           |
| `npm run test:ci`       | Run CI tests locally (for testing CI setup) | No                | Yes           |
| `npm run test:database` | Run only database tests                     | Yes               | No            |
| `npm run test:watch`    | Watch mode (all tests)                      | Yes               | No            |
| `npm run test:coverage` | Coverage report (all tests)                 | Yes               | No            |
| `npm test -- <file>`    | Run specific test file                      | Depends           | Depends       |

## Database Testing (Local Only)

### Prerequisites

Before running database tests locally, ensure Supabase is running:

```bash
# Start local Supabase instance
npx supabase start

# Output will show:
# API URL: http://localhost:54321
# Anon Key: eyJ...
```

### Database Test Configuration

Database tests use:

- `SUPABASE_URL`: Defaults to `http://localhost:54321` (or `NEXT_PUBLIC_SUPABASE_URL` env var)
- `SUPABASE_ANON_KEY`: Generated JWT tokens for testing

Example from `tests/database/core-tables.test.ts`:

```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || generateTestJWT();
```

### Running Database Tests

```bash
# Start Supabase (if not already running)
npx supabase start

# In another terminal, run database tests
npm run test:database

# Or run all tests (includes database tests)
npm test
```

### Database Test Troubleshooting

| Issue                                          | Solution                                                        |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `Connection refused at http://localhost:54321` | Run `npx supabase start` first                                  |
| `RLS policy violation`                         | Ensure test JWT has correct claims; check test user permissions |
| `Timeout errors`                               | Use `--testTimeout=30000` flag for longer timeouts              |
| `Schema not found`                             | Verify migrations were applied: `npx supabase db push`          |

## Coverage Reports

Generate coverage reports for all tests locally:

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory:

- HTML report: `coverage/lcov-report/index.html`
- Terminal summary: Displayed after command completes

Note: Coverage reports in CI will only include unit tests (database tests skipped).

## E2E Testing

E2E tests are separate from unit/database tests and use Playwright:

```bash
npm run e2e              # Run Playwright tests
npm run e2e -- --ui     # Run with interactive UI
npm run e2e -- --debug  # Run in debug mode
```

E2E tests run against a live instance and are not affected by the CI/database test filtering.

## Writing Tests

### Unit Tests

Place unit tests alongside the code they test or in `tests/unit/`:

```typescript
// tests/unit/my-component.test.ts
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render without errors', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Database Tests

Database tests should:

- Be placed in `tests/database/`
- Connect to local Supabase on startup
- Clean up test data in `afterEach()` or `afterAll()`
- Use RLS-aware queries

```typescript
// tests/database/my-schema.test.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || generateTestJWT();

describe('My Schema', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  it('should validate schema structure', async () => {
    const { data, error } = await supabase.from('my_table').select('*').limit(1);
    expect(error).toBeNull();
  });
});
```

### Important: Skip Database Tests in CI

Do NOT write tests that require database connections and place them in the general test suite. Instead:

1. Place database-specific tests in `tests/database/`
2. Use `describe.skip()` or `.skip` for tests that can't run in CI
3. Document why a test requires a database in a comment

## CI Configuration Details

### Workflow File: `.github/workflows/ci.yml`

The CI workflow:

```yaml
- name: Run Unit Tests (CI environment - excludes database tests)
  run: npm run test:ci
  env:
    CI: true # Automatically set by GitHub Actions
```

### Jest Configuration: `jest.config.js`

```javascript
const isCI = process.env.CI === 'true';

testPathIgnorePatterns: [
  '/node_modules/',
  '/.next/',
  '/dist/',
  '/build/',
  '/out/',
  '/tests/e2e/',
  ...(isCI ? ['/tests/database/'] : []), // Skip in CI only
];
```

### Package.json Scripts

```json
{
  "test": "jest", // All tests (local)
  "test:ci": "CI=true jest", // CI tests locally
  "test:database": "jest tests/database --testTimeout=30000", // DB tests only
  "test:unit": "jest --testPathIgnorePatterns=/tests/database/" // Unit tests only
}
```

## Continuous Integration Matrix

The CI pipeline tests against multiple Node.js versions (18.x, 20.x) as configured in the workflow matrix. All versions must pass for a PR to be merged.

## Debugging Failed Tests

### Local Debugging

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand tests/database/core-tables.test.ts

# Then open: chrome://inspect/
```

### CI Debugging

If tests fail in CI but pass locally:

1. Check the GitHub Actions logs for the exact error
2. Verify environment variables in Vercel/secrets (if using env vars)
3. Run `npm run test:ci` locally to simulate CI environment
4. Check Node.js version compatibility (matrix tests 18.x and 20.x)

## Performance Optimization

### Test Timeout Configuration

Database tests may need longer timeouts:

```bash
npm run test:database -- --testTimeout=60000  # 60 second timeout
```

### Parallel Test Execution

Jest runs tests in parallel by default. For database tests that share state, use:

```bash
npm run test:database -- --runInBand  # Sequential execution
```

## Best Practices

1. **Keep database tests isolated**: Each test should be independent and not rely on order
2. **Clean up after tests**: Use `afterEach()` to remove test data
3. **Use meaningful descriptions**: Test names should explain what they test
4. **Mock external services**: Don't call real APIs in tests
5. **Test edge cases**: Include tests for error handling and validation
6. **Consistent test structure**: Follow the Arrange-Act-Assert pattern

## Integration with IDEs

### VSCode with Jest Extension

Install the Jest extension:

- Extension: `firsttris.vscode-jest-runner`

Then:

- Click "Run" or "Debug" above test names
- View coverage in the editor

### WebStorm / IntelliJ IDEA

- Right-click test file and select "Run"
- IDE automatically detects Jest configuration
- Built-in coverage reporting available

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Playwright Documentation](https://playwright.dev/)
