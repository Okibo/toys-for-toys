# RLS Supabase Integration Guide

**Document Version:** 1.0
**Date:** 2024-11-15
**Target Audience:** Backend developers, frontend developers, DevOps
**Status:** Production-Ready

## Table of Contents

1. [Overview](#overview)
2. [PostgREST API Integration](#postgrest-api-integration)
3. [Real-time Subscriptions](#real-time-subscriptions)
4. [Service Role Key Usage](#service-role-key-usage)
5. [Frontend Integration Patterns](#frontend-integration-patterns)
6. [Edge Functions Integration](#edge-functions-integration)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Testing Guide](#testing-guide)

## Overview

### How Supabase Enforces RLS

1. **Authentication**: JWT token from Supabase Auth contains `sub` (user_id)
2. **API Request**: Client sends JWT in Authorization header
3. **RLS Check**: Database evaluates policies using `auth.uid()` from JWT
4. **Row Filter**: Only matching rows returned to client
5. **Response**: Filtered results sent back to client

### RLS Architecture in Supabase

```
┌─────────────────────────────────────────────────────────────┐
│ Client Application (Web/Mobile)                             │
│ - Supabase Client SDK with JWT token                        │
└──────────────────┬──────────────────────────────────────────┘
                   │ POST /rest/v1/...
                   │ Authorization: Bearer <JWT>
                   ▼
┌──────────────────────────────────────────────────────────────┐
│ Supabase Platform                                            │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ PostgREST (RESTful API Layer)                          │  │
│ │ - Extracts JWT                                         │  │
│ │ - Sets session context (auth.uid())                    │  │
│ └────────────────┬─────────────────────────────────────┘  │
│                  │                                          │
│ ┌────────────────▼──────────────────────────────────────┐  │
│ │ PostgreSQL Database                                   │  │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ RLS Engine                                       │  │  │
│ │ │ - Evaluates policies using auth.uid() value     │  │  │
│ │ │ - Filters rows based on policy conditions       │  │  │
│ │ │ - Returns only visible rows to PostgREST        │  │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## PostgREST API Integration

### 1. How PostgREST Works with RLS

PostgREST is the RESTful API layer that sits between your client and PostgreSQL. It:

1. Receives HTTP requests
2. Extracts JWT token from Authorization header
3. Creates PostgreSQL session with `auth.uid()` set from JWT subject
4. Executes query with RLS policies active
5. Returns filtered results

### 2. JWT Token Format

```typescript
// Supabase JWT structure
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // user_id
  "email": "user@example.com",
  "email_confirmed_at": "2024-11-15T10:00:00Z",
  "phone_verified_at": null,
  "aud": "authenticated",
  "iat": 1731657600,
  "exp": 1731744000,
  "isAnonymous": false
}
```

**Key Point:** `sub` (subject) is always the user_id, used by `auth.uid()` in RLS policies.

### 3. Basic PostgREST Query with RLS

#### SELECT (Read)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Get authenticated user's profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  // RLS automatically filters: WHERE auth.uid() = user_id

// Result: Only the authenticated user's profile
console.log(data)
// [{ user_id: 'xxx', email: 'user@example.com', ... }]
```

**What happens internally:**

```sql
-- PostgREST translates to:
SET "request.jwt.claim.sub" = 'xxx'; -- From JWT token
SELECT * FROM public.profiles
-- RLS automatically adds: WHERE auth.uid() = user_id
```

#### INSERT (Create)

```typescript
// Create a new toy listing
const { data, error } = await supabase
  .from('toys')
  .insert({
    category: 'blocks',
    description: 'Wooden blocks',
    age_group: '3-5',
    condition: 'good',
    postal_code: '10115',
    // Note: user_id is NOT included - comes from auth.uid()
  })
  // RLS policy: WITH CHECK (auth.uid() = user_id)

// Result: Insert succeeds only if authenticated
```

**What happens internally:**

```sql
SET "request.jwt.claim.sub" = 'xxx';
INSERT INTO public.toys (
  category, description, age_group, condition, postal_code, user_id
) VALUES (...)
-- RLS applies WITH CHECK: user_id must = auth.uid()
-- Insert rejected if user_id != auth.uid()
```

#### UPDATE (Modify)

```typescript
// Update own toy listing
const { data, error } = await supabase
  .from('toys')
  .update({ description: 'Updated description' })
  .eq('id', toyId)
  // RLS policy: USING (auth.uid() = user_id)
  //             WITH CHECK (auth.uid() = user_id)

// Result: Update succeeds only if authenticated user owns toy
```

**What happens internally:**

```sql
SET "request.jwt.claim.sub" = 'xxx';
UPDATE public.toys
SET description = 'Updated description'
WHERE id = '...'
-- RLS USING clause finds rows where auth.uid() = user_id
-- RLS WITH CHECK ensures updated row still satisfies policy
```

#### DELETE (Remove)

```typescript
// Delete a toy listing
const { data, error } = await supabase
  .from('toys')
  .delete()
  .eq('id', toyId)
  // RLS policy: USING (FALSE) - always denied

// Result: Always rejected by RLS policy
```

### 4. Complex Queries with RLS

#### Multi-table JOIN

```typescript
// Get toys with their images
const { data, error } = await supabase
  .from('toys')
  .select(`
    id,
    description,
    toy_images(
      id,
      storage_path
    )
  `)
  // RLS on toys: Only active toys or user's own toys
  // RLS on toy_images: Only images for visible toys

// Result: Toys visible by RLS + their images (also filtered by RLS)
```

**RLS evaluation flow:**

```
1. toys table RLS: Show (is_active=TRUE OR auth.uid()=user_id)
2. toy_images RLS: For each toy, filter images
3. Join: Only return toy + images both visible to user
```

#### Filtering with Multiple Conditions

```typescript
// Find toys by category AND postal code
const { data, error } = await supabase
  .from('toys')
  .select()
  .eq('category', 'blocks')
  .eq('postal_code', '10115')
  // RLS adds: AND (is_active=TRUE OR auth.uid()=user_id)

// Result: Active toys in matching location + user's own toys
```

**Query becomes:**

```sql
SELECT * FROM public.toys
WHERE
  category = 'blocks'
  AND postal_code = '10115'
  AND (is_active=TRUE OR auth.uid()=user_id)  -- RLS added
```

### 5. PostgREST RLS Limitations & Solutions

#### Limitation 1: Cannot SELECT Other Users' Private Data

```typescript
// This WILL NOT work:
const { data } = await supabase
  .from('profiles')
  .select()
  .eq('user_id', otherUserId)
  // RLS blocks: Profile only visible to owner

// Solution: Use a public view for public data
const { data } = await supabase
  .from('public_user_profiles')  // View with limited fields
  .select()
  .eq('user_id', otherUserId)
```

#### Limitation 2: Cannot Bypass RLS from Client

```typescript
// This will NOT bypass RLS (cannot use service_role on client):
const supabase = createClient(url, SERVICE_ROLE_KEY)
// Error: SERVICE_ROLE_KEY must not be exposed to client

// Solution: Use backend API or Edge Function
```

#### Limitation 3: Unauthenticated Users Have No Access

```typescript
// Anonymous/unauthenticated user gets empty result:
const { data } = await supabase
  .from('toys')
  .select()
  // RLS blocks: auth.uid() = NULL doesn't match any policy

// Solution: Create public view with limited data (future feature)
```

## Real-time Subscriptions

### 1. How Realtime Works with RLS

Realtime subscriptions in Supabase use the same RLS engine:

```typescript
import { RealtimeClient } from '@supabase/realtime-js'

const realtime = new RealtimeClient(options)

realtime
  .channel('public:toys')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'toys'
    },
    (payload) => {
      // Receives only updates user can see (RLS applied)
      console.log('Toy updated:', payload)
    }
  )
  .subscribe()
```

**RLS Application in Realtime:**

1. Client establishes WebSocket connection with JWT
2. Client subscribes to changes on `toys` table
3. Database notifies all subscribers of changes
4. Realtime checks RLS for each subscriber
5. Only visible changes delivered to client

### 2. Subscription Patterns

#### Pattern 1: Subscribe to Own Data Changes

```typescript
// User sees changes only to their own toys
channel
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'toys',
      filter: `user_id=eq.${userId}`  // Narrow filter
    },
    (payload) => {
      // Only fires when user's toys change
    }
  )
  .subscribe()
```

**How filter improves performance:**
- Database sends only relevant changes to PostgREST
- RLS still applied as safety layer
- Reduces bandwidth (only user's data)
- Reduces Realtime message volume

#### Pattern 2: Subscribe to Public Data with RLS

```typescript
// User sees changes to all active toys (discoverable)
channel
  .on(
    'postgres_changes',
    {
      event: 'INSERT',  // Only new toy listings
      schema: 'public',
      table: 'toys'
    },
    (payload) => {
      // Receives: INSERT events for active toys
      // RLS filters: Only is_active=TRUE toys
      if (payload.new.is_active) {
        console.log('New toy available:', payload.new)
      }
    }
  )
  .subscribe()
```

#### Pattern 3: Subscribe to Exchanges

```typescript
// User sees changes to their exchanges
channel
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'exchanges',
      filter: `requester_id=eq.${userId},owner_id=eq.${userId}`
    },
    (payload) => {
      // Only updates to exchanges where user is requester or owner
      console.log('Exchange status:', payload.new.status)
    }
  )
  .subscribe()
```

### 3. Realtime Payload Structure

```typescript
// Realtime delivers changes in this structure:
{
  type: 'postgres_changes',
  table: 'toys',
  schema: 'public',
  commit_timestamp: '2024-11-15T10:00:00Z',
  eventType: 'INSERT|UPDATE|DELETE',
  new: {
    // New row values
    id: 'xxx',
    user_id: 'yyy',
    description: 'Updated description',
    ...
  },
  old: {
    // Old row values (null for INSERT)
    ...
  }
}
```

**Important:** `new` and `old` already filtered by RLS - client only sees what they can access.

### 4. Common Realtime + RLS Patterns

#### Pattern: Live Toy Discovery

```typescript
// Component: ToyDiscoveryFeed
useEffect(() => {
  // Subscribe to new active toys (what user can see)
  const subscription = supabase
    .from('toys')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'toys'
      },
      (payload) => {
        // Only active toys delivered by RLS
        setNewToys(prev => [payload.new, ...prev])
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

#### Pattern: Live Exchange Status

```typescript
// Component: ExchangeTracker
useEffect(() => {
  // User sees only their exchanges update in real-time
  const subscription = supabase
    .from('exchanges')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'exchanges'
      },
      (payload) => {
        // RLS ensures only user's exchanges delivered
        setExchange(payload.new)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [userId])
```

#### Pattern: Notification Trigger via Realtime

```typescript
// Edge Function publishes update
supabase
  .from('exchanges')
  .update({ status: 'exchange_completed' })
  .eq('id', exchangeId)

// Frontend subscribes and gets notified
supabase
  .from('exchanges')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'exchanges' },
    (payload) => {
      if (payload.new.status === 'exchange_completed') {
        // Show completion notification
        showNotification('Exchange completed!')
      }
    }
  )
  .subscribe()
```

### 5. Realtime Performance Considerations

#### Subscription Count Limits

```
Per Realtime connection:
- Max subscriptions: 100 (per socket)
- Max message rate: 1000 msg/sec
- Max bandwidth: 10 MB/min

Platform limits:
- Max concurrent Realtime connections: based on Supabase plan
```

#### Optimization Strategies

1. **Use Filters to Reduce Noise**
   ```typescript
   // Bad: Subscribe to all toys
   .on('postgres_changes', { event: '*', table: 'toys' }, ...)

   // Good: Only subscribe to user's toys
   .on('postgres_changes', {
     event: '*',
     table: 'toys',
     filter: `user_id=eq.${userId}`
   }, ...)
   ```

2. **Unsubscribe When Not Needed**
   ```typescript
   const subscription = channel.subscribe()
   // ... use subscription ...
   subscription.unsubscribe() // Clean up
   ```

3. **Batch Updates for High Volume**
   ```typescript
   // For rapid changes, batch updates to reduce message count
   const [updates, setUpdates] = useState([])

   useEffect(() => {
     const timer = setTimeout(() => {
       processUpdates(updates)
       setUpdates([])
     }, 1000) // Process every 1 second

     return () => clearTimeout(timer)
   }, [updates])
   ```

## Service Role Key Usage

### 1. When to Use Service Role

Service role key should **only** be used in:

✓ Backend API routes (Next.js `/app/api`)
✓ Edge Functions (Supabase)
✓ Cron jobs (automated tasks)
✓ Scheduled maintenance

❌ **Never** expose in:
- Browser console
- Client-side code
- Mobile app
- Public repositories
- Environment variables accessible to client

### 2. Using Service Role in Next.js Backend

```typescript
// /app/api/admin/update-toy-status/route.ts
import { createClient } from '@supabase/supabase-js'

// Use service role key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Only in backend
)

export async function POST(request: Request) {
  // Service role bypasses RLS
  const { data, error } = await supabase
    .from('toys')
    .select()
    // Returns ALL toys, not just visible ones
    // No RLS filtering applied

  if (error) throw error

  return Response.json({ data })
}
```

**Key Points:**

1. `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** (backend)
2. Never send this key to client
3. Service role operations bypass RLS entirely
4. Service role has all admin permissions

### 3. Using Service Role in Edge Functions

```typescript
// supabase/functions/process-exchanges/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // Find all pending exchanges (bypasses RLS)
  const { data: exchanges } = await supabase
    .from('exchanges')
    .select()
    .eq('status', 'pending_owner_response')
    // Returns ALL pending exchanges to process

  // Business logic to auto-close expired exchanges
  for (const exchange of exchanges) {
    if (isExpired(exchange.owner_response_deadline)) {
      await supabase
        .from('exchanges')
        .update({ status: 'closed' })
        .eq('id', exchange.id)
    }
  }

  return Response.json({ processed: exchanges.length })
})
```

### 4. Service Role vs Client RLS Comparison

| Aspect | Client (Anon Key) | Backend (Service Role) |
|--------|-------------------|------------------------|
| RLS Applied | ✓ Yes | ✗ No |
| User Auth Required | ✓ Yes | ✗ No |
| Access Level | Limited to own data | Full database access |
| Typical Use | Frontend queries | Admin operations |
| Performance | Filtered results | All rows returned |
| Security Risk | Low (RLS protected) | High (must protect key) |

## Frontend Integration Patterns

### 1. Initializing Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // Note: ANON_KEY only - client-safe
)
```

### 2. Authentication Flow

```typescript
// Components/Auth/LoginForm.tsx
import { supabase } from '@/lib/supabase'

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Login failed:', error)
    return
  }

  // JWT token automatically set in supabase client
  // All subsequent requests include this JWT
  // RLS uses auth.uid() from JWT token
}
```

### 3. User Data Access Pattern

```typescript
// hooks/useProfile.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      // RLS ensures only authenticated user's profile returned
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .single()

      if (error) {
        console.error('Failed to load profile:', error)
        return
      }

      setProfile(data)
    }

    loadProfile()
  }, [])

  return { profile, loading }
}
```

### 4. Creating Data with RLS

```typescript
// services/toyService.ts
async function createToy(toyData: ToyInput) {
  // RLS: WITH CHECK (auth.uid() = user_id)
  // system automatically sets user_id from JWT
  const { data, error } = await supabase
    .from('toys')
    .insert({
      ...toyData,
      // user_id is NOT explicitly set
      // RLS requires: user_id = auth.uid() from JWT
    })

  if (error) {
    console.error('Failed to create toy:', error)
    throw error
  }

  return data
}
```

### 5. Updating Data with RLS

```typescript
// services/toyService.ts
async function updateToy(toyId: string, updates: Partial<Toy>) {
  // RLS: USING (auth.uid() = user_id)
  // Only fetches toys where user is owner

  // RLS: WITH CHECK (auth.uid() = user_id)
  // Ensures after update, user still owns toy

  const { data, error } = await supabase
    .from('toys')
    .update(updates)
    .eq('id', toyId)

  if (error) {
    if (error.code === 'PGRST116') {
      // RLS denied access (toy doesn't belong to user)
      throw new Error('You can only update your own toys')
    }
    throw error
  }

  return data
}
```

### 6. Real-time Subscriptions in React

```typescript
// hooks/useToysRealtime.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useToysRealtime(userId: string) {
  const [toys, setToys] = useState<Toy[]>([])

  useEffect(() => {
    // Initial load
    const loadToys = async () => {
      const { data } = await supabase
        .from('toys')
        .select()
        .eq('user_id', userId)

      setToys(data || [])
    }

    loadToys()

    // Subscribe to changes
    const subscription = supabase
      .from('toys')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'toys',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Handle INSERT
          if (payload.eventType === 'INSERT') {
            setToys(prev => [payload.new as Toy, ...prev])
          }
          // Handle UPDATE
          else if (payload.eventType === 'UPDATE') {
            setToys(prev =>
              prev.map(t => t.id === payload.new.id ? payload.new : t)
            )
          }
          // Handle DELETE
          else if (payload.eventType === 'DELETE') {
            setToys(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { toys }
}
```

## Edge Functions Integration

### 1. Edge Function with Service Role

```typescript
// supabase/functions/exchange-processor/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export async function processExchanges() {
  // Service role bypasses RLS - gets all exchanges
  const { data: exchanges, error } = await supabase
    .from('exchanges')
    .select('*')
    .eq('status', 'pending_delivery_confirmation')

  if (error) throw error

  // Process each exchange
  for (const exchange of exchanges) {
    if (isDeliveryDeadlinePassed(exchange)) {
      // Update to completed
      await supabase
        .from('exchanges')
        .update({ status: 'exchange_completed' })
        .eq('id', exchange.id)

      // Publish notification
      await publishNotification(exchange)
    }
  }

  return { processed: exchanges.length }
}
```

### 2. Edge Function with User Auth

```typescript
// supabase/functions/user-specific-report/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtVerify } from 'https://esm.sh/jose@5'

Deno.serve(async (req) => {
  // Get JWT from request
  const authHeader = req.headers.get('Authorization')?.split(' ')[1]

  if (!authHeader) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify JWT
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET')!)
    const verified = await jwtVerify(authHeader, secret)
    const userId = verified.payload.sub

    // Use anon key with user's JWT to respect RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authHeader}`
          }
        }
      }
    )

    // RLS applied - user sees only their data
    const { data: exchanges } = await supabase
      .from('exchanges')
      .select('*')
      // RLS filters: requester_id=userId OR owner_id=userId

    return Response.json({ exchanges })
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }
})
```

## Security Best Practices

### 1. Protecting Service Role Key

```bash
# .env.local (NEVER commit this)
SUPABASE_SERVICE_ROLE_KEY=your_secret_key_here

