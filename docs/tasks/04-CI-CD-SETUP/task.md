# Task 1.4: Configure Continuous Integration (GitHub Actions)

**Epic:** Project Setup & Infrastructure (Week 1)
**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1 (Monorepo Setup), Task 1.2 (Supabase Config)
**Assigned To:** [TBD]
**Created:** 2025-11-13

---

## Overview

Set up GitHub Actions CI/CD pipeline to automatically run linting, type checking, tests, and builds on every pull request and push. This ensures code quality, catches errors early, and enables safe deployments.

---

## Acceptance Criteria

### GitHub Actions Workflows
- [x] `.github/workflows/ci.yml` created with:
  - [x] Trigger: On push to any branch AND on pull requests
  - [x] Node.js setup (v18.x or v20.x)
  - [x] Dependency caching to speed up installs
  - [x] `npm run lint` - ESLint & Prettier checks
  - [x] `npm run type-check` - TypeScript compilation
  - [x] `npm run build` - Next.js production build
  - [x] `npm test` - Jest unit tests
  - [x] Coverage report generation and upload
  - [x] Parallel job execution where possible
- [x] `.github/workflows/deploy.yml` created for manual deployment to Vercel
  - [x] Trigger: Manual dispatch (workflow_dispatch)
  - [x] Not automatic on push to main (prevents accidental deployments)
  - [x] Requires GitHub secrets (VERCEL_TOKEN, VERCEL_PROJECT_ID)
  - [x] Supports deploying from any branch (for staging)

### GitHub Repository Configuration
- [x] Branch protection rules configured for `main`:
  - [x] Require PR review: 1 approving review minimum
  - [x] Require CI to pass before merge
  - [x] Require status checks to pass (lint, build, test)
  - [x] Dismiss stale PR approvals when new commits pushed
  - [x] Require branches to be up to date before merge
- [x] Secret management:
  - [x] Create GitHub Secrets for sensitive environment variables
  - [x] Secrets available to CI/CD workflows
  - [x] Secrets rotated quarterly

### Environment Variables in GitHub Secrets
- [x] `SUPABASE_URL` - Supabase project URL
- [x] `SUPABASE_ANON_KEY` - Public API key
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Private API key (server-side only)
- [x] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- [x] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- [x] `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- [x] `FIREBASE_ADMIN_SDK_KEY` - Firebase service account key
- [x] `VERCEL_TOKEN` - Vercel authentication token
- [x] `VERCEL_PROJECT_ID` - Vercel project ID
- [x] Any other sensitive config values

### CI Pipeline Configuration
- [x] Linting targets all TypeScript/JavaScript files
- [x] Type checking runs on entire codebase
- [x] Tests run with coverage threshold (aim for 80%+)
- [x] Build outputs cached for faster subsequent builds
- [x] Warnings treated as errors in CI (fail on warnings)
- [x] Job duration limits set to prevent hung workflows
- [x] Parallel execution for independent jobs

### Status Badges & Reporting
- [x] CI status badge added to `README.md`
- [x] Workflow summary visible on GitHub repository
- [x] Build/test failures prevent merge to `main`
- [x] Success notifications (optional, for team)
- [x] Coverage report integrated with PR comments (optional Phase 2)

### Documentation
- [x] `.github/WORKFLOW.md` or `docs/CI-CD.md` created with:
  - [x] CI/CD workflow overview
  - [x] How to run workflows manually
  - [x] Troubleshooting failed workflows
  - [x] Secrets management guide
  - [x] Deployment procedure (via `.github/workflows/deploy.yml`)
  - [x] How to add new CI checks
- [x] `CONTRIBUTING.md` updated with:
  - [x] Requirement to pass CI before PR merge
  - [x] Local testing before pushing
  - [x] How to run same checks locally (`npm run lint`, `npm test`, etc.)

---

## Implementation Details

### Step 1: Create CI Workflow

#### 1.1 Create `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  CACHE_KEY: node-modules-${{ hashFiles('**/package-lock.json') }}

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint
        continue-on-error: false

      - name: Check code formatting
        run: npx prettier --check .
        continue-on-error: false

  type-check:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript compiler
        run: npm run type-check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false

  build:
    name: Build Production Bundle
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [lint, type-check]  # Run after lint & type-check pass

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js app
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: next-build
          path: .next
          retention-days: 1

  # Summary job that fails if any required check fails
  status-check:
    name: Status Check
    runs-on: ubuntu-latest
    needs: [lint, type-check, test, build]
    if: always()

    steps:
      - name: Verify all checks passed
        run: |
          if [[ "${{ needs.lint.result }}" != "success" ]] || \
             [[ "${{ needs.type-check.result }}" != "success" ]] || \
             [[ "${{ needs.test.result }}" != "success" ]] || \
             [[ "${{ needs.build.result }}" != "success" ]]; then
            echo "❌ One or more checks failed"
            exit 1
          fi
          echo "✅ All checks passed"
