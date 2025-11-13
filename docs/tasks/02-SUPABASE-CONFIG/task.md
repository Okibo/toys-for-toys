# Task 1.2: Configure Supabase Project & Local Development

**Epic:** Project Setup & Infrastructure (Week 1)
**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1 (Monorepo Setup)
**Assigned To:** [TBD]
**Created:** 2025-11-13

---

## Overview

Create and configure a Supabase project with proper EU regional settings for GDPR compliance, establish a local development environment, and validate database connectivity from the Next.js application.

---

## Acceptance Criteria

### Supabase Project Setup
- [x] Supabase account created at https://supabase.com
- [x] New project created with:
  - [x] Project name: `toys-for-toys` (or similar)
  - [x] Region: **EU region** (Ireland `eu-west-1` or Germany `eu-central-1`)
  - [x] Database password: Secure, stored in password manager
  - [x] PostgreSQL version: 15+
- [x] Organization created (or used existing) for team access
- [x] Project fully provisioned and accessible

### Database Configuration
- [x] PostgreSQL database accessible via connection string
- [x] Row-Level Security (RLS) enabled at project level
- [x] Realtime enabled for core tables (to be configured in Task 2.1)
- [x] Backup schedule configured (daily, 7-day retention minimum)
- [x] Extensions enabled:
  - [x] `uuid-ossp` (for generating UUIDs)
  - [x] `pgcrypto` (for cryptographic functions)
  - [x] `pgsodium` (for additional crypto utilities)

### Authentication Setup
- [x] Auth provider configured:
  - [x] Email/password enabled
  - [x] Email confirmations required (production setting)
  - [x] Session timeout: 1 hour (expiration), 24 hours (refresh token)
- [x] Email templates customized (optional for MVP, but recommended):
  - [x] Confirmation email
  - [x] Reset password email
  - [x] Invite email (for future admin invitations)
- [x] Redirect URLs configured:
  - [x] `http://localhost:3000/auth/callback` (development)
  - [x] `https://your-domain.com/auth/callback` (production, TBD)
  - [x] `https://your-domain.com/api/auth/callback` (Vercel staging)

### Local Development Setup
- [x] Supabase CLI installed (`npm install -g supabase`)
- [x] Local Supabase instance running via Docker:
  - [x] `npx supabase start` initializes local environment
  - [x] PostgreSQL running on `localhost:5432`
  - [x] Supabase Studio accessible at `http://localhost:54323`
  - [x] API endpoint accessible at `http://localhost:54321`
  - [x] Realtime accessible at `http://localhost:54322`
- [x] Local database connection verified
- [x] `.env.local` configured with local credentials

### Environment Variables Configuration
- [x] `.env.local` created with:
  ```
  NEXT_PUBLIC_SUPABASE_URL=<local-or-remote-url>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
  NEXT_PUBLIC_SUPABASE_REGION=eu-west-1
  ```
- [x] Remote production environment variables noted (for Task 1.5)
- [x] Credentials stored securely (never committed to git)
- [x] `.env.local` added to `.gitignore`

### Testing & Verification
- [x] Next.js app connects to Supabase without errors
- [x] Browser console shows: "✅ Connected to Supabase"
- [x] Query test executed: `SELECT 1` returns 1 row
- [x] Auth.users table is accessible (after auth setup in Task 3.1)
- [x] Realtime connectivity verified (websocket connection)
- [x] Local backup created as starting point

### Documentation
- [x] Database configuration documented in `docs/DATABASE.md`:
  - [x] EU region choice and GDPR rationale
  - [x] Local setup instructions
  - [x] Backup/recovery procedures
  - [x] Environment variable reference
  - [x] Troubleshooting common connection issues
- [x] Credentials management guide (password rotation, API key regeneration)

---

## Implementation Details

### Step 1: Create Supabase Project

#### 1.1 Sign Up / Log In
- Navigate to https://supabase.com/dashboard
- Create account or log in with existing credentials

