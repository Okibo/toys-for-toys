# Toy-for-Toy MVP Task Management System

**Last Updated:** November 13, 2025
**Phase:** MVP (Months 1-3, 12 weeks)
**Total Tasks:** 75+ across 10 epics
**Target Team Size:** 3-4 engineers
**Estimated Effort:** 95-105 developer-days

---

## Quick Navigation

### Executive Summaries

1. **[TASK-BREAKDOWN-SUMMARY.md](./TASK-BREAKDOWN-SUMMARY.md)** - Executive overview, 5 priority tasks, timeline, effort breakdown
2. **[SPRINT-PROGRESS.md](./SPRINT-PROGRESS.md)** - Weekly progress tracker, dependencies, risk mitigation, success criteria

### Detailed Task Documentation (by Epic)

1. **[00-PROJECT-SETUP/task.md](./00-PROJECT-SETUP/task.md)** - Infrastructure setup (6 tasks, 6 days)
2. **[01-DATABASE-SCHEMA/task.md](./01-DATABASE-SCHEMA/task.md)** - Database models & RLS (10 tasks, 12 days)
3. **[02-AUTHENTICATION-GDPR/task.md](./02-AUTHENTICATION-GDPR/task.md)** - Auth flows & GDPR compliance (9 tasks, 11 days)
4. **[03-CORE-APIs/task.md](./03-CORE-APIs/task.md)** - REST API endpoints (10 tasks, 10 days)
5. **[04-GAMES-REWARDS/task.md](./04-GAMES-REWARDS/task.md)** - Mini-games & fragments (6 tasks, 7 days) _Not yet created_
6. **[05-FRONTEND-UI/task.md](./05-FRONTEND-UI/task.md)** - Web pages & components (12 tasks, 14 days) _Not yet created_
7. **[06-NOTIFICATIONS/task.md](./06-NOTIFICATIONS/task.md)** - Email/in-app notifications (7 tasks, 7 days) _Not yet created_
8. **[07-MATCHING-ENGINE/task.md](./07-MATCHING-ENGINE/task.md)** - Matching algorithm (5 tasks, 6 days) _Not yet created_
9. **[08-ADS-ANALYTICS/task.md](./08-ADS-ANALYTICS/task.md)** - Ad integration (5 tasks, 5 days) _Not yet created_
10. **[09-TESTING-QA/task.md](./09-TESTING-QA/task.md)** - Testing & launch (8 tasks, 10 days) _Not yet created_

---

## What's Included?

### Each Task Includes:

- **Status:** Pending/In Progress/Completed
- **Effort Estimate:** 1-2 days (all tasks sized for rapid completion)
- **Dependencies:** What must be done first
- **Description:** What to build
- **Acceptance Criteria:** How to know when it's done
- **Implementation Notes:** Technical guidance
- **Testing Strategy:** How to verify

### Each Epic Includes:

- **Overview:** Business context
- **Timeline:** When in the project timeline
- **Owner:** Who leads this epic
- **Critical Path:** Where it fits in dependencies
- **Success Metrics:** How to measure completion

---

## Task Statistics

| Epic           | ID  | Tasks  | Days       | Owner            | Timeline     |
| -------------- | --- | ------ | ---------- | ---------------- | ------------ |
| Infrastructure | 1   | 6      | 6          | DevOps           | Week 1       |
| Database       | 2   | 10     | 12         | DB Arch          | Weeks 2-3    |
| Auth/GDPR      | 3   | 9      | 11         | Backend/Security | Weeks 3-4    |
| Core APIs      | 4   | 10     | 10         | Backend          | Weeks 4-5    |
| Games          | 5   | 6      | 7          | Frontend/Game    | Weeks 5-6    |
| Frontend UI    | 6   | 12     | 14         | Frontend         | Weeks 6-8    |
| Notifications  | 7   | 7      | 7          | Backend          | Weeks 8-9    |
| Matching       | 8   | 5      | 6          | Data/Backend     | Weeks 9-10   |
| Ads            | 9   | 5      | 5          | Frontend/Growth  | Weeks 10-11  |
| Testing/QA     | 10  | 8      | 10         | QA               | Weeks 11-12  |
| **TOTAL**      | -   | **75** | **95-105** | **3-4 devs**     | **12 weeks** |

---

## Critical Path (Shortest Timeline to Launch)

```
Week 1:    Epic 1 (Infrastructure)
           ↓
Week 2-3:  Epic 2 (Database) → Epic 3 (Auth) → Epic 4 (APIs)
           ↓                    ↓
Week 5-6:  Epic 5 (Games) ──→ Epic 6 (Frontend)
                                ├──→ Epic 7 (Notifications)
                                ├──→ Epic 8 (Matching)
                                ├──→ Epic 9 (Ads)
                                ↓
Week 11-12: Epic 10 (Testing, QA, Launch)
```