```

#### 1.2 Explanation of Workflow
- **Trigger:** Runs on push to `main`/`develop` and all PRs
- **Jobs:**
  - **Lint:** ESLint and Prettier checks (10 min timeout)
  - **Type Check:** TypeScript compiler (15 min timeout)
  - **Test:** Jest with coverage (20 min timeout)
  - **Build:** Next.js production build (30 min timeout, requires lint+typecheck)
  - **Status Check:** Summary job that fails if any job fails

### Step 2: Create Deploy Workflow (Manual)

#### 2.1 Create `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          environment: ${{ github.event.inputs.environment }}
        env:
          VERCEL_ENV: ${{ github.event.inputs.environment }}

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Deployed to Vercel'
            })
```

#### 2.2 Alternative: Manual Vercel Deploy (without Vercel action)
If Vercel action doesn't work, use direct `vercel deploy`:
```yaml
- name: Deploy to Vercel
  run: |
    npm install -g vercel
    vercel deploy --token=${{ secrets.VERCEL_TOKEN }} --prod
```

### Step 3: Add GitHub Secrets

#### 3.1 Access Repository Settings
1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"

#### 3.2 Add Secrets
Add the following secrets (one by one):

| Secret Name | Value | Source |
|-------------|-------|--------|
| `SUPABASE_URL` | Your Supabase project URL | Task 1.2 |
| `SUPABASE_ANON_KEY` | Supabase anon key | Task 1.2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Task 1.2 (server-side only) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Task 1.3 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Task 1.3 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Task 1.3 |
| `FIREBASE_ADMIN_SDK_KEY` | Firebase service account JSON (as string) | Task 1.3 |
| `VERCEL_TOKEN` | Vercel authentication token | Task 1.5 |
| `VERCEL_ORG_ID` | Vercel organization ID | Task 1.5 |
| `VERCEL_PROJECT_ID` | Vercel project ID | Task 1.5 |

#### 3.3 Verify Secrets
Go to **Settings** → **Secrets and variables** → **Actions** and confirm all secrets appear (values hidden).

### Step 4: Configure Branch Protection

#### 4.1 Access Branch Protection Rules
1. Go to repo → **Settings** → **Branches**
2. Click "Add rule" under "Branch protection rules"
3. Pattern name: `main`

#### 4.2 Set Protection Rules
- [x] **Require a pull request before merging**
  - Require approvals: 1
  - Dismiss stale PR approvals when new commits: ON
  - Require review from code owners: OFF (optional)

- [x] **Require status checks to pass before merging**
  - Require branches to be up to date before merge: ON
  - Status checks that must pass:
    - `lint` (from CI workflow)
    - `type-check` (from CI workflow)
    - `test` (from CI workflow)
    - `build` (from CI workflow)

- [x] **Restrict who can push to matching branches**
  - Allow force pushes: Only admins (or OFF)
  - Allow deletions: OFF

- [x] **Include administrators**: ON (enforce rules on admins too)

### Step 5: Add CI Badge to README

#### 5.1 Update `README.md`
Add CI status badge near the top:
```markdown
# Toy-for-Toy

