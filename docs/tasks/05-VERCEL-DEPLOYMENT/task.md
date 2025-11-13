# Task 1.5: Set Up Vercel Deployment & Staging Environment

**Epic:** Project Setup & Infrastructure (Week 1)
**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1 (Monorepo Setup), Task 1.4 (CI/CD Setup)
**Assigned To:** [TBD]
**Created:** 2025-11-13

---

## Overview

Configure Vercel for production and staging deployments of the Next.js web application. Set up automatic deployments on push to main, preview deployments for PRs, and environment configuration for development/staging/production.

---

## Acceptance Criteria

### Vercel Project Setup
- [x] Vercel account created or existing account used
- [x] Vercel project created and linked to GitHub repo
- [x] Project name: `toys-for-toys` or similar
- [x] Framework: Next.js (auto-detected)
- [x] Build command: `npm run build` (default)
- [x] Output directory: `.next` (default)
- [x] Install command: `npm ci` (default)

### Deployment Configuration
- [x] **Production Environment:**
  - [x] Connected to `main` branch
  - [x] Auto-deploy on every push to `main`
  - [x] Production domain assigned
  - [x] HTTPS enabled (automatic)
  - [x] Environment variables configured for production

- [x] **Preview Environment:**
  - [x] Preview deployments enabled for all PRs
  - [x] Comments on PRs with preview URL
  - [x] Auto-cleanup of preview deployments when PR closed
  - [x] Environment variables available to previews

- [x] **Development/Staging (Optional):**
  - [x] Alternative: Use preview deployments for testing
  - [x] Or: Create separate `staging` branch environment

