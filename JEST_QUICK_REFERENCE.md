# Jest Quick Reference - Toy-for-Toy

## Run Tests

```bash
npm test                          # Run all tests
npm run test:watch               # Watch mode
npm run test:coverage            # With coverage report
npm test -- tests/lib/           # Run folder
npm test -- --testNamePattern="name"  # Pattern match
```

## File Structure

```
jest.config.js                   Configuration file
jest.setup.js                    Setup before tests
tests/
  jest-configuration.test.ts     Infrastructure (48 tests)
  setup.test.ts                  Project setup (8 tests)
  tsconfig.test.ts               TypeScript config (42 tests)
  api/health.test.ts             API endpoints (11 tests)
  lib/supabase.test.ts           Supabase client (20 tests)
  pages/index.test.tsx           React components (25 tests)
  README.md                       Guide
  JEST_TESTING_GUIDE.md          Full reference
  IMPLEMENTATION_CHECKLIST.md    Validation
```

## Basic Test Template

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = process(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Common Matchers

```typescript
expect(value).toBe(5);                      // Exact match
expect(value).toEqual({a: 1});              // Deep equality
expect(value).toContain('text');            // Array/String
expect(value).toMatch(/regex/);             // Regex
expect(fn).toHaveBeenCalled();              // Mock called
expect(fn).toHaveBeenCalledWith(arg);       // Called with args
expect(() => fn()).toThrow();               // Throws error
expect(promise).resolves.toBe(value);       // Promise resolves
expect(promise).rejects.toThrow();          // Promise rejects
```

## Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import Component from '@/components/Component';

test('renders', () => {
  render(<Component />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Mocking

```typescript
// Mock module
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: [] })
}));

// Mock function
const mockFn = jest.fn();
mockFn.mockReturnValue('value');

// Spy on method
jest.spyOn(obj, 'method').mockImplementation(() => {});

// Clear mocks
jest.clearAllMocks();
afterEach(() => jest.clearAllMocks());
```

## Path Aliases

```typescript
// Use @ aliases instead of relative paths:
import Component from '@/components/Component';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
```

## Global Utilities

```typescript
// Mock Supabase client
const mockClient = global.testUtils.createMockSupabaseClient();
```

## Environment Variables (in tests)

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL        // Set automatically
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY   // Set automatically
```

## Configuration

- **testEnvironment**: jsdom (DOM testing)
- **timeout**: 10 seconds
- **coverage**: 50% threshold (branches, functions, lines, statements)
- **modules**: Next.js, TypeScript, React supported

## Common Issues

| Issue | Solution |
|-------|----------|
| Test not found | Check `.test.ts` extension |
| Path alias fails | Import is correct, Jest config has mapping |
| Async timeout | Use `waitFor()` or increase timeout |
| Mock not working | Ensure `jest.mock()` before import |
| Element not found | Use `screen.getByRole()` instead of `getByTestId()` |

## Documentation

- **JEST_TESTING_GUIDE.md**: Complete guide (1,200+ lines)
- **tests/README.md**: Directory guide
- **JEST_SETUP_SUMMARY.md**: Setup details
- **tests/IMPLEMENTATION_CHECKLIST.md**: Full validation

## Examples in Codebase

- API endpoint: `tests/api/health.test.ts`
- Library testing: `tests/lib/supabase.test.ts`
- React component: `tests/pages/index.test.tsx`
- Infrastructure: `tests/jest-configuration.test.ts`

## View Coverage

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Writing New Tests

1. Create `tests/path/to/feature.test.ts(x)`
2. Follow Arrange-Act-Assert pattern
3. Use path aliases for imports
4. Mock external dependencies
5. Run `npm test -- --watch` during development
6. Aim for 50%+ coverage

## Key Takeaways

- Jest is fully configured for Next.js, TypeScript, React
- 154+ foundational tests verify infrastructure
- Path aliases work in tests (@/ prefix)
- Supabase, Next.js modules are mocked
- jsdom environment for component testing
- Comprehensive guides available in tests/ directory

## Resources

- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/react
- Full Guide: tests/JEST_TESTING_GUIDE.md