# .env.example (Safe version)
SUPABASE_SERVICE_ROLE_KEY=your_secret_key_here_CHANGE_ME

# .gitignore
.env.local
.env.*.local
```

### 2. Principle of Least Privilege

```typescript
// ✓ Good: Use anon key in frontend (RLS protected)
const clientSupabase = createClient(url, anonKey)

// ✓ Good: Use service role in backend only
const adminSupabase = createClient(url, serviceRoleKey)

// ✗ Bad: Using service role in frontend
const badSupabase = createClient(url, serviceRoleKey)
// This exposes admin key to client
```

### 3. Validating RLS Denials

```typescript
// Handle RLS permission errors gracefully
async function updateOwnToy(toyId: string, data: Partial<Toy>) {
  try {
    const { data: result, error } = await supabase
      .from('toys')
      .update(data)
      .eq('id', toyId)

    if (error?.code === 'PGRST116') {
      // Row denied by RLS policy
      throw new Error('You do not have permission to update this toy')
    }

    return result
  } catch (error) {
    console.error('Update failed:', error)
    throw error
  }
}
```

### 4. Testing RLS Policies

```typescript
// tests/rls.test.ts
import { createClient } from '@supabase/supabase-js'

describe('RLS Policies', () => {
  it('should prevent reading other users profiles', async () => {
    const user1 = createClient(url, anonKey)
    const user2 = createClient(url, anonKey)

    // User 1 tries to read User 2's profile
    const { data, error } = await user1
      .from('profiles')
      .select()
      .eq('user_id', user2Id)

    expect(data).toEqual([]) // RLS filters empty result
    expect(error).not.toExist()
  })

  it('should allow users to update own profile', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: 'New Name' })
      .eq('user_id', userId)

    expect(error).not.toExist()
    expect(data).toBeDefined()
  })
})
```

## Troubleshooting

### 1. RLS Policy Not Working

**Symptoms:** User can see/modify data they shouldn't

**Debugging:**

```sql
-- Check if RLS is enabled
SELECT * FROM pg_tables
WHERE tablename = 'toys' AND schemaname = 'public';
-- Look for: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'toys';

