# PRD Quick Reference Guide

## Document Navigation

This guide helps you quickly locate specific information in the comprehensive PRD.

**Main Document:** `PRD.md` (2,346 lines)
**Summary:** `PRD_SUMMARY.md` (quick overview)
**This File:** Quick reference for navigation

---

## By Role

### Product Manager
- **Business Goals** → Section 1.3
- **User Personas** → Section 2
- **Success Metrics/KPIs** → Section 11
- **Revenue Projections** → Section 9.2
- **Development Timeline** → Section 13
- **Risk Assessment** → Section 12

### Software Architect
- **System Overview** → Section 6.1 (diagram)
- **Data Models** → Section 6.2
- **Database Views** → Section 6.3
- **API Endpoints** → Section 6.4
- **Real-time Architecture** → Section 6.5
- **Scalability Strategy** → Section 5.2

### Backend Developer
- **Database Schema** → Section 6.2 (full tables)
- **API Endpoints** → Section 6.4 (30+ endpoints)
- **Data Models** → Section 6.2
- **RLS Policies** → Section 6.2 (example) & Section 4
- **Edge Functions** → Section 6.5-6.6
- **Data Retention** → Section 8.5

### Frontend Developer
- **User Stories** → Section 3 (13 stories)
- **Functional Requirements** → Section 4
- **UI/Components Needs** → Section 3 + 4
- **i18n Setup** → Section 4.13 + Section 13.2 (Week 7)
- **Performance Targets** → Section 5.1
- **Accessibility Requirements** → Section 5.7

### Mobile Developer
- **Capacitor Setup** → CLAUDE.md (reference)
- **API Endpoints** → Section 6.4
- **Real-time Subscriptions** → Section 6.5
- **Push Notifications** → Section 6.6 (Firebase FCM)
- **Local Development** → Section 7
- **Testing Strategy** → Section 5.3 (mobile specific)

### QA/Testing
- **Test Cases** → Section 3 (acceptance criteria in each story)
- **Functional Requirements** → Section 4 (FR-*)
- **Performance Targets** → Section 5.1
- **Security Testing** → Section 5.4
- **i18n Testing** → Section 4.13 + Section 5.6
- **Roadmap/Timeline** → Section 13.2 (with test counts)

### DevOps/Infrastructure
- **Docker Setup** → Section 7.2 (docker-compose.yml)
- **Local Development** → Section 7.3-7.6
- **Deployment** → Section 13.2 (Phase 2, Weeks 9-10)
- **Scalability** → Section 5.2
- **Availability & Disaster Recovery** → Section 5.3
- **Security Requirements** → Section 5.4

### Security/Compliance Officer
- **GDPR Compliance Plan** → Section 8 (comprehensive)
- **Consent Management** → Section 8.3
- **Data Subject Rights** → Section 8.4
- **Data Processing Agreements** → Section 8.6
- **Privacy by Design** → Section 8.7
- **Security Requirements** → Section 5.4
- **Risk Assessment** → Section 12

---

## By Feature

