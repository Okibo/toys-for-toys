# Task 1.6: Create Development & Testing Documentation

**Epic:** Project Setup & Infrastructure (Week 1)
**Status:** Pending
**Effort:** 1 day
**Dependencies:** Tasks 1.1-1.5 (all infrastructure setup tasks)
**Assigned To:** [TBD]
**Created:** 2025-11-13

---

## Overview

Create comprehensive documentation for developers and contributors covering project setup, testing strategies, coding standards, and common issues. This ensures new team members can onboard quickly and everyone follows consistent development practices.

---

## Acceptance Criteria

### CONTRIBUTING.md Documentation
- [x] File created: `CONTRIBUTING.md` with:
  - [x] Project overview & mission statement
  - [x] Getting started (setup instructions)
  - [x] Development environment setup
  - [x] Code style guidelines (ESLint, Prettier rules)
  - [x] Branch naming conventions
  - [x] Commit message format (Conventional Commits)
  - [x] PR submission process
  - [x] Code review expectations
  - [x] Testing requirements
  - [x] Troubleshooting section

### Testing Documentation
- [x] File created: `tests/README.md` with:
  - [x] Overview of testing strategy
  - [x] Jest configuration explanation
  - [x] How to write unit tests (with examples)
  - [x] How to write integration tests
  - [x] Playwright E2E setup (basic for MVP)
  - [x] Running tests locally (commands)
  - [x] Coverage targets and checking coverage
  - [x] CI integration (how tests run in GitHub Actions)
  - [x] Common test patterns (mocking, async, etc.)
  - [x] Debugging failing tests

### Database Documentation
- [x] File created: `docs/DATABASE.md` with:
  - [x] Database overview (Supabase, PostgreSQL)
  - [x] Local development setup
  - [x] Running local Supabase instance
  - [x] Database migrations guide
  - [x] RLS (Row-Level Security) policies explanation
  - [x] Common queries and debugging
  - [x] Backup & recovery procedures
  - [x] Environment variable reference
  - [x] Troubleshooting common DB issues

### API Documentation
- [x] File created: `docs/API.md` - skeleton with:
  - [x] API overview and base URL
  - [x] Authentication & authorization
  - [x] Error codes and handling
  - [x] Request/response format (JSON)
  - [x] Endpoint categories (Auth, Toys, Exchanges, etc.)
  - [x] API endpoint templates (to be filled in Task 4)
  - [x] Rate limiting & quotas
  - [x] Webhooks (for Phase 2)

### Troubleshooting Guide
- [x] File created: `docs/TROUBLESHOOTING.md` with:
  - [x] Common setup issues
  - [x] Development issues (env vars, ports, etc.)
  - [x] Supabase connection problems
  - [x] Firebase/FCM issues
  - [x] Build failures and fixes
  - [x] Test failures and debugging
  - [x] Performance issues
  - [x] "It works on my machine" solutions
  - [x] How to ask for help / get support

### Architecture Documentation
- [x] File created: `docs/ARCHITECTURE.md` with:
  - [x] System architecture overview
  - [x] Component structure (frontend)
  - [x] Database schema (high-level)
  - [x] API design principles
  - [x] Authentication flow
  - [x] Data flow diagrams
  - [x] Technology decisions and rationale
  - [x] Security considerations
  - [x] Performance considerations

### PR Template
- [x] File created: `.github/pull_request_template.md` with:
  - [x] PR description section
  - [x] Type of change checkboxes
  - [x] Testing instructions
  - [x] Checklist before submitting
  - [x] Screenshots section (for UI changes)
  - [x] Breaking changes notice

### Development Workflow Documentation
- [x] File created: `docs/WORKFLOW.md` with:
  - [x] Feature development lifecycle
  - [x] Branch strategy and naming
  - [x] Commit message conventions
  - [x] PR review process
  - [x] Merging and deployment workflow
  - [x] Release process (for future versions)

