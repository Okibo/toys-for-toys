# Ratings Tables - Quick Reference

## Files Created

### Migration

- **File:** `/supabase/migrations/20241114_0012_create_ratings_tables.sql`
- **Size:** ~650 lines with comments
- **Components:**
  - 2 tables (ratings, user_stats)
  - 1 helper function (recalculate_user_stats)
  - 3 triggers (INSERT, DELETE, UPDATE)
  - 6 indexes (5 on ratings, 1 on user_stats)

### Tests

- **File:** `/tests/database/ratings-tables.test.ts`
- **Coverage:** 30+ test cases
- **Categories:** Constraints, Triggers, Indexes, RLS readiness

### Documentation

- **Implementation:** `/docs/RATINGS_IMPLEMENTATION.md` (comprehensive guide)
- **Quick Ref:** `/docs/RATINGS_QUICK_REFERENCE.md` (this file)

## Key Implementation Details

### Ratings Table Structure

```
id: UUID (PK)
exchange_id: UUID (UNIQUE FK → exchanges)
rater_id: UUID (FK → profiles)
rated_user_id: UUID (FK → profiles)
condition_rating: INT (1-5)
communication_rating: INT (1-5)
review_text: TEXT (≤500 chars, nullable)
created_at: TIMESTAMP
```

### User Stats Table Structure

```
user_id: UUID (PK, FK → profiles)
total_exchanges: INT (≥0)
avg_condition_rating: NUMERIC(2,1) (1-5 or NULL)
avg_communication_rating: NUMERIC(2,1) (1-5 or NULL)
avg_overall_rating: NUMERIC(2,1) (1-5 or NULL)
review_count: INT (≥0)
updated_at: TIMESTAMP
```

## Constraint Enforcement

| Constraint                           | Type         | Details                 |
| ------------------------------------ | ------------ | ----------------------- |
| rater_id ≠ rated_user_id             | CHECK        | Prevents self-rating    |
| condition_rating BETWEEN 1 AND 5     | CHECK        | 5-point scale           |
| communication_rating BETWEEN 1 AND 5 | CHECK        | 5-point scale           |
| review_text LENGTH ≤ 500             | CHECK        | Character limit         |
| exchange_id UNIQUE                   | UNIQUE INDEX | One rating per exchange |

## Trigger Behavior

### INSERT Trigger

**When:** Rating inserted
**Action:** Triggers `recalculate_user_stats(rated_user_id)`
**Effect:**

- Creates user_stats row if missing
- Updates total*exchanges, avg*\* values, review_count
- Sets updated_at to CURRENT_TIMESTAMP

### DELETE Trigger

**When:** Rating deleted
**Action:** Triggers `recalculate_user_stats(rated_user_id)`
**Effect:**

- Decrements total_exchanges
- Recalculates avg\_\* values
- Sets avg\_\* to NULL if total_exchanges = 0
- Updates updated_at

### UPDATE Trigger

**When:** Rating updated (values changed)
**Action:** Triggers `recalculate_user_stats(rated_user_id)`
**Effect:**

- Recalculates all metrics
- Handles edge case if rated_user_id changes

## Aggregate Calculation Logic

```
total_exchanges = COUNT(DISTINCT exchange_id)
avg_condition_rating = AVG(condition_rating) ROUNDED TO 1 DECIMAL
avg_communication_rating = AVG(communication_rating) ROUNDED TO 1 DECIMAL
avg_overall_rating = AVG((condition_rating + communication_rating) / 2) ROUNDED TO 1 DECIMAL
review_count = COUNT(*) WHERE review_text IS NOT NULL

IF total_exchanges = 0 THEN
  avg_condition_rating = NULL
  avg_communication_rating = NULL
  avg_overall_rating = NULL
END IF
```

## Index Strategy