-- Test policy logic
EXPLAIN SELECT * FROM toys
WHERE auth.uid() = user_id;
```

**Solutions:**
1. Verify RLS is enabled: `ALTER TABLE toys ENABLE ROW LEVEL SECURITY`
2. Check policy conditions are correct
3. Verify auth.uid() returns expected value in policy context

### 2. RLS Denying Access Too Strictly

**Symptoms:** User gets empty results when data should be visible

**Debugging:**

```typescript
// Check what auth.uid() returns
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user_id:', user.id)

// Try query with logging
const { data, error } = await supabase
  .from('toys')
  .select()

console.log('Results:', data)
console.log('Error:', error)
```

**Solutions:**
1. Check user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
2. Verify JWT token is valid
3. Check policy logic: `SELECT * FROM pg_policies WHERE tablename = 'toys'`
4. Verify user_id matches in both JWT and database

### 3. Realtime Not Receiving Updates

**Symptoms:** Subscription doesn't trigger when data changes

**Debugging:**

```typescript
const subscription = supabase
  .from('toys')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'toys'
  }, (payload) => {
    console.log('Change received:', payload) // Should log here
  })
  .subscribe()

// Check subscription status
console.log(subscription.state) // Should be 'joined'
```

**Solutions:**
1. Ensure Realtime is enabled in Supabase dashboard
2. Check WebSocket connection is established
3. Verify user has RLS permission to see changed rows
4. Check filter conditions are correct
5. Ensure schema/table names are correct

### 4. Service Role Key Not Working

**Symptoms:** Service role queries still respect RLS

**Debugging:**

```typescript
const supabase = createClient(url, serviceRoleKey)

