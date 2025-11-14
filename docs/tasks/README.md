# Toy-for-Toy Task Management System

## Overview

This directory contains all implementation tasks for the Toy-for-Toy toy exchange platform, organized by phase, week, and feature area. The task system is designed to help the development team understand scope, dependencies, and success criteria for each work item.

## Organization Structure

### Directory Layout

```
docs/tasks/
├── phase-1-week-1-2-setup-auth/      # Project setup & authentication
│   ├── 01-docker-environment-setup/
│   ├── 02-database-core-schema/
│   ├── 03-supabase-rls-policies/
│   ├── 04-auth-signup-flow/
│   ├── 05-parental-consent-forms/
│   └── 06-login-password-reset/
├── phase-1-week-2-3-toys/             # Toy listing & search
│   ├── 01-toy-listing-creation/
│   └── 02-toy-search-filtering/
├── phase-1-week-3-4-exchanges/        # Exchange flow
│   ├── 01-exchange-request-flow/
│   └── 02-exchange-acceptance-delivery/
├── phase-1-week-4-5-minigames/        # Mini-games
│   ├── 01-shape-sorter-game/
│   └── 02-memory-match-game/
├── phase-1-week-5-6-notifications/    # Notifications
│   └── 01-notification-system/
├── phase-1-week-6-7-compliance/       # GDPR & i18n
│   ├── 01-gdpr-data-export/
│   └── 02-internationalization-i18n/
├── phase-1-week-7-8-testing/          # Testing & docs
│   ├── 01-unit-integration-tests/
│   └── 02-e2e-tests-deployment/
├── phase-2-week-9-10-firebase/        # Firebase integration
│   ├── 01-firebase-real-messaging/
│   └── 02-admob-integration/
├── phase-2-week-10-11-email/          # Email service
│   └── 01-sendgrid-email/
├── phase-2-week-11-12-ratings/        # Ratings & reviews
│   └── 01-ratings-reviews-ui/
├── phase-2-week-12-13-disputes/       # Dispute resolution
│   └── 01-dispute-resolution/
├── phase-2-week-13-14-wishlist/       # Wishlist matching
│   └── 01-wishlist-matching/
├── phase-2-week-14-15-analytics/      # Analytics dashboards
│   └── 01-analytics-dashboards/
├── phase-2-week-15-16-security/       # Security audit
│   └── 01-security-audit/
├── PHASE-1-PROGRESS.md                # Phase 1 tracking
├── PHASE-2-PROGRESS.md                # Phase 2 tracking
├── TASK-INDEX.md                      # Searchable index
└── README.md                          # This file
```

## Phase 1: Local Development (Weeks 1-8)

Phase 1 focuses on building the MVP with zero cloud dependencies. All services run locally in Docker.

### Week 1-2: Project Setup & Authentication
- Docker Compose configuration
- PostgreSQL schema & migrations
- Row-Level Security (RLS) policies
- User signup/email verification
- Parental consent forms (GDPR)
- Login & password reset

**Status:** Foundation tasks, must complete before other work

### Week 2-3: Toy Listing & Search
- Toy listing creation with image upload
- Search filtering (category, tags, age group)
- Behavioral analytics logging
- Full-text search optimization

**Status:** Core feature, required for exchange flow

### Week 3-4: Exchange Flow
- Exchange request initiation
- Exchange acceptance/decline
- Delivery confirmation
- Auto-completion (48-hour timeout)

**Status:** Core business logic, integrates with tickets

### Week 4-5: Mini-Games
- Shape Sorter game (mechanics, scoring)
- Memory Match game (mechanics, scoring)
- Game session tracking
- Fragment-to-ticket conversion

**Status:** Engagement feature, feeds ticket economy

### Week 5-6: Notifications
- In-app notifications (Supabase Realtime)
- Push notifications (Firebase FCM - mocked)
- Email notifications (Mailhog)
- Notification preferences & quiet hours

**Status:** User experience, integrates with exchanges

### Week 6-7: GDPR & Internationalization
- Data export (JSON download)
- Data deletion workflow
- GDPR request handling
- i18n setup (Polish, German, English)

