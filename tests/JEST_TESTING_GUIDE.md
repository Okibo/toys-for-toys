# Jest Testing Guide for Toy-for-Toy

## Overview

This guide explains how to write, run, and maintain Jest tests for the Toy-for-Toy project. Jest is configured with Next.js support, TypeScript, and React Testing Library for component testing.

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/pages/index.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="Home Page"
```

### Test File Organization

Tests follow this directory structure:

```
tests/
├── setup.test.ts              # Setup verification tests
├── tsconfig.test.ts           # TypeScript config validation
├── pages/
│   └── index.test.tsx         # Home page component tests
├── lib/
│   └── supabase.test.ts       # Supabase client tests
└── api/
    └── health.test.ts        # API endpoint tests
```

**Naming Convention**: Test files use `.test.ts` or `.test.tsx` extensions.

## Test Structure and Patterns

### 1. Basic Test Template

```typescript
/**
 * Feature Name Tests
 *
 * Verifies that:
 * - Requirement 1
 * - Requirement 2
 * - Requirement 3
 */

describe('Feature or Component Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mocks, clear state, etc.
  });

  // Group related tests
  describe('Specific Behavior', () => {
    test('should do something specific', () => {
      // Arrange: Set up test data
      const input = 'test';

      // Act: Perform the action
      const result = processInput(input);

      // Assert: Verify the outcome
      expect(result).toBe('expected');
    });
  });
});
```

### 2. Component Testing with React Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  test('renders component with props', () => {
    render(<MyComponent title="Test" />);

    // Query for elements by role (preferred)
    const heading = screen.getByRole('heading', { name: /test/i });
    expect(heading).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent onSubmit={jest.fn()} />);

    const button = screen.getByRole('button', { name: /submit/i });
    await user.click(button);

    expect(screen.getByText(/submitted/i)).toBeInTheDocument();
  });
});
```

### 3. Mocking External Dependencies

```typescript
// Mock a module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

// Partial mock with jest.spyOn
import { supabase } from '@/lib/supabase';

beforeEach(() => {
  jest.spyOn(supabase, 'from').mockReturnThis();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 4. Async/Promise Testing

```typescript
describe('Async Operations', () => {
  test('waits for async operation', async () => {
    const promise = fetchData();

    // Use await with expect or wrap in async function
    const result = await promise;
    expect(result).toBeDefined();
  });

  test('handles promise rejection', async () => {
    await expect(failingPromise()).rejects.toThrow();
  });

  test('uses async/await in test', async () => {
    const { rerender } = render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText(/loaded/i)).toBeInTheDocument();
    });
  });
});
```

## Jest Configuration Details

### jest.config.js

Key configurations:

- **testEnvironment**: `jsdom` - DOM testing for React components
- **moduleNameMapper**: Maps `@/` aliases to filesystem paths
- **setupFilesAfterEnv**: Runs `jest.setup.js` before tests
- **collectCoverageFrom**: Defines coverage scope
- **testTimeout**: 10 seconds per test

### jest.setup.js

Pre-configured:

- Jest-DOM custom matchers (@testing-library/jest-dom)
- Environment variables for testing
- Mocks for next/router and next/image
- Global test utilities (`global.testUtils`)

### Environment Variables for Tests

Automatically set in jest.setup.js:

```javascript
NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
```

Override with:
```bash
NEXT_PUBLIC_SUPABASE_URL=custom npm test
```

## Using Jest Matchers

### Common Matchers

```typescript
// Equality
expect(value).toBe(5);              // Exact match (===)
expect(value).toEqual({ a: 1 });    // Deep equality
expect(value).toStrictEqual({ a: 1 }); // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeCloseTo(0.3, 5);

// Strings
expect(value).toMatch(/regex/);
expect(value).toMatch('substring');

// Arrays/Objects
expect(arr).toContain('item');
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');
expect(arr).toHaveLength(3);

// Mock Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveReturnedWith(value);

// Async/Promises
expect(promise).resolves.toBe(value);
expect(promise).rejects.toThrow();
```

### React Testing Library Matchers

```typescript
// Element presence
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveClass('active');

// Content
expect(element).toHaveTextContent('text');
expect(element).toHaveValue('value');

