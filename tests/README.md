# Jest Testing Infrastructure

This directory contains comprehensive Jest test configuration and foundational test files for the Toy-for-Toy project.

## Directory Structure

```
tests/
├── README.md                      # This file
├── JEST_TESTING_GUIDE.md         # Comprehensive testing guide
├── jest-configuration.test.ts    # Infrastructure verification tests
├── setup.test.ts                 # Project setup verification
├── tsconfig.test.ts              # TypeScript config validation
├── api/
│   └── health.test.ts            # API endpoint tests
├── lib/
│   └── supabase.test.ts          # Supabase client tests
└── pages/
    └── index.test.tsx            # Home page component tests
```

## What's Included

### Configuration Files

1. **jest.config.js** (root)
   - Next.js support via next/jest
   - TypeScript support via ts-jest
   - jsdom environment for DOM testing
   - Path alias mapping (@/)
   - Coverage configuration with thresholds
   - Coverage exclusions for app wrapper files

2. **jest.setup.js** (root)
   - Jest-DOM custom matchers
   - Environment variables for testing
   - Mocks for next/router and next/image
   - Global test utilities (createMockSupabaseClient)
   - Console filtering for test noise reduction

### Foundational Tests

#### jest-configuration.test.ts
Tests that verify Jest infrastructure:
- Configuration files exist and are valid
- Test environment setup (globals, jsdom)
- Path alias resolution
- TypeScript support
- Module mocking capabilities
- Async/Promise support
- Coverage configuration

#### setup.test.ts (in tests/)
Tests that verify project setup:
- Configuration files (tsconfig, next.config)
- Package dependencies
- Required directories
- Supabase client configuration
- Index page and health endpoint

#### tsconfig.test.ts (in tests/)
Comprehensive TypeScript configuration validation:
- Strict mode settings
- Compiler options
- Path aliases
- Include/exclude patterns
- Production readiness checks

#### health.test.ts (in tests/api/)
API route structure tests:
- File existence and validity
- Export patterns
- Method handling
- Response structure
- Code quality checks

#### supabase.test.ts (in tests/lib/)
Supabase client configuration tests:
- Import correctness
- Environment variable setup
- Type definitions
- Mock client creation
- Auth method availability

#### index.test.tsx (in tests/pages/)
React component testing example:
- Component rendering
- Content verification
- Accessibility checks
- Responsive design classes
- Snapshot testing

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- tests/pages/index.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="Home Page"
```

## Test Execution Flow

1. **Jest initialization**: Loads jest.config.js
2. **Environment setup**: Runs jest.setup.js before all tests
3. **File transformation**: TypeScript files compiled by ts-jest
4. **Module resolution**: Path aliases resolved via moduleNameMapper
5. **Mock setup**: Mocks for next/router and next/image applied
6. **Test execution**: Test suites run in jsdom environment
7. **Coverage collection**: Code coverage metrics gathered (if --coverage flag)
8. **Report generation**: Results reported to console

## Using in Your Tests

### Import Test Utilities

```typescript
// Mock Supabase client
const mockSupabase = global.testUtils.createMockSupabaseClient();

// Use mocked Next.js router
import { useRouter } from 'next/router';
const router = useRouter(); // Returns mocked router from jest.setup.js
```

### Import Components with Path Aliases

```typescript
// Instead of relative paths:
// import Component from '../../../components/MyComponent'

// Use path aliases (configured in jest.config.js):
import Component from '@/components/MyComponent';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
```

### Test React Components

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });
});
```

## Configuration Details

### Coverage Thresholds

Current thresholds (in jest.config.js):
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

Increase as test suite matures:
```javascript
// In jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  }
}
```

### Test Environment

- **Environment**: jsdom (browser-like DOM environment)
- **Timeout**: 10 seconds per test
- **Verbose**: Detailed output of test results
- **Watch plugins**: Typeahead support for test selection

### Path Aliases Configured

- `@/*` → `./`
- `@/components/*` → `./components/`
- `@/pages/*` → `./pages/`
- `@/lib/*` → `./lib/`
- `@/public/*` → `./public/`
- `@/tests/*` → `./tests/`
- `@/types/*` → `./types/`

These match the paths in tsconfig.json.

### Excluded from Coverage

- Type definition files (*.d.ts)
- Next.js wrapper files (_app.tsx, _document.tsx, _error.tsx)
- node_modules and build directories
- Coverage reports directory

## Adding New Tests

### Test File Location

Follow existing structure:
- Component tests: `tests/pages/` or `tests/components/`
- Library tests: `tests/lib/`
- API tests: `tests/api/`
- Utility tests: `tests/utils/`

### Test File Naming

Use `.test.ts` or `.test.tsx` extension:
```
MyComponent.test.tsx
supabase-client.test.ts
api-handler.test.ts
```

### Test Template

```typescript
/**
 * Feature/Component Name Tests
 *
 * Verifies that:
 * - Requirement 1
 * - Requirement 2
 */

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Specific Behavior', () => {
    test('should do something specific', () => {
      // Test code
    });
  });
});
```

### Best Practices

1. **One responsibility per test**: Each test should verify one behavior
2. **Descriptive names**: Test names should describe expected behavior
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock external dependencies**: Isolate units under test
5. **Use semantic queries**: Prefer screen.getByRole() over getByTestId()
6. **Reset mocks between tests**: Use beforeEach() for consistent state

## Common Testing Patterns

### Testing API Routes
See: `tests/api/health.test.ts`

### Testing React Components
See: `tests/pages/index.test.tsx`

### Testing Hooks and Context
See: JEST_TESTING_GUIDE.md → "Testing React Hooks"

### Testing Supabase Integration
See: `tests/lib/supabase.test.ts`

## Debugging Tests

### Run Single Test File
```bash
npm test -- tests/pages/index.test.tsx
```

### Run Tests Matching Name Pattern
```bash
npm test -- --testNamePattern="renders correctly"
```

### Debug Output
```typescript
import { screen } from '@testing-library/react';

test('debug', () => {
  render(<MyComponent />);
  screen.debug(); // Prints DOM tree
});
```

### Check Test Coverage for File
```bash
npm run test:coverage -- tests/lib/supabase.test.ts
```

## Troubleshooting

### Tests Won't Run
1. Ensure dependencies installed: `npm install`
2. Check jest.config.js syntax
3. Verify test files have correct extension (.test.ts/.test.tsx)

### Path Aliases Not Working
1. Verify jest.config.js moduleNameMapper matches tsconfig.json
2. Use `npm test -- --testPathPattern=` to check file resolution
3. Check that target directories exist

### Async Tests Timing Out
1. Increase test timeout: `test('name', async () => {}, 20000)`
2. Use waitFor() for state updates
3. Avoid arbitrary timeouts (setTimeout)

### Mock Not Applied
1. Ensure jest.mock() called before import
2. Check mock location in jest.setup.js
3. Use jest.clearAllMocks() between tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- JEST_TESTING_GUIDE.md (in this directory)

## Next Steps

1. **Install React Testing Library**:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/user-event
   ```

2. **Review Test Examples**: Start with `tests/pages/index.test.tsx`

3. **Create Tests for New Features**: Use JEST_TESTING_GUIDE.md as reference

4. **Monitor Coverage**: Run `npm run test:coverage` regularly

5. **Update Thresholds**: Increase coverage requirements as suite matures

## Support

For detailed testing patterns and examples, see **JEST_TESTING_GUIDE.md** in this directory.