**Status:** Compliance critical, i18n prepares for production

### Week 7-8: Testing & Documentation
- Unit/integration tests (Jest)
- E2E tests (Playwright)
- Documentation (API, architecture)
- Deployment checklist

**Status:** Quality gates, required for Phase 2

## Phase 2: Production Integration (Weeks 9-16)

Phase 2 integrates real cloud services and advanced features.

### Week 9-10: Firebase & AdMob
- Real Firebase Cloud Messaging
- Real Google AdMob integration
- Vercel deployment setup

**Status:** Production services, monetization

### Week 10-11: Email Service
- SendGrid integration (transactional emails)
- Email templates
- Unsubscribe management
- Email tracking

**Status:** Communication, replaces Mailhog

### Week 11-12: Ratings & Reviews
- Toy quality ratings UI
- Exchange experience ratings
- User score aggregation
- Rating visibility & trust signals

**Status:** Community features, builds trust

### Week 12-13: Dispute Resolution
- Dispute filing UI
- Support dashboard
- Resolution workflows
- Appeals process (future)

**Status:** Risk management, customer support

### Week 13-14: Wishlist Matching
- Wishlist management UI
- Daily matching algorithm
- Smart notifications
- Wishlist analytics

**Status:** Engagement feature, increases retention

### Week 14-15: Analytics Dashboards
- User acquisition metrics
- Engagement dashboards
- Retention tracking
- Monetization reporting

**Status:** Business intelligence, informs strategy

### Week 15-16: Security Audit
- Penetration testing
- GDPR compliance audit
- Security hardening
- Performance optimization

**Status:** Pre-launch readiness

## Task File Format

Each task has its own directory with a `task.md` file containing:

### Required Sections
- **Task ID:** Unique identifier (e.g., P1-W1-SETUP-001)
- **Epic:** Which phase/week this task belongs to
- **Title:** Clear, action-verb-based title
- **Description:** 2-3 sentence summary
- **Acceptance Criteria:** Detailed checklist of what "done" looks like
- **Estimated Hours:** 2-16 hours (1-2 day tasks)
- **Dependencies:** Other tasks that must complete first
- **Testing Requirements:** How to verify completion
- **Database/Schema Changes:** DDL/DML if applicable
- **Technology Stack:** Relevant tools/libraries
- **Success Metrics:** Measurable outcomes

### Additional Sections
- Implementation Notes
- Risk Factors
- Related Stories (from PRD)
- Related Functional Requirements

## Finding Tasks

### By Feature
Use `/docs/tasks/TASK-INDEX.md` to search by:
- Feature name (e.g., "Exchange Flow")
- Story ID (e.g., "Story 5")
- Component (e.g., "Login")

### By Phase/Week
Navigate directory structure:
- Phase 1: `phase-1-week-{N}-{N+1}-{feature}/`
- Phase 2: `phase-2-week-{N}-{N+1}-{feature}/`

### By Task ID
Example: P1-W2-TOYS-001
- `P1` = Phase 1
- `W2` = Week 2
- `TOYS` = Feature area
- `001` = Task sequence

## Task Execution Workflow

### Before Starting
1. Read the task file completely
2. Review dependencies (must be completed first)
3. Check acceptance criteria for scope
4. Understand testing requirements

### During Work
1. Track progress in PHASE-X-PROGRESS.md
2. Create feature branches: `feature/P1-W1-SETUP-001`
3. Commit frequently with clear messages
4. Reference task ID in commits

### Completion Checklist
1. All acceptance criteria met
2. Tests passing (unit, integration, E2E)
3. Code reviewed and approved
4. Merge to develop branch
5. Update progress file

## Progress Tracking

### PHASE-1-PROGRESS.md
- Task status (Not Started, In Progress, Completed, Blocked)
- Actual hours spent
- Blockers and issues
- Completion date

### PHASE-2-PROGRESS.md
- Same structure as Phase 1
- Only active during Phase 2 (Weeks 9-16)

## Task Granularity

Each task should be:
- **Completable in 1-2 days** of focused work
- **Self-contained** with minimal external dependencies
- **Testable** with clear acceptance criteria
- **Valuable** delivering measurable progress

