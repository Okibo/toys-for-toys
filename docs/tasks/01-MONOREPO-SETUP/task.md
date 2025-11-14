# Task 1.1: Initialize Monorepo Structure & Dependencies

**Epic:** Project Setup & Infrastructure (Week 1)
**Status:** Pending
**Effort:** 1 day
**Dependencies:** None
**Assigned To:** [TBD]
**Created:** 2025-11-13

---

## Overview

Set up the monorepo structure with Next.js, establish core npm dependencies, configure TypeScript, and create the directory skeleton that will house the web app and mobile wrapper.

---

## Acceptance Criteria

### Setup & Configuration

- [x] Next.js 14+ project initialized with App Router (`npx create-next-app@latest`)
- [x] TypeScript configured with strict mode enabled (`tsconfig.json`)
- [x] Tailwind CSS configured and working
- [x] Path aliases configured in `tsconfig.json` (@/components, @/lib, @/public)

### Dependencies Installed

#### Form & Validation

- [x] `react-hook-form` (v7+)
- [x] `zod` (v3+)

#### State Management

- [x] `zustand` (v4+)

#### Internationalization

- [x] `next-i18next` (v14+)
- [x] `i18next` (v23+)

#### UI & Styling

- [x] `tailwindcss` (configured)
- [x] `shadcn/ui` (component library)
- [x] `class-variance-authority` (for component variants)
- [x] `clsx` or `classnames` (conditional className utility)

#### Backend & APIs

- [x] `@supabase/supabase-js` (v2+)
- [x] `@supabase/auth-helpers-nextjs` (v0.8+)
- [x] `@supabase/realtime-js` (v2+ - for live updates)
- [x] `axios` (HTTP client for external APIs)

#### Testing

- [x] `jest` (v29+)
- [x] `@testing-library/react` (v14+)
- [x] `@testing-library/jest-dom` (v6+)
- [x] `playwright` (v1.40+)

#### Development Tools

- [x] `prettier` (code formatter)
- [x] `eslint` (linter)
- [x] `eslint-config-next` (Next.js specific rules)
- [x] `@typescript-eslint/eslint-plugin` (TypeScript linting)
- [x] `husky` (git hooks)
- [x] `lint-staged` (pre-commit linting)

### Directory Structure

- [x] `/app` - Next.js App Router pages and layouts
  - [ ] `/app/(auth)` - Auth-related pages
  - [ ] `/app/(app)` - Protected app pages
  - [ ] `/app/api` - API routes and middleware
- [x] `/components` - React components
  - [ ] `/components/ui` - shadcn/ui components
  - [ ] `/components/toys` - Toy listing components
  - [ ] `/components/exchanges` - Exchange flow components
  - [ ] `/components/games` - Game components
  - [ ] `/components/ads` - Ad placement components
- [x] `/lib` - Utility functions and hooks
  - [ ] `/lib/hooks` - Custom React hooks
  - [ ] `/lib/utils` - Helper functions
  - [ ] `/lib/types.ts` - TypeScript type definitions
  - [ ] `/lib/supabase.ts` - Supabase client initialization
  - [ ] `/lib/firebase.ts` - Firebase client initialization
  - [ ] `/lib/gdpr-utils.ts` - GDPR-related utilities
- [x] `/supabase` - Database schema and configurations
  - [ ] `/supabase/migrations` - SQL migrations
  - [ ] `/supabase/functions` - Edge Functions
  - [ ] `/supabase/policies` - RLS policies
- [x] `/tests` - Test files (colocated with features)
  - [ ] `/tests/unit` - Unit tests
  - [ ] `/tests/integration` - Integration tests
  - [ ] `/tests/e2e` - End-to-end Playwright tests
- [x] `/public` - Static assets
  - [ ] `/public/images` - Image assets
  - [ ] `/public/locales` - i18n translation files
    - [ ] `/public/locales/pl` - Polish translations
    - [ ] `/public/locales/de` - German translations
    - [ ] `/public/locales/en` - English translations
- [x] `/docs` - Project documentation
  - [ ] `/docs/architecture` - Architecture diagrams
  - [ ] `/docs/api` - API documentation
  - [ ] `/docs/database` - Database schema docs

### Configuration Files

