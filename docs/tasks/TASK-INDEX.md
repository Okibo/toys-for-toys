# Toy-for-Toy Task Index

A comprehensive, searchable index of all implementation tasks organized by multiple dimensions.

---

## Quick Reference

### Total Task Count
- **Phase 1:** 36 tasks (280 hours)
- **Phase 2:** 18 tasks (180 hours)
- **Total:** 54 tasks (460 hours)

### Task Lookup Methods
1. **By Feature:** Find all tasks related to a feature
2. **By PRD Story:** Link tasks to user stories
3. **By Component:** Find UI/backend component tasks
4. **By Status:** Find tasks by development status
5. **By Dependencies:** Understand task relationships

---

## Index by Feature Area

### Authentication & User Management

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Signup | P1-W1-AUTH-001 | Email/Password Signup | 1 | 1-2 | 12-16 |
| Consent | P1-W1-AUTH-002 | Parental Consent Forms | 1 | 1-2 | 10-12 |
| Login | P1-W1-AUTH-003 | Login & Password Reset | 1 | 1-2 | 10-12 |
| Session | (Included in P1-W1-AUTH-001) | Session Management | 1 | 1-2 | - |

**Related PRD Stories:** Story 1, Story 12
**Related Functional Req:** FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004

---

### Database & Infrastructure

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Docker Setup | P1-W1-SETUP-001 | Docker Environment Setup | 1 | 1-2 | 8-12 |
| Schema | P1-W1-SETUP-002 | Core Database Schema | 1 | 1-2 | 10-14 |
| RLS Security | P1-W1-SETUP-003 | Supabase RLS Policies | 1 | 1-2 | 8-10 |

**Related PRD Stories:** All (foundational)
**Related Functional Req:** All (foundational)

---

### Toy Listings

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Create Listing | P1-W2-TOYS-001 | Toy Listing Creation | 1 | 2-3 | 14-16 |
| Search | P1-W2-TOYS-002 | Toy Search Filtering | 1 | 2-3 | 12-14 |
| Analytics | P1-W2-TOYS-003 | Behavioral Analytics Log | 1 | 2-3 | 8-10 |

**Related PRD Stories:** Story 2, Story 3
**Related Functional Req:** FR-TOY-001, FR-TOY-002, FR-TOY-003, FR-TOY-004, FR-SEARCH-001, FR-SEARCH-002, FR-SEARCH-003

---

### Ticket Economy

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Initial Allocation | (Included in Auth) | 10 Tickets on Signup | 1 | 1-2 | - |
| Ticket Operations | (Distributed) | Ticket Deduction & Freezing | 1 | Various | - |
| Balance Display | (Included in multiple) | User Balance & History | 1 | Various | - |

**Related PRD Stories:** All (cross-cutting)
**Related Functional Req:** FR-TICKET-001, FR-TICKET-002, FR-TICKET-003, FR-TICKET-004

---

### Exchange Flow

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Request | P1-W3-EXCH-001 | Exchange Request Initiation | 1 | 3-4 | 12-14 |
| Accept/Decline | P1-W3-EXCH-002 | Exchange Acceptance & Delivery | 1 | 3-4 | 12-14 |
| Completion | (Included in P1-W3-EXCH-002) | Delivery Confirmation | 1 | 3-4 | - |

**Related PRD Stories:** Story 5, Story 6, Story 7
**Related Functional Req:** FR-EXCH-001, FR-EXCH-002, FR-EXCH-003, FR-EXCH-004, FR-EXCH-005

---

### Mini-Games & Rewards

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Shape Sorter | P1-W4-GAMES-001 | Shape Sorter Game | 1 | 4-5 | 10-12 |
| Memory Match | P1-W4-GAMES-002 | Memory Match Game | 1 | 4-5 | 10-12 |
| Color Clicker | (Phase 2 backlog) | Color Clicker Game | 2+ | TBD | TBD |
| Session & Rewards | P1-W5-GAMES-003 | Game Session & Rewards | 1 | 4-5 | 8-10 |

**Related PRD Stories:** Story 10
**Related Functional Req:** FR-GAME-001, FR-GAME-002

---

