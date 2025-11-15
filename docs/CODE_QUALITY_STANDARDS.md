# Code Quality Standards - Toy-for-Toy

This document outlines the code quality standards and tooling configuration for the Toy-for-Toy project. Our goal is to maintain consistent, clean, and production-ready code while balancing developer productivity with code safety.

## Overview

We use a combination of **ESLint** for static code analysis and **Prettier** for code formatting. These tools work together to catch bugs early and ensure consistent code style across the project.

### Quick Commands

```bash
# Check code for linting issues
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Auto-format code
npm run format
```

## ESLint Configuration

### Philosophy

Our ESLint setup balances strictness with developer productivity:

- **Errors**: Critical issues that should always be fixed (bugs, security issues, unsafe patterns)
- **Warnings**: Important issues that should be reviewed but may be acceptable (console logs, unsafe types)
- **Off**: Rules that conflict with Prettier or are overly restrictive for this project

### Core Extensions

| Extension | Purpose |
| --- | --- |
| `next/core-web-vitals` | Next.js-specific best practices and Web Vitals |
| `@typescript-eslint/recommended` | TypeScript best practices |
| `@typescript-eslint/recommended-requiring-type-checking` | Advanced TypeScript checks (requires type information) |
| `plugin:react/recommended` | React best practices |
| `plugin:react-hooks/recommended` | React hooks rules of hooks |
| `prettier` | Disables rules that conflict with Prettier |

### Key Rules

#### TypeScript

| Rule | Level | Purpose |
| --- | --- | --- |
| `@typescript-eslint/no-unused-vars` | error | Catch unused variables (ignores prefixed with `_`) |
| `@typescript-eslint/no-explicit-any` | warn | Discourages type-unsafe `any` usage |
| `@typescript-eslint/explicit-function-return-types` | warn | Encourages explicit return types (with exceptions) |
| `@typescript-eslint/no-floating-promises` | warn | Detects unhandled promises |
| `@typescript-eslint/no-misused-promises` | error | Prevents promise misuse in conditionals |
| `@typescript-eslint/await-thenable` | error | Ensures proper await usage |
| `@typescript-eslint/consistent-type-imports` | warn | Prefer `import type` for type-only imports |

#### React & Hooks

| Rule | Level | Purpose |
| --- | --- | --- |
| `react-hooks/rules-of-hooks` | error | Enforces Rules of Hooks (critical for React) |
| `react-hooks/exhaustive-deps` | warn | Detects missing dependencies in useEffect, useCallback |
| `react/jsx-key` | error | Requires key prop in lists (prevents bugs) |
| `react/no-children-prop` | error | Enforces proper children usage |
| `react/self-closing-comp` | warn | Style preference for self-closing components |

#### Code Style

| Rule | Level | Purpose |
| --- | --- | --- |
| `no-console` | warn | Catches forgotten console.log statements |
| `no-var` | error | Enforces `const`/`let` over `var` |
| `prefer-const` | error | Prefers `const` over reassignable `let` |
| `eqeqeq` | error | Requires `===` instead of `==` |
| `curly` | error | Always requires braces for control flow |
| `semi` | error | Requires semicolons at statement ends |

### Ignoring Rules

When necessary, you can disable a rule for a specific line or file:

```typescript
// Disable for next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = JSON.parse(data);

// Disable for entire file
/* eslint-disable no-console */

// Disable for block
/* eslint-disable react-hooks/exhaustive-deps */
useEffect(() => {
  // ...
}, []);
/* eslint-enable react-hooks/exhaustive-deps */
```

**Note**: Avoid disabling rules without a good reason. If you find yourself disabling a rule frequently, discuss it with the team.

## Prettier Configuration