#### 1.2 Create New Project
1. Click "New project"
2. Fill in project details:
   - **Name:** `toys-for-toys-mvp` (or similar)
   - **Database password:** Generate strong password (16+ chars, mixed case, numbers, symbols)
     - Example: `P@ssw0rd!X9mK2nL#`
     - Store in password manager (1Password, LastPass, etc.)
   - **Region:** Select **Europe (Ireland)** or **Europe (Germany)**
     - Recommended: Ireland (`eu-west-1`) for EU-wide coverage
   - **Pricing Plan:** Leave as default (pay-as-you-go)

3. Click "Create new project"
4. Wait for provisioning (usually 2-3 minutes)

#### 1.3 Verify Project Creation
- Dashboard shows project name and region
- "Ready" status indicator displays
- Connection string visible under "Connection pooling" or "Database"

### Step 2: Enable Extensions & RLS

#### 2.1 Enable Required Extensions
1. In Supabase Studio, go to **SQL Editor**
2. Click "New Query"
3. Run the following SQL:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- Enable RLS on auth schema (already enabled by default, but verify)
ALTER DATABASE postgres SET "app.settings.jwt_secret" = 'YOUR_JWT_SECRET';
```

#### 2.2 Verify Extensions
Go to **Database** → **Extensions** and confirm:
- ✅ `uuid-ossp` - Active
- ✅ `pgcrypto` - Active
- ✅ `pgsodium` - Active

### Step 3: Configure Authentication

#### 3.1 Email/Password Provider
1. Go to **Authentication** → **Providers**
2. Ensure "Email" provider is **Enabled**
3. Configure settings:
   - **Enable email confirmations:** ON (for production security)
   - **Auto-confirm new users:** OFF (until Phase 2)
   - **Restrict new signups:** OFF (open registration for MVP)

#### 3.2 Configure JWT Settings
1. Go to **Authentication** → **Settings**
2. Set JWT expiration:
   - **JWT Expiry limit:** 3600 (1 hour)
   - **JWT Refresh limit:** 86400 (24 hours)
3. Copy JWT Secret (for later reference):
   - Located under "JWT Settings" → "Secret key"
   - Store securely (will need for verification)

#### 3.3 Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add site URLs:
   - `http://localhost:3000` (local development)
   - `http://localhost:3000/auth/callback` (local callback)
   - `https://your-staging-domain.vercel.app` (staging, TBD)
   - `https://your-production-domain.com` (production, TBD)

3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-staging-domain.vercel.app/auth/callback`
   - `https://your-production-domain.com/auth/callback`

### Step 4: Configure Backups

#### 4.1 Set Backup Schedule
1. Go to **Database** → **Backups**
2. Configure backup policy:
   - **Daily backup:** ON
   - **Backup frequency:** Daily (automatic)
   - **Retention period:** 7 days minimum
   - **Backup window:** 00:00-06:00 UTC (low-traffic hours)

#### 4.2 Manual Backup
1. Click "Start backup now" to create initial snapshot
2. Note backup ID for reference
3. Verify backup completes successfully

### Step 5: Get Connection Credentials

#### 5.1 From Supabase Studio
1. Go to **Project Settings** → **Database**
2. Copy the following:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **Anon Key:** `eyJhbGc...` (public key)
   - **Service Role Key:** `eyJhbGc...` (secret key)
   - **Database Password:** `xxxxx` (saved earlier)
   - **Database URL:** `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

#### 5.2 Store Credentials Securely
- Use password manager to store:
  - Project URL
  - Anon Key
  - Service Role Key
  - Database Password
- Ensure access is restricted to core team only

### Step 6: Install & Configure Supabase CLI

#### 6.1 Install CLI
```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

#### 6.2 Initialize Local Project
```bash
cd /path/to/toys-for-toys
supabase init
```

This creates:
- `/supabase/config.toml` (local configuration)
- `/supabase/migrations/` (directory for SQL migrations)
- `/supabase/seed.sql` (optional seed data)

#### 6.3 Configure Remote Connection
Edit `supabase/config.toml`:
```toml
# supabase/config.toml
[api]
port = 54321
schemas = ["public", "graphql_public"]
max_rows = 1000

[db]
port = 5432
major_version = 15
schemas = ["public", "extensions"]
seed_file = "supabase/seed.sql"

[studio]
port = 54323
```