### Setup & Onboarding
- [x] File created: `docs/SETUP.md` with:
  - [x] System requirements (Node.js version, etc.)
  - [x] Installation steps (clone, npm install, etc.)
  - [x] Environment variable setup (`.env.local`)
  - [x] Supabase local setup
  - [x] Firebase setup
  - [x] Starting dev server
  - [x] Verifying setup (test endpoints)
  - [x] IDE setup (VS Code recommendations)

### Code Examples & Patterns
- [x] File created: `docs/CODE_PATTERNS.md` with:
  - [x] Supabase client usage
  - [x] React hooks patterns
  - [x] Form handling (React Hook Form + Zod)
  - [x] State management (Zustand)
  - [x] Error handling
  - [x] Async data fetching
  - [x] Component structure
  - [x] File organization

### README.md Updates
- [x] Updated `README.md` with:
  - [x] Project description
  - [x] Key features
  - [x] Tech stack
  - [x] Quick start link to `docs/SETUP.md`
  - [x] Contributing link to `CONTRIBUTING.md`
  - [x] Documentation index
  - [x] License
  - [x] CI/CD status badge

### Documentation Navigation
- [x] File created: `docs/INDEX.md` or update `README.md` with:
  - [x] Index of all documentation files
  - [x] Quick links to common tasks
  - [x] FAQ section
  - [x] Troubleshooting quick links
  - [x] Resource links

---

## Implementation Details

### Step 1: Create CONTRIBUTING.md

