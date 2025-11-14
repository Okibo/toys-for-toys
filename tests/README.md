# Testing Guide

## Jest Setup and Configuration

The project uses **Jest** for unit and integration testing with TypeScript support via `ts-jest`.

### Current Jest Setup

- **Test environment**: Node.js
- **TypeScript support**: Enabled via `ts-jest` preset
- **Path aliases**: Configured for `@/components`, `@/lib`, `@/app`, `@/supabase`, `@/pages`, and `@/public`
- **Test timeout**: 10 seconds
- **Coverage collection**: Includes `app/`, `components/`, `lib/`, and `pages/` directories
- **Config file**: `jest.config.js`

### Running Jest Tests Locally

```bash
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode (re-run on file changes)
npm test -- --coverage     # Run tests with coverage report
npm test -- <filename>     # Run a specific test file
```

## Playwright E2E Testing Strategy

The project uses **Playwright** for end-to-end testing of user workflows across web and mobile platforms.

### Writing E2E Tests

Create test files in a dedicated `tests/e2e/` directory (if not already present):

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });
});
```

### Key Playwright Patterns

- Use `test.describe()` to group related tests
- Use `await page.goto()` to navigate to pages
- Use selectors (`page.fill()`, `page.click()`, `page.locator()`) to interact with elements
- Use `expect()` assertions to verify outcomes
- Leverage fixtures (`{ page, context, browser }`) for test isolation

### Running Playwright Tests Locally

First, ensure the dev server is running:

```bash
npm run dev              # Start Next.js dev server (separate terminal)
```

Then run Playwright tests:

```bash
npx playwright test                     # Run all E2E tests
npx playwright test --ui                # Run in UI mode (interactive)
npx playwright test --headed            # Run tests with visible browser
npx playwright test tests/e2e/auth.spec.ts  # Run specific test file
npx playwright test --debug             # Debug mode (pause on each step)
```

## How to Run Tests

### Running All Tests

```bash
npm test                # Run all Jest tests
npm run test            # Alternative (same as above)
```

### Running Specific Test Files

```bash
npm test -- config.test.ts              # Run single test file
npm test -- firebase-admin.test.ts      # Run Firebase admin tests
npm test -- --testPathPattern="firebase"  # Run tests matching pattern
```

### Running with Coverage

```bash
npm test -- --coverage                  # Generate coverage report
npm test -- --coverage --silent         # Coverage report without verbose output
npm test -- --coverage --collectCoverageFrom="lib/**"  # Coverage for specific directory
```

### Watch Mode (Development)

```bash
npm test -- --watch                     # Re-run tests on file changes
npm test -- --watch --coverage          # Watch mode with coverage
```

## Coverage Targets

### Current Coverage Goals

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

These targets apply to the following directories:

- `app/` - Next.js application layer
- `components/` - React UI components
- `lib/` - Utility functions and hooks
- `pages/` - API routes and page logic

### Checking Coverage

After running tests with coverage, view the report:

```bash
npm test -- --coverage    # Generate coverage report in terminal
```

The output shows:

- **File**: Module being tested
- **Stmts**: Statement coverage percentage
- **Branch**: Branch coverage percentage
- **Funcs**: Function coverage percentage
- **Lines**: Line coverage percentage
- **Uncovered Line #s**: Specific lines lacking test coverage

To view an HTML coverage report (if configured):

```bash
# Open coverage/lcov-report/index.html in your browser
open coverage/lcov-report/index.html
```

### Coverage Strategy

- Focus on high-value code paths first (business logic, API routes, utilities)
- Aim for 80%+ coverage on critical components (authentication, ticket economy, exchanges)
- Use coverage reports to identify untested edge cases and error handling
- Avoid chasing 100% coverage; prioritize meaningful, maintainable tests
