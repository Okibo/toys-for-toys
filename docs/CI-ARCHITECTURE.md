# CI/CD Architecture Diagram

Visual overview of the Toy-for-Toy CI/CD architecture and test filtering system.

## System Architecture

```
                          Toy-for-Toy Repository
                                  |
                    .--------------+---------------.
                    |              |                |
                    v              v                v
              Push to main    Push to develop   Pull Request
                    |              |                |
                    '------+-------+--------+-------'
                           |
                           v
               GitHub Actions Triggered
                           |
           .---------------+---------------.
           |               |               |
           v               v               v
        Lint           Build          Test (npm run test:ci)
        (1 min)        (1 min)         with CI=true env
                                            |
                    .---(Environment Detection)--.
                    |                            |
        isCI = process.env.CI === 'true'
                    |
        .-----------+-----------.
        |                       |
        v                       v
    Database Tests         Unit Tests
    SKIPPED               RUNS
    (in CI)               (in CI)
        |                   |
        |                   v
        |              Test Results
        |              (354 passed)
        |                   |
        '-------+--------+--'
                |
                v
        All Checks Passed?
                |
        .-------+--------.
        |                |
       YES               NO
        |                |
        v                v
   Merge OK         Block Merge
(with approval)      (Red X)
        |                |
        v                v
    Deploy         Notify Developer
    to Vercel      Fix & Push Again
```

## Local vs CI Test Execution Flow

### Local Development Flow

```
Developer runs: npm test
        |
        v
    process.env.CI === 'true'?
        |
        NO (undefined or 'false')
        |
        v
    jest.config.js: testPathIgnorePatterns does NOT include database
        |
        v
    All tests discovered:
    ├─ tests/unit/**/*.test.ts      (INCLUDED)
    ├─ tests/database/**/*.test.ts  (INCLUDED)
    └─ other/**/*.test.ts           (INCLUDED)
        |
        v
    Requires: npx supabase start
        |
        v
    Execution Result:
    ├─ Unit tests:  PASS
    ├─ Database tests: PASS (if Supabase running) or FAIL (without it)
    └─ Other tests: PASS
        |
        v
    Total Tests: ~450 (depending on Supabase)
```

### GitHub Actions CI Flow

```
GitHub Actions Event
        |
        v
    Environment Variables Set:
    ├─ CI = 'true'  <-- KEY VARIABLE
    ├─ Node.js 18.x or 20.x
    └─ npm cache enabled
        |
        v
    npm run test:ci   (which is: CI=true jest)
        |
        v
    jest loads jest.config.js
        |
        v
    const isCI = process.env.CI === 'true'
        |
        YES (GitHub Actions sets this)
        |
        v
    jest.config.js: testPathIgnorePatterns += ['/tests/database/']
        |
        v
    Tests discovered:
    ├─ tests/unit/**/*.test.ts      (INCLUDED)
    ├─ tests/database/**/*.test.ts  (SKIPPED)
    └─ other/**/*.test.ts           (INCLUDED)
        |
        v
    No Supabase needed
        |
        v
    Execution Result:
    ├─ Unit tests: PASS
    ├─ Database tests: SKIPPED
    └─ Other tests: PASS
        |
        v
    Total Tests: ~354 (database tests excluded)
    Time: 2-3 minutes
```

## Test Categories & Routes

```
                        npm test command
                              |
                .---------+---------+---------.
                |         |         |         |
                v         v         v         v
            npm test  npm run    npm run   npm run
                      test:unit  test:ci   test:db
                |         |         |         |
        .-------+-----.   |    .----+------.  |
        |              |  |    |           | |
        v              v  v    v           v v
    Local Dev    Unit Only  CI Mode   DB Only
    All tests    (no DB)    (unit)    (DB only)
        |          |         |          |
        v          v         v          v
    Requires: Supabase (opt) None  Supabase (req)
        |          |         |          |
        Results:   |         |          |
        ~450       ~354      ~354       ~92
        tests      tests     tests      tests
```

## Environment Variable Decision Tree

```
                    npm runs Jest
                          |
                          v
                Has CI env var?
                    /          \
                  YES            NO
                  /                \
                 v                  v
        CI=true detected      CI=false or undefined
                |                   |
                v                   v
        Exclude /tests/db/    Include /tests/db/
                |                   |
                v                   v
        ~354 Unit Tests      ~450 All Tests
        PASS (2-3 min)       PASS/FAIL (depends on Supabase)
```

