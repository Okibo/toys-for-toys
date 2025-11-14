# Contributing to Toy-for-Toy

## Setup Instructions

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env.local` in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<firebase-project>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
SENDGRID_API_KEY=<sendgrid-key>
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Code Style Guidelines

### ESLint Rules

The project enforces ESLint rules defined in `.eslintrc.json`. Run the linter before committing:

```bash
npm run lint
```

Fix linting errors automatically:

```bash
npm run lint -- --fix
```

### Prettier Formatting

Code is formatted using Prettier. Configuration is in `.prettierrc.json`.

Format code before committing:

```bash
npm run format
```

## Branch Naming Conventions

- **Features**: `feat/<feature-name>`
  - Example: `feat/ticket-exchange-system`

- **Bug Fixes**: `fix/<bug-name>`
  - Example: `fix/realtime-subscription-lag`

- **Refactoring**: `refactor/<refactor-name>`
  - Example: `refactor/component-structure`

## Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

**Scope**: Optional but recommended (e.g., `auth`, `tickets`, `storage`, `realtime`)

**Subject**: Imperative mood, lowercase, no period. Max 50 characters.

**Body**: Optional. Wrap at 72 characters. Explain what and why, not how.

**Footer**: Optional. Reference issues with `Fixes #123`.

### Examples

```
feat(tickets): add ticket balance real-time updates

Implement Supabase Realtime subscription on tickets table
to provide instant feedback when balance changes.

Fixes #45
```

```
fix(auth): prevent JWT expiry race condition

Add token refresh logic before API calls to avoid 401 errors
during rapid successive requests.
```

## PR Template

See `.github/pull_request_template.md` for the required PR template and checklist.
