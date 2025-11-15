# Code Quality Setup - Toy-for-Toy

Comprehensive documentation for the ESLint and Prettier configuration for the Toy-for-Toy project.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration Overview](#configuration-overview)
3. [File Reference](#file-reference)
4. [IDE Setup](#ide-setup)
5. [Running Checks](#running-checks)
6. [Acceptance Criteria Status](#acceptance-criteria-status)

## Quick Start

### Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Verify configuration is valid (runs tests)
npm test -- tests/config/eslint-prettier-config.test.js

# 3. Check code for linting issues
npm run lint

# 4. Auto-fix linting issues
npm run lint:fix

# 5. Check code formatting
npm run format:check

# 6. Auto-format code
npm run format
```

### Daily Workflow

```bash
# Before committing changes
npm run lint:fix    # Fix linting issues
npm run format      # Format code
git add .          # Stage changes
git commit -m "Your message"
```

## Configuration Overview

### ESLint (Static Code Analysis)

**File:** `/Users/pawelkalkun/Projects/private/toys-for-toys/.eslintrc.json`

ESLint enforces code quality by catching bugs, security issues, and style inconsistencies.

**Key Features:**
- Extends Next.js core-web-vitals rules
- Strict TypeScript checking with type information
- React hooks validation (Rules of Hooks)
- Automatic error detection and warnings
- Compatible with Prettier formatting

**Configuration:**
- Parser: `@typescript-eslint/parser`
- Plugins: `@typescript-eslint`, `react`, `react-hooks`
- Environment: Browser, Node.js, ES2021
- Project-aware checking using `tsconfig.json`

**Error Levels:**
- **Error**: Must be fixed before committing (bugs, security issues)
- **Warn**: Should be reviewed but may be acceptable (questionable patterns)
- **Off**: Intentionally disabled (conflicts with Prettier or project style)

### Prettier (Code Formatting)

**File:** `/Users/pawelkalkun/Projects/private/toys-for-toys/.prettierrc.json`

Prettier automatically formats code for consistency and readability.

**Configuration:**
```json
{
  "printWidth": 100,           // Line length limit
  "tabWidth": 2,               // Spaces per indentation level
  "useTabs": false,            // Use spaces, not tabs
  "semi": true,                // Require semicolons
  "singleQuote": true,         // Use single quotes for strings
  "trailingComma": "es5",      // Add trailing commas where valid in ES5
  "bracketSpacing": true,      // Space inside object literals
  "arrowParens": "always",     // Require parens around arrow function params
  "jsxBracketSameLine": false, // JSX closing bracket on new line
  "jsxSingleQuote": false,     // Use double quotes for JSX attributes
  "endOfLine": "lf"            // Unix line endings
}
```

### Ignore Files

**ESLint Ignore File:** `/Users/pawelkalkun/Projects/private/toys-for-toys/.eslintignore`
- Excludes: dependencies, build artifacts, configuration files, generated files
- Prevents false positives on files outside project scope

**Prettier Ignore File:** `/Users/pawelkalkun/Projects/private/toys-for-toys/.prettierignore`
- Excludes: dependencies, build artifacts, documentation, config files
- Prevents unnecessary formatting of non-source files

### Lint-Staged Configuration

**File:** `/Users/pawelkalkun/Projects/private/toys-for-toys/.lintstagedrc.json`

Automatically runs linting and formatting on staged files before commit (when husky is configured).

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

## File Reference

### Created Files

| File | Purpose | Status |
| --- | --- | --- |
| `.eslintrc.json` | ESLint configuration | Created & Validated |
| `.prettierrc.json` | Prettier configuration | Created & Validated |
| `.eslintignore` | Files to exclude from ESLint | Created & Validated |
| `.prettierignore` | Files to exclude from Prettier | Created & Validated |
| `.lintstagedrc.json` | Pre-commit hook configuration | Created & Validated |
| `docs/CODE_QUALITY_STANDARDS.md` | Code quality guidelines | Created |
| `tests/config/eslint-prettier-config.test.js` | Configuration validation tests | Created & All 37 tests pass |

### Updated Files

| File | Changes |
| --- | --- |
| `package.json` | Added `lint`, `lint:fix`, `format`, `format:check` scripts |
| `jest.config.js` | Removed ts-jest transform (not needed), removed watch plugins |

## IDE Setup

### VS Code

1. Install extensions:
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

2. Create/update `.vscode/settings.json`:

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

**Result:**
- Real-time ESLint diagnostics (red squiggles)
- Auto-fix ESLint issues on save
- Auto-format with Prettier on save
- Consistent code style across team

## Running Checks

### Local Development

```bash
# Check for linting errors
npm run lint

# Auto-fix fixable errors
npm run lint:fix

# Check formatting (no changes)
npm run format:check

# Auto-format code
npm run format

# Type checking
npm run type-check

# Run all tests
npm test

# Run specific test suite
npm test -- tests/config/eslint-prettier-config.test.js
```

### CI/CD Pipeline

Code quality checks should run in CI/CD:

```bash
# In GitHub Actions or similar:
npm run lint        # Fail if any linting errors
npm run format:check # Fail if code not formatted
npm run type-check  # Fail if type errors
npm test            # Fail if tests fail
```

## ESLint Rules Explained

### TypeScript Rules

| Rule | Level | Why |
| --- | --- | --- |
| `@typescript-eslint/no-unused-vars` | error | Catches dead code and typos |
| `@typescript-eslint/no-explicit-any` | warn | Encourages proper typing (allows exceptions) |
| `@typescript-eslint/no-floating-promises` | warn | Prevents unhandled async operations |
| `@typescript-eslint/await-thenable` | error | Ensures promises are properly awaited |
| `@typescript-eslint/no-misused-promises` | error | Prevents logic errors with promises |
| `@typescript-eslint/consistent-type-imports` | warn | Proper type import syntax |

### React & Hooks Rules

| Rule | Level | Why |
| --- | --- | --- |
| `react-hooks/rules-of-hooks` | error | Critical: Rules of Hooks must be followed |
| `react-hooks/exhaustive-deps` | warn | Catches missing dependencies |
| `react/jsx-key` | error | Prevents React rendering bugs |
| `react/no-children-prop` | error | Enforces proper children usage |

### General Code Quality

| Rule | Level | Why |
| --- | --- | --- |
| `no-console` | warn | Catches forgotten debug logs |
| `no-var` | error | Modern ES6+ standard |
| `prefer-const` | error | Makes data flow clearer |
| `eqeqeq` | error | Prevents type coercion bugs |
| `curly` | error | Explicit block delimiters |
| `semi` | error | Consistent statement termination |

## Acceptance Criteria Status

All acceptance criteria have been met:

- [x] `.eslintrc.json` exists and is valid
  - Created: `/Users/pawelkalkun/Projects/private/toys-for-toys/.eslintrc.json`
  - Validated: 16 test assertions pass

- [x] ESLint configured for Next.js and TypeScript
  - Extends: `next/core-web-vitals`
  - Parser: `@typescript-eslint/parser`
  - Plugins: `@typescript-eslint`, `react`, `react-hooks`
  - Project-aware type checking enabled

- [x] React hooks rules enabled
  - `react-hooks/rules-of-hooks`: error
  - `react-hooks/exhaustive-deps`: warn

- [x] Proper rules for development team (not overly strict)
  - Errors: Critical issues only
  - Warns: Important patterns to review
  - Off: Conflicts with Prettier or project style

- [x] Prettier configuration created (`.prettierrc.json`)
  - Created: `/Users/pawelkalkun/Projects/private/toys-for-toys/.prettierrc.json`
  - Validated: 11 test assertions pass
  - Matches specified settings exactly

- [x] .prettierignore file created
  - Created: `/Users/pawelkalkun/Projects/private/toys-for-toys/.prettierignore`
  - Excludes all unnecessary files

- [x] ESLint and Prettier are compatible (no conflicts)
  - `prettier` plugin included in ESLint extends
  - Quote styles match: `@typescript-eslint/quotes: "single"` & `singleQuote: true`
  - Semicolons match: `semi: "error"` & `semi: true`
  - Trailing commas match: `comma-dangle: "es5"` & `trailingComma: "es5"`
  - Validated: 4 test assertions pass

- [x] Recommended rules for a production project
  - Strict TypeScript checking with type information
  - Promise handling validation
  - Security-focused (no implicit any without warning)
  - Best practices for React hooks

- [x] IDE integration ready (VS Code)
  - Configuration documented in this file
  - Extensions identified and instructions provided
  - `.vscode/settings.json` template included

- [x] npm scripts for linting added to package.json
  - `npm run lint` - Check for linting errors
  - `npm run lint:fix` - Auto-fix linting issues
  - `npm run format` - Auto-format code
  - `npm run format:check` - Check formatting without changes
  - Validated: 4 test assertions pass

## Test Results

**Validation Test Suite: 37 tests, 37 passed**

```
PASS tests/config/eslint-prettier-config.test.js
  Code Quality Configuration Validation
    ESLint Configuration (16 tests)
    ✓ All assertions pass
    Prettier Configuration (11 tests)
    ✓ All assertions pass
    Ignore Files (2 tests)
    ✓ All assertions pass
    Configuration Compatibility (4 tests)
    ✓ All assertions pass
    Package.json Lint Scripts (4 tests)
    ✓ All assertions pass
```

## Best Practices

### Code Reviews

When reviewing code, check:
1. No ESLint errors (`npm run lint`)
2. Properly formatted (`npm run format:check`)
3. No unused variables
4. No missing dependencies in hooks
5. Proper error handling
6. Type safety (no `any` without justification)

### Handling Warnings

- **React Hook Warnings**: Review and add dependencies if needed
- **Console Warnings**: Remove debug logs before committing
- **Type Warnings**: Use `as` type assertion only with comment
- **Promise Warnings**: Ensure proper async/await usage

### Common Fixes

```bash
# Most issues are auto-fixable
npm run lint:fix

# Then format
npm run format

# Then review changes
git diff
```

## Troubleshooting

### ESLint Errors After Update

If ESLint rules change:
```bash
npm run lint      # See what errors exist
npm run lint:fix  # Auto-fix what can be fixed
npm run lint      # Review remaining issues
```

### Prettier vs ESLint Conflicts

If Prettier and ESLint fight:
1. Ensure `prettier` is in ESLint extends
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Restart editor

### Pre-commit Hook Issues

To setup pre-commit checks (optional):
```bash
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

## Resources

- [ESLint Documentation](https://eslint.org/docs/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [React Hooks Rules](https://react.dev/warnings/missing-dependency-in-dependency-array)
- [Next.js Linting](https://nextjs.org/docs/basic-features/eslint)
