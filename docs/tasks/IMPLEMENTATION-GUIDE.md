# Task Implementation Guide

## How to Use the Task System

This guide explains how to work with the Toy-for-Toy task management system.

---

## Getting Started

### Step 1: Understand the Task Organization
- Browse `/docs/tasks/README.md` for overview
- Review `/docs/tasks/TASK-INDEX.md` for complete reference
- Find your team's assigned tasks

### Step 2: Choose Your First Task
Look at `/docs/tasks/PHASE-1-PROGRESS.md`:
1. Find tasks with status "Not Started"
2. Check "Blocker" column - must be empty or resolved
3. Verify dependencies are all "Completed"
4. Pick a task within 8-16 hours range for 1-2 day commitment

**Example:** If starting fresh:
- Start with **P1-W1-SETUP-001** (Docker Environment)
- This unblocks all other Phase 1 tasks

### Step 3: Read the Task File
Navigate to task directory and read `task.md`:
- `/docs/tasks/phase-1-week-1-2-setup-auth/01-docker-environment-setup/task.md`

### Step 4: Understand Scope
Review these sections of task file:
1. **Acceptance Criteria** - exact definition of done
2. **Dependencies** - what must complete first
3. **Testing Requirements** - how to verify completion
4. **Estimated Hours** - verify you have time

### Step 5: Start Implementation
1. Create feature branch: `git checkout -b feature/{TASK_ID}`
2. Reference task ID in all commits
3. Update progress file daily
4. Ask questions if unclear

---

## Task File Structure

Every task has this structure:

```
/docs/tasks/phase-X-week-N-M-feature/
└── NN-task-name/
    └── task.md
```

### Example Paths
```
/docs/tasks/phase-1-week-1-2-setup-auth/01-docker-environment-setup/task.md
/docs/tasks/phase-1-week-2-3-toys/01-toy-listing-creation/task.md
/docs/tasks/phase-2-week-9-10-firebase/01-firebase-real-messaging/task.md
```

### Task ID Format
`{Phase}-{Week}-{Category}-{Number}`

Examples:
- `P1-W1-SETUP-001` = Phase 1, Week 1, Setup, Task 1
- `P1-W2-TOYS-001` = Phase 1, Week 2, Toys, Task 1
- `P2-W9-FIREBASE-001` = Phase 2, Week 9, Firebase, Task 1

---

## Reading a Task File

### Essential Sections

1. **Task ID & Title**
   - Unique identifier for this work
   - Clear, action-based title

2. **Description**
   - 2-3 sentence summary
   - What needs to be built, not how

3. **Acceptance Criteria**
   - Detailed checklist of requirements
   - All must be met to call task "done"
   - Based on PRD requirements

4. **Estimated Hours**
   - Total effort: 2-16 hours
   - Should fit in 1-2 days of focused work

5. **Dependencies**
   - Other tasks that must complete first
   - If any blocked, can't start this task

6. **Testing Requirements**
   - How to verify the work is correct
   - Unit, integration, E2E test scenarios

7. **Technology Stack**
   - Tools, libraries, frameworks to use
   - Language, database, services

### Optional Sections

- **Implementation Notes** - tips, patterns, gotchas
- **Risk Factors** - what could go wrong
- **Related Stories** - PRD story numbers
- **Related Functional Req** - PRD requirements covered
- **Database/Schema Changes** - DDL/DML needed

---

## Working on a Task

### Before You Start

1. **Check Dependencies**
   - Read task's "Dependencies" section
   - Verify all are in PHASE-X-PROGRESS.md as "Completed"
   - If not, start with dependency task first

2. **Read the PRD**
   - Review related stories and requirements
   - Understand business context
   - Know why this task matters

3. **Understand Acceptance Criteria**
   - Read every line of "Acceptance Criteria"
   - These define "done" for this task
   - Verify you understand all requirements

4. **Plan Your Approach**
   - Read "Implementation Notes"
   - Consider "Risk Factors"
   - Outline your approach in Slack/document