#### 1.1 Create `CONTRIBUTING.md`
```markdown
# Contributing to Toy-for-Toy

Thank you for interest in contributing! This guide explains how to contribute code, report issues, and participate in the project.

## Code of Conduct

Be respectful, inclusive, and professional. We don't tolerate harassment or discrimination.

## Getting Started

### Prerequisites
- Node.js 18+ (download from https://nodejs.org/)
- npm 9+ (comes with Node.js)
- Git (download from https://git-scm.com/)
- GitHub account
- Vercel account (for deployments)
- Supabase account (for database)

### Setup Local Development

1. **Fork & Clone Repository**
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/toys-for-toys.git
   cd toys-for-toys
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Setup Environment Variables**
   - Copy \`.env.example\` to \`.env.local\`
   - Fill in values from Supabase, Firebase, etc.
   - See [SETUP.md](docs/SETUP.md) for detailed instructions

4. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   - App runs at http://localhost:3000
   - Supabase Studio at http://localhost:54323 (if using local instance)

5. **Verify Setup**
   \`\`\`bash
   npm run lint        # Should pass with 0 errors
   npm run type-check  # Should pass with 0 errors
   npm test            # Should pass (or run with no tests)
   npm run build       # Should complete in <60 seconds
   \`\`\`

See [SETUP.md](docs/SETUP.md) for more detailed setup instructions.

## Code Style

### Formatting
- Use Prettier for automatic formatting
- Run \`npm run format\` before committing
- Commit hooks run Prettier automatically

### Linting
- Use ESLint for code quality
- Run \`npm run lint\` to check
- Run \`npm run lint -- --fix\` to auto-fix issues
- No console.log() in production code (use proper logging)

### TypeScript
- Write all code in TypeScript (`.ts` or `.tsx` files)
- Strict mode enabled (\`strict: true\` in tsconfig.json)
- No \`any\` types without justification (add comment: \`// eslint-disable-next-line @typescript-eslint/no-explicit-any\`)
- Add types for function parameters and returns

### Naming Conventions
- **Components:** PascalCase (e.g., \`ToyCard.tsx\`)
- **Functions:** camelCase (e.g., \`getToyDetails()\`)
- **Constants:** UPPER_SNAKE_CASE (e.g., \`MAX_RETRIES = 3\`)
- **Files:** kebab-case for non-component files (e.g., \`util-helper.ts\`)

## Branch & Commit

### Branch Naming
\`\`\`
feat/add-toy-search           # New feature
fix/resolve-auth-bug          # Bug fix
refactor/optimize-queries     # Code improvement
docs/update-api-docs          # Documentation
test/add-exchange-tests       # Tests
chore/update-dependencies     # Maintenance
\`\`\`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
feat(toys): Add toy search functionality
fix(auth): Resolve JWT token refresh issue
docs(api): Update API endpoint documentation
test(exchanges): Add unit tests for escrow logic
\`\`\`

Format: \`<type>(<scope>): <subject>\`

- **Type:** feat, fix, docs, test, refactor, chore
- **Scope:** Feature area (toys, exchanges, games, etc.)
- **Subject:** Concise, imperative mood ("add" not "added")

### Commit Size
- Keep commits focused on one logical change
- Avoid mixing features/fixes in single commit
- Allows easier code review and rollbacks

## Pull Requests

### Before Submitting PR
1. Update your branch with latest \`main\`:
   \`\`\`bash
   git fetch origin
   git rebase origin/main
   \`\`\`

2. Run all checks locally:
   \`\`\`bash
   npm run lint         # Fix formatting
   npm run type-check   # Fix type errors
   npm test             # Ensure tests pass
   npm run build        # Ensure build succeeds
   \`\`\`

3. If all pass, push to your branch:
   \`\`\`bash
   git push origin feat/your-feature
   \`\`\`

### PR Submission
- Go to GitHub and open PR from your branch to \`main\`
- PR template auto-fills (see \`.github/pull_request_template.md\`)
- Fill in description, type, and testing instructions
- Link related issues with \`Fixes #123\`

### PR Description
- Explain **what** changed and **why**
- Reference related issues or discussions
- Include screenshots for UI changes
- List testing steps for reviewers

### Code Review Process
- At least 1 approval required before merge
- GitHub Actions CI must pass
- Address reviewer comments
- Maintainers merge when ready

## Testing

### Running Tests Locally
\`\`\`bash
npm test              # Run all tests
npm test -- --watch  # Watch mode (re-run on changes)
npm run test:coverage # Generate coverage report
\`\`\`

### Writing Tests
- Unit tests co-located with components/functions
- Test behavior, not implementation
- Use descriptive test names
- See [tests/README.md](tests/README.md) for examples

### Coverage Targets
- Aim for 80%+ code coverage
- Required for main features
- View coverage report: \`npm run test:coverage\`

See [tests/README.md](tests/README.md) for detailed testing guide.

## Performance & Security

### Performance
- Use React DevTools Profiler to identify slow components
- Check Network tab for unnecessary API calls
- Optimize bundle size: \`npm run build\` shows size analysis

### Security
- Never commit sensitive data (.env.local, API keys)
- Use environment variables for secrets
- Sanitize user input (Zod validation)
- Report security issues privately to maintainers

## Database Changes

### Migrations
- Create migration file: \`npx supabase migration new <name>\`
- Write SQL in migration file
- Test locally: \`npx supabase db reset\`
- Push when ready: \`npx supabase db push\`

See [docs/DATABASE.md](docs/DATABASE.md) for migration guide.

## Getting Help

### Questions & Issues
- Check [docs/](docs) for existing documentation
- Search [GitHub Issues](https://github.com/pawelkalkun/toys-for-toys/issues) for similar problems
- Ask in GitHub Discussions
- Email maintainers if sensitive

### Debugging
- See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
- Use browser DevTools for frontend issues
- Use Supabase Studio for database issues
- Check logs in Vercel dashboard for production issues

## Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed structure.

Quick overview:
\`\`\`
/app          - Next.js pages and routes
/components   - React components
/lib          - Utilities and hooks
/supabase     - Database schema and migrations
/tests        - Test files
/docs         - Documentation
\`\`\`

## Documentation

- Keep documentation up to date with code changes
- Add comments for complex logic
- Update examples if behavior changes
- Link to related docs and resources

## Recognition

- Contributors listed in README.md
- All contributions appreciated (code, docs, feedback, etc.)
- Join community discussions

## License

By contributing, you agree code is licensed under [LICENSE](LICENSE).

---

**Questions?** Open an issue or discussion on GitHub.
**Ready to contribute?** Follow the steps above and submit your PR!
```

### Step 2: Create Testing Documentation

