# Database Views Quick Reference

## View Directory

### toy_detail_view

**Purpose**: Toy listing detail page with aggregated context
**Key Columns**: photos_array (JSON), times_wishlisted, view_count, lister_avg_rating
**Joins**: 5 LEFT JOINs (profiles, user_stats, toy_photos, wishlist_items, toy_views)
**Ideal For**: Single toy detail requests, avoiding N+1 queries

### exchange_detail_view

**Purpose**: Complete exchange context with both parties
**Key Columns**: requester_name, lister_name, delivery_condition, dispute_status, ratings
**Joins**: 10 LEFT JOINs (dual profiles, dual user_stats, kids, delivery, disputes, dual ratings)
**Ideal For**: Exchange detail/timeline pages, transaction history

### user_profile_view

**Purpose**: User profile with statistics and activity
**Key Columns**: avg_overall_rating, badge_status, active_kids_count, active_toys_count
**Joins**: 4 LEFT JOINs (user_stats, kids, toys, exchanges)
**Ideal For**: Public profile pages, leaderboards, user activity dashboards

### active_wishlists_view

**Purpose**: Denormalized wishlist data for matching algorithm
**Key Columns**: toy_id, custom_wish_text, condition_preference, kid_interests
**Joins**: 2 INNER JOINs (wishlists, kids with active filter)
**Ideal For**: Matching algorithm queries, filtering by preferences

### notification_feed_view

**Purpose**: Formatted notification feed with context
**Key Columns**: type, title, body, related_toy_name, related_exchange_status
**Joins**: 2 LEFT JOINs (toys, exchanges)
**Ideal For**: User notification feeds, filtering by type

---

## Query Examples

### Get toy with all details

```sql
SELECT * FROM public.toy_detail_view WHERE id = '...'
```

### Get user exchanges with full context

```sql
SELECT * FROM public.exchange_detail_view
WHERE requester_id = '...' OR lister_id = '...'
ORDER BY created_at DESC
```

### Get user profile with stats

```sql
SELECT * FROM public.user_profile_view WHERE id = '...'
```

### Get active wishlists for matching

```sql
SELECT * FROM public.active_wishlists_view
WHERE parent_id = '...'
ORDER BY priority_order
```

### Get user notifications

```sql
SELECT * FROM public.notification_feed_view
WHERE user_id = '...' AND is_read = false
LIMIT 20
```

---

## RLS Enforcement

All views have `security_barrier = on`, which ensures:

- RLS policies from underlying tables are applied
- Views cannot bypass user data isolation
- Users automatically see only their own data

**Test**: Query view as User A, User B should see nothing

---

## Performance Notes

- All JOINs use indexed columns (no table scans)
- Aggregates use FILTER clause (no row expansion)
- Photos ordered deterministically in JSON
- Soft deletes handled efficiently with partial indexes

**Monitor**: Check PostgREST response times in Supabase Dashboard

---

## Common Issues

### No results from exchange_detail_view

- Check: Do RLS policies exist for user?
- Check: Is user requester OR lister in exchange?

### Missing photos in toy_detail_view

- Check: Are photos in toy_photos table?
- Check: Is display_order correct?

### NULL values instead of counts

- Check: This is normal (0 is returned as fallback)
- Check: COALESCE ensures no NULL counts

### Badge status is NULL

- Check: User needs avg_rating >= 4.5 AND review_count >= 10
- Check: Thresholds are configurable in SQL

---

## Testing

### Automated Tests

```bash
npm test -- views.test.ts
```

### Manual Validation

1. Open Supabase SQL Editor
2. Copy queries from `/tests/database/views-manual-test.sql`
3. Run and verify results

### RLS Verification

1. Create authenticated clients for User A and B
2. A creates exchange/toy, B queries view
3. Verify B sees nothing (RLS enforced)

---

## Implementation Files

| File                                                           | Purpose                |
| -------------------------------------------------------------- | ---------------------- |
| `/supabase/migrations/20241114_0016_create_database_views.sql` | View definitions       |
| `/tests/database/views.test.ts`                                | Jest test suite        |
| `/tests/database/views-manual-test.sql`                        | Manual SQL tests       |
| `/supabase/VIEWS_IMPLEMENTATION.md`                            | Detailed documentation |

---

## Deployment

```bash
# Apply migration
npx supabase db push

# Run tests
npm test -- views.test.ts

# Monitor performance
# Check Supabase Dashboard → PostgreSQL → Logs
```

---

Last Updated: 2024-11-14
Created By: PostgreSQL Architecture Specialist
