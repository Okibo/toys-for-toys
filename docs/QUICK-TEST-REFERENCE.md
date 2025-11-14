# Quick Test Reference

Quick guide for running tests in different scenarios.

## Before You Start

```bash
# Install dependencies
npm install

# For database tests only: Start Supabase
npx supabase start
```

## Common Commands

### Local Development (All Tests)

```bash
npm test                 # Run all tests (includes database tests if Supabase is running)
npm run test:watch      # Watch mode - reruns tests on file change
npm run test:coverage   # Generate coverage report
```

### Unit Tests Only (No Database Required)

```bash
npm run test:unit              # Run unit tests only
npm run test:unit -- --watch   # Watch mode for unit tests
```

### Database Tests Only (Requires Supabase)

```bash
npx supabase start             # Start Supabase first
npm run test:database          # Run only database tests
npm run test:database -- --watch  # Watch mode for database tests
```

### Simulate CI Environment (Locally)

```bash
npm run test:ci    # Runs like GitHub Actions (skips database tests)
```

### Specific Test File

```bash
npm test -- core-tables.test.ts                    # Run specific test file
npm test -- --testNamePattern="UUID generation"    # Run tests matching pattern
```

## GitHub Actions CI

- Automatically skips database tests
- Runs on all pushes to `main` and `develop`
- Runs on all pull requests
- Tests fail if linting, build, or unit tests fail

## Environment Variables

### Setting CI Mode

```bash
# Force CI mode (skips database tests)
CI=true npm test

# Force local mode (includes database tests)
CI=false npm test
```

### For Database Tests

```bash
# Override Supabase URL (default: localhost:54321)
NEXT_PUBLIC_SUPABASE_URL=http://custom-url npm run test:database

# Override Supabase Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key npm run test:database
```

## Troubleshooting

### Database tests fail with "Connection refused"

```bash
# Start Supabase
npx supabase start

# Check it's running
npx supabase status
```

### Database tests timeout

```bash
# Increase timeout to 60 seconds
npm run test:database -- --testTimeout=60000
```

### Run tests sequentially (not parallel)

```bash
# Useful for tests that interfere with each other
npm test -- --runInBand
```

### Debug a specific test

```bash
# Run with inspection enabled
node --inspect-brk node_modules/.bin/jest --runInBand tests/database/core-tables.test.ts

# Then open: chrome://inspect/
```

### Clear Jest cache

```bash
npm test -- --clearCache
```

## Test Categories

| Category      | Command                 | Requires Supabase |
| ------------- | ----------------------- | ----------------- |
| All tests     | `npm test`              | Yes               |
| Unit only     | `npm run test:unit`     | No                |
| Database only | `npm run test:database` | Yes               |
| CI mode       | `npm run test:ci`       | No                |
| Watch mode    | `npm run test:watch`    | Yes               |
| Coverage      | `npm run test:coverage` | Yes               |

## Before Committing

1. Run linting: `npm run lint`
2. Run build: `npm run build`
3. Run tests: `npm test` (if you have Supabase running) or `npm run test:unit` (if not)
4. Commit and push

## CI Checklist

Before pushing to `main` or `develop`:

- [ ] Local tests pass: `npm test` (with Supabase) or `npm run test:unit`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors when running `npm run dev`

## Documentation

For detailed information, see:

- [docs/TESTING.md](./TESTING.md) - Comprehensive testing guide
- [docs/CI-CD.md](./CI-CD.md) - CI/CD workflow documentation