#### 2.1 Create `tests/README.md`
```markdown
# Testing Guide

This guide covers unit testing, integration testing, and E2E testing for the Toy-for-Toy project.

## Overview

### Testing Pyramid
- **Unit Tests (70%):** Individual functions and components
- **Integration Tests (20%):** Multiple components working together
- **E2E Tests (10%):** Full user workflows

### Test Files Location
- Jest: Co-located with features (e.g., \`lib/utils.test.ts\`)
- Playwright: Centralized in \`tests/e2e/\`

## Jest (Unit & Integration Tests)

### Setup
Jest configured in \`jest.config.js\` and \`jest.setup.js\`.

Key settings:
- Environment: \`jest-environment-jsdom\` (for React components)
- Path aliases: \`@/*\` maps to project root
- Coverage: Configured in \`jest.config.js\`

### Running Tests

\`\`\`bash
npm test              # Run all tests once
npm test -- --watch  # Watch mode (re-run on file changes)
npm test -- --coverage  # Generate coverage report
npm test -- app.test.ts  # Run specific file
npm test -- -t "todo"  # Run tests matching pattern "todo"
\`\`\`

### Writing Unit Tests

Example: Testing a utility function

\`\`\`typescript
// lib/utils.ts
export function calculateTicketBalance(
  owned: number,
  frozen: number
): number {
  return owned - frozen
}

// lib/utils.test.ts
import { calculateTicketBalance } from './utils'

describe('calculateTicketBalance', () => {
  it('calculates correct balance', () => {
    const result = calculateTicketBalance(10, 3)
    expect(result).toBe(7)
  })

  it('handles zero values', () => {
    expect(calculateTicketBalance(0, 0)).toBe(0)
  })

  it('handles negative frozen (edge case)', () => {
    // Edge case: frozen should never be negative, but test robustness
    expect(calculateTicketBalance(10, -1)).toBe(11)
  })
})
\`\`\`

### Testing React Components

Example: Testing a toy card component

\`\`\`typescript
// components/toys/ToyCard.test.tsx
import { render, screen } from '@testing-library/react'
import ToyCard from './ToyCard'

describe('ToyCard', () => {
  const mockToy = {
    id: '1',
    name: 'LEGO Set',
    description: 'Fun building blocks',
    condition: 'like-new',
    image_url: '/toy.jpg',
  }

  it('renders toy information', () => {
    render(<ToyCard toy={mockToy} />)
    expect(screen.getByText('LEGO Set')).toBeInTheDocument()
    expect(screen.getByText('like-new')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<ToyCard toy={mockToy} onClick={onClick} />)
    screen.getByRole('button').click()
    expect(onClick).toHaveBeenCalled()
  })
})
\`\`\`

### Mocking

#### Mocking Modules
\`\`\`typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))
\`\`\`

#### Mocking Functions
\`\`\`typescript
const mockFetch = jest.fn()
global.fetch = mockFetch
mockFetch.mockResolvedValue(
  Promise.resolve({ ok: true, json: () => ({ data: [] }) })
)
\`\`\`

### Async Tests

\`\`\`typescript
describe('Async Operations', () => {
  it('fetches toys', async () => {
    const result = await fetchToys()
    expect(result).toEqual([])
  })
})
\`\`\`

## Playwright (E2E Tests)

### Setup
Playwright configured in \`playwright.config.ts\`.

Key settings:
- Browser: Chromium (default)
- Timeout: 30 seconds per test
- Retries: 0 (local), 2 (CI)
- Screenshots: On failure

### Running E2E Tests

\`\`\`bash
npx playwright test          # Run all E2E tests
npx playwright test --ui     # Interactive UI mode
npx playwright test --debug  # Debugger mode
npx playwright test --headed  # Show browser window
\`\`\`

### Writing E2E Tests

Example: User login flow

\`\`\`typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('user can log in', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation and verify
    await page.waitForURL('**/dashboard')
    expect(page.url()).toContain('dashboard')
  })
})
\`\`\`

### Locators

\`\`\`typescript
// By role (recommended - accessible)
page.getByRole('button', { name: 'Submit' })

// By test ID (when role not sufficient)
page.getByTestId('toy-card')

// By CSS selector
page.locator('.toy-list')

// By text
page.getByText('Click me')
\`\`\`

### Assertions

\`\`\`typescript
expect(locator).toBeVisible()
expect(locator).toContainText('Hello')
expect(page).toHaveTitle('Toy-for-Toy')
expect(page).toHaveURL(/.*dashboard/)
\`\`\`

## Coverage

### Generating Coverage Report

\`\`\`bash
npm run test:coverage
\`\`\`

Outputs to \`coverage/\` directory.

### Viewing Coverage

\`\`\`bash
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html  # Windows
\`\`\`

### Coverage Targets
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

## CI Integration

Tests run automatically in GitHub Actions:
1. Lint check
2. Type check
3. Unit tests (Jest)
4. Build (Next.js)
5. (E2E tests in Phase 2)

Tests must pass before PR merge.

## Best Practices

### What to Test
✅ Utility functions
✅ Business logic
✅ Component rendering
✅ User interactions
✅ API calls (mocked)
✅ Error handling

### What NOT to Test
❌ Third-party libraries
❌ Implementation details
❌ Component internals
❌ External APIs (mock instead)
❌ React itself

### Test Quality

- **Descriptive names:** Explain what test does
- **Arrange-Act-Assert:** Setup → Action → Verify
- **One assertion per test:** (or related assertions)
- **No test dependencies:** Each test independent
- **Fast:** Unit tests <100ms, E2E tests <5s

Example:

\`\`\`typescript
describe('ToyCard', () => {
  // ARRANGE
  const mockToy = { id: '1', name: 'LEGO' }

  it('displays toy name', () => {
    // ACT
    render(<ToyCard toy={mockToy} />)

    // ASSERT
    expect(screen.getByText('LEGO')).toBeInTheDocument()
  })
})
\`\`\`

## Debugging

### Debug Output

\`\`\`typescript
import { screen, debug } from '@testing-library/react'

debug() // Print DOM to console
screen.logTestingPlaygroundURL() // Link to Testing Playground
\`\`\`

### VS Code Integration

Extensions:
- "Jest" by orta
- "Playwright Test for VSCode"

Right-click test file → Run test.

## Common Issues

### Tests Fail: "Cannot find module"
- Run \`npm install\` to ensure dependencies installed
- Check path aliases in \`tsconfig.json\`

### Tests Timeout
- Increase timeout: \`jest.setTimeout(10000)\`
- Check for unresolved promises
- Verify mocks are working

### TypeScript Errors in Tests
- Ensure test files are \`.test.ts\` or \`.test.tsx\`
- Check tsconfig includes test directory

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
```

