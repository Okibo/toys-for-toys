# Supabase Schema Integration Guide

**Document Version:** 1.0
**Task:** P1-W1-SETUP-002
**Database:** PostgreSQL 14+ (Supabase)
**Last Updated:** 2024-11-14

## Overview

This document covers Supabase-specific configuration, integration points, and validation for the Toy-for-Toy core schema. It complements the CORE_SCHEMA_REFERENCE.md with Supabase-specific considerations.

## Table of Contents

1. [Supabase Auth Integration](#supabase-auth-integration)
2. [Schema Deployment](#schema-deployment)
3. [RLS (Row-Level Security) Foundation](#rls-row-level-security-foundation)
4. [PostgREST API Integration](#postgrest-api-integration)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Storage Integration](#storage-integration)
7. [Validation & Verification](#validation--verification)
8. [Troubleshooting](#troubleshooting)

---

## Supabase Auth Integration

### auth.users Foreign Key

The core of Toy-for-Toy's authentication model is the relationship between `auth.users` (managed by Supabase) and our custom `profiles` table.

**Schema:**

```sql
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  language_preference language_preference DEFAULT 'en' NOT NULL,
  postal_code TEXT NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Key Points:**

- `user_id` is a direct foreign key to `auth.users(id)`
- ON DELETE CASCADE ensures profile cleanup when user is deleted
- Email is duplicated in `profiles` for easier indexing and query performance
- `is_email_verified` mirrors `auth.users.email_confirmed_at` (optional, for app convenience)

### JWT Claims

When users authenticate via Supabase Auth, their JWT token includes standard claims:

```json
{
  "sub": "user_id_uuid",
  "email": "user@example.com",
  "email_confirmed": true,
  "auth_time": 1234567890,
  "aud": "authenticated",
  "role": "authenticated"
}
```

**Using JWT Claims in Your App:**

```typescript
// In Supabase client
const { data: { session } } = await supabase.auth.getSession();
const user_id = session.user.id;  // Extract from JWT

// In RLS policies
-- Claims are accessible as:
auth.uid()         -- Returns current user's UUID
auth.jwt()         -- Returns full JWT object
auth.role()        -- Returns 'authenticated' or 'anon'
```

### User Creation Flow

```
1. User signs up via Supabase Auth endpoint
   ↓
2. Supabase creates auth.users record
   ↓
3. Trigger creates profiles record (or manual INSERT from app)
   ↓
4. Trigger creates tickets record (wallet initialized to 10)
   ↓
5. Trigger creates initial consent_records (for GDPR)
```

**Important:** You must either:
- Create a database trigger on `auth.users` INSERT (if permissions allow)
- OR manually INSERT into `profiles` after auth signup (recommended)

### Service Role Key

For backend operations (admin, API routes), use the Service Role Key:

```typescript
// Service role bypasses RLS entirely
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Admin access
);

// This query ignores RLS
const { data } = await supabase.from('tickets').select('*');
```

**Use Cases:**
- Admin operations
- Batch processing
- Scheduled jobs (Edge Functions with admin key)
- Data migration

---

## Schema Deployment

### Local Development (Supabase CLI)

**1. Start Local Supabase:**

```bash
npx supabase start
```

This starts PostgreSQL, Supabase services, and includes Auth with default test credentials.

**2. Apply Migrations:**

```bash
npx supabase db push
```

Applies all migrations from `supabase/migrations/` in order.

**3. Verify Local Schema:**

```bash
# Connect to local database
psql "postgresql://postgres:postgres@localhost:54322/postgres"

-- Check tables
\dt public.*

-- Check enums
\dT public.*

-- Check specific table
\d public.profiles
```

### Remote Deployment (Production)

**1. Push to Remote Supabase:**

```bash
npx supabase db push --remote
```

**2. Verify Remote Schema:**

```bash
# Via Supabase Dashboard
# Dashboard → SQL Editor → Run Query

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**3. Check Migration Status:**

```bash
npx supabase migration list --remote
```

### Migration File Naming

Supabase expects migration files named:

```
TIMESTAMP_DESCRIPTION.sql
├─ 20241114_0001_create_enums.sql
├─ 20241114_0002_create_profiles.sql
├─ 20241114_0003_create_tickets.sql
├─ 20241114_0004_create_toys.sql
├─ 20241114_0005_create_exchanges.sql
└─ 20241114_0006_create_consent_records.sql
```

Each file is idempotent (safe to run multiple times).

---

## RLS (Row-Level Security) Foundation

### Why RLS?

RLS ensures that authenticated users can only access data they should have access to:

- Users can only see/modify their own profiles
- Toy listings are readable by all, writable by owner only
- Exchanges are only visible to requester/owner
- Ticket transactions are private to each user

### RLS Status (Current)

**Enabled Tables (Deny by Default):**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
```

**Disabled Tables:**

- `toy_images` - No RLS (controlled via parent `toys.user_id` + Supabase Storage RLS)

### RLS Policy Templates (To Be Created in P1-W2-RLS-003)

These templates show the pattern for creating RLS policies.

#### 1. Self-Access Pattern (User's Own Data)

```sql
CREATE POLICY "users_own_profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Use for:** profiles, tickets, consent_records

#### 2. Public Read Pattern (Listings)

```sql
CREATE POLICY "public_can_read_active_toys"
  ON public.toys
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "user_can_update_own_toys"
  ON public.toys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Use for:** toys (public read, owner write)

#### 3. Multi-User Access Pattern (Exchanges)

```sql
CREATE POLICY "users_see_own_exchanges"
  ON public.exchanges
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "users_can_update_own_exchanges"
  ON public.exchanges
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = owner_id);
```

**Use for:** exchanges (requester/owner access)

#### 4. Audit Trail Pattern (Immutable)

```sql
CREATE POLICY "users_see_own_transactions"
  ON public.ticket_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies (immutable)
```

**Use for:** ticket_transactions (read-only)

### Service Role Exception

The service role bypasses all RLS:

```sql
-- Service role still works with unrestricted access
-- Useful for admin operations, batch processing, scheduled jobs

-- Don't expose service role key to frontend
-- Use only in secure backend environments
```

---

## PostgREST API Integration

Supabase automatically exposes your schema as a REST API via PostgREST.

### Base URL

```
https://YOUR_PROJECT_REF.supabase.co/rest/v1/
```

### Authentication

All requests (except public reads) require `Authorization` header:

```bash
# With Auth Token (from JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-project.supabase.co/rest/v1/profiles?user_id=eq.123e4567-e89b-12d3-a456-426614174000

# With API Key (Anonymous, limited access)
curl -H "apikey: YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/toys?is_active=eq.true
```

### Common Queries

**Get User's Profile:**

```bash
GET /rest/v1/profiles?user_id=eq.USER_UUID&select=*

# Response
{
  "user_id": "...",
  "email": "user@example.com",
  "postal_code": "10115",
  "language_preference": "en"
}
```

**List Active Toys (Public):**

```bash
GET /rest/v1/toys?is_active=eq.true&select=*&limit=20

# No auth required (public read)
```

**Get User's Ticket Balance:**

```bash
GET /rest/v1/tickets?user_id=eq.USER_UUID&select=total_balance,frozen_listing_tickets,frozen_exchange_tickets

# Only visible to own user (RLS enforced)
```

**Find Toys by Category:**

```bash
GET /rest/v1/toys?is_active=eq.true&category=eq.educational&select=*&limit=10

# Composite query with filtering
```

### Supabase JS Client (Preferred)

Using the Supabase client is safer and handles auth automatically:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get user's profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single();

// List active toys
const { data: toys } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .limit(20);

// Create a ticket transaction
const { data: transaction } = await supabase
  .from('ticket_transactions')
  .insert({
    user_id: session.user.id,
    transaction_type: 'listing_created',
    amount: -1,
    reference_id: toy_id
  });
```

### API Limitations (Important)

- Max response size: ~1 MB
- Max request body: ~100 KB
- Concurrent connections: Depends on plan
- Query timeout: 30 seconds

**For large operations, use Edge Functions instead.**

---

## Real-time Subscriptions

### WebSocket Subscriptions (Realtime)

Supabase provides real-time updates via PostgreSQL logical decoding.

**Setup (Automatic in Supabase):**

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Subscribe to ticket updates
const subscription = supabase
  .channel('user_tickets')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tickets',
      filter: `user_id=eq.${session.user.id}`
    },
    (payload) => {
      console.log('Ticket updated:', payload.new);
      // Update UI with new balance
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### Realtime Events

Available event types:

```
'INSERT'   - New row created
'UPDATE'   - Row modified
'DELETE'   - Row deleted
'*'        - All events
```

### Channels to Monitor

For Toy-for-Toy:

```typescript
// 1. User's ticket balance (critical)
channel('user_tickets').on('UPDATE', { filter: `user_id=eq.${uid}` })

// 2. Incoming exchanges (important)
channel('exchanges_owner').on('*', { filter: `owner_id=eq.${uid}` })

// 3. Active toys (nice to have)
channel('toys_active').on('*', { filter: `is_active=eq.true` })

// 4. Chat messages (if implemented)
channel('chat_messages').on('INSERT', { filter: `participant_id=eq.${uid}` })
```

### Realtime Limitations

- Realtime data is best-effort (not guaranteed)
- Each WebSocket connection counts toward connection limits
- Very large broadcasts may be throttled
- Not suitable for high-frequency updates (>100/sec)

**Fallback:** Implement polling for critical updates:

```typescript
// If realtime fails, fall back to polling
let lastUpdateAt = new Date();
setInterval(async () => {
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', session.user.id)
    .gt('updated_at', lastUpdateAt.toISOString());

  if (data?.length) {
    lastUpdateAt = new Date();
    // Process updates
  }
}, 5000); // Poll every 5 seconds
```

---

## Storage Integration

### Toy Images Storage Path

Toy images are stored in Supabase Storage with RLS policies:

**Storage Path Structure:**

```
toys/
├─ {user_id}/
│  └─ {toy_id}/
│     ├─ {image_id}.jpg
│     ├─ {image_id}.jpg
│     └─ {image_id}.jpg
```

**Example Path:**

```
toys/f47ac10b-58cc-4372-a567-0e02b2c3d479/a1b2c3d4-e5f6-47a8-9b1c-2d3e4f5a6b7c/img1.jpg
```

### Database Reference

The `toy_images` table stores just the reference:

```sql
INSERT INTO toy_images (toy_id, storage_path, image_order)
VALUES (
  'a1b2c3d4-e5f6-47a8-9b1c-2d3e4f5a6b7c',
  'toys/f47ac10b-58cc-4372-a567-0e02b2c3d479/a1b2c3d4-e5f6-47a8-9b1c-2d3e4f5a6b7c/img1.jpg',
  1
);
```

### Uploading Images

```typescript
// 1. Upload to storage
const { data, error } = await supabase.storage
  .from('toys')
  .upload(`${user_id}/${toy_id}/image1.jpg`, file, {
    cacheControl: '3600',
    upsert: false
  });

// 2. Record in database
if (!error) {
  await supabase.from('toy_images').insert({
    toy_id: toy_id,
    storage_path: data.path,
    image_order: 1
  });
}
```

### Retrieving Image URLs

```typescript
// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('toys')
  .getPublicUrl('f47ac10b-58cc-4372-a567-0e02b2c3d479/a1b2c3d4-e5f6-47a8-9b1c-2d3e4f5a6b7c/img1.jpg');

// Use in <img> tag
<img src={publicUrl} alt="Toy image" />
```

### Storage RLS Policies

Storage has separate RLS policies from the database:

```sql
-- Users can only delete their own toy images
CREATE policy "Users can delete their own toy images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'toys'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Validation & Verification

### Schema Validation Script

Run the comprehensive validation test:

```bash
# Via psql
psql "postgresql://user:pass@host:5432/db" < tests/database/supabase-schema-validation.sql

# Via Supabase Dashboard
# SQL Editor → Paste content → Run
```

**Expected Output:**

```
PASS: All enum types created
PASS: All tables created
PASS: Index count sufficient
PASS: Foreign keys present
PASS: Triggers present
PASS: Cascade delete relationships present
PASS: All tables in public schema (PostgREST accessible)
```

### RLS Enable Script

```bash
# Via Supabase Dashboard
# SQL Editor → Paste from supabase/sql/enable-rls.sql → Run

# Or via CLI
psql "postgresql://user:pass@host:5432/db" < supabase/sql/enable-rls.sql
```

### Verify RLS Status

```sql
-- Check which tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected (all should be TRUE):
-- profiles          | t
-- tickets           | t
-- ticket_transactions | t
-- toys              | t
-- exchanges         | t
-- consent_records   | t
-- toy_images        | f
```

### Test PostgREST Access

```bash
# List active toys (public read - no auth needed)
curl -H "apikey: YOUR_ANON_KEY" \
  'https://your-project.supabase.co/rest/v1/toys?is_active=eq.true&select=id,description,category'

# Get own profile (requires auth)
curl -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  'https://your-project.supabase.co/rest/v1/profiles?user_id=eq.YOUR_UUID'
```

---

## Troubleshooting

### Common Issues

#### Issue: "new row violates row-level security policy"

**Cause:** RLS policies not created yet (still in deny-by-default mode)

**Solution:** Wait for P1-W2-RLS-003 to create policies, or temporarily disable RLS for testing:

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

#### Issue: "Foreign key violation: reference from auth.users not found"

**Cause:** Trying to create profiles without valid auth.users record

**Solution:** Always create profile after user signs up via Supabase Auth:

```typescript
// After signup
const { data: { user } } = await supabase.auth.signUp({ ... });

// Insert profile
await supabase.from('profiles').insert({
  user_id: user.id,
  email: user.email,
  postal_code: '10115',
  language_preference: 'en'
});
```

#### Issue: "Index does not exist"

**Cause:** Migration wasn't applied

**Solution:**

```bash
# Check migration status
npx supabase migration list

# Reapply migrations
npx supabase db push
```

#### Issue: Real-time subscriptions not working

**Cause:** Logical decoding not enabled or network issue

**Solution:**

1. Check Supabase project settings (Realtime should be enabled)
2. Verify WebSocket connection in browser console
3. Check firewall allows WebSocket connections
4. Implement polling fallback (see Real-time Subscriptions section)

#### Issue: PostgREST queries returning 403 Forbidden

**Cause:** RLS denying access (expected until policies created)

**Solution:**

1. Verify correct auth token is sent
2. Check RLS policies exist and match query
3. Use service role key for admin testing (not frontend)

### Debug Queries

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN (
  'profiles', 'tickets', 'toys', 'exchanges', 'consent_records'
);

-- Count rows in each table
SELECT 'profiles' as table_name, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'toys', COUNT(*) FROM public.toys
UNION ALL
SELECT 'exchanges', COUNT(*) FROM public.exchanges
UNION ALL
SELECT 'consent_records', COUNT(*) FROM public.consent_records;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Check constraints
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name, constraint_name;

-- Check triggers
SELECT event_object_schema, event_object_table, trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## Next Steps

1. **Local Testing:**
   - Run `npx supabase start`
   - Apply migrations with `npx supabase db push`
   - Run validation script
   - Test PostgREST queries

2. **Create RLS Policies (P1-W2-RLS-003):**
   - Create user self-access policies
   - Create public read policies for toys
   - Create exchange isolation policies
   - Test policies with real auth.users

3. **Integration Testing:**
   - Test signup flow creates profiles/tickets/consent
   - Test RLS policies with authenticated user
   - Test real-time subscriptions
   - Test storage integration

4. **API Documentation:**
   - Generate Swagger/OpenAPI from PostgREST
   - Document available endpoints
   - Provide SDK examples

---

**Document End**
