# RLS Quick Reference Guide

**For:** Frontend & Backend Developers
**Updated:** 2024-11-15
**Status:** Production-Ready

## In 60 Seconds

### What is RLS?
Row-Level Security (RLS) automatically filters database queries based on the authenticated user. **Your code doesn't see what it shouldn't see.**

### How Does It Work?
```typescript
// You write this
const { data } = await supabase
  .from('toys')
  .select()

// Database automatically executes this
// SELECT * FROM toys
// WHERE (is_active = TRUE OR auth.uid() = user_id) -- <-- RLS added automatically
```

### Why Should I Care?
- **Security:** Users cannot see/modify other users' data
- **Compliance:** GDPR requirements enforced automatically
- **Performance:** Optimized with indexes (minimal overhead)
- **Simplicity:** You don't need manual access control checks

## Common Patterns

### Pattern 1: Read Own Data

```typescript
// Get authenticated user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select()
  .single()
// RLS: Returns only authenticated user's profile
```

### Pattern 2: Read Public/Discoverable Data

```typescript
// Get all active toys (anyone can see these)
const { data: toys } = await supabase
  .from('toys')
  .select('id, description, age_group')
  .eq('is_active', true)
// RLS: (is_active = TRUE OR user_id = auth.uid())
// Result: All active toys are visible
```

### Pattern 3: Create Data for Self

```typescript
// Create a toy listing
const { data, error } = await supabase
  .from('toys')
  .insert({
    category: 'blocks',
    description: 'Wooden blocks',
    age_group: '3-5',
    condition: 'good',
    postal_code: '10115'
    // Note: No user_id needed - RLS uses auth.uid()
  })
// RLS: Enforces that user_id = auth.uid()
```

### Pattern 4: Update Own Data

```typescript
// Update own toy listing
const { data, error } = await supabase
  .from('toys')
  .update({ description: 'Updated' })
  .eq('id', toyId)
// RLS: Only succeeds if you own the toy
```

### Pattern 5: Real-time Subscriptions

```typescript
// Subscribe to own toys changes
supabase
  .from('toys')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'toys',
    filter: `user_id=eq.${userId}`  // Performance: narrow filter
  }, (payload) => {
    console.log('Your toy changed:', payload)
  })
  .subscribe()
// RLS: Only own toys delivered in real-time
```

## Policy Reference

### Profiles Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Own profile only | Can't read others |
| INSERT | Denied | Auth trigger only |
| UPDATE | Own profile only | Can't modify others |
| DELETE | Denied | GDPR workflow only |

### Tickets Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Own balance only | User isolation |
| INSERT | Denied | System triggers only |
| UPDATE | Denied | Triggers manage updates |
| DELETE | Denied | Immutable |

### Toys Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Active toys + own toys | Discovery + ownership |
| INSERT | Create own toys | auto-sets user_id |
| UPDATE | Update own toys only | Can't modify others |
| DELETE | Denied | Use soft delete (is_active=false) |

### Toy_Images Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Images for visible toys | Linked to toy visibility |
| INSERT | Images for own toys | Must own the toy |
| UPDATE | Update own images | Order/metadata only |
| DELETE | Delete own images | Must own the toy |

### Exchanges Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Exchanges you're in | Requester OR owner |
| INSERT | Create exchanges | Authenticated users |
| UPDATE | Update your exchanges | Must be party to exchange |
| DELETE | Denied | Archive via status |

### Consent_Records Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Own records | GDPR audit trail |
| INSERT | Your own records | Track consent |
| UPDATE | Withdraw consent | Can't modify history |
| DELETE | Denied | Immutable (GDPR) |

### Ticket_Transactions Table
| Operation | Access | Notes |
|-----------|--------|-------|
| SELECT | Own history | Transparency |
| INSERT | Denied | System only |
| UPDATE | Denied | Immutable |
| DELETE | Denied | Immutable |

## Do's and Don'ts

### DO

✓ **Do** include user_id in WHERE clause for better performance
```typescript
const { data } = await supabase
  .from('toys')
  .select()
  .eq('user_id', userId)  // Helps with index usage
  .eq('is_active', true)
```

✓ **Do** use filters in real-time subscriptions for bandwidth
```typescript
.on('postgres_changes', {
  event: '*',
  table: 'toys',
  filter: `user_id=eq.${userId}`  // More efficient
}, ...)
```

### DON'T

✗ **Don't** use service role key in frontend
```typescript
// WRONG - never do this!
const supabase = createClient(url, SERVICE_ROLE_KEY)
// This exposes admin access
```

✗ **Don't** expect to access other users' private data
```typescript
// WRONG - RLS will block this
const { data } = await supabase
  .from('tickets')
  .select()
  .eq('user_id', otherUserId)
// Result: empty (RLS filtered)
```

## Testing RLS

### Quick Test: Can I See What I Shouldn't?

```typescript
// Sign in as User A
await supabase.auth.signInWithPassword({
  email: 'user_a@example.com',
  password: 'password'
})

// Try to read User B's profile
const { data } = await supabase
  .from('profiles')
  .select()
  .eq('user_id', userBId)

console.assert(data.length === 0, 'RLS should block this!')
```

## Common Questions

### Q: How does RLS know who I am?

**A:** From your JWT token. When you sign in, Supabase creates a JWT with your user_id. RLS uses `auth.uid()` to get your user_id from the token.

### Q: Can I see other users' public data?

**A:** Yes, if the policy allows it. Example: active toys are visible to all users via `(is_active = TRUE OR auth.uid() = user_id)`.

### Q: What if I try to hack RLS?

**A:** Can't. RLS is enforced at the database level. Every query is filtered, regardless of what your code does.

### Q: Does RLS work with real-time?

**A:** Yes. Real-time subscriptions respect RLS. You only receive updates for rows you can see.

### Q: What about performance?

**A:** Minimal overhead (5-10%) when properly indexed. All RLS filter columns are indexed.

## Links to Full Documentation

- **Integration Guide:** `docs/RLS_SUPABASE_INTEGRATION.md`
- **Performance Analysis:** `docs/RLS_PERFORMANCE_ANALYSIS.md`
- **Validation Report:** `docs/RLS_VALIDATION_REPORT.md`
- **Implementation Summary:** `docs/RLS_IMPLEMENTATION_SUMMARY.md`
- **Validation Script:** `tests/database/rls-validation.sql`

## The RLS Guarantee

```
If user A cannot see row X in the SQL query...
Then user A cannot access row X through ANY API method.

RLS is enforced at the DATABASE LEVEL.
Not the application level.
```

---

**Last Updated:** 2024-11-15
**Status:** Production-Ready
**Questions?** Check the full documentation links above.