### Step 3: Create Database Documentation

#### 3.1 Create `docs/DATABASE.md`
```markdown
# Database Documentation

## Overview

- **Type:** PostgreSQL 15+ (via Supabase)
- **Location:** EU region (Ireland or Germany)
- **Purpose:** Store user data, toys, exchanges, and app state
- **Access:** SQL queries + Supabase client SDK

## Local Development

### Start Local Database

\`\`\`bash
npx supabase start
\`\`\`

This starts:
- PostgreSQL on \`localhost:5432\`
- Supabase Studio on \`http://localhost:54323\`
- API on \`http://localhost:54321\`

### Access Supabase Studio

1. Navigate to \`http://localhost:54323\`
2. Email: \`supabase@example.com\`
3. Password: [as configured]
4. Explore tables, run queries, etc.

### Environment Variables

Local development (\`.env.local\`):
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
\`\`\`

## Migrations

### Creating a Migration

\`\`\`bash
npx supabase migration new <migration_name>
\`\`\`

This creates \`supabase/migrations/[timestamp]_<name>.sql\`.

### Writing Migrations

\`\`\`sql
-- Create new table
CREATE TABLE toys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX toys_user_id_idx ON toys(user_id);
\`\`\`

### Applying Migrations

Locally:
\`\`\`bash
npx supabase db reset  # Resets to latest migrations
\`\`\`

Remote (Vercel):
\`\`\`bash
npx supabase db push  # Push to remote project
\`\`\`

## Row-Level Security (RLS)

RLS policies ensure users can only access their own data.

### Enable RLS on Table

\`\`\`sql
ALTER TABLE toys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own toys
CREATE POLICY toys_select ON toys
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own toys
CREATE POLICY toys_insert ON toys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
\`\`\`

### Test RLS

1. Go to Supabase Studio → SQL Editor
2. Run query as different user (Supabase Auth)
3. Verify users only see their own data

## Common Queries

### Insert Toy

\`\`\`sql
INSERT INTO toys (user_id, name, description)
VALUES (auth.uid(), 'LEGO Set', 'Fun building blocks')
RETURNING *;
\`\`\`

### Query Own Toys

\`\`\`sql
SELECT * FROM toys WHERE user_id = auth.uid();
\`\`\`

### Update Toy

\`\`\`sql
UPDATE toys SET name = 'New Name'
WHERE id = '123e4567-e89b-12d3-a456-426614174000'
RETURNING *;
\`\`\`

## Backup & Recovery

### Local Backup

\`\`\`bash
pg_dump postgresql://user:pass@localhost/postgres > backup.sql
\`\`\`

### Local Restore

\`\`\`bash
psql postgresql://user:pass@localhost/postgres < backup.sql
\`\`\`

### Remote Backup

Supabase Studio → Settings → Backups
- Daily automatic backups (7-day retention)
- Manual backup available anytime

## Troubleshooting

### "Connection refused"
- Verify Supabase running: \`docker ps | grep supabase\`
- Check environment variables
- Restart: \`npx supabase stop && npx supabase start\`

### "RLS policy missing"
- Check policy exists: \`SELECT * FROM pg_policies WHERE tablename = 'toys';\`
- Create missing policy

### "Permission denied"
- Verify user authenticated
- Check RLS policy allows operation
- Review auth token validity

## Performance

### Indexes

Create indexes for frequently queried columns:

\`\`\`sql
CREATE INDEX toys_user_id_idx ON toys(user_id);
CREATE INDEX exchanges_status_idx ON exchanges(status);
\`\`\`

### Query Optimization

Use \`EXPLAIN ANALYZE\` to optimize slow queries:

\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM toys WHERE user_id = auth.uid();
\`\`\`

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
```

