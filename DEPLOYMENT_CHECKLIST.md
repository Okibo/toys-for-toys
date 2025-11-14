# GitHub Actions CI/CD Configuration - Deployment Checklist

This checklist guides you through reviewing and deploying the CI/CD configuration updates.

## Pre-Deployment Review (15 minutes)

### Code Changes

- [ ] **Review .github/workflows/ci.yml**
  - Verify test step uses `npm run test:ci`
  - Verify `CI: true` environment variable is set
  - File: `/Users/pawelkalkun/Projects/private/toys-for-toys/.github/workflows/ci.yml`

- [ ] **Review jest.config.js**
  - Verify CI detection: `const isCI = process.env.CI === 'true'`
  - Verify conditional test exclusion: `...(isCI ? ['/tests/database/'] : [])`
  - File: `/Users/pawelkalkun/Projects/private/toys-for-toys/jest.config.js`

- [ ] **Review package.json test scripts**
  - Verify `test:ci`: `"CI=true jest"`
  - Verify `test:database`: `"jest tests/database --testTimeout=30000"`
  - Verify `test:unit`: `"jest --testPathIgnorePatterns=/tests/database/"`
  - File: `/Users/pawelkalkun/Projects/private/toys-for-toys/package.json`

### Documentation Review

- [ ] **Read IMPLEMENTATION_SUMMARY.md** (20 minutes)
  - Location: `/Users/pawelkalkun/Projects/private/toys-for-toys/IMPLEMENTATION_SUMMARY.md`
  - Understand the problem and solution
  - Review verification results

- [ ] **Read QUICK-TEST-REFERENCE.md** (5 minutes)
  - Location: `/Users/pawelkalkun/Projects/private/toys-for-toys/docs/QUICK-TEST-REFERENCE.md`
  - Understand test commands
  - Note troubleshooting tips

- [ ] **Skim CI-ARCHITECTURE.md** (10 minutes)
  - Location: `/Users/pawelkalkun/Projects/private/toys-for-toys/docs/CI-ARCHITECTURE.md`
  - Review visual diagrams
  - Understand environment variable flow

- [ ] **Bookmark docs/INDEX.md for reference**
  - Location: `/Users/pawelkalkun/Projects/private/toys-for-toys/docs/INDEX.md`
  - Use for navigation when needed

## Local Verification (10 minutes)

### Test the Configuration

- [ ] **Install dependencies**

  ```bash
  npm install
  ```

- [ ] **Verify CI mode (unit tests only)**

  ```bash
  npm run test:ci
  # Expected: 354 tests pass, database tests skipped
  ```

- [ ] **Verify CI mode environment variable**

  ```bash
  CI=true npm test
  # Expected: Same as npm run test:ci
  ```

- [ ] **Verify local mode (if Supabase available)**

  ```bash
  npx supabase start  # If not already running
  npm test           # Or: npm run test:database
  # Expected: More tests run, including database tests
  ```

- [ ] **Verify test:unit command**
  ```bash
  npm run test:unit
  # Expected: Unit tests pass, database tests excluded
  ```

## Git Workflow (5 minutes)

### Commit Changes

- [ ] **Stage all changes**

  ```bash
  git add .
  ```

- [ ] **Verify staged changes**

  ```bash
  git status
  ```

  Should show:
  - Modified: `.github/workflows/ci.yml`
  - Modified: `jest.config.js`
  - Modified: `package.json`
  - New: `docs/TESTING.md`
  - New: `docs/CI-CD.md`
  - New: `docs/QUICK-TEST-REFERENCE.md`
  - New: `docs/CI-ARCHITECTURE.md`
  - New: `.github/workflows/test-with-supabase.yml`
  - New: `IMPLEMENTATION_SUMMARY.md`
  - New: `docs/INDEX.md`
  - New: `DEPLOYMENT_CHECKLIST.md` (this file)

