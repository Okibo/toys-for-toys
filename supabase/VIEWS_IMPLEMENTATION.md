# Database Views Implementation Guide

## Overview

This document details the 5 optimized PostgreSQL views created to abstract complex joins and simplify API queries for the Toy-for-Toy platform. All views are read-only, respect RLS policies, and use LEFT JOINs for optional relationships.

## View 1: toy_detail_view

### Purpose

Optimized toy listing detail page that combines toy data with photos, ratings, wishlists, and view analytics in a single query, eliminating N+1 query problems.

### Key Design Decisions

- **JSON aggregation** for photos preserves display order using `JSON_AGG(...) ORDER BY display_order`
- **Photos array** returns empty array `[]` instead of NULL for cleaner client-side handling
- **COALESCE** for counts prevents NULL values (returns 0 instead)
- **Aggregation with GROUP BY** required for COUNT and JSON_AGG functions
- **Lister rating** pulled from user_stats with COALESCE fallback to 0 (handles users without ratings)

### Columns Returned

```
id, user_id, name, description, category, tags, age_range, condition, status,
created_at, updated_at, lister_name, lister_avg_rating, photos_array,
times_wishlisted, view_count
```

### Join Strategy

```
toys (base)
├─ LEFT profiles (lister info)
├─ LEFT user_stats (lister rating)
├─ LEFT toy_photos (aggregated into JSON array)
├─ LEFT wishlist_items (count)
└─ LEFT toy_views (count)
```

### Performance Notes

- Photos ordered in JSON to avoid client-side sorting
- Indexes on toys.user_id, toy_photos.toy_id, wishlist_items.toy_id, toy_views.toy_id enable efficient JOINs
- GROUP BY includes all non-aggregated columns

### RLS Enforcement

Inherits RLS from underlying toy table. Users can only see toys according to existing toy visibility policies.

---

## View 2: exchange_detail_view

### Purpose

Full exchange context for detail/timeline page. Aggregates exchange data with both parties' information, ratings, disputes, and delivery confirmation.

### Key Design Decisions

- **Dual profile JOINs** (requester and lister) requires aliases: `p_requester`, `p_lister`
- **Dual user_stats JOINs** for requesting party and listing party ratings: `us_requester`, `us_lister`
- **Dual rating JOINs** on rater_id matching to correctly attribute who rated whom
- **LEFT JOINs** for optional relationships: delivery_confirmations (only if delivered), disputes (only if disputed), ratings (only if completed)
- **CASE expression** for delivery_condition extraction from optional delivery_confirmations table

### Columns Returned

```
id, requester_id, lister_id, toy_id, kid_for_id, status, requester_message,
created_at, accepted_at, delivery_confirmed_at, completed_at,
toy_name, toy_condition,
requester_name, requester_rating,
lister_name, lister_rating,
kid_name, kid_age_group,
delivery_condition,
dispute_status, dispute_resolution,
requester_condition_rating_given, requester_communication_rating_given,
lister_condition_rating_given, lister_communication_rating_given
```

### Join Strategy

```
exchanges (base)
├─ LEFT toys (toy details)
├─ LEFT profiles (requester info)
├─ LEFT user_stats (requester rating)
├─ LEFT profiles (lister info) [ALIAS: p_lister]
├─ LEFT user_stats (lister rating) [ALIAS: us_lister]
├─ LEFT kids (kid info)
├─ LEFT delivery_confirmations (delivery info)
├─ LEFT disputes (dispute info)
├─ LEFT ratings (requester rating given) [WHERE rater_id = requester_id]
└─ LEFT ratings (lister rating given) [WHERE rater_id = lister_id]
```

### Performance Notes

- Dual joins to profiles require clear aliasing for query clarity
- Indexes on exchanges.requester_id, exchanges.lister_id enable efficient JOINs
- LEFT JOINs on optional relationships prevent missing data for incomplete exchanges

### RLS Enforcement

Inherits RLS from exchanges table. Users can only see exchanges where they are either requester or lister (via RLS policies).

