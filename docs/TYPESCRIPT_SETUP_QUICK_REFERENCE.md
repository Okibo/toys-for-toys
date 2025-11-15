# TypeScript Setup - Quick Reference Guide

## Overview

The Toy-for-Toy project uses a strict TypeScript configuration with full type safety enforcement. This guide helps you work effectively with the type system.

## Quick Commands

```bash
# Type check entire project (no emit)
npm run type-check

# Run TypeScript configuration tests
npm test -- tests/tsconfig.test.ts --no-coverage

# Run all tests
npm test

# Start development server with type checking
npm run dev
```

## Path Aliases

Use these aliases throughout your code to avoid relative imports:

```typescript
// Components
import Button from '@/components/Button';

// Utilities and Hooks
import { useAuth } from '@/lib/hooks';

// Types
import type { User, Ticket } from '@/types';

// API Routes
import { handleRequest } from '@/pages/api/utils';

// Tests
import { setupTest } from '@/tests/helpers';

// Public Assets
import logo from '@/public/logo.svg';
```

## Strict Mode Compliance

The project enforces the following rules automatically:

### 1. No Implicit Any
```typescript
// ERROR - parameter has implicit any type
function process(data) { }

// CORRECT - explicit type
function process(data: unknown) { }
```

### 2. Strict Null Checks
```typescript
// ERROR - value might be null
const user: User = null; // Type error

// CORRECT - explicitly allow null
const user: User | null = null;

// CORRECT - use optional
const user?: User;
```

### 3. No Unused Variables
```typescript
// ERROR - unused variable
const config = loadConfig();

// CORRECT - use it or prefix with underscore
const _config = loadConfig(); // Intentionally unused
```

### 4. No Unused Parameters
```typescript
// ERROR - unused parameter
function callback(error, data) { return data; }

// CORRECT - prefix with underscore if intentionally unused
function callback(_error, data) { return data; }
```

### 5. Function Must Return
```typescript
// ERROR - code path might not return
function getValue(type: string): string {
  if (type === 'a') return 'A';
}

// CORRECT - all paths return
function getValue(type: string): string {
  if (type === 'a') return 'A';
  return 'default';
}
```

### 6. No Switch Fallthrough
```typescript
// ERROR - case falls through
switch (type) {
  case 'A':
    process();
  case 'B':
    break;
}

// CORRECT - explicit break or return
switch (type) {
  case 'A':
    process();
    break;
  case 'B':
    break;
}
```

## Common Type Patterns

### API Response
```typescript
import type { ApiResponse } from '@/types';

async function fetchData(): Promise<ApiResponse<User>> {
  return {
    status: 'success',
    data: user,
  };
}
```

### Event Handlers
```typescript
import type { FormEvent } from 'react';

function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // type-safe form handling
}
```

### Async Operations
```typescript
async function fetchUser(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  } catch {
    return null;
  }
}
```

### Discriminated Unions
```typescript
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function handle<T>(result: Result<T>) {
  if (result.status === 'success') {
    // result.data is properly typed as T
    return result.data;
  } else {
    // result.error is properly typed as string
    console.error(result.error);
  }
}
```

## Type Definitions Location

All type definitions are centralized in `/Users/pawelkalkun/Projects/private/toys-for-toys/types/index.ts`:

```typescript
// User and authentication types
export interface User { ... }

// Ticket economy types
export interface Ticket { ... }
export interface Exchange { ... }
export interface Toy { ... }

// Notification types
export interface Notification { ... }

// API response wrapper
export interface ApiResponse<T = unknown> { ... }
```

## Adding New Types

When adding new types, always:

1. Define them in `/Types/index.ts` if they're shared
2. Keep component-specific types near the component
3. Use `interface` for object shapes
4. Use `type` for unions and complex mappings
5. Export them explicitly

```typescript
// /Types/index.ts
export interface Profile {
  id: string;
  name: string;
  avatar?: string;
}

// Usage
import type { Profile } from '@/types';

const myProfile: Profile = {
  id: '123',
  name: 'John',
};
```

## Debugging Type Errors

### Inspect the Type
```typescript
// Use hover in editor to see inferred type
const value = getSomething();
//    ^ Hover to see type

// Use TypeScript's reveal type
type T = ReturnType<typeof getSomething>;
```

### Check Assignment Compatibility
```typescript
// Show what type is expected
const x: SomeType = value; // Error shows incompatibility

// Use 'satisfies' operator (TypeScript 4.9+)
const config = {
  port: 3000
} satisfies Config;
```

### Enable Verbose Error Messages
```bash
# Show more details about type errors
npm run type-check 2>&1 | grep -A5 "error TS"
```

## Pre-Commit Type Checking

Before committing, always run:

```bash
npm run type-check && npm test
```

This ensures:
- No type errors
- No unused code
- All tests pass

## IDE Setup

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "typescript.format.enabled": true
}
```

### Recommended Extensions

- **TypeScript Vue Plugin** - For Vue support (if needed)
- **Error Lens** - Shows errors inline
- **TypeScript Tweaks** - Better TypeScript support

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run type-check
```

### Stale type definitions

```bash
# Regenerate Next.js types
rm -f next-env.d.ts
npm run type-check
```

### Import path not resolved

Ensure you're using one of the configured aliases:
- `@/components/*`
- `@/lib/*`
- `@/types/*`
- `@/pages/*`
- `@/public/*`
- `@/tests/*`

### "Unused variable" warnings

Two ways to handle:

```typescript
// Option 1: Prefix with underscore (intentional)
const _unused = getValue();

// Option 2: Actually use it
const used = getValue();
console.log(used);
```

## Configuration Files Location

| File | Purpose |
|------|---------|
| `/Users/pawelkalkun/Projects/private/toys-for-toys/tsconfig.json` | TypeScript compiler configuration |
| `/Users/pawelkalkun/Projects/private/toys-for-toys/jest.config.js` | Jest testing configuration |
| `/Users/pawelkalkun/Projects/private/toys-for-toys/next.config.js` | Next.js configuration |

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## Support

For TypeScript configuration issues:

1. Check `/Users/pawelkalkun/Projects/private/toys-for-toys/docs/TYPESCRIPT_CONFIG_VALIDATION.md` for detailed configuration info
2. Run `npm run type-check` to see exact error messages
3. Run `npm test -- tests/tsconfig.test.ts` to verify setup
4. Review the tsconfig.json comments for compiler option rationale

---

**Last Updated:** November 15, 2025
**Configuration Version:** 1.0
**TypeScript Version:** 5.0.0+