### Notifications

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| In-App & Push | P1-W5-NOTIF-001 | Notification System | 1 | 5-6 | 12-14 |
| Real Firebase | P2-W9-FIREBASE-001 | Firebase Cloud Messaging | 2 | 9-10 | 10-12 |
| Email (Mock) | (Included in P1-W5-NOTIF-001) | Email Notifications | 1 | 5-6 | - |
| Email (Real) | P2-W11-EMAIL-001 | SendGrid Integration | 2 | 10-11 | 8-10 |

**Related PRD Stories:** Story 11
**Related Functional Req:** FR-NOTIF-001, FR-NOTIF-002, FR-NOTIF-003

---

### GDPR & Data Management

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Data Export | P1-W6-GDPR-001 | Data Export & GDPR Rights | 1 | 6-7 | 10-12 |
| Consent Mgmt | (Included in P1-W1-AUTH-002) | Parental Consent | 1 | 1-2 | - |
| Deletion | (Included in P1-W6-GDPR-001) | Data Deletion Workflow | 1 | 6-7 | - |

**Related PRD Stories:** Story 1, Story 12
**Related Functional Req:** FR-AUTH-002, GDPR Compliance Plan (Section 8)

---

### Internationalization

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| i18n Framework | P1-W6-I18N-001 | Internationalization (i18n) | 1 | 6-7 | 12-14 |

**Related PRD Stories:** Story 13
**Related Functional Req:** FR-I18N-001

---

### Ratings & Reviews

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Ratings UI | P2-W12-RATINGS-001 | Ratings & Reviews UI | 2 | 11-12 | 12-14 |

**Related PRD Stories:** Story 9
**Related Functional Req:** FR-RATE-001, FR-RATE-002, FR-RATE-003

---

### Disputes & Support

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Disputes | P2-W13-DISPUTES-001 | Dispute Resolution System | 2 | 12-13 | 12-14 |

**Related PRD Stories:** Story 8
**Related Functional Req:** FR-DISP-001, FR-DISP-002, FR-DISP-003

---

### Wishlists & Matching

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Wishlists | P2-W14-WISHLIST-001 | Wishlist & Smart Matching | 2 | 13-14 | 14-16 |

**Related PRD Stories:** Story 4
**Related Functional Req:** FR-WISH-001, FR-WISH-002, FR-WISH-003

---

### Monetization

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| AdMob | P2-W9-FIREBASE-002 | Google AdMob Integration | 2 | 9-10 | 12-14 |

**Related PRD Stories:** Story 10 (rewarded ads)
**Related Functional Req:** FR-GAME-003 (ad rewards), Monetization Strategy (Section 9)

---

### Testing & Quality

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Unit Tests | P1-W7-TEST-001 | Unit & Integration Tests | 1 | 7-8 | 16-20 |
| E2E Tests | P1-W7-TEST-002 | E2E Tests (Playwright) | 1 | 7-8 | 12-16 |

**Related PRD Stories:** All (cross-cutting)
**Related Functional Req:** All (cross-cutting)

---

### Analytics & Business Intelligence

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Analytics Dashboards | P2-W15-ANALYTICS-001 | Analytics & BI | 2 | 14-15 | 12-14 |

**Related PRD Stories:** Story 3 (search analytics), Story 4 (wishlist analytics)
**Related Functional Req:** FR-ANALYTICS-001, FR-INSIGHTS-001

---

### Operations & Deployment

| Feature | Task ID | Title | Phase | Week | Hours |
|---------|---------|-------|-------|------|-------|
| Vercel Deployment | P2-W10-VERCEL-001 | Vercel Deployment & CI/CD | 2 | 9-10 | 10-12 |
| Security Audit | P2-W16-SECURITY-001 | Security Audit & Hardening | 2 | 15-16 | 12-14 |
| Launch | P2-W16-LAUNCH-001 | Launch Readiness & Go-Live | 2 | 15-16 | 8-10 |
| Documentation | P1-W8-DOC-001 | Documentation & Deployment | 1 | 7-8 | 8-12 |

**Related PRD Stories:** All (cross-cutting)
**Related Functional Req:** All (cross-cutting)

---

## Index by PRD Story

### Story 1: User Registration & Onboarding
- P1-W1-SETUP-001 (Docker - foundation)
- P1-W1-SETUP-002 (Schema - foundation)
- P1-W1-SETUP-003 (RLS - foundation)
- P1-W1-AUTH-001 (Signup)
- P1-W1-AUTH-002 (Consent)
- P1-W1-AUTH-003 (Login)
- P1-W6-I18N-001 (i18n for signup)