### Large Features → Multiple Tasks
Example: Exchange flow broken into:
1. Exchange request initiation
2. Exchange acceptance/decline
3. Delivery confirmation

NOT a single "Build Exchange System" task

## Dependencies & Sequencing

### Critical Path (Must Do First)
1. Docker environment (P1-W1-SETUP-001)
2. Database schema (P1-W1-SETUP-002)
3. RLS policies (P1-W1-SETUP-003)
4. Auth signup (P1-W1-AUTH-001)
5. Login/reset (P1-W1-AUTH-003)

### Parallel Work
Once critical path complete, can work in parallel:
- Toy listing (P1-W2-TOYS-001) doesn't block mini-games (P1-W4-GAMES-001)
- Notifications (P1-W5-NOTIF-001) independent of exchanges

### Dependency Map
See TASK-INDEX.md for complete dependency graph

## Team Collaboration

### Task Assignment
- Assign by feature area (one person per feature)
- Pair programming for security-critical tasks
- Code review mandatory for all tasks

### Communication
- Update progress daily in PHASE-X-PROGRESS.md
- Flag blockers immediately
- Share learnings in task comments

### Handoff
- Document assumptions/decisions in task files
- Include troubleshooting notes
- Update related task files if scope changes

## Technology Stack References

### Frontend
- Next.js 14+
- React 18+
- TypeScript 5+
- Tailwind CSS 3+

### Backend
- Supabase (PostgreSQL, Auth, Realtime)
- Next.js API routes
- Edge Functions (future)

### Database
- PostgreSQL 14+
- Row-Level Security (RLS)
- Database triggers & functions

### Testing
- Jest (unit/integration)
- Playwright (E2E)
- MSW (API mocking)

### DevOps
- Docker Compose (local development)
- Vercel (production)
- GitHub Actions (CI/CD - future)

## Common Patterns

### API Endpoint Pattern
- Method: GET/POST/PUT/DELETE
- Path: `/api/{resource}/{action}`
- Auth: JWT in cookies
- Response: JSON with status, data/error

### Database Pattern
- Tables: snake_case
- Columns: snake_case
- IDs: UUID v4
- Timestamps: UTC, created_at/updated_at

### React Component Pattern
- Functional components with hooks
- Props typed with TypeScript
- Styles via Tailwind classes
- No inline styles

### Testing Pattern
- Unit: pure functions, business logic
- Integration: API endpoints, database
- E2E: user workflows, full stack

## Troubleshooting

### Task Scope Creep
- If task growing beyond 16 hours: break into subtasks
- Create new task files for significant changes
- Update dependencies in related tasks

### Blocked Tasks
- Document blocker in PHASE-X-PROGRESS.md
- Identify who can unblock (usually previous task owner)
- Estimate delay and communicate to team

### Unclear Requirements
- Review task file acceptance criteria
- Check related PRD section
- Ask in team Slack/meeting
- Update task file for clarity

## Support & Questions

- PRD Location: `/Users/pawelkalkun/Projects/private/toys-for-toys/PRD.md`
- Architecture: `/Users/pawelkalkun/Projects/private/toys-for-toys/CLAUDE.md`
- Questions: Review related task file sections, check dependencies, ask PM

## Task Statistics

### Phase 1 (8 weeks)
- Total tasks: ~35-40
- Foundation tasks: 6 (must complete first)
- Feature tasks: 25-30
- Quality tasks: 5-8

### Phase 2 (8 weeks)
- Total tasks: ~20-25
- Integration tasks: 8-10
- Feature tasks: 8-10
- Hardening tasks: 5-8

### Estimated Total
- Phase 1: 240-320 hours (30-40 hours/week)
- Phase 2: 160-240 hours (20-30 hours/week)
- **Total MVP: 400-560 hours** (2-3 developers, 16 weeks)

## Next Steps

1. Review PHASE-1-PROGRESS.md to start working
2. Choose an unblocked task from the progress file
3. Read task file completely before starting
4. Update progress file daily
5. Reference task ID in all commits
6. Ask questions early if requirements unclear