#### 6.4 Link to Remote Project (Optional)
For CI/CD and migrations, link local project to remote:
```bash
supabase link --project-ref <your-project-id>
```

Provide credentials when prompted.

### Step 7: Start Local Supabase

#### 7.1 Prerequisites
- Docker installed and running
- Docker Compose available

#### 7.2 Start Local Instance
```bash
npx supabase start
```

Output should show:
```
Started supabase local development server.

API URL: http://localhost:54321
GraphQL URL: http://localhost:54322
DB URL: postgresql://postgres:postgres@localhost:5432/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
```

#### 7.3 Access Supabase Studio
1. Navigate to http://localhost:54323
2. Sign in with default credentials:
   - **Email:** `supabase@example.com`
   - **Password:** `your_secure_password` (default is empty; you set this)
3. Verify tables and data are visible

### Step 8: Configure `.env.local`

#### 8.1 For Local Development
Create or update `.env.local`:
```env
# Supabase - Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>
NEXT_PUBLIC_SUPABASE_REGION=eu-west-1

# For Remote (will override in Task 1.5)
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-remote-anon-key>
```

#### 8.2 Secure Environment Variables
Add to `.gitignore`:
```
.env.local
.env.*.local
```

Verify `.env.local` is not in git:
```bash
git check-ignore -v .env.local
# Output: .env.local
```

### Step 9: Create Supabase Client in Next.js

#### 9.1 Create `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 9.2 Test Connection in App
Create `app/page.tsx`:
```typescript
import { supabase } from '@/lib/supabase'

export default async function Home() {
  try {
    const { data, error } = await supabase
      .from('auth')
      .select('count(*)')
      .limit(1)

    if (error) throw error

    return (
      <main>
        <h1>✅ Connected to Supabase</h1>
        <p>Ready for development</p>
      </main>
    )
  } catch (err) {
    return (
      <main>
        <h1>❌ Connection Failed</h1>
        <p>{String(err)}</p>
      </main>
    )
  }
}
```

#### 9.3 Run Development Server
```bash
npm run dev
```

Verify:
- App loads at http://localhost:3000
- Message displays: "✅ Connected to Supabase"
- Browser console shows no errors

### Step 10: Create Backup & Documentation

#### 10.1 Create Initial Local Backup
```bash
# Export local database state
pg_dump postgresql://postgres:postgres@localhost:5432/postgres > supabase/backups/init-backup.sql
```

#### 10.2 Create Database Documentation
Create `docs/DATABASE.md`:
```markdown
# Database Setup & Configuration

## Overview
- **Project:** Toy-for-Toy
- **Database:** PostgreSQL 15+ (Supabase)
- **Region:** EU-West-1 (Ireland)
- **Purpose:** GDPR-compliant toy exchange platform

## Local Development

### Prerequisites
- Docker & Docker Compose installed
- Supabase CLI installed globally

### Start Local Instance
\`\`\`bash
npx supabase start
\`\`\`

### Access Supabase Studio
- URL: http://localhost:54323
- Email: supabase@example.com
- Password: [as configured]

## Environment Variables
See `.env.example` for complete list.

## Backup & Recovery
[To be documented in Task 8.4]

## RLS Policies
[To be documented in Task 2.9]
```

---

## Testing Checklist

### Local Setup
- [ ] `supabase start` completes successfully
- [ ] Supabase Studio accessible at http://localhost:54323
- [ ] Database connection verified in Studio
- [ ] Extensions visible and active (uuid-ossp, pgcrypto, pgsodium)

### Next.js Integration
- [ ] `npm run dev` starts without environment variable errors
- [ ] App loads and displays "✅ Connected to Supabase"
- [ ] Browser console shows no connection errors
- [ ] Network requests to Supabase show 200 status

### Remote Configuration (if not local-only)
- [ ] Remote project accessible at https://supabase.com/dashboard
- [ ] Project region is EU (Ireland or Germany)
- [ ] Backup schedule configured and first backup completed
- [ ] Auth providers enabled and redirect URLs configured

### Security Verification
- [ ] RLS enabled at project level (check Project Settings)
- [ ] Service Role Key is never exposed in browser (check Network tab)
- [ ] `.env.local` not committed to git
- [ ] Database password stored in secure password manager