### Story 2: List a Toy
- P1-W2-TOYS-001 (Listing creation)
- P1-W2-TOYS-003 (Analytics logging)

### Story 3: Search & Discover Toys
- P1-W2-TOYS-002 (Search filtering)
- P1-W2-TOYS-003 (Analytics logging)
- P2-W15-ANALYTICS-001 (Analytics dashboards)

### Story 4: Wishlist & Smart Matching
- P2-W14-WISHLIST-001 (Wishlist management & matching)
- P2-W15-ANALYTICS-001 (Analytics - wishlist insights)

### Story 5: Initiate Exchange Request
- P1-W3-EXCH-001 (Exchange request)

### Story 6: Accept/Decline Exchange Request
- P1-W3-EXCH-002 (Acceptance & decline)

### Story 7: Confirm Delivery & Complete Exchange
- P1-W3-EXCH-002 (Delivery confirmation)

### Story 8: Dispute Resolution
- P2-W13-DISPUTES-001 (Disputes)

### Story 9: Rate Exchange Experience
- P2-W12-RATINGS-001 (Ratings UI)

### Story 10: Mini-Game Engagement
- P1-W4-GAMES-001 (Shape Sorter)
- P1-W4-GAMES-002 (Memory Match)
- P1-W5-GAMES-003 (Game sessions & rewards)
- P2-W9-FIREBASE-002 (AdMob - rewarded ads)

### Story 11: Push Notifications & Preferences
- P1-W5-NOTIF-001 (Notification system)
- P2-W9-FIREBASE-001 (Firebase real notifications)
- P2-W11-EMAIL-001 (Email service)

### Story 12: Account Settings & Data Access
- P1-W6-GDPR-001 (Data export & deletion)
- P1-W1-AUTH-002 (Consent management)

### Story 13: Internationalization
- P1-W6-I18N-001 (i18n framework)

---

## Index by Component

### Frontend Components

| Component | Task(s) | Description |
|-----------|---------|-------------|
| Auth Pages | P1-W1-AUTH-001, 002, 003 | Signup, Login, Reset Password |
| Toy Listing Form | P1-W2-TOYS-001 | Create toy listing |
| Search Interface | P1-W2-TOYS-002 | Filter & search toys |
| Exchange Flow | P1-W3-EXCH-001, 002 | Request, accept, deliver |
| Mini-Games | P1-W4-GAMES-001, 002 | Shape Sorter, Memory Match |
| Notifications UI | P1-W5-NOTIF-001 | In-app notifications |
| Settings | P1-W6-GDPR-001, I18N-001 | GDPR, preferences, language |
| Ratings Form | P2-W12-RATINGS-001 | Rate exchanges |
| Wishlists | P2-W14-WISHLIST-001 | Create & manage wishlists |
| Dashboards | P2-W15-ANALYTICS-001 | Analytics views |

---

### Backend APIs

| API | Task(s) | Description |
|-----|---------|-------------|
| `/api/auth/*` | P1-W1-AUTH-001, 002, 003 | Authentication endpoints |
| `/api/toys/*` | P1-W2-TOYS-001, 002 | Toy listing & search |
| `/api/exchanges/*` | P1-W3-EXCH-001, 002 | Exchange operations |
| `/api/games/*` | P1-W4-GAMES-001, 002, 003 | Game endpoints |
| `/api/notifications/*` | P1-W5-NOTIF-001 | Notification preferences |
| `/api/profile/*` | P1-W6-GDPR-001 | Data export, deletion |
| `/api/ratings/*` | P2-W12-RATINGS-001 | Rating endpoints |
| `/api/disputes/*` | P2-W13-DISPUTES-001 | Dispute endpoints |
| `/api/wishlists/*` | P2-W14-WISHLIST-001 | Wishlist endpoints |

---

### Database Tables

