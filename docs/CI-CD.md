# CI/CD Configuration Guide

This document explains the Toy-for-Toy CI/CD setup, including GitHub Actions workflows, test execution, and deployment strategies.

## Overview

The project uses **GitHub Actions** for continuous integration, with separate workflows for:

1. **Main CI Pipeline** (`.github/workflows/ci.yml`): Runs on all pushes and PRs
   - Lint checks
   - Build verification
   - Unit tests (database tests skipped in CI)
   - Matrix testing: Node.js 18.x and 20.x

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`): Deploys to Vercel
   - Automatic deployment on `main` branch
   - Preview deployments for PRs

3. **Optional Supabase Testing** (`.github/workflows/test-with-supabase.yml`): Template for future use
   - Database tests with local Supabase instance
   - Currently disabled to optimize build time

## CI Pipeline Details

### Workflow: Main CI (`.github/workflows/ci.yml`)

This workflow runs automatically on:

- Push to `main` or `develop` branches
- Pull requests against `main` or `develop`

#### Execution Steps

1. **Checkout**: Pull the latest code from the repository
2. **Setup Node.js**: Install Node.js (18.x and 20.x matrix)
3. **Cache Dependencies**: Use npm cache for faster installs
4. **Install**: `npm install`
5. **Lint**: `npm run lint` (checks code style and potential errors)
6. **Build**: `npm run build` (builds Next.js application)
7. **Test**: `npm run test:ci` (runs unit tests, skips database tests)

#### Test Filtering in CI

The key difference in CI is the automatic test filtering:

```bash
# Local development (all tests)
npm test

# CI environment (unit tests only)
npm run test:ci  # Sets CI=true environment variable
```

**How it works:**

1. GitHub Actions automatically sets `CI=true` environment variable
2. `jest.config.js` detects this and modifies `testPathIgnorePatterns`
3. Database tests in `/tests/database/` are automatically excluded
4. Unit tests and other tests run normally

### Why Database Tests Are Excluded from CI

Database tests require:

- A local Supabase instance running on `localhost:54321`
- Real PostgreSQL database connection
- Proper RLS policy evaluation
- Test data setup and cleanup

These requirements cannot be met in CI because:

- GitHub Actions runners are ephemeral and isolated
- Starting a full Supabase stack adds 3-5 minutes to build time
- Database state can introduce flaky tests if not carefully managed
- Network isolation prevents `localhost` connections

### Performance Targets

- **Unit tests only**: 2-3 minutes total
- **With database tests**: 5-10 minutes (if enabled)
- **Build time**: ~1-2 minutes

## Testing Strategy

### Local Development

Developers run all tests locally using:

```bash
# Start Supabase first (required for database tests)
npx supabase start

# In another terminal, run all tests
npm test
```

This ensures:

- Full test coverage before pushing
- Database schema validation
- RLS policy verification
- Early issue detection

### CI Environment

CI runs only unit tests to:

- Validate code quality and linting
- Ensure application builds successfully
- Catch logic errors in components and utilities
- Maintain fast feedback loop for developers

### Test Coverage

- **Mandatory (CI)**: Unit tests, linting, build
- **Recommended (Local)**: All tests including database
- **Optional (CI)**: Database tests (can be enabled separately)

## Environment Variables

### GitHub Secrets

Sensitive variables should be stored as GitHub Secrets and referenced in workflows:

```yaml
- name: Deploy to Vercel
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    SUPABASE_API_KEY: ${{ secrets.SUPABASE_API_KEY }}
```

**Set up in:** Repository Settings > Secrets and variables > Actions

### Required Secrets

For Vercel deployment:

- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_PROJECT_ID`: Vercel project ID
- `VERCEL_ORG_ID`: Vercel organization ID (if using org)

For Supabase (optional, if CI database testing is enabled):

- `SUPABASE_PROJECT_ID`: Project ID
- `SUPABASE_DB_PASSWORD`: Database password

## Branch Protection Rules

Configure branch protection in GitHub to enforce CI checks before merging:

1. Go to: Repository Settings > Branches > Add rule
2. Configure for `main` and `develop` branches:
   - **Require status checks to pass before merging**: Enable
   - **Require branches to be up to date**: Enable
   - **Require code reviews before merging**: Recommended
   - **Require approval of the most recent reviewers**: Recommended
   - **Require conversation resolution before merging**: Recommended

## Pull Request Workflow

### For Feature Development

1. Create a feature branch from `develop`:

   ```bash
   git checkout -b feature/my-feature develop
   ```

2. Develop and commit changes:

   ```bash
   npm test           # Test locally (all tests)
   npm run lint       # Check linting
   npm run build      # Verify production build
   git push origin feature/my-feature
   ```

3. Create a PR against `develop`:
   - GitHub Actions automatically runs CI
   - All checks must pass before merging
   - Request code review from team

4. After approval and CI passes:
   - Merge PR into `develop`
   - CI runs again on `develop`

### For Releases