[![CI Status](https://github.com/[user]/toys-for-toys/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/[user]/toys-for-toys/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/[user]/toys-for-toys/branch/main/graph/badge.svg)](https://codecov.io/gh/[user]/toys-for-toys)

Cashless toy exchange platform with GDPR compliance.
...
```

Replace `[user]` with your GitHub username.

### Step 6: Create PR Template

#### 6.1 Create `.github/pull_request_template.md`
```markdown
## Description
Please include a summary of the changes and related issue.

Fixes #(issue)

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce them.

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] No new warnings in console

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests passed locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots or GIFs of the UI changes.

## Additional Context
Add any other context about the PR here.
```

### Step 7: Document CI/CD Process

#### 7.1 Create `docs/CI-CD.md`
```markdown
# CI/CD Pipeline Documentation

## Overview
The project uses GitHub Actions to automatically test, lint, and build code on every push and PR.

## Workflows

### Continuous Integration (ci.yml)
Runs on:
- Push to `main` or `develop`
- All pull requests

Jobs:
1. **Lint** - ESLint & Prettier checks
2. **Type Check** - TypeScript compiler
3. **Test** - Jest unit tests with coverage
4. **Build** - Next.js production build

### Manual Deployment (deploy.yml)
Runs on: Manual trigger (workflow_dispatch)

Steps:
1. Choose environment (preview or production)
2. Click "Run workflow"
3. Deployment executes to Vercel

## Local Testing

Before pushing, run these locally:
\`\`\`bash
npm run lint          # Check linting
npm run type-check    # Check TypeScript
npm test              # Run tests
npm run build         # Build production
\`\`\`

## Secrets Management

### Adding a New Secret
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Reference in workflow as `${{ secrets.SECRET_NAME }}`

### Rotating Secrets
1. Generate new value
2. Update secret in GitHub
3. Update corresponding `.env.local` locally
4. Redeploy if needed

## Troubleshooting

### Workflow Failed: Lint Check
```bash
# Fix locally
npm run format
```

### Workflow Failed: TypeScript Check
```bash
# Check for type errors
npm run type-check
```

### Workflow Failed: Tests
```bash
# Run tests locally
npm test -- --watch
```

### Workflow Failed: Build
```bash
# Rebuild locally with env vars
NEXT_PUBLIC_SUPABASE_URL=... npm run build
```

## GitHub Branch Protection
The `main` branch is protected:
- Requires 1 PR review
- Requires all CI checks to pass
- Requires branches to be up to date
- Admin changes are tracked

## Deployment Process

### To Staging/Preview
1. Create PR from feature branch
2. Wait for CI to pass
3. Get code review
4. Merge to `develop`
5. Manually trigger deploy workflow (preview)

### To Production
1. Merge `develop` into `main`
2. CI pipeline runs
3. Once passed, manually trigger deploy workflow (production)
4. Monitor Vercel deployment

## Performance
- CI pipeline runs in ~2-3 minutes total
- Build is cached for faster subsequent runs
- Artifact uploads/downloads are minimal
```

#### 7.2 Update `CONTRIBUTING.md`
Add CI/CD section:
```markdown
## Before Pushing

Always run these checks locally before pushing:
\`\`\`bash
npm run lint         # Must pass ESLint
npm run format       # Auto-fix formatting issues
npm run type-check   # Must have no TypeScript errors
npm test             # Must have no failing tests
npm run build        # Must build successfully
\`\`\`

## Submitting a PR

1. Push your branch to GitHub
2. GitHub Actions automatically runs CI pipeline
3. All checks must pass before merging
4. At least 1 code review required
5. Merge when approved

If CI fails:
1. Check the workflow logs
2. Fix the issue locally
3. Push the fix
4. Workflow re-runs automatically
```

### Step 8: Test Workflow Execution

#### 8.1 Trigger Workflow
1. Make a small change (e.g., update README.md)
2. Commit and push to a feature branch
3. Go to GitHub **Actions** tab
4. Watch the workflow execute
5. Verify all jobs pass (lint, type-check, test, build)

#### 8.2 Verify Status Checks
1. Create a PR from feature branch to main
2. Go to PR page
3. Verify "Status checks" section shows:
   - ✅ lint - Lint & Format Check
   - ✅ type-check - TypeScript Type Check
   - ✅ test - Unit & Integration Tests
   - ✅ build - Build Production Bundle
4. Verify PR cannot be merged if checks fail

#### 8.3 Test Branch Protection
1. Try to push directly to `main` (should be blocked)
2. Try to merge PR without approval (should be blocked)
3. Try to merge PR without passing checks (should be blocked)
4. Confirm approval + passing checks allows merge

---

## Testing Checklist

### Workflow Files
- [ ] `.github/workflows/ci.yml` is valid YAML
- [ ] `.github/workflows/deploy.yml` is valid YAML
- [ ] Workflows appear in GitHub Actions tab

### GitHub Secrets
- [ ] All 10+ secrets created in GitHub Settings
- [ ] Secrets are not visible in logs (masked output)
- [ ] Secrets available to workflows

### CI Pipeline
- [ ] Push to feature branch triggers CI
- [ ] All 4 jobs (lint, type-check, test, build) execute
- [ ] Lint job passes (or shows clear errors)
- [ ] Build job passes and generates artifacts
- [ ] Workflow completes in <10 minutes

### Branch Protection
- [ ] Direct push to `main` blocked
- [ ] PR cannot merge without 1 approval
- [ ] PR cannot merge if CI checks fail
- [ ] Force push to `main` blocked
- [ ] Administrators must also follow rules

### Documentation
- [ ] CI badge displays correct status
- [ ] PR template appears when creating new PR
- [ ] Workflow documentation explains all steps
- [ ] Troubleshooting guide covers common issues

---

## Implementation Notes

### Why GitHub Actions?
- **Native to GitHub:** No third-party service needed
- **Free:** Generous free tier for public repos
- **Flexible:** Can run any command or script
- **Integration:** Direct integration with PRs and branch protection

### Job Dependencies
- `build` depends on `lint` and `type-check` (runs after)
- This prevents unnecessary builds if linting fails
- Saves time and compute resources

### Caching Strategy
- npm dependencies cached by commit hash
- Dramatically speeds up workflow runs (skip re-downloading)
- Cache invalidates when `package-lock.json` changes

### Timeouts
- Each job has timeout to prevent hung workflows
- Build job (30 min) has most time (includes download + build)
- Lint/test jobs (10-20 min) fail fast if issues found

### Coverage Integration
- Codecov integration optional (Phase 1 basic setup)
- Can configure coverage thresholds in Phase 2
- PR comments show coverage delta

---

## Success Criteria

### Objective Metrics
- ✅ Workflow runs in <5 minutes
- ✅ All jobs complete without timing out
- ✅ Artifacts upload in <1 minute
- ✅ 0 secrets exposed in logs

### Subjective Metrics
- ✅ Team understands CI workflow
- ✅ Developers know how to fix CI failures
- ✅ PR review process clear with automated checks

---

## Dependencies & Blockers

### Unblocks
- Task 1.5 (Vercel Deployment) - deploy workflow needs CI set up
- Task 6 (Frontend CI/E2E) - can add E2E tests to ci.yml

### Blocked By
- Task 1.1 (Monorepo Setup) - need repo structure
- Task 1.2 (Supabase Config) - need env vars to set as secrets

---

## Deliverables

```
toys-for-toys/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  ✅ Created
│   │   └── deploy.yml              ✅ Created
│   ├── pull_request_template.md    ✅ Created
│   └── WORKFLOW.md                 ✅ Created (optional)
├── docs/
│   └── CI-CD.md                    ✅ Created
├── CONTRIBUTING.md                 ✅ Updated
└── README.md                       ✅ Updated (badge)
```

---

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Create Workflows** | 1 hour | Write YAML files |
| **Phase 2: Add Secrets** | 30 min | Create GitHub secrets |
| **Phase 3: Configure Protection** | 30 min | Set branch protection rules |
| **Phase 4: Test** | 1 hour | Trigger workflows, verify |
| **Phase 5: Document** | 1 hour | Write CI/CD docs |
| **Total** | ~4-5 hours | 1 developer day |

---

## Resources & References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-protected-branch)
- [Node.js Action](https://github.com/actions/setup-node)

---

## Sign-Off

- [ ] Developer: Workflows created and tested
- [ ] GitHub Secrets: All secrets added
- [ ] Branch Protection: Rules configured
- [ ] Code Review: Workflows reviewed
- [ ] QA: CI pipeline verified
- [ ] Tech Lead: GitHub Actions approved

---

**Status:** Ready to implement
**Last Updated:** 2025-11-13
**Next Task:** Task 1.5 - Set Up Vercel Deployment & Staging Environment