### Settings

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "jsxBracketSameLine": false,
  "jsxSingleQuote": false,
  "endOfLine": "lf"
}
```

### Format Explanation

| Setting | Value | Reasoning |
| --- | --- | --- |
| `printWidth` | 100 | Balances readability on modern monitors |
| `tabWidth` | 2 | Standard for JavaScript/TypeScript projects |
| `singleQuote` | true | Matches ESLint quotes rule |
| `trailingComma` | es5 | Clean diffs, matches ESLint comma-dangle |
| `semi` | true | Explicit semicolons prevent ASI issues |
| `endOfLine` | lf | Consistent line endings (Unix style) |

### Ignoring Files

The `.prettierignore` file excludes files/directories that shouldn't be formatted:
- `node_modules`, `.next`, build artifacts
- Configuration files (package.json, tsconfig.json, etc.)
- Documentation (*.md files)
- Generated files

## IDE Integration

### VS Code Setup

1. Install extensions:
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

2. Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

3. Restart VS Code

Now you'll get:
- Real-time ESLint diagnostics with squiggly underlines
- Auto-fix on save (`source.fixAll.eslint`)
- Auto-format on save with Prettier

## CI/CD Integration

### Pre-commit Hooks (Recommended)

Install `husky` and `lint-staged` to run checks before commits:

```bash
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### GitHub Actions

The CI/CD pipeline runs linting on pull requests. Ensure your code passes all checks before merging.

## Common Issues & Solutions

### "Does not match any of the allowed types"

This error occurs when you're using `any` type unsafely. Either:

1. Use a proper type:
   ```typescript
   // Bad
   const data: any = JSON.parse(response);

   // Good
   interface ResponseData {
     id: string;
     name: string;
   }
   const data: ResponseData = JSON.parse(response);
   ```

2. Or suppress with a comment (when absolutely necessary):
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const config: any = JSON.parse(data);
   ```

### "Unsafe promise in conditionals"

Promise must be awaited or explicitly handled:

```typescript
// Bad
if (fetchData()) {
  // ...
}

// Good
if (await fetchData()) {
  // ...
}

// Also good
const promise = fetchData();
if (await promise) {
  // ...
}
```

### "Missing dependencies in useEffect"

ESLint warns when variables are used in hooks but not in dependency arrays:

```typescript
// Bad
useEffect(() => {
  console.log(userId);
}, []); // Missing userId

// Good
useEffect(() => {
  console.log(userId);
}, [userId]);

// Also good (when intentional)
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  console.log('Only run once');
}, []);
```

## Special Cases

### Child Data & GDPR Compliance

When handling child data, be extra careful:

- Never log sensitive information (ESLint will warn about console.log)
- Always validate parental consent before storing child data
- Type child-related data explicitly (avoid `any`)
- Document why you're suppressing rules if necessary

Example:

```typescript
// Safe child data handling
interface ChildProfile {
  id: string;
  firstName: string;
  dateOfBirth: Date;
  parentalConsent: boolean;
}

async function saveChildProfile(profile: ChildProfile): Promise<void> {
  // Type is explicit, no any, explicit validation
  if (!profile.parentalConsent) {
    throw new Error('Parental consent required');
  }
  // ... save to database
}
```

### Real-time Subscriptions

When subscribing to Supabase real-time changes:

```typescript
// Good: Proper typing and error handling
const subscription = supabase
  .from('exchanges')
  .on('*', (payload) => {
    const exchange: Exchange = payload.new;
    setExchanges((prev) => [...prev, exchange]);
  })
  .subscribe();

// Remember to unsubscribe (ESLint will warn if you don't)
return () => {
  subscription?.unsubscribe();
};
```

## Best Practices

1. **Always fix lint errors before committing** - Use `npm run lint:fix` to auto-fix common issues

2. **Prefer `const` over `let`** - Makes code more predictable

3. **Be explicit with types** - Avoid `any` unless absolutely necessary with a comment

4. **Use async/await over `.then()`** - More readable and easier to debug

5. **Keep functions small** - Easier to understand and test

6. **Comment complex logic** - Help future developers (including yourself!)

7. **Handle errors explicitly** - Don't let promises hang

Example of good code:

```typescript
// Good: Explicit types, proper error handling, readable
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

// Usage in component
const [profile, setProfile] = useState<UserProfile | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  if (!userId) return;

  const loadProfile = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await fetchUserProfile(userId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  loadProfile();
}, [userId]);
```

## Enforcement

Code quality is enforced at multiple levels:

1. **Local**: ESLint/Prettier in your editor (immediate feedback)
2. **Pre-commit**: `husky` and `lint-staged` prevent committing bad code
3. **CI/CD**: GitHub Actions verify all checks pass on pull requests
4. **Code Review**: Team reviews code quality during PR review

## Further Reading

- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React Hooks Rules](https://react.dev/warnings/missing-dependency-in-dependency-array)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Next.js Linting](https://nextjs.org/docs/basic-features/eslint)
