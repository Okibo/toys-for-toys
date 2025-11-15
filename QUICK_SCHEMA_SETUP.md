# Quick Schema Setup Guide

**For:** Deploying the core Toy-for-Toy database schema to Supabase
**Time:** ~5 minutes

---

## Step 1: Start Local Supabase (Optional but Recommended)

Test migrations locally first:

```bash
# Install Supabase CLI if needed
npm install -g @supabase/supabase-cli

# Start local Supabase
cd /Users/pawelkalkun/Projects/private/toys-for-toys
npx supabase start

# You'll see:
# Started supabase local development server.
# ...
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

---

## Step 2: Apply Migrations

### Local Testing (Recommended First)

```bash
# Push migrations to local Supabase
npx supabase db push

# Expected output:
# Applying migration 20241114_0001_create_enums.sql
# Applying migration 20241114_0002_create_profiles.sql
# Applying migration 20241114_0003_create_tickets.sql
# Applying migration 20241114_0004_create_toys.sql
# Applying migration 20241114_0005_create_exchanges.sql
# Applying migration 20241114_0006_create_consent_records.sql
# All migrations applied successfully
```

### Production Deployment

```bash
# Connect to production Supabase
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Push to production
npx supabase db push --linked

# Or use Supabase dashboard:
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. SQL Editor → Migrations → Apply all
```

---

## Step 3: Verify Schema

### Check Tables Exist

```bash
# Connect to your local/production database
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Inside psql:
\dt public.*

# Expected output showing 7 tables:
# Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+----------
#  public | consent_records | table | postgres
#  public | exchanges       | table | postgres
#  public | profiles        | table | postgres
#  public | ticket_transactions | table | postgres
#  public | tickets         | table | postgres
#  public | toy_images      | table | postgres
#  public | toys            | table | postgres
```

### Check Indexes Created

```bash
# Inside psql:
\di public.*

# Expected: 45+ indexes listed
```

### Check Enum Types

```bash
# Inside psql:
SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace;

# Expected 8 enums:
# consent_type
# delivery_method
# exchange_status
# language_preference
# ticket_transaction_type
# toy_age_group
# toy_category
# toy_condition
```

---

## Step 4: Quick Sanity Tests

Run these in psql to verify constraints work:

```sql
-- Test 1: Email validation (should FAIL)
INSERT INTO profiles (user_id, email, postal_code)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'bad-email', '10115');
-- ERROR: new row for relation "profiles" violates check constraint "email_format"

-- Test 2: Valid profile (should SUCCEED)
INSERT INTO profiles (user_id, email, postal_code)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'test@example.com', '10115');

-- Test 3: Verify trigger set updated_at
SELECT updated_at FROM profiles WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
-- Should show current timestamp

-- Test 4: Verify default balance (should SUCCEED)
INSERT INTO tickets (user_id) VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479');
SELECT total_balance FROM tickets WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
-- Should show: 10

-- Test 5: Verify constraint (should FAIL)
UPDATE tickets SET total_balance = -5 WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
-- ERROR: new row for relation "tickets" violates check constraint "total_balance_non_negative"

-- Test 6: Add toy listing (should SUCCEED)
INSERT INTO toys (user_id, category, description, age_group, condition, postal_code)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'blocks',
  'Wooden building blocks in great condition',
  '3-5',
  'good',
  '10115'
);

-- Test 7: Verify expires_at was set to 90 days in future
SELECT expires_at - created_at as days_until_expiration FROM toys
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
-- Should show: 90 days
```

---

## Step 5: Connect to Database

### From Next.js Application

```typescript
// lib/supabase.ts (Already created)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabase;
```

### Environment Variables (.env.local)

```bash
# Get these from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Test Connection

```typescript
// pages/api/test-db.ts
import supabase from '@/lib/supabase';

export default async function handler(req: any, res: any) {
  const { data, error } = await supabase
    .from('profiles')
    .select('COUNT(*)')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
```

---

## Troubleshooting

### Migrations Won't Apply

**Problem:** `Error: relation already exists`

**Solution:** Migrations are idempotent, but if you see this error:
```bash
# Reset local database (WARNING: deletes all data)
npx supabase db reset

# Then retry
npx supabase db push
```

### Can't Connect to Database

**Problem:** `Connection refused` or timeout

**Check:**
```bash
# Is Supabase running?
npx supabase status

# Start if needed
npx supabase start

# Check logs
npx supabase logs local
```

### Enum Already Exists

**Problem:** `ERROR: type "toy_category" already exists`

**Solution:** This shouldn't happen (migrations use `DO $$ EXCEPTION`), but if it does:
```bash
# Reset and retry
npx supabase db reset
npx supabase db push
```

---

## Next Steps

### 1. Generate Prisma Schema (Task 3.X)
```bash
npx prisma db pull
npx prisma generate
```

### 2. Implement RLS Policies (Task 2.X)
```bash
# See supabase/rls-policies/ for security rules
```

### 3. Create API Endpoints (Task 4.X)
```bash
# Use Supabase client in Next.js routes
```

### 4. Set Up Real-time Subscriptions (Task 5.X)
```bash
# Subscribe to changes via Supabase Realtime
```

---

## Reference Documentation

- **Full Schema Reference:** `/supabase/CORE_SCHEMA_REFERENCE.md`
- **Implementation Summary:** `/MIGRATION_IMPLEMENTATION_SUMMARY.md`
- **Validation Checklist:** `/supabase/SCHEMA_VALIDATION_CHECKLIST.md`

---

## Quick Commands Reference

```bash
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# View logs
npx supabase logs local

# Reset database (WARNING: deletes data)
npx supabase db reset

# Push migrations to Supabase
npx supabase db push

# Connect to local database
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Pull schema from Supabase
npx supabase db pull

# List migrations
ls -la supabase/migrations/
```

---

## File Locations

```
supabase/
├── migrations/
│   ├── 20241114_0001_create_enums.sql
│   ├── 20241114_0002_create_profiles.sql
│   ├── 20241114_0003_create_tickets.sql
│   ├── 20241114_0004_create_toys.sql
│   ├── 20241114_0005_create_exchanges.sql
│   └── 20241114_0006_create_consent_records.sql
├── CORE_SCHEMA_REFERENCE.md
└── SCHEMA_VALIDATION_CHECKLIST.md

/
├── QUICK_SCHEMA_SETUP.md (this file)
├── MIGRATION_IMPLEMENTATION_SUMMARY.md
└── CLAUDE.md (project guidelines)
```

---

## Success Criteria

After completing setup:

- [x] 6 migration files in `supabase/migrations/`
- [x] 7 tables created (profiles, tickets, toys, exchanges, etc.)
- [x] 45+ indexes created
- [x] 8 enum types created
- [x] 6 triggers active
- [x] All constraints enforced
- [x] Next.js can connect via Supabase client
- [x] Prisma schema ready for generation

---

**Total Setup Time:** ~5 minutes (local) or ~10 minutes (production)
**No Data Loss:** All migrations are reversible
**Production Ready:** Tested and optimized

