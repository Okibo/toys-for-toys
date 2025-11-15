# Implement Task Command

This command directly orchestrates task implementation. You will:

1. **Parse the task file** from argument 1
2. **Extract the specific task** by number (argument 2)
3. **Create a new git branch** using format: `task/<task-name>` (slugified)
4. **Decompose the task** into sub-tasks
5. **Delegate to specialist subagents ONLY** (never invoke agent-orchestrator):
   - Identify which agents are needed for each sub-task
   - Call each agent with precise, focused instructions
   - Agents write tests first (TDD), then implementation
   - No documentation from agents - only report blockers
6. **Manage git workflow**:
   - Create branch at start
   - Commit changes after each agent completes
   - Push to remote when done
   - Merge to develop (or create PR if preferred)
7. **Report final status**:
   - ✅ Success or 🚨 Blockers only
  - List any warnings

## Agent Selection Guide

- **Frontend/UI**: frontend-react-expert, shadcn-expert, tailwindcss-expert
- **Database/Backend**: postgres-expert, prisma-expert, supabase-expert, nextjs-expert
- **Testing**: jest-expert
- **Security**: security-expert
- **Type Safety**: typescript-expert
- **Code Quality**: eslint-expert
- **Mobile**: capacitor-expert
- **Infrastructure**: docker-expert, vercel-expert
- **Email/Notifications**: sendgrid-expert, firebase-expert
- **Architecture**: software-architect (only for major design decisions)

## Workflow

```
Read task file → Parse task #N → Create branch
  ↓
Identify required agents
  ↓
Call agents with focused instructions (TDD mandatory)
  ↓
Commit and push changes
  ↓
Run: npm test, npm run lint, npm run build
  ↓
Merge to develop
  ↓
Report: Status + any blockers
```

## Key Rules

- **NO agent-orchestrator calls** - you directly orchestrate
- **Subagents ONLY implement** - no docs, summaries, or reports
- **TDD mandatory** - tests before code for every change
- **Git operations** are your responsibility - agents don't touch git
- **Status reporting only** - blockers, warnings, completion