- [x] `tsconfig.json` - TypeScript strict mode enabled
- [x] `jest.config.js` - Jest configuration
- [x] `.eslintrc.json` - ESLint rules
- [x] `.prettierrc` - Prettier formatting rules
- [x] `.env.example` - Environment variables template
- [x] `.gitignore` - Git ignore rules (include `.env.local`)
- [x] `package.json` - Updated with all dependencies and scripts
- [x] `next.config.js` - Next.js configuration
- [x] `.husky/pre-commit` - Lint-staged configuration
- [x] `.github/pull_request_template.md` - PR template

### NPM Scripts

- [x] `npm run dev` - Start development server
- [x] `npm run build` - Build for production
- [x] `npm run start` - Run production build
- [x] `npm run lint` - Run ESLint
- [x] `npm run format` - Run Prettier
- [x] `npm test` - Run Jest tests
- [x] `npm run test:watch` - Run tests in watch mode
- [x] `npm run test:coverage` - Generate coverage report
- [x] `npm run e2e` - Run Playwright tests

### Documentation

- [x] `README.md` updated with project overview and setup instructions
- [x] `CONTRIBUTING.md` created (reference from separate task)
- [x] `.env.example` includes all required variables with descriptions

---

## Implementation Details

### Step-by-Step Setup

#### 1. Initialize Next.js Project

```bash
npx create-next-app@latest toys-for-toys --typescript --tailwind --app
cd toys-for-toys
```

#### 2. Install Additional Dependencies

```bash
# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# State Management
npm install zustand

# Internationalization
npm install next-i18next i18next i18next-browser-languagedetector

# UI & Styling
npm install shadcn-ui class-variance-authority clsx lucide-react

# Backend
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs axios

# Testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev playwright @playwright/test

# Development Tools
npm install --save-dev prettier eslint eslint-config-next @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev husky lint-staged
npx husky install
```

#### 3. Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/public/*": ["./public/*"]
    }
  }
}
```

#### 4. Setup ESLint & Prettier

Create `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "next"],
  "rules": {
    "react/display-name": "off",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### 5. Setup Husky Pre-Commit Hooks

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

#### 6. Create Directory Structure

```bash
mkdir -p app/{auth,app,api}
mkdir -p components/{ui,toys,exchanges,games,ads}
mkdir -p lib/{hooks,utils}
mkdir -p supabase/{migrations,functions,policies}
mkdir -p tests/{unit,integration,e2e}
mkdir -p public/{images,locales/{pl,de,en}}
mkdir -p docs/{architecture,api,database}
```

#### 7. Create Environment Template

Create `.env.example`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_REGION=eu-west-1

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
FIREBASE_ADMIN_SDK_KEY=your-admin-sdk-key

# SendGrid (for Phase 2)
SENDGRID_API_KEY=your-sendgrid-key

# Vercel
VERCEL_URL=

# Node Environment
NODE_ENV=development
```

#### 8. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx && prettier --check .",
    "format": "prettier --write . && eslint --fix .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:debug": "playwright test --debug",
    "type-check": "tsc --noEmit"
  }
}
```

#### 9. Create Jest Configuration

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

#### 10. Initialize Git & Create Initial Commit

```bash
git init
git add .
git commit -m "chore: Initialize monorepo with Next.js, TypeScript, and core dependencies"
```

---

## Testing Checklist

### Build & Development

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts successfully and displays "Ready in X seconds"
- [ ] http://localhost:3000 loads the default Next.js page
- [ ] No console errors or warnings during startup

### Linting & Formatting

- [ ] `npm run lint` returns 0 errors
- [ ] `npm run format` formats all files without errors
- [ ] ESLint catches unused imports and warns appropriately
- [ ] Prettier reformats code on file save (if IDE configured)

### TypeScript

- [ ] `npm run type-check` returns 0 errors
- [ ] IDE shows TypeScript errors for type mismatches
- [ ] Import paths using `@/` aliases work correctly

### Testing Infrastructure

- [ ] `npm test` runs Jest with no tests (should pass)
- [ ] `npm run test:coverage` generates coverage report
- [ ] `npm run e2e` runs Playwright (should have 0 tests initially)

### Git Integration

- [ ] Pre-commit hook runs ESLint on staged files
- [ ] Cannot commit if linting fails
- [ ] Can bypass hooks with `git commit --no-verify` (for emergency only)

### IDE Configuration (VS Code)

- [ ] Prettier plugin installed and auto-formats on save
- [ ] ESLint plugin installed and shows diagnostics
- [ ] TypeScript IntelliSense working (Ctrl+Space autocomplete)

---

## Implementation Notes

### Key Decisions

1. **App Router vs Pages Router:** Using Next.js 14+ App Router for modern patterns and file-based routing
2. **State Management:** Zustand chosen for lightweight, performant state (avoid Redux complexity for MVP)
3. **UI Library:** shadcn/ui provides customizable Tailwind components with accessibility built-in
4. **Testing:** Jest + Playwright covers unit, integration, and E2E testing needs
5. **Code Quality:** ESLint + Prettier enforce consistent style; Husky prevents bad commits

### Configuration Rationale

- **TypeScript Strict Mode:** Catches errors early; essential for production code
- **Path Aliases:** Cleaner imports (`@/lib/utils` vs `../../../lib/utils`)
- **Pre-commit Hooks:** Prevents committing unformatted or linted code
- **Monorepo Structure:** Organized by feature area (toys, exchanges, games) for scalability

### Common Pitfalls to Avoid

- Don't commit `.env.local` (configure `.gitignore` correctly)
- Don't modify `node_modules` directly (use npm to install/update)
- Don't skip the Supabase client initialization (needed in Task 1.2)
- Don't ignore TypeScript errors (fix them, don't use `any` type)