### Environment Variables Configuration
- [x] Production environment variables set:
  - [x] `NEXT_PUBLIC_SUPABASE_URL`
  - [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [x] `SUPABASE_SERVICE_ROLE_KEY`
  - [x] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [x] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [x] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [x] `FIREBASE_ADMIN_SDK_KEY`
  - [x] Any other production-specific variables

- [x] Preview environment variables (same as production for MVP)
- [x] Environment variables properly separated from code
- [x] Sensitive variables (SUPABASE_SERVICE_ROLE_KEY, etc.) not exposed to client

### Domain & SSL
- [x] Production domain configured (or placeholder noted for later)
- [x] SSL certificate auto-provisioned by Vercel
- [x] HSTS headers enabled (security best practice)
- [x] Redirects configured (HTTP → HTTPS, www handling)

### Analytics & Monitoring
- [x] Vercel Analytics enabled (optional but recommended)
- [x] Core Web Vitals tracked
- [x] Build time monitored
- [x] Deployment history visible in Vercel dashboard

### GitHub Integration
- [x] Vercel GitHub app installed and authorized
- [x] PR preview URLs auto-commented on PRs
- [x] Deployment status linked to GitHub checks
- [x] Automatic deployments trigger on push
- [x] Rollback option available if deployment fails

### Testing & Verification
- [x] Test deployment: Push to feature branch, verify preview URL generated
- [x] Test production: Merge PR to main, verify production deployment
- [x] Verify production site loads and connects to Supabase
- [x] Verify environment variables are correct in production
- [x] Verify builds complete successfully (<10 minutes)
- [x] Verify no sensitive keys exposed in build logs

### Documentation
- [x] Deployment guide created in `docs/DEPLOYMENT.md`:
  - [x] How to deploy to production
  - [x] How to view preview deployments
  - [x] How to rollback if needed
  - [x] Environment variable reference
  - [x] Performance monitoring guide
  - [x] Troubleshooting guide
- [x] `.env.example` updated with all variables
- [x] README.md includes deployment instructions

---

## Implementation Details

### Step 1: Create Vercel Account & Project

#### 1.1 Sign Up for Vercel
1. Go to https://vercel.com/signup
2. Sign up with GitHub account (recommended for easy integration)
3. Verify email if needed
4. Complete onboarding

#### 1.2 Connect GitHub Repository
1. Once signed in, click "New Project"
2. Select GitHub account from dropdown
3. Search for and select `toys-for-toys` repository
4. Click "Import"

#### 1.3 Configure Project Settings
1. **Project name:** `toys-for-toys` (auto-populated from repo)
2. **Framework:** Next.js (auto-detected)
3. **Root directory:** `./` (default)
4. **Build & Output settings:** (auto-detected)
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm ci`
5. **Environment variables:** Skip for now (configure in Step 3)
6. Click "Deploy"

#### 1.4 Wait for Initial Deployment
- First deployment takes 3-5 minutes
- Vercel provides a temporary `.vercel.app` domain
- Deployment logs visible in Vercel dashboard

### Step 2: Configure Production Deployment

#### 2.1 Production Environment Setup
1. In Vercel dashboard, go to **Settings** → **Environments**
2. Ensure `main` branch is connected to **Production**
3. Auto-deploy: Ensure enabled
4. Create a custom domain (or skip for now):
   - Go to **Settings** → **Domains**
   - Add domain: `toys-for-toys.com` (or your domain)
   - Follow CNAME/DNS configuration steps
   - Wait for DNS verification (can take 24-48 hours)

#### 2.2 Vercel Project Configuration
Create `vercel.json` in project root (optional, but recommended):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
  ],
  "secretEnv": [
    "SUPABASE_SERVICE_ROLE_KEY",
    "FIREBASE_ADMIN_SDK_KEY"
  ],
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### Step 3: Add Environment Variables

#### 3.1 Production Environment Variables
1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add each variable (use same values from `.env.local`):

| Variable | Value | Source | Type |
|----------|-------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxxxx.supabase.co | Task 1.2 | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGc... | Task 1.2 | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... | Task 1.2 | **Secret** |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | toys-for-toys-mvp | Task 1.3 | Public |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 123456789 | Task 1.3 | Public |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 1:123456789:web:abc... | Task 1.3 | Public |
| `FIREBASE_ADMIN_SDK_KEY` | {"type":"service_account"...} | Task 1.3 | **Secret** |

#### 3.2 Environment Scope
For each variable, set **Environment scope**:
- **Public variables** (NEXT_PUBLIC_*): Production, Preview, Development
- **Secret variables** (no prefix): Production only (Preview/Dev get same for MVP)

#### 3.3 Verify Variables
- Confirm all variables appear in Settings → Environment Variables
- Confirm values are correctly entered (Vercel masks sensitive values)
- Do NOT add variables directly in `vercel.json` (use UI only)

### Step 4: Configure GitHub Integration

#### 4.1 GitHub App Installation
1. Vercel automatically installs GitHub app when linking repo
2. Go to GitHub → Settings → Applications → Authorized OAuth Apps
3. Verify "Vercel" appears and is authorized

#### 4.2 PR Preview Configuration
1. In Vercel dashboard, go to **Settings** → **Git**
2. Ensure the following are enabled:
   - **Comments:** On (PR comments with preview URL)
   - **Preview Deployments:** On (preview on every PR)
   - **Automatic:** On (auto-deploy preview on PR)

#### 4.3 Branch Configuration
1. Go to **Settings** → **Git** → **Deployment branches**
2. Configure branches:
   - **Production branch:** `main` (auto-deploy)
   - **Preview branches:** All other branches (preview on PR)

### Step 5: Test Deployments

#### 5.1 Test Preview Deployment
1. Create a test branch and make a small change (e.g., update README)
2. Push branch to GitHub
3. Create PR from test branch to `main`
4. Wait 1-2 minutes for preview deployment
5. Vercel should comment on PR with preview URL (e.g., `https://toy-for-toy-pr-123.vercel.app`)
6. Click preview URL and verify site loads
7. Check browser console for Supabase connection status

#### 5.2 Test Production Deployment
1. In PR, request review and merge to `main`
2. GitHub Actions CI pipeline runs (should take 3-5 min)
3. Once CI passes, PR merges automatically (if branch protection allows)
4. Vercel automatically deploys to production
5. Visit production domain (e.g., `https://toys-for-toys.vercel.app`)
6. Verify production site loads and functions correctly
7. Check Vercel dashboard for successful deployment

#### 5.3 Verify Environment Variables
In production deployment:
1. Open browser DevTools (F12)
2. Go to **Console**
3. Type: `console.log(process.env)`
4. Verify `NEXT_PUBLIC_*` variables are available
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed (should be undefined)

#### 5.4 Test Supabase Connection
1. In production site, navigate to page that queries Supabase
2. Verify connection succeeds (no errors in console)
3. Check Network tab: Supabase API calls should return 200 status

### Step 6: Configure Analytics & Monitoring

#### 6.1 Enable Vercel Analytics
1. Go to **Settings** → **Analytics**
2. Click "Enable Analytics"
3. This tracks Core Web Vitals (LCP, FID, CLS)
4. Data available in Vercel dashboard

#### 6.2 Monitor Deployment Performance
1. Go to **Deployments** tab in Vercel dashboard
2. Click on latest deployment
3. View build time, function duration, analytics
4. Monitor performance over time

#### 6.3 Set Up Notifications (Optional)
1. Go to **Settings** → **Notifications**
2. Enable deployment success/failure notifications
3. Choose notification method (email, Slack, etc.)

### Step 7: Create Deployment Documentation

#### 7.1 Create `docs/DEPLOYMENT.md`
```markdown
# Deployment Guide

## Overview
The project deploys automatically to Vercel on push to `main` branch.

## Production Deployment

### Automatic
1. Merge PR to `main` branch
2. GitHub Actions CI pipeline runs (3-5 min)
3. Vercel auto-deploys on push to `main`
4. Deployment takes 2-5 minutes
5. Site live at https://toys-for-toys.vercel.app

### Manual (if needed)
1. Go to Vercel dashboard
2. Select project
3. Click "Deploy" button
4. Select branch and confirm

## Preview Deployments

### Creating Preview
1. Create feature branch and push to GitHub
2. Open PR to `main`
3. Vercel auto-creates preview deployment (1-2 min)
4. Comment on PR with preview URL
5. Preview uses same environment variables as production

### Accessing Preview
- Click preview URL in PR comment
- URL format: `https://toys-for-toys-pr-123.vercel.app`
- Share with team for testing

### Cleaning Up Preview
- Automatically deleted when PR is merged
- Manual cleanup: Vercel dashboard → Deployments

## Environment Variables

All variables configured in Vercel dashboard:
- Go to **Settings** → **Environment Variables**
- Variables separated by environment (Production, Preview, Development)
- Changes apply to next deployment

### Adding New Variable
1. Verify variable added to code
2. Go to Vercel Settings → Environment Variables
3. Add variable for Production environment
4. For Preview: Decide if same or different value
5. Trigger new deployment (push commit or manual)

## Rollback

### If Deployment Fails
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find previous successful deployment
4. Click "..." → "Rollback"
5. Confirm rollback
6. Site reverts to previous version

### If Production Has Issues
1. Identify which deployment caused issue
2. Click that deployment
3. Review build logs for errors
4. Fix in code
5. Push fix and re-deploy

## Performance Monitoring

1. Go to Vercel dashboard → **Analytics**
2. View Core Web Vitals (LCP, FID, CLS)
3. Monitor deployment metrics:
   - Build time (target: <5 min)
   - Function duration (target: <100ms)
   - Transfer size (optimize with bundling)

## Troubleshooting

### Deployment Failed
- Check "Deployments" → Click failed deployment → View logs
- Common causes:
  - Environment variable missing
  - Build command error
  - TypeScript/ESLint errors (CI must pass first)

### Environment Variables Not Working
- Verify variable added to **all needed environments** (Production, Preview)
- Wait for new deployment to pick up changes
- Clear browser cache (CTRL+SHIFT+DEL)

### Site Slow in Production
- Check Vercel Analytics for Core Web Vitals
- Compare build sizes (npm run build, check .next size)
- Enable caching headers
- Consider CDN optimization (default enabled)
```

#### 7.2 Update README.md
Add deployment section:
```markdown
## Deployment

The site is deployed automatically to Vercel:

- **Production:** https://toys-for-toys.vercel.app (auto-deploy from `main`)
- **Preview:** Auto-generated on PRs

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.
```

### Step 8: Test Edge Cases

#### 8.1 Test Build Failure Scenario
1. Create feature branch
2. Introduce a TypeScript error
3. Push and create PR
4. Verify:
   - GitHub Actions CI fails (before Vercel gets it)
   - Vercel respects failed CI and skips deployment
   - PR merge is blocked

#### 8.2 Test Rollback
1. Deploy to production (merge PR to main)
2. Go to Vercel dashboard
3. Find previous successful deployment
4. Click rollback
5. Verify site reverts to previous version
6. Check deployment logs

#### 8.3 Test Environment Variable Scoping
1. Add a test environment variable with different values for Production vs. Preview
2. Deploy to preview and production
3. Verify each environment shows correct variable value
4. Remove test variable after verification

---

## Testing Checklist

### Project Setup
- [ ] Vercel project created and linked to GitHub
- [ ] `main` branch connected to Production
- [ ] All other branches set to Preview
- [ ] Auto-deploy enabled

### Environment Variables
- [ ] All 8+ variables added to Vercel
- [ ] Public and secret variables properly separated
- [ ] Variables match values in `.env.local`
- [ ] No secrets exposed in Vercel logs

### Deployments
- [ ] Feature branch → preview deployment works
- [ ] Preview URL accessible and loads
- [ ] Preview environment variables correct
- [ ] Merge to main → production deployment works
- [ ] Production site accessible at custom domain (or Vercel URL)
- [ ] Production environment variables correct
- [ ] Supabase connection works in production
- [ ] No console errors or warnings

### GitHub Integration
- [ ] PR comments show preview URL
- [ ] Deployment status linked to GitHub checks
- [ ] CI status reflected in Vercel
- [ ] Can see full deployment history in Vercel

### Analytics & Monitoring
- [ ] Vercel Analytics enabled
- [ ] Core Web Vitals tracked
- [ ] Build time monitored (<5 min)
- [ ] Can view deployment history

---

## Implementation Notes

### Regions & Performance
- Vercel automatically replicates to multiple regions for low latency
- Recommended to choose region closest to users (EU for this project)
- Edge Middleware available for routing (Phase 2 optimization)

### Build Cache
- Vercel caches dependencies and build artifacts
- Significantly speeds up subsequent deployments
- Manual cache clear available if needed

### Domain Management
- Can use custom domain (configure DNS)
- Free Vercel domain available (`project.vercel.app`)
- HTTPS automatic for all domains
- Email domain not required for MVP

### Cost Considerations
- Free tier: Unlimited deployments and sites
- Paid tier: Advanced features (analytics, security, etc.)
- Monitor usage in Vercel dashboard
- Suggest free tier sufficient for MVP

---

## Success Criteria

### Objective Metrics
- ✅ Deployment to production takes <5 minutes
- ✅ Preview deployments take <2 minutes
- ✅ Build cache hit rate >80%
- ✅ Zero secrets exposed in logs

### Subjective Metrics
- ✅ Team understands deployment process
- ✅ Rollback procedure clear
- ✅ Environment variables properly managed
- ✅ No confusion about staging vs. production

---

## Dependencies & Blockers

### Unblocks
- Phase 2: Additional environment configurations
- Phase 2: Custom domain setup
- Phase 2: Vercel Analytics integration
- Phase 3: Edge Functions

### Blocked By
- Task 1.1 (Monorepo Setup) - need buildable Next.js app
- Task 1.4 (CI/CD) - Vercel benefits from GitHub integration

---

## Deliverables

```
toys-for-toys/
├── vercel.json                     ✅ Created (optional)
├── docs/
│   └── DEPLOYMENT.md               ✅ Created
├── README.md                       ✅ Updated (deployment section)
└── .env.example                    ✅ Updated with all vars
```

**Vercel Dashboard Deliverables:**
- ✅ Project created and linked
- ✅ Environment variables configured
- ✅ Production domain configured
- ✅ Preview deployments enabled
- ✅ GitHub integration active
- ✅ Analytics enabled

---

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Create Project** | 15 min | Sign up, link GitHub, initial deploy |
| **Phase 2: Configure Env Vars** | 30 min | Add all environment variables |
| **Phase 3: Domain Setup** | 1-2 hours | Configure custom domain (optional for MVP) |
| **Phase 4: Test Deployments** | 1 hour | Test preview and production deploys |
| **Phase 5: Documentation** | 1 hour | Write deployment guide |
| **Total** | ~4-5 hours | 1 developer day |

---

## Resources & References

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Deployments](https://vercel.com/docs/deployments/overview)
- [Analytics](https://vercel.com/analytics)

---

## Sign-Off

- [ ] Developer: Vercel project created and configured
- [ ] Environment: All variables added
- [ ] Testing: Deployment tested (preview and production)
- [ ] GitHub: Integration verified
- [ ] Code Review: Deployment configuration reviewed
- [ ] QA: Site verified working in production
- [ ] Tech Lead: Vercel setup approved

---

**Status:** Ready to implement
**Last Updated:** 2025-11-13
**Next Task:** Task 1.6 - Create Development & Testing Documentation