---

## View 3: user_profile_view

### Purpose

Public user profile with aggregated statistics. Shows user info, ratings, activity counts, and computed badge status.

### Key Design Decisions

- **Badge status computed in view**: "Trusted" if avg_overall_rating >= 4.5 AND review_count >= 10
- **Only active kids counted** via filter `WHERE k.status = 'active'`
- **Only active toys counted** via filter `WHERE t.status = 'active'`
- **Completed exchanges from both sides**: WHERE status = 'completed' AND (requester_id = p.id OR lister_id = p.id)
- **COALESCE for NULL handling**: Returns 0 or NULL appropriately for users without ratings
- **GROUP BY required** for count aggregates

### Columns Returned

```
id, full_name, language,
avg_overall_rating, avg_condition_rating, avg_communication_rating,
review_count, total_exchanges,
active_kids_count, active_toys_count, completed_exchanges_count,
badge_status
```

### Join Strategy

```
profiles (base)
├─ LEFT user_stats (rating statistics)
├─ LEFT kids (active only)
├─ LEFT toys (active only)
└─ LEFT exchanges (completed only, both parties)
```

### Performance Notes

- Aggregation via COUNT(DISTINCT) for counts (prevents inflation from multiple JOINs)
- FILTER clause for selective counting (WHERE status = 'active')
- Indexes on kids.parent_id, kids.status, toys.user_id, toys.status, exchanges.requester_id, exchanges.lister_id enable efficient JOINs

### RLS Enforcement

Inherits RLS from underlying tables. Profile visibility determined by underlying profile RLS policies.

---

## View 4: active_wishlists_view

### Purpose

Denormalized wishlist data for matching algorithm. Only includes wishlists for active children.

### Key Design Decisions

- **INNER JOINs** (not LEFT) ensure only active wishlists included
- **Filter at view level**: WHERE k.status = 'active'
- **Denormalized layout** simplifies matching algorithm queries (all preference data in one row)
- **kid_interests and kid_allergies** brought in for context during matching

### Columns Returned

```
id, wishlist_id, kid_id, parent_id,
toy_id, custom_wish_text,
category_preference, tag_preferences, condition_preference, priority_order,
kid_age_group, kid_interests, kid_allergies
```

### Join Strategy

```
wishlist_items (base)
├─ INNER wishlists
├─ INNER kids (active only)
```

### Performance Notes

- INNER JOINs with filter ensure only active wishlists
- Index on wishlists.kid_id (UNIQUE constraint) provides fast lookup
- Index on wishlist_items.wishlist_id enables efficient JOIN

### RLS Enforcement

Inherits RLS from wishlist_items and kids tables. Users can only see wishlists for their own active children.

---

## View 5: notification_feed_view

### Purpose

Formatted notification feed with related context (toy, exchange). Excludes soft-deleted notifications and returns in chronological order.

### Key Design Decisions

- **Soft delete filter**: WHERE deleted_at IS NULL at view level
- **Ordered by created_at DESC** for newest notifications first
- **LEFT JOINs** for optional toy and exchange references
- **Computed related_user_id**: Extracts opposite party from exchange (if notification relates to exchange)
- **NULL handling**: Optional toy_name and exchange_status when relations don't exist

### Columns Returned

```
id, user_id, type, title, body, is_read, created_at,
related_toy_id, related_toy_name,
related_exchange_id, related_exchange_status,
related_user_id
```

### Join Strategy

```
notifications (base)
├─ LEFT toys (related toy, if related_toy_id not null)
└─ LEFT exchanges (related exchange, if related_exchange_id not null)
```

### Performance Notes

- Soft delete filter (WHERE deleted_at IS NULL) optimized by partial index `idx_notifications_not_deleted`
- ORDER BY created_at DESC uses index for efficient sorting
- CASE expression for related_user_id computes opposite party (lightweight operation)

### RLS Enforcement

Inherits RLS from notifications table. Users can only see their own notifications (user_id filtering).

---

## Implementation Details