| Index                            | Columns                          | Use Case                   |
| -------------------------------- | -------------------------------- | -------------------------- |
| `idx_ratings_exchange_id_unique` | exchange_id                      | Enforce UNIQUE constraint  |
| `idx_ratings_rater_id`           | rater_id                         | Find ratings user gave     |
| `idx_ratings_rated_user_id`      | rated_user_id                    | Find ratings user received |
| `idx_ratings_created_at`         | created_at DESC                  | Time-based pagination      |
| `idx_ratings_rated_created`      | (rated_user_id, created_at DESC) | User's ratings timeline    |
| `idx_user_stats_updated_at`      | updated_at DESC                  | Track materialization      |

## Common Queries

### Get User's Rating Statistics

```sql
SELECT * FROM user_stats WHERE user_id = 'user-uuid';
```

### Get User's Received Ratings (Recent First)

```sql
SELECT r.*, p.full_name as rater_name
FROM ratings r
JOIN profiles p ON r.rater_id = p.id
WHERE r.rated_user_id = 'user-uuid'
ORDER BY r.created_at DESC
LIMIT 10;
```

### Get User's Given Ratings

```sql
SELECT * FROM ratings
WHERE rater_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Create a Rating

```sql
INSERT INTO ratings (exchange_id, rater_id, rated_user_id, condition_rating, communication_rating, review_text)
VALUES ('exchange-uuid', 'rater-uuid', 'rated-user-uuid', 5, 4, 'Great exchange!');
-- Triggers automatically update user_stats
```

### Check if User Has Ratings

```sql
SELECT EXISTS(SELECT 1 FROM ratings WHERE rated_user_id = 'user-uuid');
```

## Test Execution

### Run All Rating Tests

```bash
npm test -- tests/database/ratings-tables.test.ts
```

### Run Specific Test

```bash
npm test -- tests/database/ratings-tables.test.ts -t "cannot create rating with rater_id"
```

### Dry-run Before Deployment

```bash
npx supabase db push --dry-run
```

### Apply Migration

```bash
npx supabase db push
```

## Verification Steps

### 1. Verify Tables Exist

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('ratings', 'user_stats');
```

### 2. Verify Triggers Exist

```sql
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table IN ('ratings', 'user_stats');
```

### 3. Verify Indexes Exist

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('ratings', 'user_stats');
```

### 4. Verify RLS is Enabled

```sql
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('ratings', 'user_stats');
```

Should show `rowsecurity = true` for both.

### 5. Test Insert & Trigger

```sql
-- Create test rating
INSERT INTO ratings (exchange_id, rater_id, rated_user_id, condition_rating, communication_rating)
VALUES ('test-exchange-uuid', 'rater-uuid', 'rated-user-uuid', 5, 5);

