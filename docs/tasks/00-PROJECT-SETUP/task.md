# Epic: Project Setup & Infrastructure (Week 1)

## Overview
Initialize the development environment, create CI/CD pipeline, configure core infrastructure, and establish development standards.

---

## Task 1.1: Initialize Monorepo Structure & Dependencies

**Status:** Pending
**Effort:** 1 day
**Dependencies:** None

### Description
Set up the monorepo structure with Next.js, establish core npm dependencies, configure TypeScript, and create the directory skeleton.

### Acceptance Criteria
- [ ] Next.js 14+ project initialized with App Router
- [ ] TypeScript configured with strict mode enabled
- [ ] Essential npm packages installed:
  - React Hook Form, Zod (forms)
  - Zustand (state management)
  - next-i18next (i18n)
  - Tailwind CSS, shadcn/ui
  - @supabase/supabase-js, @supabase/auth-helpers-nextjs
  - Jest, Playwright (testing)
  - prettier, eslint configured
- [ ] Directory structure created: /app, /components, /lib, /pages, /supabase, /tests, /public/locales
- [ ] .env.example file created with required variables
- [ ] README.md updated with setup instructions
- [ ] Git hooks configured (pre-commit linting)

### Implementation Notes
- Use `create-next-app` with TypeScript template as base
- Configure `jsconfig.json` with path aliases (@/components, @/lib, etc.)
- Set up ESLint and Prettier rules to match project style
- Create a development checklist for contributors

### Testing
- npm run dev starts without errors
- npm run build completes successfully
- npm run lint returns 0 errors

---

## Task 1.2: Configure Supabase Project & Local Development

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1

### Description
Create and configure Supabase project, set up local development environment, and establish database connection.

### Acceptance Criteria
- [ ] Supabase project created (EU region: Ireland or Germany)
- [ ] Local Supabase instance running via Docker (supabase/cli)
- [ ] `.env.local` configured with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_REGION`
- [ ] Supabase Auth configured (email/password provider enabled)
- [ ] Initial migrations directory set up
- [ ] Connection tested from Next.js app (console message: "Connected to Supabase")
- [ ] Backup strategy documented (daily snapshots)

### Implementation Notes
- Follow Supabase EU compliance setup (GDPR-friendly region)
- Enable Row-Level Security (RLS) at project level
- Configure realtime for core tables
- Document database URL and API key rotation schedule

### Testing
- `npx supabase start` launches successfully
- Supabase Studio accessible at http://localhost:54323
- Next.js can query `auth.users` table (after RLS setup in next tasks)

---

## Task 1.3: Set Up Firebase Project for Push Notifications

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1

### Description
Create Firebase project, configure Cloud Messaging, and prepare Firebase Admin SDK integration.

### Acceptance Criteria
- [ ] Firebase project created (same region as Supabase)
- [ ] Cloud Messaging enabled
- [ ] Web app registration completed
- [ ] Service account JSON downloaded and stored securely
- [ ] `.env.local` updated with:
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `FIREBASE_ADMIN_SDK_KEY` (private, never exposed)
- [ ] Firebase SDK initialized in lib/firebase.ts
- [ ] Testing configured (Firebase Emulator Suite for local testing)
- [ ] Documentation: How to obtain device tokens for push notifications

### Implementation Notes
- Create separate projects for development and production (if budget allows)
- Disable analytics for development environment
- Document sensitive key rotation procedures
- Note: Actual push sending to be implemented in Phase 2

### Testing
- Firebase connection test passes
- Environment variables load correctly
- No keys exposed in browser console

---

## Task 1.4: Configure Continuous Integration (GitHub Actions)

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1, 1.2

### Description
Set up GitHub Actions CI/CD pipeline for automated testing, linting, and deployment preparation.

### Acceptance Criteria
- [ ] `.github/workflows/ci.yml` created with:
  - Node.js setup (v18+)
  - npm install
  - npm run lint
  - npm run build
  - npm test (basic test suite)
- [ ] `.github/workflows/deploy.yml` created for production deployment to Vercel (manual trigger, not auto-deploy to main)
- [ ] Branch protection rules configured:
  - Require CI to pass before merge to main
  - Require code review (1 reviewer minimum)
- [ ] Status badge added to README.md
- [ ] Secrets configured in GitHub:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `FIREBASE_PROJECT_ID`, `FIREBASE_ADMIN_SDK_KEY`
  - `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`
- [ ] Documentation: CI/CD workflow and deployment procedure

### Implementation Notes
- Use starter-provided Node.js action
- Keep workflows simple for MVP (no matrix testing for now)
- Cache dependencies to speed up builds
- Consider: Matrix testing for multiple Node versions (Phase 2)

### Testing
- Push to feature branch triggers CI
- CI completes in <5 minutes
- Merge blocked if CI fails

---

## Task 1.5: Set Up Vercel Deployment & Staging Environment

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1, 1.4

### Description
Configure Vercel for web deployment, set up staging environment, and establish deployment workflow.

### Acceptance Criteria
- [ ] Vercel project created and linked to GitHub repo
- [ ] Production environment configured (auto-deploy on push to main)
- [ ] Staging environment created (preview deployments on PRs)
- [ ] Environment variables configured in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] Domain configured (or placeholder noted)
- [ ] Analytics enabled (Vercel Analytics for Core Web Vitals)
- [ ] Deployment preview comments enabled on PRs
- [ ] Documentation: Deployment checklist and rollback procedure

### Implementation Notes
- Keep Vercel env vars synchronized with local .env.local
- Set production region to EU for data residency
- Enable automatic deployments only for main branch
- Note: Manual deployment option for non-main branches during testing

### Testing
- Merge to main triggers auto-deployment
- Staging preview generated for PR
- Live site loads and connects to Supabase

---

## Task 1.6: Create Development & Testing Documentation

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1-1.5

### Description
Document development setup, testing strategies, and contributing guidelines.

### Acceptance Criteria
- [ ] CONTRIBUTING.md created with:
  - Setup instructions (npm install, env vars)
  - Code style guidelines (ESLint/Prettier)
  - Branch naming conventions (feat/, fix/, refactor/)
  - Commit message format (Conventional Commits)
  - PR template created (.github/pull_request_template.md)
- [ ] Testing documentation (tests/README.md):
  - Jest setup and configuration
  - Playwright E2E testing strategy
  - How to run tests locally
  - Coverage targets
- [ ] Database development guide (docs/DATABASE.md):
  - Local Supabase setup
  - Migration workflow
  - RLS policy development
- [ ] API documentation template (docs/API.md) - skeleton for Phase 1 endpoints
- [ ] Troubleshooting guide (docs/TROUBLESHOOTING.md) for common dev issues

### Implementation Notes
- Make documentation accessible to new contributors
- Keep docs in sync with actual dev processes
- Use examples and screenshots where helpful

### Testing
- A new developer can follow CONTRIBUTING.md to set up locally
- All documentation builds without errors (if using docusaurus later)