---

## Success Criteria

### Objective Metrics

- ✅ Build time: <60 seconds for initial build
- ✅ Dev server startup: <10 seconds
- ✅ Linting: 0 errors, 0 warnings
- ✅ Test suite: Runs in <5 seconds (empty suite initially)

### Subjective Metrics

- ✅ New contributor can run `npm install && npm run dev` and see the app
- ✅ IDE provides full TypeScript/ESLint support
- ✅ Code is properly formatted after `npm run format`

---

## Dependencies & Blockers

### Unblocks

- All subsequent frontend development
- Task 1.2 (Supabase configuration)
- Task 1.3 (Firebase configuration)
- Task 1.4 (CI/CD setup)

### Blocked By

- None (this is the first task)

---

## Deliverables

```
toys-for-toys/
├── .env.example                    ✅ Created
├── .eslintrc.json                  ✅ Created
├── .gitignore                       ✅ Created (Updated)
├── .husky/                          ✅ Created
│   └── pre-commit
├── .lintstagedrc.json              ✅ Created
├── .prettierrc                      ✅ Created
├── jest.config.js                  ✅ Created
├── jest.setup.js                   ✅ Created
├── tsconfig.json                   ✅ Created (Updated)
├── next.config.js                  ✅ Created
├── package.json                    ✅ Created (Updated)
├── app/                            ✅ Created
│   ├── (auth)/
│   ├── (app)/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                     ✅ Created
│   ├── ui/
│   ├── toys/
│   ├── exchanges/
│   ├── games/
│   └── ads/
├── lib/                            ✅ Created
│   ├── hooks/
│   ├── utils/
│   ├── supabase.ts
│   ├── firebase.ts
│   ├── gdpr-utils.ts
│   └── types.ts
├── public/                         ✅ Created
│   ├── images/
│   └── locales/
│       ├── pl/
│       ├── de/
│       └── en/
├── supabase/                       ✅ Created
│   ├── migrations/
│   ├── functions/
│   └── policies/
├── tests/                          ✅ Created
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                           ✅ Created
│   ├── architecture/
│   ├── api/
│   └── database/
├── README.md                       ✅ Updated
└── CONTRIBUTING.md                 ✅ Reference
```

---

## Timeline

| Phase                  | Duration  | Activities                               |
| ---------------------- | --------- | ---------------------------------------- |
| **Phase 1: Setup**     | 1-2 hours | Run Next.js setup, install dependencies  |
| **Phase 2: Configure** | 2-3 hours | Setup TypeScript, ESLint, Prettier, Jest |
| **Phase 3: Verify**    | 1 hour    | Test dev server, linting, builds         |
| **Phase 4: Document**  | 1 hour    | Create .env.example, update README       |
| **Total**              | ~8 hours  | 1 developer day                          |

---

## Resources & References

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Setup](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/next)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Playwright Setup](https://playwright.dev/docs/intro)
- [Husky Setup](https://typicode.github.io/husky/)

---

## Sign-Off

- [ ] Developer: Completed and tested
- [ ] Code Review: Approved
- [ ] QA: Verified dependencies and scripts work
- [ ] Tech Lead: Configuration meets standards

---

**Status:** Ready to implement
**Last Updated:** 2025-11-13
**Next Task:** Task 1.2 - Configure Supabase Project & Local Development