### Step 4: Create Additional Documentation Files

#### 4.1 Create `docs/API.md`
```markdown
# API Documentation

## Overview

Base URL:
- Development: \`http://localhost:3000/api\`
- Production: \`https://toys-for-toys.vercel.app/api\`

## Authentication

All requests require JWT token in \`Authorization\` header:

\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Endpoints

### Auth Endpoints
(To be documented in Task 3)

### Toy Endpoints
(To be documented in Task 4)

### Exchange Endpoints
(To be documented in Task 4)

More documentation in implementation tasks...
\`\`\`

#### 4.2 Create `docs/TROUBLESHOOTING.md`
```markdown
# Troubleshooting Guide

## Setup Issues

### "Cannot find module @/components"
**Solution:**
- Check path aliases in \`tsconfig.json\`
- Run \`npm install\` to reinstall dependencies
- Restart dev server

### "ENOENT: no such file or directory .env.local"
**Solution:**
- Create \`.env.local\` from \`.env.example\`
- Copy values from Supabase and Firebase
- Restart dev server

## Database Issues

### "Connection refused (localhost:5432)"
**Solution:**
- Start Supabase: \`npx supabase start\`
- Check Docker running: \`docker ps\`
- Verify environment variables

### "No such table: toys"
**Solution:**
- Run migrations: \`npx supabase db reset\`
- Check migration files exist in \`supabase/migrations/\`

## Build Issues

### "npm run build fails"
**Solution:**
- Check TypeScript errors: \`npm run type-check\`
- Fix linting errors: \`npm run lint -- --fix\`
- Delete .next folder: \`rm -rf .next && npm run build\`

## Testing Issues

### "Tests timeout"
**Solution:**
- Increase timeout: \`jest.setTimeout(10000)\`
- Check for unresolved promises
- Debug with: \`npm test -- --verbose\`

## Deployment Issues

### "Vercel build fails"
**Solution:**
- Check GitHub Actions logs (CI must pass first)
- Review Vercel build logs
- Verify environment variables in Vercel dashboard

## Performance Issues

### "Dev server slow"
**Solution:**
- Restart dev server
- Clear Next.js cache: \`rm -rf .next\`
- Check Chrome DevTools Profiler

## Getting Help

- Check [docs/](docs) for detailed guides
- Search GitHub Issues
- Open new Issue with:
  - Description of problem
  - Steps to reproduce
  - Error messages
  - Environment (OS, Node version, etc.)
\`\`\`

#### 4.3 Create `docs/ARCHITECTURE.md`
```markdown
# Architecture Documentation