// Service role should bypass RLS
const { data, error } = await supabase
  .from('profiles')
  .select()
  // Should return ALL profiles, not filtered

if (data.length === 0) {
  // Check if key is actually service role
  console.log('Might not be service role key')
}
```

**Solutions:**
1. Verify correct key is being used (check Supabase dashboard)
2. Check environment variable is set correctly
3. Ensure key is marked as "Service Role" not "Anon"
4. Restart app to reload environment variables

## Testing Guide

### 1. Unit Test RLS Policies

```typescript
// tests/integration/rls-policies.test.ts
describe('RLS Policies', () => {
  describe('profiles table', () => {
    it('user can read own profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('user_id', currentUserId)

      expect(error).toBeNull()
      expect(data?.length).toBe(1)
    })

    it('user cannot read other profiles', async () => {
      const { data } = await supabase
        .from('profiles')
        .select()
        .eq('user_id', otherUserId)

      expect(data?.length).toBe(0)
    })

    it('user can update own profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: 'New Name' })
        .eq('user_id', currentUserId)

      expect(error).toBeNull()
    })

    it('user cannot delete profile', async () => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', currentUserId)

      expect(error?.code).toBe('PGRST116')
    })
  })

  describe('toys table', () => {
    it('user sees active toys from all users', async () => {
      const { data } = await supabase
        .from('toys')
        .select()
        .eq('is_active', true)

      expect(data.length).toBeGreaterThan(0)
    })

    it('user sees only own inactive toys', async () => {
      const { data } = await supabase
        .from('toys')
        .select()
        .eq('is_active', false)
        .eq('user_id', currentUserId)

      expect(data.length).toBe(inactiveToyCount)
    })
  })
})
```

### 2. Integration Test RLS

```typescript
// tests/e2e/rls-integration.test.ts
describe('RLS Integration', () => {
  it('prevents unauthorized data access in real-time', async () => {
    const user1Client = createClient(url, anonKey)
    const user2Client = createClient(url, anonKey)

    // Sign in as different users
    await user1Client.auth.signInWithPassword({
      email: 'user1@example.com',
      password: 'password'
    })

    await user2Client.auth.signInWithPassword({
      email: 'user2@example.com',
      password: 'password'
    })

    // User 1 creates a toy
    const { data: toy } = await user1Client.from('toys').insert({
      category: 'blocks',
      description: 'Test toy',
      age_group: '3-5',
      condition: 'good',
      postal_code: '10115',
      is_active: false  // Hidden from others
    })

    // User 2 tries to see it
    const { data: toys } = await user2Client
      .from('toys')
      .select()
      .eq('id', toy.id)

    expect(toys.length).toBe(0) // RLS prevents access
  })
})
```

---

## Summary

### Key Takeaways

1. **RLS is transparent to PostgREST API** - Policies automatically applied
2. **JWT token is the key** - `auth.uid()` from JWT subject
3. **Service role bypasses RLS** - Use only in backend
4. **Realtime respects RLS** - Subscriptions filtered by policies
5. **Frontend uses anon key** - RLS-protected access
6. **Backend uses service role** - Admin bypass capability

### Checklist for Integration

- [ ] Supabase anon key used in frontend
- [ ] Service role key protected (server-side only)
- [ ] Policies tested and verified
- [ ] Real-time subscriptions use filters
- [ ] Error handling for RLS denials
- [ ] JWT token properly configured
- [ ] Edge Functions use correct key
- [ ] RLS policies match business logic

---

**Document References:**
- RLS Performance Analysis: `/docs/RLS_PERFORMANCE_ANALYSIS.md`
- RLS Validation Script: `/tests/database/rls-validation.sql`
- Supabase RLS Docs: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgREST Documentation: https://postgrest.org/