## File Dependencies

```
.github/workflows/ci.yml
        |
        |-- Sets: env CI=true
        |-- Runs: npm run test:ci
        |
        v
package.json
        |
        |-- test:ci script: "CI=true jest"
        |
        v
jest.config.js
        |
        |-- Reads: process.env.CI
        |-- Detects: isCI = process.env.CI === 'true'
        |-- Modifies: testPathIgnorePatterns
        |
        v
Test Discovery & Execution
        |
        |-- With CI=true: Skip /tests/database/*
        |-- Without CI: Run all tests
        |
        v
Test Results
```

## Database Test Lifecycle

```
Developer Local Environment:
    |
    +-- npm test
    |   |
    |   +-- Supabase running? (npx supabase start)
    |   |   |
    |   |   YES
    |   |   |
    |   |   +-- Database tests EXECUTE
    |   |   |   |
    |   |   |   +-- Connect to localhost:54321
    |   |   |   +-- Run schema validation
    |   |   |   +-- Test RLS policies
    |   |   |   +-- Clean up test data
    |   |   |
    |   |   NO
    |   |   |
    |   |   +-- Database tests FAIL (connection refused)
    |
GitHub Actions CI:
    |
    +-- npm run test:ci
    |   |
    |   +-- CI=true environment detected
    |   |
    |   +-- Database tests SKIPPED
    |       (not even discovered by Jest)
```

## Conditional Compilation Logic

### jest.config.js Implementation

```javascript
const isCI = process.env.CI === 'true';
//  ^^^^ True when GitHub Actions runs
//       False when developer runs npm test

testPathIgnorePatterns: [
  '/node_modules/',
  '/.next/',
  '/dist/',
  '/build/',
  '/out/',
  '/tests/e2e/',
  ...(isCI ? ['/tests/database/'] : []),
  //  ^^^^   True = add database pattern
  //  False = don't add, database tests run
];
```

## Performance Timeline

### Without Database Tests (CI)

```
Seconds   Activity
--------  ------------------------------------------
0         Start: Checkout code
5         Setup Node.js, npm cache
10        Install dependencies
15        npm run lint (ESLint)
75        npm run build (Next.js build)
80        npm run test:ci (unit tests)
160       Finish: All checks pass/fail

Total: ~2.5-3 minutes
```

### With Database Tests (Local)

```
Seconds   Activity
--------  ------------------------------------------
0         Start: npm test
5         Jest discovers all tests
10        Connect to Supabase localhost:54321
15        Run unit tests
80        Run database tests (schema, RLS, policies)
120       Generate coverage (optional)
130       Finish: Results displayed

Total: ~2-3 minutes (if Supabase is already running)
       ~5+ minutes (if starting Supabase first)
```

## Scaling Considerations

### Current Architecture (Unit Tests Only in CI)

```
Test Speed:        2-3 minutes ✓
Flakiness:         Low ✓
Database Req:      No ✓
Supabase Startup:  No ✓
GitHub Cost:       Low ✓
Developer Flow:    Fast feedback ✓
```

### Future Option: Supabase in CI

```
Test Speed:        5-10 minutes
Flakiness:         Medium (if not careful)
Database Req:      Yes
Supabase Startup:  3-5 min
GitHub Cost:       Higher
Developer Flow:    Comprehensive testing ✓
```

## Success Metrics

```
CI/CD Configuration Validation:
├── GitHub Actions Passing
│   ├── Lint checks
│   ├── Build successful
│   ├── Unit tests passing
│   └── Database tests skipped ✓
│
├── Local Development
│   ├── npm test runs all tests
│   ├── npm run test:unit skips DB
│   ├── npm run test:ci works offline
│   └── Database tests with Supabase ✓
│
└── Documentation
    ├── TESTING.md exists
    ├── CI-CD.md exists
    ├── QUICK-TEST-REFERENCE.md exists
    └── IMPLEMENTATION_SUMMARY.md exists ✓
```

## References

- See `docs/TESTING.md` for testing details
- See `docs/CI-CD.md` for workflow details
- See `docs/QUICK-TEST-REFERENCE.md` for command reference
- See `IMPLEMENTATION_SUMMARY.md` for implementation details