-- Verify user_stats created/updated
SELECT * FROM user_stats WHERE user_id = 'rated-user-uuid';
-- Should show: total_exchanges=1, avg_condition_rating=5.0, avg_communication_rating=5.0, avg_overall_rating=5.0
```

## Next Steps (Task 2.9)

### Create RLS Policies

Location: New migration file (e.g., `20241114_0013_create_ratings_rls_policies.sql`)

**Required Policies:**

1. **Ratings - SELECT (Public Read)**

   ```sql
   CREATE POLICY "ratings_select_public" ON public.ratings
     FOR SELECT
     USING (true);
   ```

2. **Ratings - INSERT (User Only)**

   ```sql
   CREATE POLICY "ratings_insert_as_rater" ON public.ratings
     FOR INSERT
     WITH CHECK (auth.uid()::text = rater_id::text);
   ```

3. **Ratings - UPDATE (User Only)**

   ```sql
   CREATE POLICY "ratings_update_as_rater" ON public.ratings
     FOR UPDATE
     USING (auth.uid()::text = rater_id::text);
   ```

4. **Ratings - DELETE (User or Admin)**

   ```sql
   CREATE POLICY "ratings_delete_as_rater" ON public.ratings
     FOR DELETE
     USING (auth.uid()::text = rater_id::text);
   ```

5. **User Stats - SELECT (Public Read)**

   ```sql
   CREATE POLICY "user_stats_select_public" ON public.user_stats
     FOR SELECT
     USING (true);
   ```

6. **User Stats - No Writes (Trigger-Managed)**
   - No INSERT, UPDATE, or DELETE policies needed
   - Triggers manage all changes

## Performance Notes

| Operation                      | Expected Time | Bottleneck                  |
| ------------------------------ | ------------- | --------------------------- |
| INSERT rating                  | 2-5ms         | Trigger aggregation         |
| DELETE rating                  | 2-5ms         | Trigger aggregation         |
| SELECT user stats              | <0.1ms        | PK lookup                   |
| SELECT user ratings (10 limit) | <1ms          | Composite index             |
| AVG calculation (on demand)    | N/A           | Not needed (pre-calculated) |

## Constraints Summary

| Field                    | Min | Max | Format       | NULL | Unique   |
| ------------------------ | --- | --- | ------------ | ---- | -------- |
| id                       | -   | -   | UUID         | NO   | YES (PK) |
| exchange_id              | -   | -   | UUID         | NO   | YES      |
| rater_id                 | -   | -   | UUID         | NO   | NO       |
| rated_user_id            | -   | -   | UUID         | NO   | NO       |
| condition_rating         | 1   | 5   | INT          | NO   | NO       |
| communication_rating     | 1   | 5   | INT          | NO   | NO       |
| review_text              | 0   | 500 | TEXT         | YES  | NO       |
| created_at               | -   | -   | TIMESTAMP    | NO   | NO       |
| total_exchanges          | 0   | ∞   | INT          | NO   | NO       |
| avg_condition_rating     | 1.0 | 5.0 | NUMERIC(2,1) | YES  | NO       |
| avg_communication_rating | 1.0 | 5.0 | NUMERIC(2,1) | YES  | NO       |
| avg_overall_rating       | 1.0 | 5.0 | NUMERIC(2,1) | YES  | NO       |
| review_count             | 0   | ∞   | INT          | NO   | NO       |
| updated_at               | -   | -   | TIMESTAMP    | NO   | NO       |

## Troubleshooting

### Issue: "relation \"ratings\" does not exist"

**Cause:** Migration not applied
**Fix:** Run `npx supabase db push`

### Issue: Trigger not firing on insert

**Cause:** RLS policy blocking INSERT
**Fix:** Check RLS policy allows INSERT with matching rater_id

### Issue: user_stats not created

**Cause:** Trigger function has error
**Fix:** Check PostgreSQL logs: `npx supabase logs postgres`

### Issue: avg\_\* values incorrect

**Cause:** ROUNDING logic in trigger
**Fix:** Verify `ROUND(..., 1)::NUMERIC(2,1)` casting in trigger

### Issue: Constraint violation on review_text

**Cause:** review_text length > 500 chars
**Fix:** Truncate review_text in application before INSERT

## Migration Rollback

If rollback needed before RLS policies created:

```bash
# No action needed yet - migration is idempotent with "IF NOT EXISTS"
```

If rollback needed after RLS policies created:

```sql
-- Drop policies first
DROP POLICY IF EXISTS ratings_select_public ON public.ratings;
DROP POLICY IF EXISTS ratings_insert_as_rater ON public.ratings;
-- ... etc for other policies

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_user_stats_on_rating_insert ON public.ratings;
DROP TRIGGER IF EXISTS trigger_update_user_stats_on_rating_delete ON public.ratings;
DROP TRIGGER IF EXISTS trigger_update_user_stats_on_rating_update ON public.ratings;

-- Drop function
DROP FUNCTION IF EXISTS public.recalculate_user_stats(UUID);

-- Drop tables (CASCADE will handle indexes)
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
```

## References

- Full documentation: `/docs/RATINGS_IMPLEMENTATION.md`
- Test file: `/tests/database/ratings-tables.test.ts`
- Migration: `/supabase/migrations/20241114_0012_create_ratings_tables.sql`
- RLS policies (Task 2.9): To be created in `/supabase/migrations/20241114_0013_*.sql`