// Attributes
expect(element).toHaveAttribute('href', '/path');
```

## Testing Common Scenarios

### Testing API Routes

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    res.status(200).json({ status: 'ok' });
  }
}

// tests/api/health.test.ts
describe('/api/health', () => {
  test('returns health status', async () => {
    const req = {
      method: 'GET',
    } as NextApiRequest;

    const json = jest.fn().mockReturnValue(undefined);
    const res = {
      status: jest.fn().mockReturnValue({ json }),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import useCounter from '@/hooks/useCounter';

describe('useCounter', () => {
  test('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Testing Context/Providers

```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/context/ThemeContext';
import ComponentUsingTheme from '@/components/ComponentUsingTheme';

describe('ComponentUsingTheme', () => {
  test('renders with theme context', () => {
    render(
      <ThemeProvider>
        <ComponentUsingTheme />
      </ThemeProvider>
    );

    expect(screen.getByText(/themed/i)).toBeInTheDocument();
  });
});
```

### Testing Supabase Operations

```typescript
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('Data Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches toys from database', async () => {
    const mockData = [
      { id: '1', name: 'Teddy Bear' },
      { id: '2', name: 'Blocks' },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const { data, error } = await supabase
      .from('toys')
      .select('*');

    expect(data).toEqual(mockData);
    expect(error).toBeNull();
  });
});
```

## Snapshot Testing

Snapshot tests capture component output and compare future renders:

```typescript
test('component snapshot', () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchSnapshot();
});
```

**Usage**:
- Update snapshots: `npm test -- -u`
- Review snapshot changes carefully before committing
- Use for regression detection, not as primary test

## Coverage Reports

Generate coverage:

```bash
npm run test:coverage
```

View HTML report:
```bash
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in jest.config.js:

```javascript
coverageThreshold: {
  global: {
    branches: 50,    // 50% of conditional branches
    functions: 50,   // 50% of functions
    lines: 50,       // 50% of lines
    statements: 50   // 50% of statements
  }
}
```

Increase thresholds as test coverage improves.

## Global Test Utilities

Available in all tests via `global.testUtils`:

```typescript
// Create mock Supabase client
const mockClient = global.testUtils.createMockSupabaseClient();

// Mock has chainable methods
mockClient
  .from('toys')
  .select('*')
  .eq('user_id', '123');
```

## Common Pitfalls and Solutions

### Issue: Tests timeout

**Solution**: Increase timeout or check for infinite loops
```typescript
test('slow operation', async () => {
  // ...
}, 20000); // 20 second timeout
```

### Issue: State pollution between tests

**Solution**: Use beforeEach/afterEach to reset mocks
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### Issue: Async state updates not reflected

**Solution**: Use waitFor from testing-library
```typescript
await waitFor(() => {
  expect(screen.getByText(/loaded/)).toBeInTheDocument();
});
```

### Issue: Module not found errors

**Solution**: Check moduleNameMapper in jest.config.js matches tsconfig.json

### Issue: Next.js specific errors

**Solution**: These are handled by next/jest. If persisting, check jest.setup.js mocks.

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see/do
   - Avoid testing internal state directly

2. **Use Semantic Queries**
   ```typescript
   // Good
   screen.getByRole('button', { name: /submit/i });

   // Avoid
   screen.getByTestId('submit-button');
   ```

3. **Keep Tests Simple and Focused**
   - One assertion per test when possible
   - Clear, descriptive test names
   - Use describe blocks to organize related tests

4. **Mock External Dependencies**
   - Mock Supabase, Firebase, API calls
   - Use real implementations for business logic
   - Keep mocks close to where they're used

5. **Write Tests While Developing**
   - TDD improves code design
   - Run tests frequently with watch mode
   - Tests serve as documentation

6. **Avoid Flaky Tests**
   - Use waitFor() for async operations
   - Don't rely on timeouts
   - Clear state between tests

## Debugging Tests

### Run single test:
```bash
npm test -- --testNamePattern="Home Page"
```

### Run tests in a file:
```bash
npm test -- tests/pages/index.test.tsx
```

### Enable debug output:
```bash
DEBUG_PRINT_LIMIT=0 npm test
```

### Use screen.debug():
```typescript
import { render, screen } from '@testing-library/react';

test('debug output', () => {
  render(<MyComponent />);
  screen.debug(); // Prints DOM tree
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Library Best Practices](https://testing-library.com/docs/best-practices)

## Next Steps

1. Install @testing-library/react and @testing-library/user-event:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/user-event
   ```

2. Create tests for new features during development

3. Gradually increase coverage thresholds as suite grows

4. Review and update tests as requirements change
