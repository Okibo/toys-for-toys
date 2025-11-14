# Toy-for-Toy MVP Task Breakdown - Complete Summary

**Date:** November 13, 2025
**Scope:** MVP Phase 1 (Months 1-3)
**Document:** Executive summary of task organization and estimated effort

---

## Overview

The Toy-for-Toy PRD has been decomposed into **75 granular implementation tasks** organized into **10 epics**. All tasks are designed to be completable by a single developer in 1-2 days, enabling parallel work and flexible team composition.

---

## Task Distribution by Category

### Epic 1: Project Setup & Infrastructure (6 tasks)

**Effort:** 6 developer-days
**Timeline:** Week 1
**Owner:** DevOps Lead
**Status:** Pending

Tasks cover:

- Monorepo initialization (Next.js, TypeScript, dependencies)
- Supabase project setup (EU region, local development)
- Firebase configuration (Cloud Messaging)
- GitHub Actions CI/CD pipeline
- Vercel deployment setup
- Development documentation

**Critical Path:** All tasks sequential; Epic 1 must complete before other work begins
**Success Metric:** Dev environment fully functional, CI/CD passing, deployments working

---

### Epic 2: Database Schema & Core Models (10 tasks)

**Effort:** 12 developer-days (2.9 includes RLS complexity)
**Timeline:** Weeks 2-3
**Owner:** Database Architect
**Status:** Pending

Tasks cover:

- Core tables (users, profiles, kids)
- Ticket economy (tickets, fragments, transaction log)
- Toy listings (toys, photos, views)
- Exchanges & escrow (transactions, delivery, disputes)
- Messaging system (exchange-scoped messages, blocklist)
- Wishlist management (wishlists, wishlist items, matching log)
- Notifications (notification center, preferences)
- Ratings & reviews (with denormalized user stats)
- Row-Level Security (RLS) policies
- Database views (for optimized queries)

**Critical Path:** Completes Epic 1; enables Epic 3, 4, 8
**Success Metric:** All tables created, RLS enforced, views optimize common queries

---

### Epic 3: Authentication & GDPR Compliance (9 tasks)

**Effort:** 11 developer-days
**Timeline:** Weeks 3-4
**Owner:** Backend/Security Lead
**Status:** Pending

Tasks cover:

- Email/password authentication
- Login/sign-up UI pages
- Parental consent flow (multi-step, GDPR Article 8)
- Privacy policy & Terms of Service
- Consent withdrawal (30-day grace period)
- Data Subject Access Request (DSAR) form
- 2FA skeleton (deferred to Phase 2)
- Email verification (optional for MVP)
- Password reset workflow

**Critical Path:** Requires Epic 2; enables Epic 6
**Success Metric:** Sign-up/login functional, GDPR consent flows working, all legal docs accessible

**GDPR Compliance Focus:**

- Explicit consent required (no pre-checked boxes)
- Consent recorded with timestamp, IP, version
- Revocation with 30-day grace period
- Data deletion workflows
- DSAR processing within 10 working days
- Privacy policy in Polish, German, English

---

### Epic 4: Core APIs & Ticket Economy (10 tasks)

**Effort:** 10 developer-days
**Timeline:** Weeks 4-5
**Owner:** Backend Lead
**Status:** Pending

Tasks cover:

- Authentication endpoints (login, signup, logout, token refresh)
- User profile endpoints (get, update, delete)
- Toy listing endpoints (create, search, get, update, delete)
- Ticket economy endpoints (wallet, balance, fragment conversion)
- Exchange endpoints (request, accept, decline, deliver, confirm)
- Wishlist endpoints (create, add items, remove items)
- Messaging endpoints (send, get history, delete)
- Rate limiting & CORS configuration
- API documentation (OpenAPI/Swagger)

**API Endpoint Count:** ~35 endpoints
**Critical Path:** Requires Epic 2 & 3; enables Epic 5, 6, 7, 8, 9
**Success Metric:** All APIs functional, documented, tested with Postman/curl

**Key Business Logic:**

- Ticket freezing on request (escrow)
- Ticket release on delivery confirmation
- Auto-refund if request declined
- Auto-complete exchanges after 7 days
- Dispute handling workflow

---

### Epic 5: Mini-Games & Rewards System (6 tasks)

