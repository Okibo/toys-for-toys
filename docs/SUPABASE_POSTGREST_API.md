# Supabase PostgREST API Guide

**Document Version:** 1.0
**Task:** P1-W1-SETUP-002
**API:** PostgREST (Auto-generated REST API)
**Base URL:** `https://YOUR_PROJECT.supabase.co/rest/v1`

## Overview

Supabase automatically exposes your PostgreSQL schema as a REST API via PostgREST. This guide covers common query patterns for Toy-for-Toy.

## Table of Contents

1. [Authentication](#authentication)
2. [Query Syntax](#query-syntax)
3. [Common Queries by Feature](#common-queries-by-feature)
4. [Examples by Table](#examples-by-table)
5. [Advanced Patterns](#advanced-patterns)
6. [Performance Tips](#performance-tips)
7. [Error Handling](#error-handling)

---

## Authentication

### Auth Header (Recommended)

Use JWT token from Supabase Auth:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://your-project.supabase.co/rest/v1/profiles?select=*"
```

**In TypeScript (Supabase Client):**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// JWT is automatically added to requests
const { data } = await supabase.from('profiles').select('*');
```

### API Key Header (Public Read-Only)

For public/anon operations:

```bash
curl -H "apikey: YOUR_ANON_KEY" \
  "https://your-project.supabase.co/rest/v1/toys?is_active=eq.true"
```

### Service Role Key (Admin/Backend)

For backend operations only:

```bash
# NEVER expose in frontend code
curl -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  "https://your-project.supabase.co/rest/v1/tickets?select=*"
```

---

## Query Syntax

### Basic SELECT

```
GET /rest/v1/{table}?select={columns}

Parameters:
  select    - Columns to return (comma-separated, * for all)
  eq        - Equal (column=eq.value)
  lt        - Less than (column=lt.value)
  gt        - Greater than (column=gt.value)
  gte       - Greater than or equal
  lte       - Less than or equal
  neq       - Not equal
  like      - Pattern match
  ilike     - Case-insensitive like
  in        - Array membership (column=in.(val1,val2))
  order     - Sort (order=column.asc or .desc)
  limit     - Max rows
  offset    - Skip rows
```

### Examples

```bash
# Get 5 active toys
GET /rest/v1/toys?is_active=eq.true&limit=5

# Get toys in category "educational"
GET /rest/v1/toys?category=eq.educational

# Get toys sorted by newest first
GET /rest/v1/toys?is_active=eq.true&order=created_at.desc&limit=10

# Get toy by exact ID
GET /rest/v1/toys?id=eq.550e8400-e29b-41d4-a716-446655440000

# Get multiple toys by ID
GET /rest/v1/toys?id=in.(550e8400-e29b-41d4-a716-446655440000,
                         6ba7b810-9dad-11d1-80b4-00c04fd430c8)
```

---

## Common Queries by Feature

### User Profile Management

```typescript
// Get own profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single();

// Update profile
const { data: updated } = await supabase
  .from('profiles')
  .update({ full_name: 'John Doe', language_preference: 'de' })
  .eq('user_id', session.user.id)
  .select()
  .single();
```

### Ticket Balance Queries

```typescript
// Check own balance
const { data: tickets } = await supabase
  .from('tickets')
  .select('total_balance, frozen_listing_tickets, frozen_exchange_tickets')
  .eq('user_id', session.user.id)
  .single();

// Available tickets = total - frozen
const available = tickets.total_balance -
  (tickets.frozen_listing_tickets + tickets.frozen_exchange_tickets);

// Get transaction history
const { data: transactions } = await supabase
  .from('ticket_transactions')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
  .limit(50);
```

### Toy Listing Queries

```typescript
// Get active toys (public discovery)
const { data: toys } = await supabase
  .from('toys')
  .select('id, description, category, age_group, condition, postal_code, created_at')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(20);

// Get toys by category
const { data: educational } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .eq('category', 'educational')
  .order('created_at', { ascending: false });

// Get toys for specific age group
const { data: toddler_toys } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .eq('age_group', '3-5');

// Search toys by description (full-text search)
const { data: search_results } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .textSearch('description', 'lego puzzle');  // FTS query

// Get user's own toys (including inactive)
const { data: my_toys } = await supabase
  .from('toys')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false });

// Create toy listing
const { data: new_toy } = await supabase
  .from('toys')
  .insert({
    user_id: session.user.id,
    category: 'educational',
    description: 'Wooden puzzle set',
    tags: ['puzzle', 'wood'],
    age_group: '3-5',
    condition: 'like_new',
    postal_code: '10115'
  })
  .select()
  .single();
```

### Exchange Queries

```typescript
// Get exchanges where I'm requester
const { data: my_requests } = await supabase
  .from('exchanges')
  .select('*')
  .eq('requester_id', session.user.id)
  .order('created_at', { ascending: false });

// Get exchanges where I'm owner
const { data: my_offers } = await supabase
  .from('exchanges')
  .select('*')
  .eq('owner_id', session.user.id)
  .order('created_at', { ascending: false });

// Get pending exchanges (awaiting owner response)
const { data: pending } = await supabase
  .from('exchanges')
  .select('*')
  .eq('status', 'pending_owner_response')
  .eq('owner_id', session.user.id)
  .lt('owner_response_deadline', 'now()');  // Overdue

// Create exchange request
const { data: exchange } = await supabase
  .from('exchanges')
  .insert({
    toy_id: toy_id,
    requester_id: session.user.id,
    owner_id: toy_owner_id,
    delivery_method: 'in_person',
    requester_message: 'I have a great toy collection!'
  })
  .select()
  .single();

// Accept exchange (owner action)
const { data: accepted } = await supabase
  .from('exchanges')
  .update({ status: 'exchange_confirmed' })
  .eq('id', exchange_id)
  .eq('owner_id', session.user.id)
  .select()
  .single();

// Confirm delivery (requester action)
const { data: confirmed } = await supabase
  .from('exchanges')
  .update({ status: 'exchange_completed' })
  .eq('id', exchange_id)
  .eq('requester_id', session.user.id)
  .select()
  .single();
```

### Consent & GDPR

```typescript
// Check if user has given consent
const { data: consents } = await supabase
  .from('consent_records')
  .select('consent_type, consent_given, timestamp')
  .eq('user_id', session.user.id)
  .is('withdrawn_at', null);

// Record consent
const { data: consent } = await supabase
  .from('consent_records')
  .insert({
    user_id: session.user.id,
    consent_type: 'privacy_policy',
    consent_given: true,
    ip_address: ipAddress,  // From request
    user_agent: userAgent   // From request
  })
  .select()
  .single();

// Withdraw consent
const { data: withdrawn } = await supabase
  .from('consent_records')
  .update({ withdrawn_at: 'now()' })
  .eq('user_id', session.user.id)
  .eq('consent_type', 'behavioral_analytics')
  .is('withdrawn_at', null)
  .select()
  .single();

// Get all consent records (audit trail)
const { data: all_consents } = await supabase
  .from('consent_records')
  .select('*')
  .eq('user_id', session.user.id)
  .order('timestamp', { ascending: false });
```

---

## Examples by Table

### PROFILES

**Get profile:**

```sql
SELECT * FROM profiles WHERE user_id = auth.uid();
```

```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', session.user.id)
  .single();
```

**Update profile:**

```typescript
const { data } = await supabase
  .from('profiles')
  .update({ full_name: 'John', postal_code: '10115' })
  .eq('user_id', session.user.id)
  .select();
```

### TICKETS

**Get balance:**

```typescript
const { data } = await supabase
  .from('tickets')
  .select('total_balance, frozen_listing_tickets, frozen_exchange_tickets')
  .eq('user_id', session.user.id)
  .single();

console.log(`Available: ${data.total_balance - (data.frozen_listing_tickets + data.frozen_exchange_tickets)}`);
```

### TICKET_TRANSACTIONS

**Get transaction history:**

```typescript
const { data: transactions } = await supabase
  .from('ticket_transactions')
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
  .limit(100);

// Group by type
const byType = transactions.reduce((acc, t) => {
  acc[t.transaction_type] = (acc[t.transaction_type] || 0) + t.amount;
  return acc;
}, {});

console.log(byType);
// { listing_created: -2, exchange_completed: 1, ... }
```

### TOYS

**List active toys:**

```typescript
const { data: toys } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Get toys with images:**

```typescript
const { data: toys } = await supabase
  .from('toys')
  .select(`
    *,
    toy_images(storage_path, image_order)
  `)
  .eq('is_active', true)
  .limit(20);

// Result:
// {
//   id: '...',
//   description: '...',
//   toy_images: [
//     { storage_path: 'toys/.../img1.jpg', image_order: 1 },
//     { storage_path: 'toys/.../img2.jpg', image_order: 2 }
//   ]
// }
```

**Filter toys:**

```typescript
// Category + age group
const { data } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .eq('category', 'educational')
  .eq('age_group', '6-8')
  .limit(20);

// By postal code (location-based)
const { data } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .eq('postal_code', '10115')
  .order('created_at', { ascending: false });

// By condition
const { data } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .in('condition', ['like_new', 'good'])
  .limit(30);

// By tag
const { data } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .contains('tags', ['lego'])  // Array contains
  .limit(20);
```

**Create toy:**

```typescript
const { data: toy } = await supabase
  .from('toys')
  .insert({
    user_id: session.user.id,
    category: 'blocks',
    description: 'Original LEGO set, barely used',
    tags: ['lego', 'building'],
    age_group: '6-8',
    condition: 'like_new',
    postal_code: '10115'
  })
  .select()
  .single();
```

**Soft delete toy:**

```typescript
const { data } = await supabase
  .from('toys')
  .update({ is_active: false })
  .eq('id', toy_id)
  .eq('user_id', session.user.id)
  .select();
```

### EXCHANGES

**Get user's exchanges:**

```typescript
// As requester
const { data: requested } = await supabase
  .from('exchanges')
  .select('*')
  .eq('requester_id', session.user.id)
  .order('created_at', { ascending: false });

// As owner
const { data: offered } = await supabase
  .from('exchanges')
  .select('*')
  .eq('owner_id', session.user.id)
  .order('created_at', { ascending: false });
```

**Get exchanges by status:**

```typescript
// Pending owner response
const { data: awaiting } = await supabase
  .from('exchanges')
  .select('*')
  .eq('owner_id', session.user.id)
  .eq('status', 'pending_owner_response')
  .order('owner_response_deadline', { ascending: true });

// In delivery
const { data: delivering } = await supabase
  .from('exchanges')
  .select('*')
  .eq('status', 'pending_delivery_confirmation')
  .or(`requester_id.eq.${uid},owner_id.eq.${uid}`)
  .order('delivery_deadline', { ascending: true });
```

**Get with toy details:**

```typescript
const { data: exchanges } = await supabase
  .from('exchanges')
  .select(`
    *,
    toys(id, description, category, condition)
  `)
  .eq('requester_id', session.user.id)
  .order('created_at', { ascending: false });
```

### CONSENT_RECORDS

**Check active consents:**

```typescript
const { data: consents } = await supabase
  .from('consent_records')
  .select('consent_type, consent_given')
  .eq('user_id', session.user.id)
  .is('withdrawn_at', null);

const hasGivenPrivacy = consents.find(c => c.consent_type === 'privacy_policy')?.consent_given;
```

---

## Advanced Patterns

### Joins (Foreign Key Traversal)

```typescript
// Get toys with owner details
const { data: toys } = await supabase
  .from('toys')
  .select(`
    *,
    profiles!user_id(full_name, postal_code)
  `)
  .eq('is_active', true)
  .limit(10);

// Result structure:
// {
//   id: '...',
//   description: '...',
//   user_id: '...',
//   profiles: {
//     full_name: 'John',
//     postal_code: '10115'
//   }
// }
```

### Nested Joins

```typescript
// Get exchanges with toy and owner details
const { data } = await supabase
  .from('exchanges')
  .select(`
    *,
    toys(description, category, condition),
    owner:owner_id(full_name, postal_code)
  `)
  .eq('requester_id', session.user.id);
```

### Aggregation (with Edge Functions)

PostgREST doesn't support native aggregation. Use Edge Functions for complex queries:

```typescript
// Instead of: SELECT COUNT(*), user_id FROM toys GROUP BY user_id

// Use Edge Function
const { data } = await supabase.functions.invoke('aggregate-toys', {
  body: { aggregate: 'count', groupBy: 'user_id' }
});
```

### Full-Text Search

```typescript
// Basic search
const { data } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .textSearch('description', 'lego puzzle blocks');

// With ranking (requires custom Edge Function)
```

### Pagination

```typescript
const PAGE_SIZE = 20;
let page = 0;

// Get page 1
const { data: page1, count } = await supabase
  .from('toys')
  .select('*', { count: 'exact' })
  .eq('is_active', true)
  .range(0, PAGE_SIZE - 1);

// Get page 2
const { data: page2 } = await supabase
  .from('toys')
  .select('*')
  .eq('is_active', true)
  .range(PAGE_SIZE, PAGE_SIZE * 2 - 1);

const totalPages = Math.ceil(count / PAGE_SIZE);
```

### Bulk Operations

```typescript
// Insert many
const { data: created } = await supabase
  .from('toy_images')
  .insert([
    { toy_id: '...', storage_path: '...', image_order: 1 },
    { toy_id: '...', storage_path: '...', image_order: 2 },
    { toy_id: '...', storage_path: '...', image_order: 3 }
  ])
  .select();

// Update many
const { data: updated } = await supabase
  .from('exchanges')
  .update({ status: 'closed' })
  .eq('status', 'pending_owner_response')
  .lt('owner_response_deadline', 'now()')
  .select();
```

---

## Performance Tips

### 1. Select Only Needed Columns

```typescript
// SLOW: Fetch entire record
await supabase.from('toys').select('*');

// FAST: Fetch only needed columns
await supabase.from('toys').select('id,description,category');
```

### 2. Use Indexes

Queries on indexed columns are fast:

```typescript
// Fast: Indexed column
await supabase.from('toys').eq('is_active', true);

// Fast: Composite index
await supabase.from('toys')
  .eq('category', 'educational')
  .eq('is_active', true);

// Slow: Non-indexed columns
await supabase.from('toys').eq('description', 'puzzle');
```

### 3. Limit Result Sets

```typescript
// FAST: Limit to 50 rows
await supabase.from('toys').select('*').limit(50);

// SLOW: Fetch all 100k toys
await supabase.from('toys').select('*');
```

### 4. Paginate Large Results

```typescript
// FAST: Paginate
const page = 5;
const pageSize = 20;
await supabase.from('toys')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1);

// SLOW: Skip/offset
await supabase.from('toys')
  .select('*')
  .offset(10000)
  .limit(20);
```

### 5. Use Realtime Subscriptions Wisely

```typescript
// GOOD: Subscribe to specific changes
channel.on(
  'postgres_changes',
  {
    event: 'UPDATE',
    table: 'tickets',
    filter: `user_id=eq.${uid}`
  },
  handler
);

// BAD: Subscribe to all changes
channel.on('postgres_changes', { event: '*', table: 'toys' }, handler);
```

---

## Error Handling

### Common Errors

```typescript
// 403: Forbidden (RLS denied access)
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', other_user_id);

  if (error?.code === 'PGRST116') {
    // RLS policy denied access
    console.log('Access denied by RLS');
  }
} catch (e) {
  console.error(e);
}

// 400: Bad request
const { data, error } = await supabase
  .from('toys')
  .select('nonexistent_column');
// error: "column 'nonexistent_column' does not exist"

// 404: Not found
const { data, error } = await supabase
  .from('nonexistent_table')
  .select('*');
// error: "relation 'nonexistent_table' does not exist"
```

### Error Pattern

```typescript
async function safeQuery<T>(
  query: Promise<{ data: T; error: any }>
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    console.error('Query failed:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

// Usage
const toys = await safeQuery(
  supabase.from('toys').select('*').eq('is_active', true)
);
```

---

**Document End**
