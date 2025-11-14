# Fix Issue Command

This command analyzes an issue description and intelligently delegates to appropriate subagents to resolve it.

## Usage

```
/fix-issue <issue-description>
```

## What This Command Does

1. **Analyze the issue** - Parse issue description to determine type and affected areas
2. **Identify specialist agents** - Based on issue keywords and context, select appropriate subagents
3. **Create feature branch** - Create `fix/issue-<description-slug>` branch for the fix
4. **Delegate implementation** - Call selected subagents with precise instructions
   - Agents implement fixes following TDD (tests first)
   - Each agent owns their domain (frontend, database, security, etc.)
5. **Manage git workflow** - Commit, push, and report status
6. **Verify quality** - Run tests, linting, and build verification
7. **Report results** - Success ✅ or blockers 🚨

## Issue Category Detection

The command analyzes issue description for keywords to determine type:

### Frontend Issues
- Keywords: `UI`, `component`, `button`, `form`, `page`, `style`, `Tailwind`, `shadcn`, `responsive`, `layout`, `design`
- Agents: `frontend-react-expert`, `shadcn-expert`, `tailwindcss-expert`

### Database/Backend Issues
- Keywords: `database`, `schema`, `migration`, `query`, `RLS`, `policy`, `Prisma`, `Supabase`, `data`, `table`
- Agents: `postgres-expert`, `prisma-expert`, `supabase-expert`

### Security Issues
- Keywords: `security`, `vulnerability`, `XSS`, `injection`, `auth`, `authorization`, `exploit`, `breach`
- Agents: `security-expert`, `supabase-expert`

### Testing Issues
- Keywords: `test`, `failing`, `coverage`, `Jest`, `unit`, `integration`, `E2E`
- Agents: `jest-expert`

### TypeScript/Type Safety Issues
- Keywords: `type`, `TypeScript`, `@ts`, `any`, `inference`, `generic`
- Agents: `typescript-expert`

### API/Backend Issues
- Keywords: `API`, `endpoint`, `route`, `handler`, `Next.js`, `route handler`
- Agents: `nextjs-expert`

### Code Quality Issues
- Keywords: `lint`, `eslint`, `format`, `code style`, `warning`
- Agents: `eslint-expert`

### Mobile Issues
- Keywords: `mobile`, `Capacitor`, `iOS`, `Android`, `native`, `app`
- Agents: `capacitor-expert`

### Notifications/Email Issues
- Keywords: `email`, `SendGrid`, `notification`, `Firebase`, `FCM`, `push`
- Agents: `sendgrid-expert`, `firebase-expert`

### Performance/Infrastructure Issues
- Keywords: `performance`, `slow`, `optimize`, `Docker`, `Vercel`, `deploy`
- Agents: `vercel-expert`, `docker-expert`, `postgres-expert`

### Git/Version Control Issues
- Keywords: `git`, `merge`, `conflict`, `branch`, `commit`, `push`
- Agents: `git-expert`

## Workflow

```
Parse issue description
  ↓
Detect issue type from keywords
  ↓
Select appropriate subagents
  ↓
Create feature branch (fix/issue-...)
  ↓
Call agents with focused instructions
  ↓
Agents implement fix (TDD mandatory)
  ↓
Commit changes with clear message
  ↓
Push to remote
  ↓
Run: npm test, npm run lint, npm run build
  ↓
Report: Status ✅ or Blockers 🚨
```

## Key Rules

- **NO agent-orchestrator calls** - You directly orchestrate the fix
- **Intelligent delegation** - Analyze issue to pick right agents, not all agents
- **TDD mandatory** - Agents write tests before implementation
- **Focused instructions** - Give agents specific, actionable task descriptions
- **Git responsibility** - You manage branches, commits, and pushes
- **Clear reporting** - Report blockers and warnings only, not full implementation details
- **Minimal context** - Don't load entire codebase into agent prompts; let agents explore

## Agent Selection Strategy

When analyzing the issue:
1. Read the entire issue description carefully
2. Identify primary domain (frontend vs backend vs infrastructure)
3. Check for secondary concerns (security, testing, types)
4. Select 1-3 specialist agents (rarely more)
5. Provide each agent with:
   - Clear problem statement
   - Expected behavior
   - Current behavior
   - Affected files (if known)
   - Any relevant context from issue

## Example Analysis

**Issue:** "Login button not visible on mobile"
- Type: Frontend + Responsive Design
- Keywords: `mobile`, `button`, `responsive`
- Agents: `frontend-react-expert`, `tailwindcss-expert`
- Branch: `fix/issue-login-button-mobile`

**Issue:** "Database query returning stale data"
- Type: Backend + Database
- Keywords: `database`, `query`, `data`
- Agents: `postgres-expert`, `prisma-expert`
- Branch: `fix/issue-stale-data-query`

**Issue:** "XSS vulnerability in user input handling"
- Type: Security + Backend
- Keywords: `XSS`, `security`, `vulnerability`
- Agents: `security-expert`, `nextjs-expert`
- Branch: `fix/issue-xss-vulnerability`
