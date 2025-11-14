# Documentation Index

Complete guide to all documentation related to testing and CI/CD in the Toy-for-Toy project.

## Quick Navigation

### For Developers

**Just want to run tests?**

- Read: [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md) (5 minutes)
- Common commands and troubleshooting

**Getting started with testing?**

- Read: [TESTING.md](./TESTING.md) (30 minutes)
- Complete testing guide with examples

### For DevOps/CI Engineers

**Understanding the CI/CD setup?**

- Read: [CI-CD.md](./CI-CD.md) (30 minutes)
- Workflow details, environment configuration, security

**Visual overview?**

- Read: [CI-ARCHITECTURE.md](./CI-ARCHITECTURE.md) (15 minutes)
- Diagrams, decision trees, performance timelines

### For Project Managers

**Implementation overview?**

- Read: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) (20 minutes)
- Problem, solution, benefits, verification

**Project context?**

- Read: [CLAUDE.md](../CLAUDE.md) (15 minutes)
- Project overview and technology stack

## Documentation Map

```
docs/
├── INDEX.md (this file)
│   └─ Navigation guide for all documentation
│
├── QUICK-TEST-REFERENCE.md
│   └─ Fast reference for test commands (5 min read)
│   └─ For: All developers
│   └─ Contains: Commands, troubleshooting, checklist
│
├── TESTING.md
│   └─ Comprehensive testing guide (30 min read)
│   └─ For: All developers, QA engineers
│   └─ Contains: Test structure, local dev, CI behavior, writing tests
│
├── CI-CD.md
│   └─ GitHub Actions and CI/CD documentation (30 min read)
│   └─ For: DevOps, CI engineers, architects
│   └─ Contains: Workflows, strategy, deployment, security
│
├── CI-ARCHITECTURE.md
│   └─ Visual architecture and diagrams (15 min read)
│   └─ For: Technical leads, architects
│   └─ Contains: System diagrams, decision trees, performance
│
└── sketches/ (existing)
    └─ UI/UX wireframes and design documents

../IMPLEMENTATION_SUMMARY.md
├─ Complete implementation overview (20 min read)
├─ For: Project managers, technical leads
├─ Contains: Problem, solution, files, verification, future work
└─ Links to: All related documentation

../CLAUDE.md (existing)
├─ Project overview and guidelines
├─ For: All team members
├─ Contains: Technology stack, development workflow, quick troubleshooting
└─ Links to: All documentation

../package.json (modified)
├─ Test scripts: test, test:ci, test:database, test:unit
└─ For: Developers running tests locally

../.github/workflows/
├─ ci.yml (modified)
│   └─ Main CI workflow with unit test execution
├─ deploy.yml (unchanged)
│   └─ Vercel deployment workflow
└─ test-with-supabase.yml (new, disabled)
    └─ Optional template for future Supabase CI testing
```

## Reading Recommendations by Role

### Frontend Developer

1. Start: [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md)
2. Deep dive: [TESTING.md](./TESTING.md) - sections on "Unit Tests" and "Writing Tests"
3. Reference: [CLAUDE.md](../CLAUDE.md) - project overview

### Backend/Database Developer

1. Start: [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md)
2. Deep dive: [TESTING.md](./TESTING.md) - sections on "Database Testing" and "RLS Testing"
3. Reference: [CI-CD.md](./CI-CD.md) - environment variables section

### DevOps Engineer

1. Start: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)
2. Deep dive: [CI-CD.md](./CI-CD.md)
3. Reference: [CI-ARCHITECTURE.md](./CI-ARCHITECTURE.md)
4. Technical details: [jest.config.js](../jest.config.js), [.github/workflows/ci.yml](../.github/workflows/ci.yml)

### QA Engineer

1. Start: [TESTING.md](./TESTING.md)
2. Reference: [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md)
3. Understanding CI: [CI-CD.md](./CI-CD.md) - sections on "Test Strategy" and "Performance"

### Technical Lead

1. Overview: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)
2. Architecture: [CI-ARCHITECTURE.md](./CI-ARCHITECTURE.md)
3. Complete guide: [CI-CD.md](./CI-CD.md)
4. Project context: [CLAUDE.md](../CLAUDE.md)

### Project Manager

1. Overview: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)
2. Benefits section: [CI-CD.md](./CI-CD.md) - "Performance Targets"
3. References: [CLAUDE.md](../CLAUDE.md) - "Quick Troubleshooting"

## Key Concepts

### Test Filtering System

The project uses intelligent test filtering to:

- Run only unit tests in CI (fast, reliable)
- Run all tests locally (comprehensive coverage)
- Skip database tests when not needed (flexibility)