**Effort:** 7 developer-days
**Timeline:** Weeks 5-6
**Owner:** Frontend/Game Developer
**Status:** Pending

Tasks cover:

- Game architecture & component design
- Color Match Puzzle game implementation (2 days due to complexity)
- Fragment reward system
- Fragment-to-ticket conversion logic
- Game moderation & child safety (age restrictions, parental controls)
- Analytics & tracking (non-invasive)

**Game MVP Scope:** 1 game (Color Match)
**Fragment Mechanics:**

- Each game: 0.5 fragments per completion
- Bonus: 0.25 fragments per rewarded video (max 2/day)
- Conversion: 4 fragments = 1 ticket
- Parental controls: Disable games, session limits

**Out of Scope for MVP:**

- 2nd & 3rd games (Memory, Trivia) → Phase 2
- Rewarded video ads → Phase 2
- Leaderboards → Phase 2

**Critical Path:** Requires Epic 4; enables Epic 6
**Success Metric:** Game functional, fragments awarded, conversion working, parental controls stubbed

---

### Epic 6: Frontend Core UI (12 tasks)

**Effort:** 14 developer-days
**Timeline:** Weeks 6-8
**Owner:** Frontend Lead
**Status:** Pending

Pages/Components:

1. Dashboard layout & navigation
2. Toy discovery (search, filters, infinite scroll)
3. Toy detail page (photos, condition, request button, similar toys)
4. My listings (inventory management, edit, delist)
5. Exchange status (pending, in-transit, delivered, completed)
6. Wallet (tickets, fragments, transaction history)
7. Wishlist management (add, remove, reorder)
8. Settings (account, preferences, GDPR, language)
9. Notification center (in-app inbox)
10. In-app messaging (exchange-scoped chat)
11. Games tab (game selection, play interface)
12. Mobile responsiveness & testing

**UI Framework:** Next.js App Router + shadcn/ui + Tailwind CSS
**Design System:** shadcn/ui components, responsive (mobile-first)
**Pages Count:** ~10 main pages

**Critical Path:** Requires Epic 4 & 5; depends on notifications (Epic 7)
**Success Metric:** All pages functional, responsive design, data flowing from APIs

---

### Epic 7: Notifications & Communication (7 tasks)

**Effort:** 7 developer-days
**Timeline:** Weeks 8-9
**Owner:** Backend Lead
**Status:** Pending

Tasks cover:

- Email notification system (SendGrid integration)
- Notification preference endpoints (frequency, channels)
- In-app notification center (persistent inbox)
- Notification digest logic (batching, de-duplication)
- Realtime subscriptions (Supabase Realtime)
- Message moderation (auto-flag phone #, addresses, payment terms)
- Message retention/cleanup jobs (delete 30 days post-exchange)

**Notification Types (MVP):**

- Match found (daily digest)
- Request received (instant)
- Exchange status changes (instant)
- Game reward earned (instant)
- Delivery overdue (escalation)

**Out of Scope for MVP:**

- SMS notifications → Phase 2
- Push notifications (Firebase FCM) → Phase 2
- Quiet hours enforcement → Phase 2

**Critical Path:** Requires Epic 4; enables Epic 6
**Success Metric:** Email notifications sent, in-app center working, preferences respected

---

### Epic 8: Matching Engine & Smart Wishlist (5 tasks)

**Effort:** 6 developer-days
**Timeline:** Weeks 9-10
**Owner:** Data/Backend Lead
**Status:** Pending

Tasks cover:

- Matching algorithm (scoring: tags 40%, age 30%, condition 20%, recency 10%)
- Daily matching Edge Function (02:00 UTC)
- Match notification triggering
- Matching analytics & testing
- Manual toy discovery optimization (search, filters)

**Matching Scope:**

- Runs daily at 02:00 UTC
- Score threshold: ≥60% to notify
- Top 3 matches per child per day
- No duplicate notifications within 7 days
- De-duplication of same toy

**Algorithm Details:**

- Tag match: Exact (100%), partial (70%), category (40%), none (0%)
- Age match: Exact (100%), ±1yr (80%), ±2yr (50%), no tag (100%)
- Condition: Meets preference (100%), 1 level below (70%), 2+ below (0%)
- Recency: 7d (100%), 14d (80%), 30d (60%), 30d+ (40%)

**Out of Scope for MVP:**

- ML-based personalization → Phase 3
- Advanced matching preferences → Phase 2

**Critical Path:** Requires Epic 2 & 4; enables notifications
**Success Metric:** Matching algorithm scoring correctly, daily job runs, matches send notifications

---

### Epic 9: Ad Integration & Analytics (5 tasks)

**Effort:** 5 developer-days
**Timeline:** Weeks 10-11
**Owner:** Frontend/Growth Lead
**Status:** Pending

Tasks cover:

- Google AdMob web integration (mobile ads)
- Google AdSense web fallback (display ads)
- Ad placement components (banner, native)
- Analytics & event tracking
- Revenue monitoring dashboards

**Ad Placements (MVP):**

- Toy detail page (banner below description): 0.02-0.05 EUR CPM
- Search results (every 5th item): 0.03-0.06 EUR CPM
- Exchange flow (awaiting response): 0.05-0.10 EUR CPM
- Games screen (above list): 0.02-0.04 EUR CPM
- Notification digest footer: 0.01-0.02 EUR CPM

**GDPR Compliance:**

- No PII transmitted to ad networks
- Only age group + interests
- Targeting: G-rated, family-appropriate ads only
- No tracking of individual game actions

**Out of Scope for MVP:**

- Rewarded video ads → Phase 2
- Sponsored listings → Phase 2
- Advanced targeting → Phase 3

**Critical Path:** Requires Epic 6; enables revenue
**Success Metric:** Ads displaying, GDPR-compliant, analytics tracked, revenue visible

---

### Epic 10: Testing, QA & Polish (8 tasks)

**Effort:** 10 developer-days
**Timeline:** Weeks 11-12
**Owner:** QA Lead
**Status:** Pending

Tasks cover:

- Unit tests (core business logic): 2 days
- Integration tests (API layer): 2 days
- E2E tests (user flows): 2 days
- Security audit (RLS, auth, data handling): 1 day
- Accessibility audit (WCAG AA): 1 day
- Performance testing & optimization: 1 day
- Soft launch with 100 beta users: 2 days
- Bug fixes & final polish: 2 days

**Testing Targets:**

- Unit test coverage: 80%+
- Integration tests for all APIs
- E2E tests for core flows (signup → exchange → confirm)
- Security: RLS enforcement, auth flows, data isolation
- Accessibility: Keyboard navigation, screen reader, color contrast

**Critical Path:** Requires all other epics; gates public launch
**Success Metric:** 80%+ test coverage, security audit passed, WCAG AA compliance, 100+ beta users

---

## Summary Table

| Epic             | Tasks  | Effort (days) | Timeline     | Owner            |
| ---------------- | ------ | ------------- | ------------ | ---------------- |
| 1. Setup         | 6      | 6             | Week 1       | DevOps           |
| 2. Database      | 10     | 12            | Weeks 2-3    | DB Architect     |
| 3. Auth/GDPR     | 9      | 11            | Weeks 3-4    | Backend/Security |
| 4. Core APIs     | 10     | 10            | Weeks 4-5    | Backend          |
| 5. Games         | 6      | 7             | Weeks 5-6    | Frontend/Game    |
| 6. Frontend UI   | 12     | 14            | Weeks 6-8    | Frontend         |
| 7. Notifications | 7      | 7             | Weeks 8-9    | Backend          |
| 8. Matching      | 5      | 6             | Weeks 9-10   | Data/Backend     |
| 9. Ads           | 5      | 5             | Weeks 10-11  | Frontend/Growth  |
| 10. Testing      | 8      | 10            | Weeks 11-12  | QA               |
| **Total**        | **75** | **95-105**    | **12 weeks** | **3-4 devs**     |

---

## Critical Path Timeline

```
Week 1:  Epic 1 (Infrastructure Setup)
         ↓
Week 2-3: Epic 2 (Database Schema)
         ↓
Week 3-4: Epic 3 (Auth) ───┬──→ Epic 4 (APIs)
         ↓                 │       ↓
         └─────────────────┴──→ Epic 5 (Games)
                                 ↓
                            Epic 6 (Frontend UI)
                                 ├──→ Epic 7 (Notifications)
                                 ├──→ Epic 8 (Matching)
                                 ├──→ Epic 9 (Ads)
                                 ↓
                            Epic 10 (Testing)
                                 ↓
                            Public Launch (Week 12)
```

**Critical Path Length:** 12 weeks (sequential dependencies)
**Parallel Work:** Epics 5, 7, 8, 9 can overlap with Epic 6
**Estimated Completion:** 12 weeks with 3-4 developers

---

## Task Sequencing: Top 5 Priority Tasks to Start With

### 1. **Task 1.1: Initialize Monorepo Structure** (Day 1-2)

- **Why First:** Unblocks all subsequent work
- **Owner:** DevOps Lead
- **Deliverable:** Working Next.js project with dev server running
- **Success:** `npm run dev` launches without errors

### 2. **Task 1.2: Configure Supabase Project** (Day 3-4)

- **Why Critical:** Database is foundation for everything
- **Owner:** DevOps/Backend Lead
- **Deliverable:** Supabase project created, local dev environment working
- **Success:** `npx supabase start` runs, Studio accessible

### 3. **Task 2.1: Create Core Tables Schema** (Day 5)

- **Why Essential:** Data model unblocks API development
- **Owner:** Database Architect
- **Deliverable:** profiles, kids, toys tables created
- **Success:** Tables visible in Supabase, migrations run cleanly

### 4. **Task 2.9: Set Up RLS Policies** (Day 6-9)

- **Why Critical:** Security enforcement cannot be afterthought
- **Owner:** Security/Backend Lead
- **Deliverable:** RLS policies enforced on all tables
- **Success:** User A cannot see User B's data; admins can see all

### 5. **Task 3.1: Implement Email/Password Authentication** (Day 10-11)

- **Why Unblocks:** Auth required for all protected features
- **Owner:** Backend Lead
- **Deliverable:** Sign-up, login, logout, token refresh working
- **Success:** User can register and login; JWT tokens valid

---

## First Sprint (2 weeks, Week 1-2)

**Sprint Goal:** Infrastructure and database foundations ready

### Tasks to Complete:

1. Task 1.1 (Monorepo)
2. Task 1.2 (Supabase)
3. Task 1.3 (Firebase)
4. Task 1.4 (CI/CD)
5. Task 1.5 (Vercel)
6. Task 2.1 (Core tables)
7. Task 2.2 (Tickets)
8. Task 2.3 (Toys)
9. Task 2.4 (Exchanges)
10. Task 2.5 (Messaging)

**Total Effort:** ~20 developer-days
**Team:** 3 engineers (1 DevOps/Infra, 2 Backend/Database)
**Success Metrics:**

- Dev environment fully functional
- CI/CD pipeline passing
- All core tables created
- Migrations run cleanly
- Ready to start API implementation

---

## Effort Breakdown by Discipline

### Backend/API Development: ~35 days

- Authentication (Task 3.1, 3.9)
- Core APIs (Epic 4: 10 tasks)
- Matching algorithm (Epic 8.1-8.3)
- Notifications (Epic 7: 7 tasks)
- Database design (Epic 2: 10 tasks)

### Frontend Development: ~35 days

- UI pages (Epic 6: 12 tasks)
- Game implementation (Epic 5: 6 tasks)
- Ad integration (Epic 9: 5 tasks)
- Auth UI (Task 3.2)

### DevOps/Infrastructure: ~10 days

- Project setup (Epic 1: 6 tasks)
- CI/CD & deployment (Task 1.4, 1.5)
- Monitoring & performance (Epic 10.6)

### QA/Testing: ~15 days

- Unit tests (2 days)
- Integration tests (2 days)
- E2E tests (2 days)
- Security audit (1 day)
- Accessibility audit (1 day)
- Beta testing (2 days)

### Data/Analytics: ~6 days

- Matching algorithm (Epic 8: 5 tasks)
- Analytics setup (Epic 9.4-9.5)

**Total: ~95-105 developer-days**

---

## Resource Allocation by Phase

### Optimal Team: 4 Engineers

**Phase 1 (Weeks 1-4):**

- 1 DevOps/Infra lead
- 2 Backend engineers
- 1 Frontend engineer
- **Activity:** Setup, database, auth

**Phase 2 (Weeks 5-8):**

- 1 Backend lead
- 1 Frontend lead
- 1 Game developer
- 1 QA engineer
- **Activity:** APIs, games, core UI

**Phase 3 (Weeks 9-12):**

- 1 Data engineer (matching)
- 1 Backend engineer (notifications)
- 1 Frontend engineer (UI polish, ads)
- 2 QA engineers (testing, security)
- **Activity:** Advanced features, testing, launch

---

## Success Criteria Summary

### Functional Completeness

- [ ] All 10 epics completed
- [ ] 75/75 tasks completed
- [ ] All user stories from PRD implemented

### Non-Functional Requirements

- [ ] Page load <2s (first paint)
- [ ] API response <200ms (p95)
- [ ] 99.5% uptime
- [ ] Mobile responsive (320px+)
- [ ] WCAG AA accessibility
- [ ] 80%+ test coverage

### Business Metrics

- [ ] 100+ beta users enrolled
- [ ] 90%+ consent completion rate
- [ ] Ad network live (AdMob + AdSense)
- [ ] EUR 200-500/month initial ad revenue

### GDPR Compliance

- [ ] Explicit consent collected for 100% of accounts
- [ ] DSAR response within 10 working days
- [ ] Data deletion within 30 days of request
- [ ] Privacy policy available in 3 languages
- [ ] No data breaches or security incidents
- [ ] RLS policies enforced at database level

---

## Risk Mitigation Strategies

### Top Risks & Mitigations

1. **RLS Policy Errors (Data Leakage)**
   - Mitigation: Dedicated security review, thorough testing, staged rollout
   - Owner: Backend/Security Lead
   - Timeline: +1 week for testing

2. **Matching Algorithm Performance**
   - Mitigation: Query optimization, database indexing, test at scale
   - Owner: Data Engineer
   - Timeline: +1 day for optimization

3. **GDPR Compliance Gaps**
   - Mitigation: Legal review (Phase 2), comprehensive testing, audit trail
   - Owner: Product Owner + Legal
   - Timeline: Ongoing, +1 day for review

4. **Team Context Loss**
   - Mitigation: Comprehensive documentation, code comments, daily standups
   - Owner: All
   - Timeline: Built into sprint

---

## File Organization

All tasks are documented in the following structure:

```
/docs/tasks/
├── 00-PROJECT-SETUP/
│   └── task.md (Epic 1: 6 tasks)
├── 01-DATABASE-SCHEMA/
│   └── task.md (Epic 2: 10 tasks)
├── 02-AUTHENTICATION-GDPR/
│   └── task.md (Epic 3: 9 tasks)
├── 03-CORE-APIs/
│   └── task.md (Epic 4: 10 tasks)
├── 04-GAMES-REWARDS/
│   └── task.md (Epic 5: 6 tasks)
├── 05-FRONTEND-UI/
│   └── task.md (Epic 6: 12 tasks)
├── 06-NOTIFICATIONS/
│   └── task.md (Epic 7: 7 tasks)
├── 07-MATCHING-ENGINE/
│   └── task.md (Epic 8: 5 tasks)
├── 08-ADS-ANALYTICS/
│   └── task.md (Epic 9: 5 tasks)
├── 09-TESTING-QA/
│   └── task.md (Epic 10: 8 tasks)
├── SPRINT-PROGRESS.md (This file - ongoing status tracker)
└── TASK-BREAKDOWN-SUMMARY.md (This file - executive summary)
```

Each task.md file contains:

- Detailed description of all tasks in that epic
- Acceptance criteria for each task
- Dependencies and blocking relationships
- Implementation notes and best practices
- Testing strategies
- Estimated effort (1-2 days per task)

---

## Next Steps

1. **Review & Approve:** Share this breakdown with team leads and product owner
2. **Resource Planning:** Confirm team composition and timeline
3. **Kick-off Meeting:** Align on definitions, conventions, deployment strategy
4. **Sprint Planning:** Create detailed sprint 1 plan (first 2 weeks)
5. **Begin Work:** Start Epic 1 (Project Setup) on Week 1

---

## Questions & Support

- **Epic Questions:** Refer to specific epic task.md files
- **Technical Details:** Consult CLAUDE.md for architecture guidance
- **PRD Questions:** Reference original PRD.md for full requirements
- **Blocking Issues:** Escalate to product owner immediately
- **Task Refinement:** Decompose further if tasks feel >2 days

---

**Prepared by:** Claude Code (AI Product Manager)
**Date:** November 13, 2025
**Status:** Ready for team review and approval
**Version:** 1.0 (MVP Phase)