1. Create a release branch from `main`:

   ```bash
   git checkout -b release/v1.0.0 main
   ```

2. Make release changes (version bumps, changelogs):

   ```bash
   npm run test:coverage   # Generate coverage reports
   git push origin release/v1.0.0
   ```

3. Create a PR against `main`:
   - CI validates release build
   - Reviews and approvals required

4. Merge and tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

   - Deployment workflow automatically triggers

## Deployment Strategy

### Vercel Deployment (Web)

Configured in `.github/workflows/deploy.yml`:

- **Automatic deployment** on push to `main`
- **Preview deployments** for all PRs
- **Production environment** for `main` branch

Environment variables in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- All other public and secret variables

### Mobile Deployment (iOS/Android)

Capacitor builds are **manual** and require:

1. Build the Next.js app:

   ```bash
   npm run build
   ```

2. Sync to native projects:

   ```bash
   npx cap sync
   ```

3. Open in IDE and build:
   ```bash
   npx cap open ios     # Xcode
   npx cap open android # Android Studio
   ```

## Monitoring CI/CD

### GitHub Actions Dashboard

View workflow runs:

1. Go to: Repository > Actions tab
2. Select workflow to view runs
3. Click run to see step-by-step logs

### Troubleshooting Failed CI

#### Build Failures

```bash
# Check locally
npm run lint    # Linting errors
npm run build   # Build errors
npm run test:ci # Test failures
```

#### Common Issues

| Issue                           | Cause                        | Solution                                      |
| ------------------------------- | ---------------------------- | --------------------------------------------- |
| Dependency install fails        | `package-lock.json` mismatch | Update: `npm install` locally, commit changes |
| Build fails                     | TypeScript errors            | Run `npm run build` locally to see errors     |
| Tests fail in CI (pass locally) | Environment differences      | Check CI logs; may be Node.js version issue   |
| Lint fails                      | Code style violations        | Run `npm run lint` locally to auto-fix        |

#### Viewing CI Logs

1. Go to the failing workflow run in GitHub Actions
2. Click on the failed step
3. View detailed output
4. Search for error messages
5. Debug locally using the same commands

## Caching Strategy

The CI workflow uses npm cache to speed up dependency installation:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
    cache: 'npm' # Automatically caches ~/.npm directory
```

**Cache invalidation**: Automatically invalidated when `package-lock.json` changes

## Performance Optimization Tips

### For Local Development

1. Use `npm run test:watch` during development
2. Run specific tests instead of full suite when possible:

   ```bash
   npm test -- my-component.test.ts
   npm test -- --testNamePattern="specific test"
   ```

3. Use `npm run test:unit` to skip database tests if not needed

### For CI Pipeline

1. Keep the matrix small (only essential Node versions)
2. Use caching effectively (npm cache, build artifacts)
3. Run linting before building (fail fast)
4. Consider splitting workflows for different concerns

### Database Testing (Future Enhancement)

If you enable database testing in CI:

1. Use parallel workflows: fast unit tests + optional full tests
2. Run database tests only when migrations change:

   ```yaml
   paths:
     - 'supabase/migrations/**'
   ```

3. Use `--runInBand` flag for sequential execution of database tests
4. Set extended timeouts: `--testTimeout=30000`

## Continuous Integration Best Practices

1. **Keep CI fast**: Target < 5 minutes for PR feedback
2. **Fail fast**: Lint before building, build before testing
3. **Meaningful names**: Use clear step names in workflows
4. **Clear documentation**: Document why tests are skipped/included
5. **Monitor costs**: Watch GitHub Actions usage for organization
6. **Regular reviews**: Update dependencies and Node versions regularly
7. **Test locally first**: Always run `npm test` before pushing
8. **Clear error messages**: Ensure CI failures are easy to understand

## Security Considerations

1. **Secret Management**:
   - Never commit `.env` files or credentials
   - Use GitHub Secrets for all sensitive data
   - Rotate API keys regularly

2. **Dependency Security**:
   - Keep npm packages updated
   - Review `npm audit` reports
   - Use `--audit-level=moderate` in CI

3. **Access Control**:
   - Limit who can approve PRs
   - Require code reviews before merge
   - Restrict deployment token access

## Future Enhancements

### Database Testing in CI

When ready to add database tests to CI:

1. Use `.github/workflows/test-with-supabase.yml` as a template
2. Consider using Supabase GitHub Action (if available)
3. Or use Postgres Docker image with initialization scripts
4. Run tests in sequence (`--runInBand`) for consistency

### Performance Benchmarking

Add workflow to track performance over time:

```yaml
- name: Store benchmark results
  uses: benchmark-action/github-action@v1
  with:
    tool: 'customBiggerBetter'
    output-file-path: benchmark.txt
```

### Release Automation

Enhance release process with:

1. Automatic version bumping
2. Changelog generation
3. GitHub release creation
4. Notification to team

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Capacitor Documentation](https://capacitorjs.com/docs)