**How it works:**

```
GitHub Actions sets CI=true
    ↓
jest.config.js detects isCI
    ↓
Conditionally excludes /tests/database/
    ↓
Tests run accordingly
```

See: [CI-ARCHITECTURE.md](./CI-ARCHITECTURE.md#environment-variable-decision-tree)

### Test Categories

| Category      | Environment | Command                 | Requires Supabase |
| ------------- | ----------- | ----------------------- | ----------------- |
| All tests     | Local       | `npm test`              | Yes               |
| Unit only     | Local or CI | `npm run test:unit`     | No                |
| Database only | Local       | `npm run test:database` | Yes               |
| CI mode       | CI          | `npm run test:ci`       | No                |

See: [TESTING.md](./TESTING.md#test-commands-reference)

### Files Modified vs Created

**Modified (3 files):**

- `.github/workflows/ci.yml` - CI workflow updated
- `jest.config.js` - CI detection added
- `package.json` - Test scripts added

**Created (6 files):**

- `docs/TESTING.md` - Testing guide
- `docs/CI-CD.md` - CI/CD documentation
- `docs/QUICK-TEST-REFERENCE.md` - Quick reference
- `docs/CI-ARCHITECTURE.md` - Architecture diagrams
- `.github/workflows/test-with-supabase.yml` - Optional template
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview

See: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md#files-modified)

## Common Scenarios

### I need to run tests

See: [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md)

### My tests are failing

See: [TESTING.md](./TESTING.md#troubleshooting) or [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md#troubleshooting)

### I want to understand the CI workflow

See: [CI-CD.md](./CI-CD.md#ci-pipeline-details)

### Database tests won't run

See: [TESTING.md](./TESTING.md#database-testing-local-only)

### I want to debug a failing test

See: [TESTING.md](./TESTING.md#debugging-failed-tests)

### I need to configure environment variables

See: [CI-CD.md](./CI-CD.md#environment-variables)

### I want to add a new test

See: [TESTING.md](./TESTING.md#writing-tests)

### I need to set up branch protection

See: [CI-CD.md](./CI-CD.md#branch-protection-rules)

## Updates and Maintenance

Documentation is maintained alongside code changes:

1. **When modifying CI workflow**: Update [CI-CD.md](./CI-CD.md) and [CI-ARCHITECTURE.md](./CI-ARCHITECTURE.md)
2. **When adding test categories**: Update [TESTING.md](./TESTING.md) and [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md)
3. **When changing test scripts**: Update [package.json](../package.json) and document in [TESTING.md](./TESTING.md)
4. **When changing Jest config**: Update [jest.config.js](../jest.config.js) and explain in [TESTING.md](./TESTING.md)

## FAQ

### Q: Why are database tests skipped in CI?

A: Database tests require a local Supabase instance on localhost:54321. GitHub Actions runners don't have this, so tests are skipped to keep CI fast (2-3 minutes) and reliable.

See: [TESTING.md](./TESTING.md#why-database-tests-are-skipped-in-ci)

### Q: How do I run database tests locally?

A: First start Supabase (`npx supabase start`), then run `npm run test:database` or `npm test`.

See: [QUICK-TEST-REFERENCE.md](./QUICK-TEST-REFERENCE.md#database-tests-only-requires-supabase)

### Q: Can I enable database tests in CI?

A: Yes, there's a template workflow in `.github/workflows/test-with-supabase.yml` that you can enable when ready.

See: [CI-CD.md](./CI-CD.md#future-enhancements)

### Q: What environment variables do I need?

A: For local development, use `.env.local`. For CI, configure secrets in GitHub.

See: [CI-CD.md](./CI-CD.md#environment-variables)

### Q: How do I debug CI failures?

A: Run `npm run test:ci` locally to simulate CI, then check GitHub Actions logs.

See: [CI-CD.md](./CI-CD.md#troubleshooting-failed-ci)

## Support

For questions about:

- **Testing**: See [TESTING.md](./TESTING.md) or ask in #testing Slack channel
- **CI/CD**: See [CI-CD.md](./CI-CD.md) or ask in #devops Slack channel
- **Specific issues**: Check GitHub Issues or create a new one
- **General questions**: See [CLAUDE.md](../CLAUDE.md) or team documentation

## Version History

- **v1.0.0** (Current)
  - Initial GitHub Actions CI/CD configuration
  - Database test filtering system implemented
  - Comprehensive documentation created
  - 4600+ lines of documentation
  - Zero breaking changes

See: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) for full details

---

Last Updated: 2024-11-14
Maintained by: GitHub Expert Agent
Questions? See the relevant documentation file or contact the DevOps team.