### Authentication
- **User Stories** → Story 1 (Section 3)
- **Functional Req** → FR-AUTH-001 to FR-AUTH-004 (Section 4.1)
- **API Endpoints** → POST /api/auth/* (Section 6.4)
- **Roadmap** → Weeks 1-2 (Section 13.2)

### Toy Listings & Search
- **User Stories** → Story 2, 3 (Section 3)
- **Functional Req** → FR-TOY-001 to FR-TOY-004, FR-SEARCH-001 to 003 (Section 4.3-4.4)
- **Data Model** → toys table (Section 6.2)
- **API Endpoints** → GET/POST /api/toys (Section 6.4)
- **Roadmap** → Weeks 2-3 (Section 13.2)

### Ticket Economy
- **User Stories** → Story 2, 5, 7, 10 (Section 3)
- **Functional Req** → FR-TICKET-001 to 004 (Section 4.2)
- **Data Model** → tickets, ticket_transactions (Section 6.2)
- **Business Logic** → Section 4.2, CLAUDE.md
- **Roadmap** → Weeks 1-4 (Section 13.2)

### Exchanges
- **User Stories** → Stories 5, 6, 7, 8 (Section 3)
- **Functional Req** → FR-EXCH-001 to 005, FR-DISP-001 to 003 (Section 4.6-4.7)
- **Data Model** → exchanges, disputes (Section 6.2)
- **Exchange States** → FR-EXCH-001 (state diagram)
- **API Endpoints** → POST/PUT /api/exchanges (Section 6.4)
- **Roadmap** → Weeks 3-4, Phase 2 Weeks 12-13 (Section 13.2)

### Mini-Games
- **User Stories** → Story 10 (Section 3)
- **Functional Req** → FR-GAME-001 to 004 (Section 4.9)
- **Games** → Shape Sorter, Memory Match, Color Clicker
- **Data Model** → game_sessions (Section 6.2)
- **API Endpoints** → POST /api/games/* (Section 6.4)
- **Monetization** → Rewarded video ads (Section 9.1)
- **Roadmap** → Week 5 (Section 13.2)

### Wishlists & Matching
- **User Stories** → Story 4 (Section 3)
- **Functional Req** → FR-WISH-001 to 003 (Section 4.5)
- **Data Model** → wishlists, wishlist_items (Section 6.2)
- **Matching Algorithm** → FR-WISH-002 (scoring logic)
- **API Endpoints** → POST /api/wishlists (Section 6.4)
- **Roadmap** → Phase 2 Week 14 (Section 13.2)

### Ratings & Reviews
- **User Stories** → Story 9 (Section 3)
- **Functional Req** → FR-RATE-001 to 003 (Section 4.8)
- **Data Model** → ratings table (Section 6.2)
- **API Endpoints** → POST /api/ratings (Section 6.4)
- **Roadmap** → Phase 2 Week 12 (Section 13.2)

### Notifications
- **User Stories** → Story 11 (Section 3)
- **Functional Req** → FR-NOTIF-001 to 003 (Section 4.10)
- **Types** → In-app (Realtime), Push (FCM), Email (SendGrid)
- **Data Model** → notification_preferences (Section 6.2)
- **API Endpoints** → GET /api/notifications (Section 6.4)
- **Real-time** → Section 6.5
- **Roadmap** → Week 6, Phase 2 Weeks 10-11 (Section 13.2)

### GDPR & Data Access
- **User Stories** → Story 12 (Section 3)
- **Functional Req** → FR-AUTH-002 (Section 4.1)
- **GDPR Plan** → Section 8 (comprehensive)
- **API Endpoints** → POST /api/profile/export-data, delete-request (Section 6.4)
- **Consent Forms** → Section 8.3 (example)
- **Roadmap** → Week 7, Phase 2 compliance audit (Section 13.2)

### Internationalization (i18n)
- **User Stories** → Story 13 (Section 3)
- **Functional Req** → FR-I18N-001 to 003 (Section 4.13)
- **Non-Functional** → Section 5.6
- **Languages** → Polish (primary), German, English
- **Roadmap** → Week 7 (Section 13.2)

### Analytics & Monetization
- **Functional Req** → FR-ANALYTICS-001 to 004, FR-INSIGHTS-001 to 002 (Section 4.11-4.12)
- **Data Collection** → Section 4.11.1 (behavioral only)
- **Monetization Strategy** → Section 9 (complete)
- **Revenue Model** → Section 9.1 (3 streams: display ads, rewarded ads, data licensing)
- **Privacy** → Section 4.11-4.12 (GDPR-compliant)
- **Roadmap** → Week 7, Phase 2 Week 15 (Section 13.2)

---

## By Technical Topic

### Database Design
- **Core Tables** → Section 6.2 (15+ tables listed)
- **Table Relationships** → Section 6.2 (FK references)
- **Indexes** → Section 6.3 (example SQL)
- **Views** → Section 6.3 (4 optimized views)
- **RLS Policies** → Section 6.2 (example policy)
- **Migration Timeline** → Section 13.2 (Weeks 1-8)

### API Design
- **Endpoints** → Section 6.4 (30+ routes)
- **Authentication** → POST /api/auth/* (Section 6.4)
- **Rate Limiting** → Mentioned in FR-AUTH (implementation detail)
- **Error Handling** → Each endpoint (implied by acceptance criteria)

### Real-time Features
- **Subscriptions** → Section 6.5 (Supabase Realtime code examples)
- **WebSocket** → Section 6.5 (Supabase manages)
- **Fallback** → Polling every 30s if unavailable (Section 5.3)

### Push Notifications
- **Firebase FCM** → Section 6.6 (Edge Function examples)
- **Integration** → Phase 2 Weeks 9-10 (Section 13.2)
- **Local Dev** → Console logging (Section 7.4)
- **Privacy** → Quiet hours respected (FR-NOTIF-002)

### Image Handling
- **Upload** → FR-TOY-002, FR-TOY-003 (validation, optimization)
- **Storage** → Supabase Storage with RLS (Section 6.2)
- **Optimization** → 800x800px resize, WebP format (Section 5.1)
- **Path Structure** → /toys/{user_id}/{toy_id}/ (Section 4.3)

### Security
- **Authentication** → Section 5.4 (JWT, token validation)
- **RLS Policies** → Section 6.2 (database-layer security)
- **Input Validation** → Section 5.4 (client + server)
- **SQL Injection** → Parameterized queries via PostgREST (Section 5.4)
- **Audit Logging** → Section 5.4, Section 8.7 (immutable logs)

### Performance
- **Targets** → Section 5.1 (page load <2s, search <500ms)
- **Optimization** → Code splitting, image lazy-load, caching (Section 5.1)
- **Database** → Indexes, RLS overhead <10ms (Section 5.2)
- **Scalability** → 10,000 concurrent users (Section 5.2)

---

## By Development Phase

### Phase 1: Local Development (Weeks 1-8)
- **Goals** → Section 10.1 (MVP deliverables)
- **Week 1-2** → Auth (Section 13.2)
- **Week 2-3** → Toys & Search (Section 13.2)
- **Week 3-4** → Exchanges (Section 13.2)
- **Week 5** → Mini-Games (Section 13.2)
- **Week 6** → Notifications (Section 13.2)
- **Week 7** → GDPR & Analytics (Section 13.2)
- **Week 8** → Testing & Docs (Section 13.2)
- **Docker Setup** → Section 7 (complete)

### Phase 2: Production Integration (Weeks 9-16)
- **Goals** → Section 10.2 (cloud services)
- **Week 9-10** → Supabase & Firebase (Section 13.2)
- **Week 11** → Email & Notifications (Section 13.2)
- **Week 12-13** → Ratings & Disputes (Section 13.2)
- **Week 14** → Wishlist Matching (Section 13.2)
- **Week 15** → Analytics Dashboards (Section 13.2)
- **Week 16** → Security & Compliance Audit (Section 13.2)

### Post-MVP: Future Phases
- **Not in Scope** → Section 10.1, 10.2
- **Phase 3 Ideas** → Local communities, chat, subscriptions, ML matching, social

---

## Key Decision Points

### MVP Scope
- **What's Included** → Section 10.1 (comprehensive list)
- **What's Not** → Section 10.1 (chat, analytics dashboards, subscriptions)
- **Why This Scope** → Phase 1 focuses on core loop (listing, exchange, games, ads)

### Architecture Choices
- **No Monolithic Backend** → Using managed Supabase (Section 6)
- **RLS for Security** → Database-layer enforcement, not frontend (Section 5.4)
- **Supabase Realtime** → In-app notifications (Section 6.5)
- **Firebase FCM** → Background push notifications (Section 6.6)
- **Docker-First Dev** → All services run locally (Section 7)

### Monetization Strategy
- **Three Revenue Streams** → Section 9.1
- **Behavioral Targeting** → Anonymous aggregates (Section 4.12)
- **Privacy-First** → No child data collection (Section 2)
- **Conservative Revenue** → EUR 30k-50k Year 1 (Section 9.2)

### GDPR Compliance
- **Parent-Only Accounts** → No child profiles (Section 2, 8)
- **Explicit Consent** → Checkbox not pre-checked (Section 8.3)
- **Data Minimization** → Only collect what's needed (Section 4.11)
- **Right to Deletion** → 30-day grace period (Section 8.4)
- **DPAs in Place** → With all data processors (Section 8.6)

---

## Common Questions Answered

**Q: Where are user acceptance criteria?**
A: Section 3 (User Stories), each story has detailed acceptance criteria

**Q: What does the database look like?**
A: Section 6.2 (core tables) + Section 6.3 (views) + Appendix C (example SQL)

**Q: How do I set up local development?**
A: Section 7 (complete Docker setup with instructions)

**Q: What's the API specification?**
A: Section 6.4 (30+ endpoints with methods and purposes)

**Q: How is GDPR handled?**
A: Section 8 (comprehensive compliance plan, 8 subsections)

**Q: What are success metrics?**
A: Section 11 (KPIs by category: acquisition, engagement, retention, monetization, compliance)

**Q: What are the risks?**
A: Section 12 (15+ identified risks with probability, impact, mitigation)

**Q: When will features be built?**
A: Section 13 (16-week timeline with weekly milestones)

**Q: How do mini-games work?**
A: Section 4.9, Story 10, Section 13.2 (Week 5)

**Q: How is the ticket economy secured?**
A: Section 4.2 (FR-TICKET-001 to 004) with escrow mechanism

**Q: What languages are supported?**
A: Polish (primary), German, English - Section 4.13, 5.6

---

## Document Structure at a Glance

```
PRD.md (2,346 lines)
├── 1. Executive Summary (Business context)
├── 2. User Personas (Emma, 35-50 parent)
├── 3. User Stories (13 stories with acceptance criteria)
├── 4. Functional Requirements (50+ FRs organized by domain)
├── 5. Non-Functional Requirements (Performance, security, compliance)
├── 6. Technical Architecture (System design, data models, APIs)
├── 7. Local Development (Docker-first setup)
├── 8. GDPR Compliance (Data protection framework)
├── 9. Monetization Strategy (3 revenue streams)
├── 10. MVP Scope & Phasing (Phase 1 & 2 breakdown)
├── 11. Success Metrics & Analytics (KPIs across 5 dimensions)
├── 12. Risk Assessment (15+ risks with mitigation)
├── 13. Development Roadmap (16-week timeline)
├── 14. FAQ (Common questions)
├── 15. Appendices (Glossary, resources, SQL examples)
└── 16. Document Control (Version history, next review)
```

---

## Getting Help

**For specific feature details:** Search PRD.md for feature name or story number

**For role-specific guidance:** See "By Role" section above

**For technical topics:** See "By Technical Topic" section above

**For timeline:** See Section 13 (Development Roadmap)

**For GDPR questions:** See Section 8 (GDPR Compliance Plan)

**For API details:** See Section 6.4 (API Endpoints)

**For database schema:** See Section 6.2 (Data Models)

---

**Last Updated:** November 14, 2024
**Document Version:** 1.0
**PRD Location:** `/Users/pawelkalkun/Projects/private/toys-for-toys/PRD.md`