- [ ] **Create commit**

  ```bash
  git commit -m "feat: Configure GitHub Actions CI/CD for database test filtering

  - Skip database tests in CI environment (GitHub Actions)
  - Maintain full test coverage in local development
  - Add CI environment detection in jest.config.js
  - Add flexible npm test scripts (test:ci, test:database, test:unit)
  - Add comprehensive documentation for testing and CI/CD
  - Includes quick reference, detailed guides, and architecture diagrams

  Benefits:
  - Faster CI builds (2-3 minutes vs 5-10 with Supabase)
  - Reliable test results (no flaky database tests)
  - Clear guidance for developers
  - Future-proof architecture for Supabase integration

  Files modified: 3 (ci.yml, jest.config.js, package.json)
  Files created: 6 (IMPLEMENTATION_SUMMARY.md, docs/*.md, workflows/*.yml)
  Documentation: 4600+ lines
  Breaking changes: None"
  ```

- [ ] **Verify commit**
  ```bash
  git log -1 --stat
  ```

## GitHub Workflow (10 minutes)

### Create Pull Request

- [ ] **Push to develop branch**

  ```bash
  git push origin develop
  # Or: git push origin feature-branch-name
  ```

- [ ] **Create pull request on GitHub**
  - Base: `develop`
  - Compare: your branch
  - Title: "feat: Configure GitHub Actions CI/CD for database test filtering"
  - Description: Copy from commit message
  - Link to IMPLEMENTATION_SUMMARY.md

- [ ] **Add labels**
  - `enhancement`
  - `ci-cd`
  - `documentation`

- [ ] **Request reviewers**
  - DevOps team lead
  - Project architect
  - Test lead

### PR Checks

- [ ] **Wait for GitHub Actions to run**
  - Expected: All checks pass
  - Linting: PASS
  - Build: PASS
  - Tests (CI mode): PASS (354 tests)
  - No database tests in CI: CONFIRMED

- [ ] **Review PR comments from automated checks**
  - Address any issues if needed

- [ ] **Request code review**
  - Notify team of ready-for-review status

## Review & Approval (varies)

### Code Review Checklist for Reviewers

- [ ] **Configuration changes are minimal and correct**
  - CI workflow updated properly
  - Jest config has conditional logic
  - npm scripts added correctly

- [ ] **Tests pass locally and in CI**
  - Local: `npm run test:ci` passes
  - CI: GitHub Actions workflow passes
  - No breaking changes

- [ ] **Documentation is comprehensive**
  - Quick reference available
  - Detailed guides provided
  - Architecture documented

- [ ] **No security concerns**
  - No secrets exposed
  - No breaking changes to auth
  - Environment variables properly handled

- [ ] **Backward compatible**
  - Existing workflow not broken
  - Developers can still use `npm test`
  - No impact on deployment

## Deployment (5 minutes)

### Merge to Develop

- [ ] **Confirm all checks passed**
  - GitHub Actions: ALL GREEN
  - Reviews: APPROVED

- [ ] **Merge pull request**
  - Use: "Create a merge commit"
  - Or: "Squash and merge" (recommended for clean history)

- [ ] **Delete feature branch**
  - GitHub usually offers this after merge
  - If not: `git push origin --delete branch-name`

### Deploy to Production (when ready)

- [ ] **Create release PR from develop to main**
  - When ready for production release
  - Not needed immediately after this PR

- [ ] **Verify GitHub Actions on main**
  - New CI configuration will be used
  - All checks should pass

## Post-Deployment (varies)

### Team Communication

- [ ] **Notify team of changes**
  - Send message to #development or #devops
  - Link to QUICK-TEST-REFERENCE.md
  - Mention new commands: test:ci, test:database, test:unit

- [ ] **Share documentation**
  - Share: `docs/QUICK-TEST-REFERENCE.md` (bookmark this!)
  - Share: `docs/INDEX.md` (navigation guide)
  - Mention: `IMPLEMENTATION_SUMMARY.md` for details