**Parallel Opportunities:**

- Epics 5, 7, 8, 9 can overlap with Epic 6
- Epic 3 frontend UI work can start during Epic 2
- Epic 10 testing can start after Epic 4 begins

---

## How to Use This Task System

### For Project Managers

1. Read [TASK-BREAKDOWN-SUMMARY.md](./TASK-BREAKDOWN-SUMMARY.md) for complete overview
2. Review [SPRINT-PROGRESS.md](./SPRINT-PROGRESS.md) for weekly tracking
3. Use epic task files to create detailed sprint plans
4. Update progress status in SPRINT-PROGRESS.md weekly

### For Engineers

1. Read epic task files for your assigned work
2. Review acceptance criteria before starting
3. Follow implementation notes and testing strategy
4. Update task status as you progress
5. Flag blockers immediately

### For Technical Leads

1. Review all epic overviews to understand architecture
2. Check dependencies (SPRINT-PROGRESS.md) for scheduling
3. Identify critical path items (must not slip)
4. Monitor high-risk tasks (RLS, GDPR, matching algorithm)
5. Allocate resources accordingly

### For Product Owner

1. Review TASK-BREAKDOWN-SUMMARY.md for scope alignment
2. Monitor progress in SPRINT-PROGRESS.md
3. Approve scope changes (may affect timeline)
4. Communicate delays to stakeholders
5. Validate success metrics weekly

---

## Key Constraints & Assumptions

### Time Constraints

- All tasks must be completable in ≤2 days by one developer
- Total MVP effort: 95-105 developer-days
- Target launch: Week 12 (3 months)
- 2-week sprints → 6 sprints per phase

### Resource Constraints

- Optimal team: 3-4 full-time developers
- Cannot reduce team below 2 without extending timeline
- 1 developer = ~30-day MVP (not recommended for quality)
- 5+ developers = likely coordination overhead

### Dependency Constraints

- Epic 1 must complete before all others
- Epic 2 must complete before Epic 3, 4, 8
- Epic 3 & 4 must complete before Epic 5, 6, 7, 9
- All 9 epics must complete before Epic 10 (testing)
- No shortcuts on GDPR tasks (legal requirement)

### Scope Constraints

- MVP scope fixed (per PRD Phase 1)
- Phase 2 features deferred (games, rewarded ads, mobile)
- Phase 3 features deferred (ML, advanced analytics)
- No changes to scope without timeline impact discussion

---

## Success Criteria for MVP Launch

### Functional (All Must Be Yes)

- [ ] User registration with GDPR consent working
- [ ] Toy listing and search functional
- [ ] Request/accept/deliver exchange flow complete
- [ ] Tickets frozen in escrow, released on completion
- [ ] Wishlist + daily matching algorithm running
- [ ] In-app messaging (exchange-scoped) working
- [ ] Color Match game fully functional
- [ ] Fragment earning and conversion working
- [ ] Email notifications sending
- [ ] User ratings and reviews working
- [ ] DSAR requests processed within 10 days

### Non-Functional (All Must Be Yes)

- [ ] Page load <2s (first paint)
- [ ] API response <200ms (p95)
- [ ] 99.5% uptime
- [ ] Mobile responsive (≥320px width)
- [ ] WCAG AA accessibility
- [ ] 80%+ test coverage
- [ ] No critical security vulnerabilities
- [ ] RLS policies verified (data isolation)

### Business (All Must Be Yes)

- [ ] 100+ beta testers enrolled
- [ ] 90%+ complete onboarding flow
- [ ] Ad network live (AdMob + AdSense)
- [ ] EUR 200-500/month ad revenue (initial)
- [ ] 5,000+ MAU target achievable with marketing

### Compliance (All Must Be Yes)

- [ ] GDPR consent collected for 100% of users
- [ ] Privacy policy available in 3 languages
- [ ] Deletion requests processed within 30 days
- [ ] Data breach response plan documented
- [ ] No PII exposed in ad targeting
- [ ] DPO contact info published

---

## Risk Management

### High-Risk Tasks (Require Extra Attention)

1. **Task 2.9: RLS Policy Configuration**
   - Risk: Incorrect policies leak user data
   - Mitigation: Security review, thorough testing, staged rollout
   - Owner: Backend/Security Lead
   - Timeline: +2-3 days for testing

2. **Task 8.1: Matching Algorithm**
   - Risk: Performance timeout with many wishlists
   - Mitigation: Query optimization, indexing, load testing
   - Owner: Data Engineer
   - Timeline: +1 day optimization