---

## Implementation Notes

### GDPR & Regional Compliance
- **EU Region:** Ireland (`eu-west-1`) chosen to satisfy EU data residency requirements
- **Data Retention:** All data stored in EU; no cross-border transfers
- **Backup Location:** Backups retained in same region (default Supabase behavior)
- **Compliance Note:** Document this choice in privacy policy

### Security Best Practices
1. **API Keys Rotation:** Plan to rotate keys quarterly
2. **Service Role Key:** NEVER expose to client; only use in server-side functions
3. **Anon Key:** Safe to expose; limited by RLS policies
4. **Password Management:** Database password stored in secure vault, accessible only to core team
5. **Least Privilege:** Future API users created with minimal necessary permissions

### Performance Considerations
- **Connection Pooling:** Supabase provides PgBouncer connection pooling
- **Query Optimization:** Add indexes in Task 2.1 for common queries
- **Realtime Subscriptions:** Enable only for tables that need live updates (tasks, messages, notifications)
- **Caching:** Plan for Redis caching layer in Phase 2 if needed

### Troubleshooting
| Issue | Solution |
|-------|----------|
| **Connection refused (localhost)** | Ensure `supabase start` is running; check Docker status |
| **Auth error (remote)** | Verify anon key and URL in `.env.local` |
| **Extensions not found** | Re-run CREATE EXTENSION commands in SQL Editor |
| **Backup failed** | Check database size; free tier has storage limits |
| **RLS blocking queries** | RLS policies created in Task 2.9; expected to fail before then |

---

## Success Criteria

### Objective Metrics
- ✅ Local Supabase starts in <30 seconds
- ✅ Studio loads in <5 seconds
- ✅ Database query responds in <100ms
- ✅ Zero connection errors in 5-minute stability test

### Subjective Metrics
- ✅ Team can start local instance with single command
- ✅ Backup strategy documented and verified
- ✅ Environment variables clearly documented
- ✅ No confusion about local vs. remote databases

---

## Dependencies & Blockers

### Unblocks
- Task 2.1 (Database Schema Creation) - need live database to create tables
- Task 3.1 (Authentication Setup) - need Supabase Auth configured
- All subsequent backend development

### Blocked By
- Task 1.1 (Monorepo Setup) - need Node.js environment

---

## Deliverables

```
toys-for-toys/
├── .env.local                      ✅ Created (gitignored)
├── .env.example                    ✅ Updated with Supabase vars
├── lib/
│   └── supabase.ts                 ✅ Created
├── supabase/
│   ├── config.toml                 ✅ Created
│   ├── migrations/                 ✅ Directory created
│   ├── seed.sql                    ✅ Created (optional)
│   └── backups/
│       └── init-backup.sql         ✅ Created
├── docs/
│   ├── DATABASE.md                 ✅ Created
│   └── ENVIRONMENT.md              ✅ Reference
└── app/
    └── page.tsx                    ✅ Updated (connection test)
```

---

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Create Project** | 30 min | Sign up, create project, wait for provisioning |
| **Phase 2: Configure** | 1-2 hours | Enable extensions, set auth, configure backups |
| **Phase 3: Local Setup** | 1 hour | Install CLI, start local, link to remote |
| **Phase 4: Integration** | 1 hour | Configure Next.js, test connection |
| **Phase 5: Verify** | 30 min | Run connection tests, document setup |
| **Total** | ~5-6 hours | 1 developer day |

---

## Resources & References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/overview)
- [PostgreSQL Authentication](https://www.postgresql.org/docs/current/auth-methods.html)
- [GDPR & Data Residency](https://supabase.com/docs/guides/platform/gdpr)
- [Backup & Recovery](https://supabase.com/docs/guides/platform/backups)
- [Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Sign-Off

- [ ] Developer: Completed and tested locally
- [ ] Remote Project: Created and configured (if applicable)
- [ ] Code Review: Environment setup verified
- [ ] QA: Connection tests passed
- [ ] Tech Lead: Region and backup settings approved

---

**Status:** Ready to implement
**Last Updated:** 2025-11-13
**Next Task:** Task 1.3 - Configure Firebase Project for Push Notifications