### SQL Syntax Features Used

1. **JSON_AGG with ORDER BY**
   - Aggregates rows into JSON array while preserving order
   - Used in toy_detail_view for photo aggregation
   - `JSON_AGG(...ORDER BY display_order)`

2. **JSON_BUILD_OBJECT**
   - Constructs JSON objects from columns
   - Used to structure photo data: `JSON_BUILD_OBJECT('id', tp.id, ...)`

3. **FILTER clause**
   - Selective aggregation without WHERE affecting GROUP BY
   - Used in user_profile_view: `COUNT(...) FILTER (WHERE status = 'active')`

4. **COALESCE**
   - Provides fallback values for NULL aggregates
   - Returns 0 for missing counts, prevents NULL propagation

5. **CASE expressions**
   - Conditional logic in SELECT
   - Used for badge_status computation and related_user_id extraction

6. **Aliased JOINs**
   - Multiple JOINs to same table with different aliases
   - exchange_detail_view: `p_requester`, `p_lister` for dual profile joins

7. **DISTINCT in COUNT**
   - Prevents counting inflation from multiple JOINs
   - `COUNT(DISTINCT k.id)` for counting children without duplication

### RLS Configuration

All views include `security_barrier = on` to ensure RLS policies from underlying tables are enforced:

```sql
ALTER VIEW public.toy_detail_view SET (security_barrier = on);
-- ... repeat for all views
```

This prevents view queries from bypassing RLS policies.

### Testing Strategy

#### SQL Tests (Manual)

Run queries in `/tests/database/views-manual-test.sql`:

- Column existence verification
- Data type validation
- Aggregate correctness
- Filter verification
- Performance checks with EXPLAIN ANALYZE

#### TypeScript Tests

Run Jest tests in `/tests/database/views.test.ts`:

- Column presence and type validation
- Data range validation (ratings between 0-5)
- Constraint verification (XOR for wishlists)
- LEFT JOIN NULL handling
- RLS policy enforcement (placeholder for authenticated user tests)

### Known Limitations

1. **RLS Testing**: Full RLS enforcement tests require authenticated user context. Placeholder tests provided that can be expanded with authenticated Supabase clients.

2. **Materialized Views**: For extremely high-traffic scenarios, consider materializing these views (especially user_profile_view for leaderboards). Not included in this migration but can be added later.

3. **Badge Status Computation**: Currently in view for simplicity. For more complex badge logic, consider moving to stored procedure.

4. **Related User ID**: In notification_feed_view, assumes user was party to related exchange. Will be NULL if notification type doesn't relate to user's own exchange.

### Future Enhancements

1. **Parameterized Views**: Add LIMIT/OFFSET support for pagination at view level (requires stored procedures)
2. **Materialized Views**: Create MV for user_profile_view dashboard aggregates, refresh on schedule
3. **View Indexes**: Create indexes on frequently queried columns of views
4. **Computed Columns**: Add derived metrics (days_since_exchange, match_quality_score)
5. **Performance Monitoring**: Add query plan monitoring to identify slow views

---

## Files Created

1. **supabase/migrations/20241114_0016_create_database_views.sql**
   - Migration file containing all 5 views
   - Run via Supabase CLI: `npx supabase db push`

2. **tests/database/views.test.ts**
   - TypeScript/Jest test suite
   - Tests column existence, data types, ranges, constraints
   - Run via: `npm test -- views.test.ts`

3. **tests/database/views-manual-test.sql**
   - Manual SQL test queries
   - Run in Supabase SQL Editor for validation
   - Includes EXPLAIN ANALYZE for performance verification

---

## Deployment Checklist

- [ ] Verify migration syntax locally (test with Supabase CLI)
- [ ] Run TypeScript tests: `npm test -- views.test.ts`
- [ ] Execute manual SQL tests in test database
- [ ] Verify RLS policies with authenticated user tests
- [ ] Check EXPLAIN ANALYZE output for performance
- [ ] Test with real production-scale data if possible
- [ ] Monitor query performance post-deployment