### During Implementation

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/P1-W1-SETUP-001-docker-environment
   ```

2. **Reference Task ID in Commits**
   ```bash
   git commit -m "feat(P1-W1-SETUP-001): Add docker-compose configuration"
   git commit -m "feat(P1-W1-SETUP-001): Add environment variable template"
   ```

3. **Write Tests as You Go**
   - Don't wait until end
   - Test-driven development preferred
   - See "Testing Requirements" section

4. **Track Progress**
   - Update PHASE-X-PROGRESS.md daily
   - Note blockers immediately
   - Share learnings in pull request

5. **Ask Questions Early**
   - If requirements unclear, ask PM
   - If technical stuck, ask tech lead
   - Update task file for clarity

### Completing the Task

1. **Verify All Acceptance Criteria Met**
   - Go through checklist one more time
   - All items should be done
   - Demo to team if applicable

2. **Run All Tests**
   - Unit tests: `npm test -- {module}`
   - Integration tests: full test suite
   - E2E tests: user workflows
   - All must pass, >85% coverage

3. **Code Review**
   - Create pull request with clear description
   - Reference task ID in PR
   - Wait for approval (2+ reviewers)

4. **Merge to Develop**
   - Ensure CI/CD pipeline passes
   - One reviewer approves
   - Merge and delete branch

5. **Update Progress**
   - Change status to "Completed" in PHASE-X-PROGRESS.md
   - Record actual hours spent
   - Add completion date
   - Commit this change to main

6. **Hand Off**
   - If dependent task exists, notify that team
   - Share any learnings or gotchas
   - Update related task files if scope changed

---

## Progress Tracking

### Updating PHASE-X-PROGRESS.md

Each task row has these columns:

| Column | Meaning | Update When |
|--------|---------|-------------|
| Task ID | Unique identifier | Never |
| Title | Task name | Never |
| Status | not started / in progress / blocked / completed | Daily |
| Hours Est | Estimated effort | Never |
| Hours Actual | Actual effort spent | When complete |
| Blocker | What's preventing progress | If blocked |
| Notes | Any relevant info | As needed |

### Status Workflow

```
Not Started
    ↓
  (assign to developer)
    ↓
In Progress
    ↓
  (complete and merge)
    ↓
Completed
```

### If Blocked

Example progress entry:
```
P1-W1-SETUP-002 | Core Database Schema | Blocked | 10-14 | 0 | P1-W1-SETUP-001 not merged | Waiting for Docker setup, will unblock by EOD tomorrow |
```

When unblocked:
```
P1-W1-SETUP-002 | Core Database Schema | In Progress | 10-14 | 4 | None | Docker setup complete, continuing with schema |
```

---

## Common Task Workflows

### Workflow 1: Simple Backend Task (P1-W1-AUTH-001)

1. **Understand Requirements**
   - Read task file
   - Read PRD Story 1
   - Understand validation rules, email flow

2. **Implement Backend**
   - Create `/api/auth/signup` endpoint
   - Add validation functions
   - Connect to Supabase Auth
   - Insert profile and ticket records

3. **Write Tests**
   - Unit tests for validation
   - Integration tests for endpoint
   - Test error cases

4. **Implement Frontend**
   - Create signup form component
   - Add validation feedback
   - Handle submission and errors

5. **Write E2E Tests**
   - Complete signup flow
   - Verify email sent
   - Verify user records created

6. **Code Review & Merge**
   - Push to GitHub
   - Create PR with task reference
   - Get approval
   - Merge to develop

7. **Update Progress**
   - Mark as Completed
   - Record actual hours
   - Note any learnings

### Workflow 2: Complex Feature (P1-W2-TOYS-001)

1. **Plan the Approach**
   - Database migrations needed?
   - Image processing required?
   - RLS policies needed?
   - Design schema changes

2. **Implement in Phases**
   - Phase 1: Database schema
   - Phase 2: Image upload
   - Phase 3: API endpoint
   - Phase 4: Frontend form

3. **Test Each Phase**
   - Don't wait until end
   - Test as you go
   - Full integration tests at end

4. **Handle Complexity**
   - Image processing takes time
   - File upload can be finicky
   - Use library (Sharp) for resizing
   - Test on real files

5. **Optimize Performance**
   - Ensure image processing efficient
   - Use indexes on frequently queried columns
   - Load test with multiple images

6. **Code Review**
   - Expect more review cycles
   - Be open to feedback
   - May need multiple rounds

7. **Update Progress**
   - Record actual hours (likely exceeded estimate)
   - Note what took longer
   - Update team on learnings

### Workflow 3: Blocked Task

1. **Identify Blocker**
   - Can't start because dependency not done
   - Example: P1-W3-EXCH-001 blocked by P1-W2-TOYS-001

2. **Update Progress**
   - Status: Blocked
   - Blocker column: Reference task
   - Notes: "Waiting for P1-W2-TOYS-001 to merge"

3. **While Waiting**
   - Read task files for dependent features
   - Design your implementation approach
   - Write tests (that will pass when dependency done)
   - Pair with dependency owner

4. **When Unblocked**
   - Status: In Progress
   - Pull latest from develop (includes dependency)
   - Start implementation
   - Note day you became unblocked

---

## Testing Your Task

### Unit Tests (Jest)

Example: Password validation
```typescript
// tests/auth/password-validator.test.ts
import { validatePassword } from '@/lib/password-validator';