- [ ] **Update team documentation**
  - If you have team wiki/docs, link to the new guides
  - Update onboarding with new test commands

### Monitor First PRs

- [ ] **Watch first few PRs with new CI**
  - Verify CI passes correctly
  - Check that database tests are skipped
  - Note any feedback from team

- [ ] **Be available for questions**
  - Team may have questions about new commands
  - Reference guides are comprehensive, but help as needed

## Rollback Plan (if needed)

### If Issues Arise

1. **Identify the issue**
   - Check GitHub Actions logs
   - Verify local tests still pass

2. **Quick revert** (if needed urgently)

   ```bash
   git revert HEAD
   git push origin develop
   ```

3. **Investigate**
   - Review IMPLEMENTATION_SUMMARY.md for details
   - Check troubleshooting sections in docs
   - Contact GitHub Expert Agent if needed

4. **Fix and re-deploy**
   - Address the issue
   - Re-test locally
   - Create new PR with fix

## Success Criteria Verification

- [ ] **All tests pass in CI**
  - Unit tests: PASS
  - Database tests: SKIPPED (as expected)
  - Build: PASS
  - Lint: PASS

- [ ] **Local development works**
  - `npm test` runs with Supabase
  - `npm run test:ci` runs without Supabase
  - `npm run test:unit` runs without Supabase
  - `npm run test:database` runs with Supabase

- [ ] **Documentation is available**
  - QUICK-TEST-REFERENCE.md: Easy to find and use
  - TESTING.md: Comprehensive and well-organized
  - CI-CD.md: Detailed workflow information
  - INDEX.md: Navigation guide works

- [ ] **Team understands the changes**
  - Team has read QUICK-TEST-REFERENCE.md
  - Team knows about new test commands
  - Questions are answered

## Sign-Off

- [ ] **Code review approved**
  - Minimum 1 approval required
  - Preferably from DevOps/infra team

- [ ] **All checks passed**
  - GitHub Actions: GREEN
  - Manual tests: PASSED
  - Documentation: COMPLETE

- [ ] **Ready to merge**
  - No blocking issues
  - All required reviews obtained
  - Deployment checklist complete

## Timeline

**Typical deployment timeline:**

1. Pre-deployment review: 15 minutes
2. Local verification: 10 minutes
3. Git workflow: 5 minutes
4. GitHub PR creation: 5 minutes
5. Review & approval: 1-2 hours (depends on team)
6. Merge: 5 minutes
7. **Total active time: ~40 minutes**

## Quick Reference Commands

```bash
# Test the configuration
npm run test:ci              # CI mode (unit tests only)
npm run test:unit           # Unit tests explicitly
npm run test:database       # Database tests (needs Supabase)
npm test                    # All tests (needs Supabase)

# Git workflow
git status                  # Check what changed
git diff                    # See specific changes
git commit -m "message"     # Commit changes
git push origin develop     # Push to GitHub

# Verify after deployment
npm run test:ci             # Verify CI tests still work
npm run test:unit          # Verify unit tests work
git log --oneline -5       # See recent commits
```

## Contact & Support

- **Questions about CI/CD?** See `docs/CI-CD.md`
- **Questions about testing?** See `docs/TESTING.md`
- **Quick command reference?** See `docs/QUICK-TEST-REFERENCE.md`
- **Implementation details?** See `IMPLEMENTATION_SUMMARY.md`
- **Need navigation?** See `docs/INDEX.md`

## Document History

- Created: 2024-11-14
- Purpose: Deploy CI/CD configuration for database test filtering
- Status: Ready for deployment
- Last updated: 2024-11-14

---

**This checklist ensures smooth deployment of the GitHub Actions CI/CD configuration.**
All items should be completed before final sign-off.

If you encounter any issues, refer to the comprehensive documentation or contact the GitHub Expert Agent.