| Table | Task(s) | Description |
|-------|---------|-------------|
| auth.users | P1-W1-SETUP-002 | Supabase auth |
| profiles | P1-W1-SETUP-002 | User profiles |
| tickets | P1-W1-SETUP-002 | Ticket balances |
| toy_listing | P1-W2-TOYS-001 | Toy listings |
| toys | P1-W1-SETUP-002 | Toy data (schema) |
| toy_images | P1-W1-SETUP-002 | Toy images |
| exchanges | P1-W1-SETUP-002 | Exchange records |
| game_sessions | P1-W4-GAMES-001, 002 | Game play tracking |
| notifications | P1-W5-NOTIF-001 | Notification records |
| consent_records | P1-W1-AUTH-002 | GDPR consent |
| ratings | P2-W12-RATINGS-001 | User ratings |
| disputes | P2-W13-DISPUTES-001 | Dispute records |
| wishlists | P2-W14-WISHLIST-001 | User wishlists |

---

## Index by Estimated Hours

### 14-16 Hours (Large Tasks)
- P1-W2-TOYS-001 - Toy Listing Creation (14-16)
- P1-W7-TEST-001 - Unit & Integration Tests (16-20)
- P2-W14-WISHLIST-001 - Wishlist & Smart Matching (14-16)

### 12-14 Hours (Medium-Large Tasks)
- P1-W1-AUTH-001 - Email/Password Signup (12-16)
- P1-W2-TOYS-002 - Toy Search Filtering (12-14)
- P1-W3-EXCH-001 - Exchange Request (12-14)
- P1-W3-EXCH-002 - Exchange Acceptance (12-14)
- P1-W5-NOTIF-001 - Notification System (12-14)
- P1-W6-I18N-001 - Internationalization (12-14)
- P1-W7-TEST-002 - E2E Tests (12-16)
- P2-W9-FIREBASE-002 - AdMob (12-14)
- P2-W12-RATINGS-001 - Ratings UI (12-14)
- P2-W13-DISPUTES-001 - Disputes (12-14)
- P2-W15-ANALYTICS-001 - Analytics (12-14)
- P2-W16-SECURITY-001 - Security Audit (12-14)

### 10-12 Hours (Medium Tasks)
- P1-W1-SETUP-001 - Docker Environment (8-12)
- P1-W1-SETUP-002 - Database Schema (10-14)
- P1-W1-AUTH-002 - Consent Forms (10-12)
- P1-W1-AUTH-003 - Login & Reset (10-12)
- P1-W4-GAMES-001 - Shape Sorter (10-12)
- P1-W4-GAMES-002 - Memory Match (10-12)
- P1-W6-GDPR-001 - GDPR Data Export (10-12)
- P2-W9-FIREBASE-001 - Firebase FCM (10-12)
- P2-W10-VERCEL-001 - Vercel Deployment (10-12)

### 8-10 Hours (Small Tasks)
- P1-W1-SETUP-003 - RLS Policies (8-10)
- P1-W2-TOYS-003 - Analytics Logging (8-10)
- P1-W5-GAMES-003 - Game Sessions (8-10)
- P1-W8-DOC-001 - Documentation (8-12)
- P2-W11-EMAIL-001 - SendGrid (8-10)
- P2-W16-LAUNCH-001 - Launch (8-10)

---

## Index by Dependency Chain

### Critical Path (Must Complete Before Others)
```
P1-W1-SETUP-001 (Docker)
  ↓
P1-W1-SETUP-002 (Schema)
  ↓
P1-W1-SETUP-003 (RLS)
  ↓
P1-W1-AUTH-001 (Signup)
  ├→ P1-W1-AUTH-002 (Consent)
  ├→ P1-W1-AUTH-003 (Login)
  └→ P1-W6-I18N-001 (i18n)
       ↓
       ├→ P1-W2-TOYS-001 (Listings)
       ├→ P1-W3-EXCH-001 (Exchanges)
       ├→ P1-W4-GAMES-001 (Games)
       └→ P1-W5-NOTIF-001 (Notifications)
```

### Parallel Tracks (Can Work Simultaneously)

**Track 1: Core Features**
- P1-W2-TOYS-001 → P1-W2-TOYS-002 → P1-W2-TOYS-003

**Track 2: Exchanges**
- P1-W3-EXCH-001 → P1-W3-EXCH-002

**Track 3: Games**
- P1-W4-GAMES-001 → P1-W4-GAMES-002 → P1-W5-GAMES-003

**Track 4: Compliance**
- P1-W1-AUTH-002 (Consent)
- P1-W6-GDPR-001 (Data Management)