describe('Password Validation', () => {
  it('validates strong password', () => {
    expect(validatePassword('SecurePass123!')).toEqual({
      valid: true,
      errors: []
    });
  });

  it('rejects weak password', () => {
    expect(validatePassword('weak')).toEqual({
      valid: false,
      errors: ['min 8 chars', 'needs uppercase', ...]
    });
  });
});
```

Run: `npm test -- password-validator.test.ts`

### Integration Tests (Jest)

Example: API endpoint
```typescript
// tests/api/auth-signup.test.ts
import { POST } from '@/app/api/auth/signup/route';

describe('POST /api/auth/signup', () => {
  it('creates user with valid data', async () => {
    const request = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePass123!'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

Run: `npm test`

### E2E Tests (Playwright)

Example: Complete user flow
```typescript
// tests/e2e/signup-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete signup flow', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/signup');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button:has-text("Create Account")');
  await expect(page).toHaveURL(/\/auth\/verify-email/);
});
```

Run: `npx playwright test`

### Manual Testing

For features Playwright can't test:
1. Test on real mobile device
2. Check email in Mailhog (http://localhost:8025)
3. Verify database records with Supabase Studio
4. Test edge cases not covered by automation

---

## Handling Dependencies

### Understanding Dependencies

Every task lists prerequisites:
```
P1-W3-EXCH-001 | Exchange Request | Not Started | 12-14 | 0 | P1-W2-TOYS-001 | Can't start until toys exist
```

### Dependency Chain
```
P1-W1-SETUP-001 (Docker)
  ↓
P1-W1-SETUP-002 (Schema)
  ↓
P1-W1-SETUP-003 (RLS)
  ↓
P1-W1-AUTH-001 (Signup) → others
  ↓
P1-W2-TOYS-001 → P1-W3-EXCH-001
```

### What to Do If Blocked

1. **Wait for Dependency**
   - Start date when dependency merges
   - Pull latest from develop
   - Verify dependency works

2. **Prepare While Waiting**
   - Read task file completely
   - Design your implementation
   - Write unit tests (won't pass yet)
   - Pair with dependency owner to understand

3. **Parallel Work**
   - Pick unblocked task from different area
   - Some tasks are independent
   - Help other team members
   - Code review their PRs

### Parallel Execution

These tasks can work simultaneously (no dependencies between):
- P1-W2-TOYS-001 (Toys) vs P1-W4-GAMES-001 (Games)
- P1-W6-GDPR-001 (GDPR) vs P1-W3-EXCH-001 (Exchanges)

Assign to different developers to accelerate timeline.

---

## Escalation & Help

### I Don't Understand the Task

1. **Re-read carefully**
   - Read "Description" and "Acceptance Criteria" again
   - Review related PRD section
   - Check "Implementation Notes"

2. **Ask the team**
   - Slack message to tech lead
   - Mention task ID
   - Share what's confusing

3. **Update the task file**
   - If task wording unclear
   - Create PR to clarify
   - Future developers will benefit

### I'm Blocked on Implementation

1. **Debug systematically**
   - Add console.log or debugger
   - Read error messages carefully
   - Google the error
   - Check related code

2. **Ask for help**
   - Pair with senior developer
   - Code review early (don't wait)
   - Share error context

3. **Document learnings**
   - Add to "Implementation Notes"
   - Help future developers
   - Create useful error messages

### The Task is Bigger Than Estimated

1. **Don't force it**
   - If 16 hours estimated, grew to 24 hours
   - Talk to tech lead immediately
   - Options: split into subtasks, extend deadline, get help

2. **Root cause**
   - Was requirement unclear?
   - Did tech complexity increase?
   - Learn for next estimate

3. **Update progress**
   - Record actual hours
   - Note learnings
   - Adjust future estimates

---

## Code Quality Standards

### JavaScript/TypeScript

- Use TypeScript (no `any` types)
- Follow ESLint rules (`npm run lint`)
- Format with Prettier (`npm run format`)
- 85%+ test coverage required
- Clear variable/function names

### React Components

- Functional components with hooks
- Props fully typed
- No inline styles (use Tailwind)
- Accessible (ARIA labels, semantic HTML)
- Mobile-first responsive design

### API Endpoints

- RESTful conventions (GET, POST, PUT, DELETE)
- Proper HTTP status codes
- Clear error messages
- Input validation
- JWT auth required (except public endpoints)

### Database

- Migrations for all schema changes
- Proper indexing on filter columns
- RLS policies enforce security
- Foreign key constraints
- Comments on complex queries

### Testing

- Unit tests for business logic
- Integration tests for APIs
- E2E tests for user flows
- Manual testing for edge cases
- >85% code coverage

---

## Git Workflow

### Creating Your Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/P1-W1-SETUP-001-docker-environment
```

### Committing Your Work
```bash
# Commit frequently with clear messages
git commit -m "feat(P1-W1-SETUP-001): Add docker-compose.yml"
git commit -m "feat(P1-W1-SETUP-001): Add environment template"
git commit -m "test(P1-W1-SETUP-001): Add docker health check test"

# Push regularly
git push origin feature/P1-W1-SETUP-001-docker-environment
```

### Creating a Pull Request
1. Go to GitHub
2. Click "Create Pull Request"
3. Title: `feat(P1-W1-SETUP-001): Docker environment setup`
4. Description:
   ```
   # Task: P1-W1-SETUP-001 - Docker Environment Setup

   ## What Changed
   - Added docker-compose.yml with Supabase services
   - Added .env.local.example template
   - Added setup documentation

   ## Checklist
   - [x] All acceptance criteria met
   - [x] Tests passing
   - [x] Code reviewed
   - [x] Documentation updated

   ## Hours Spent
   11 hours (estimated 8-12)
   ```

4. Request reviewers (tech lead + 1 other developer)
5. Wait for approval
6. Merge when ready

### Merging to Develop
- Require 2 approvals
- All checks passing
- No merge conflicts
- Delete feature branch after merge
- Update progress file on develop

---

## Tools & Resources

### Development Tools
- **IDE:** VS Code (recommended)
- **Node.js:** v18+ (check `.nvmrc`)
- **Package Manager:** npm
- **Database:** Supabase (local Docker)
- **Testing:** Jest, Playwright
- **Version Control:** Git, GitHub

### Project Resources
- **PRD:** `/Users/pawelkalkun/Projects/private/toys-for-toys/PRD.md`
- **Architecture:** `/Users/pawelkalkun/Projects/private/toys-for-toys/CLAUDE.md`
- **Tasks:** `/Users/pawelkalkun/Projects/private/toys-for-toys/docs/tasks/`

### Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev          # Run Next.js on localhost:3001
docker-compose up    # Start Supabase services

# Testing
npm test                          # Run all tests
npm test -- filename.test.ts      # Run specific test
npm run test:e2e                  # Run Playwright tests

# Quality
npm run lint                       # Check code style
npm run format                     # Format code
npm run build                      # Test production build

# Database
npx supabase db push               # Push migrations to Supabase
npx supabase db pull               # Pull remote schema locally
```

---

## Next Steps

1. **Review README.md** for task organization
2. **Check PHASE-1-PROGRESS.md** for available tasks
3. **Pick your first task** (P1-W1-SETUP-001 is good start)
4. **Read the task file** completely
5. **Ask questions** before you start
6. **Get to work!**

---

## Quick Reference

| Need | Location |
|------|----------|
| Task list | `/docs/tasks/PHASE-1-PROGRESS.md` |
| Task details | `/docs/tasks/phase-*-week-*/NN-task-name/task.md` |
| Search tasks | `/docs/tasks/TASK-INDEX.md` |
| Project overview | `/docs/tasks/README.md` |
| Architecture | `/CLAUDE.md` |
| Full PRD | `/PRD.md` |
| This guide | `/docs/tasks/IMPLEMENTATION-GUIDE.md` |

Good luck! 🚀