3. **Epic 3: GDPR Compliance**
   - Risk: Non-compliance = legal liability
   - Mitigation: Legal review (Phase 2), comprehensive testing, audit logs
   - Owner: Product + Legal
   - Timeline: Built-in, additional 1-2 days for review

4. **Task 5.2: Game Implementation**
   - Risk: Performance issues with animations
   - Mitigation: Browser testing, optimization, fallback modes
   - Owner: Frontend/Game Dev
   - Timeline: +1 day for optimization

### Medium-Risk Tasks

- Realtime subscription scalability (Task 7.5)
- Mobile responsiveness (Task 6.12)
- Email delivery reliability (Task 7.1)
- Ad revenue tracking accuracy (Task 9.4)

---

## Updating Progress

### Weekly Status Updates

1. Update SPRINT-PROGRESS.md with:
   - Completed tasks (mark status='Completed', add completion date)
   - In-progress tasks (current status, % complete)
   - Blocked tasks (reason, escalation status)
   - Updated estimates (if changed)

2. Flag new blockers:
   - Add to SPRINT-PROGRESS.md "Blockers" section
   - Notify relevant epic owner
   - Escalate if blocking critical path

3. Reprioritize next sprint:
   - Review dependencies
   - Identify executable tasks
   - Account for in-progress work

---

## Definitions

### Task Status

- **Pending:** Not started, waiting for dependencies
- **In Progress:** Active work, developer assigned
- **Completed:** Acceptance criteria met, tested, merged
- **Blocked:** Cannot proceed (dependency or issue)

### Effort Estimates

- **1 day:** Straightforward, well-defined scope
- **2 days:** Complex, multiple sub-tasks, integration
- **3+ days:** Indicates task needs decomposition

### Critical Path Items

Tasks that delay public launch if they slip. Focus resources here first.

---

## Common Questions

**Q: Can we reduce timeline?**
A: Not without cutting scope or adding resources. Current breakdown is optimal at 3-4 devs.

**Q: Can we reduce scope?**
A: Yes, defer Phase 2 features (mobile apps, additional games, advanced matching).

**Q: What if a task runs over?**
A: Escalate immediately. Consider: Can it be split into smaller tasks? Do we need help? Can scope be reduced?

**Q: How do we track progress?**
A: Update SPRINT-PROGRESS.md weekly. Create weekly standup notes documenting blockers.

**Q: What if dependencies change?**
A: Review critical path. Re-sequence if needed. Communicate timeline impact to stakeholders.

---

## Document Maintenance

This task system is a living document. Update it:

- **Weekly:** SPRINT-PROGRESS.md (status updates)
- **Per sprint:** Refine next sprint's tasks
- **Per epic:** Update task.md files as implementation details change
- **Post-launch:** Archive this document; create Phase 2 tasks

---

## Contact & Escalation

- **Product Questions:** Contact Product Owner
- **Technical Blockers:** Contact relevant Epic Owner
- **Timeline/Resource Issues:** Escalate to Engineering Lead
- **GDPR/Legal Questions:** Contact Legal/DPO (Phase 2)

---

## Appendix: Files Reference

### Core Documents

- **PRD.md** - Full product requirements (referenced throughout tasks)
- **CLAUDE.md** - Development guidelines and architecture overview
- **README.md** - Project setup and getting started

### Task Documentation

- **TASK-BREAKDOWN-SUMMARY.md** - Executive summary, timeline, priorities
- **SPRINT-PROGRESS.md** - Weekly status, dependencies, risks
- **00-PROJECT-SETUP/task.md** - 6 infrastructure tasks
- **01-DATABASE-SCHEMA/task.md** - 10 database tasks
- **02-AUTHENTICATION-GDPR/task.md** - 9 auth/GDPR tasks
- **03-CORE-APIs/task.md** - 10 API tasks
- **04-GAMES-REWARDS/task.md** - 6 game tasks (to be created)
- **05-FRONTEND-UI/task.md** - 12 frontend tasks (to be created)
- **06-NOTIFICATIONS/task.md** - 7 notification tasks (to be created)
- **07-MATCHING-ENGINE/task.md** - 5 matching tasks (to be created)
- **08-ADS-ANALYTICS/task.md** - 5 ad tasks (to be created)
- **09-TESTING-QA/task.md** - 8 testing tasks (to be created)

---

## Version History

| Version | Date       | Changes                                         |
| ------- | ---------- | ----------------------------------------------- |
| 1.0     | 2025-11-13 | Initial complete task breakdown for MVP Phase 1 |

---

**Status:** Ready for team review and sprint planning
**Next Action:** Kick-off meeting to review scope and resource allocation