**Track 5: UX**
- P1-W5-NOTIF-001 (Notifications)
- P1-W6-I18N-001 (Internationalization)

### Blocking Dependencies
- P1-W3-EXCH-001 blocks P1-W3-EXCH-002
- P1-W4-GAMES-001 blocks P1-W4-GAMES-002
- All Phase 1 tasks block Phase 2

---

## Finding Tasks

### Method 1: By Feature Name
**Want to work on:** "Exchange flow"
1. Go to "Index by Feature Area" section
2. Find "Exchange Flow" subsection
3. See related tasks and PRD requirements

### Method 2: By PRD Story
**Want to implement:** "Story 5: Initiate Exchange Request"
1. Go to "Index by PRD Story" section
2. Find "Story 5"
3. See all related tasks
4. Read task files for details

### Method 3: By Component
**Working on:** "Frontend - Toy Listing Form"
1. Go to "Index by Component" section
2. Find "Toy Listing Form"
3. See related task P1-W2-TOYS-001

### Method 4: By Time Available
**Have 16 hours:**
1. Go to "Index by Estimated Hours" section
2. Find "14-16 Hours" or split "12-14 Hours"
3. Pick task that fits timeline

### Method 5: By Technology
**Want to work on:** "Database & RLS"
1. Go to "Index by Feature Area"
2. Find "Database & Infrastructure"
3. See P1-W1-SETUP-002 and P1-W1-SETUP-003

---

## Task Relationships

### Prerequisites
Before starting ANY task:
1. Complete P1-W1-SETUP-001 (Docker)
2. Complete P1-W1-SETUP-002 (Schema)
3. Complete P1-W1-SETUP-003 (RLS)

### Foundation Tasks (Enable All Others)
- P1-W1-AUTH-001 (Signup) - needed for user existence
- P1-W1-AUTH-003 (Login) - needed for user sessions

### Dependent Tasks (Need Specific Prerequisite)
- P1-W3-EXCH-001 needs P1-W2-TOYS-001 (toys must exist)
- P1-W5-NOTIF-001 needs P1-W3-EXCH-002 (exchange events to notify on)
- P2-W12-RATINGS-001 needs P1-W3-EXCH-002 (rating comes after exchange)
- P2-W13-DISPUTES-001 needs P2-W12-RATINGS-001 (disputes filed by raters)

### Independent Tasks (Can Start Anytime After Foundation)
- P1-W2-TOYS-001 (depends only on auth)
- P1-W4-GAMES-001 (depends only on auth)
- P1-W6-GDPR-001 (depends only on auth)
- P1-W6-I18N-001 (depends only on auth)

---

## Progress & Status Legend

| Status | Meaning | Action |
|--------|---------|--------|
| Not Started | Task hasn't begun | Assign and start |
| In Progress | Task is being worked on | Monitor and help if needed |
| Completed | Task is done and merged | Move to next task |
| Blocked | Can't proceed (waiting for dependency) | Unblock and resume |

---

## How to Contribute to This Index

1. When creating new tasks, add entries to relevant sections
2. Update dependency chains as needed
3. Keep hour estimates current
4. Link to task files clearly
5. Review quarterly to catch outdated info

---

## Quick Lookup Examples

### "I want to work on the toy listing feature"
1. Go to "Index by Feature Area" → Toy Listings
2. Find P1-W2-TOYS-001
3. Navigate to `/docs/tasks/phase-1-week-2-3-toys/01-toy-listing-creation/task.md`
4. Read complete task specification

### "Story 5 implementation - where do I start?"
1. Go to "Index by PRD Story" → Story 5
2. Find task P1-W3-EXCH-001
3. Check dependencies: needs P1-W2-TOYS-001 complete
4. Start task when dependency complete

### "What needs to be done for authentication?"
1. Go to "Index by Feature Area" → Authentication
2. See 3 tasks: Signup, Consent, Login
3. Follow order: Signup → Consent → Login
4. Each task is 10-16 hours

### "What can I work on in parallel?"
1. Go to "Index by Dependency Chain" → Parallel Tracks
2. Pick any track that's unblocked
3. Assign developers to different tracks
4. Integrate when all tracks complete

---

## Document Revision History

- **2024-11-14:** Initial task index created with all Phase 1 & 2 tasks mapped