## System Overview

```
Client (Web/Mobile)
        ↓
Next.js Frontend
        ↓
Supabase Backend
├─ PostgreSQL
├─ Auth
├─ Storage
└─ Edge Functions
        ↓
External Services
├─ Firebase (Push Notifications)
├─ SendGrid (Email)
└─ Google Ads
```

## Directory Structure

\`\`\`
/app              - Next.js App Router
/components       - React UI components
/lib              - Utilities, hooks, constants
/supabase         - Database schema & migrations
/tests            - Test files
/docs             - Documentation
/public           - Static assets
\`\`\`

## Technology Decisions

### Frontend: Next.js + React
- Server-side rendering for performance
- Built-in API routes
- Vercel deployment integration

### Database: PostgreSQL (Supabase)
- Relational data model
- Row-Level Security
- Real-time subscriptions

### Authentication: Supabase Auth
- JWT-based
- Built-in email confirmation
- Password reset flows

## Data Flow

1. User interacts with React component
2. Component calls API route or Supabase client
3. API route authenticates with JWT
4. Database enforces RLS policies
5. Data returned and rendered

## API Design

- RESTful endpoints
- JSON request/response
- Error codes and messages
- Rate limiting (future)

[More details in implementation tasks...]
\`\`\`

#### 4.4 Create `docs/SETUP.md`
```markdown
# Development Setup Guide

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git ([download](https://git-scm.com/))
- Docker ([download](https://www.docker.com/)) - for local Supabase
- Text editor (VS Code recommended)

## Installation

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/pawelkalkun/toys-for-toys.git
cd toys-for-toys
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Create Environment File

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit \`.env.local\` with:
- Supabase URL and keys (from Task 1.2)
- Firebase config (from Task 1.3)

### 4. Start Supabase Locally

\`\`\`bash
npx supabase start
\`\`\`

Access Supabase Studio: \`http://localhost:54323\`

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\` in browser.

### 6. Verify Setup

\`\`\`bash
npm run lint        # Check linting (should pass)
npm run type-check  # Check TypeScript (should pass)
npm test            # Run tests
npm run build       # Build for production
\`\`\`

All should complete without errors.

## IDE Setup (VS Code)

Recommended extensions:
- ES Lint
- Prettier - Code formatter
- Jest
- Tailwind CSS IntelliSense

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.
\`\`\`

#### 4.5 Create `docs/CODE_PATTERNS.md`
```markdown
# Code Patterns & Examples

## Using Supabase Client

\`\`\`typescript
import { supabase } from '@/lib/supabase'

// Fetch data
const { data, error } = await supabase
  .from('toys')
  .select('*')
  .eq('user_id', userId)

if (error) throw error
console.log(data)

// Insert data
await supabase
  .from('toys')
  .insert({ user_id: userId, name: 'LEGO' })
\`\`\`

## React Hooks

\`\`\`typescript
// Fetching data
const { data: toys, loading } = useAsyncData(
  async () => {
    const { data, error } = await supabase
      .from('toys')
      .select('*')
    return data
  },
  []
)

// State management
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
\`\`\`

## Form Handling

\`\`\`typescript
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
})

export default function MyForm() {
  const { register, handleSubmit, errors } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  )
}
\`\`\`

## Error Handling

\`\`\`typescript
try {
  const { data, error } = await supabase
    .from('toys')
    .select('*')

  if (error) throw error
  return data
} catch (error) {
  console.error('Failed to fetch toys:', error)
  throw new Error('Could not load toys. Please try again.')
}
\`\`\`

[More examples in implementation tasks...]
\`\`\`

### Step 5: Update README.md

Update the main README with documentation links and quick start.

---

## Testing Checklist

### File Creation
- [ ] CONTRIBUTING.md exists and is comprehensive
- [ ] tests/README.md exists with examples
- [ ] docs/DATABASE.md explains schema and migrations
- [ ] docs/API.md has structure for all endpoints
- [ ] docs/TROUBLESHOOTING.md covers common issues
- [ ] docs/ARCHITECTURE.md explains system design
- [ ] docs/SETUP.md has clear setup steps
- [ ] docs/CODE_PATTERNS.md provides examples
- [ ] .github/pull_request_template.md exists
- [ ] README.md updated with links and badges

### Content Quality
- [ ] All markdown files are valid (no syntax errors)
- [ ] Links between docs are working
- [ ] Examples are accurate and runnable
- [ ] Instructions are clear and follow exact steps
- [ ] Troubleshooting covers 80%+ of common issues
- [ ] Code examples compile without errors

### Completeness
- [ ] Setup instructions work for new developers
- [ ] Testing guide covers Jest and Playwright
- [ ] Database guide explains migrations and RLS
- [ ] Contributing guide is followed by contributors
- [ ] API documentation structure ready for endpoints

---

## Implementation Notes

### Why This Documentation?

1. **Onboarding:** New developers can set up locally quickly
2. **Quality:** Coding standards ensure consistency
3. **Testing:** Clear test guidelines improve coverage
4. **Troubleshooting:** Common issues documented and solved
5. **Architecture:** System design understood by all

### Keeping Docs Updated

- Update docs when changing features
- Link docs from code comments
- Review docs in PRs for accuracy
- Keep examples current

---

## Success Criteria

### Objective Metrics
- ✅ All documentation files created
- ✅ All markdown files valid (no syntax errors)
- ✅ 80%+ of common issues covered in troubleshooting
- ✅ Setup guide successfully followed by 2+ new developers

### Subjective Metrics
- ✅ Documentation is clear and easy to follow
- ✅ Examples are practical and accurate
- ✅ Contributing guide encourages participation
- ✅ Team considers docs comprehensive and helpful

---

## Dependencies & Blockers

### Unblocks
- Easier onboarding of new contributors
- Faster development with clear patterns
- Better quality with testing guidance
- Reduced support burden

### Blocked By
- Task 1.1-1.5 (setup complete to document)

---

## Deliverables

```
toys-for-toys/
├── CONTRIBUTING.md                 ✅ Created
├── docs/
│   ├── SETUP.md                    ✅ Created
│   ├── DATABASE.md                 ✅ Created
│   ├── API.md                      ✅ Created
│   ├── ARCHITECTURE.md             ✅ Created
│   ├── TROUBLESHOOTING.md          ✅ Created
│   ├── CODE_PATTERNS.md            ✅ Created
│   └── INDEX.md                    ✅ Created (optional)
├── tests/
│   └── README.md                   ✅ Created
├── .github/
│   └── pull_request_template.md    ✅ Created
└── README.md                       ✅ Updated
```

---

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Write Files** | 2-3 hours | Create all markdown files |
| **Phase 2: Examples** | 1-2 hours | Add code examples |
| **Phase 3: Review** | 1 hour | Proofread and fix typos |
| **Phase 4: Verify** | 1 hour | Test setup instructions |
| **Total** | ~6-7 hours | 1 developer day |

---

## Sign-Off

- [ ] Developer: All documentation created
- [ ] Code Review: Content reviewed for accuracy
- [ ] QA: Setup guide tested by new developer
- [ ] Tech Lead: Documentation approved
- [ ] Product: Contributing guide aligns with project goals

---

**Status:** Ready to implement
**Last Updated:** 2025-11-13
**Next Epic:** Epic 2 - Database Schema & Migrations
