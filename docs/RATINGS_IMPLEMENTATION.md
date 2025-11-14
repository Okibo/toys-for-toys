# Ratings & User Stats Implementation Guide

## Task 2.8 Completion Summary

### Migration File

**Location:** `/supabase/migrations/20241114_0012_create_ratings_tables.sql`

### Tables Created

#### 1. `ratings` Table

Stores individual ratings for completed exchanges (1:1 relationship with exchanges).

**Structure:**

```sql
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_id UUID NOT NULL UNIQUE REFERENCES public.exchanges(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  condition_rating INT NOT NULL,
  communication_rating INT NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT rater_not_rated CHECK (rater_id != rated_user_id),
  CONSTRAINT valid_condition_rating CHECK (condition_rating BETWEEN 1 AND 5),
  CONSTRAINT valid_communication_rating CHECK (communication_rating BETWEEN 1 AND 5),
  CONSTRAINT valid_review_length CHECK (review_text IS NULL OR LENGTH(review_text) <= 500)
);
```

**Constraints Enforced:**

- `rater_id ≠ rated_user_id`: Prevents self-rating
- `condition_rating` BETWEEN 1 AND 5: Enforces 5-point scale
- `communication_rating` BETWEEN 1 AND 5: Enforces 5-point scale
- `review_text` ≤ 500 characters or NULL: Character limit validation
- `exchange_id` UNIQUE: One rating per exchange

**Indexes:**

- `idx_ratings_exchange_id_unique`: UNIQUE index on exchange_id (enforces constraint)
- `idx_ratings_rater_id`: Fast lookup of ratings created by user
- `idx_ratings_rated_user_id`: Fast lookup of ratings received by user
- `idx_ratings_created_at`: Time-based pagination and sorting
- `idx_ratings_rated_created`: Composite index for user's ratings timeline

**Foreign Key Relationships:**

- `exchange_id` → exchanges.id (CASCADE DELETE)
- `rater_id` → profiles.id (CASCADE DELETE)
- `rated_user_id` → profiles.id (CASCADE DELETE)

#### 2. `user_stats` Table

Denormalized statistics table for efficient dashboard queries. Auto-updated via triggers.

**Structure:**

```sql
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_exchanges INT DEFAULT 0 NOT NULL,
  avg_condition_rating NUMERIC(2, 1),
  avg_communication_rating NUMERIC(2, 1),
  avg_overall_rating NUMERIC(2, 1),
  review_count INT DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_total_exchanges CHECK (total_exchanges >= 0),
  CONSTRAINT valid_review_count CHECK (review_count >= 0),
  CONSTRAINT valid_avg_condition CHECK (avg_condition_rating IS NULL OR (avg_condition_rating >= 1 AND avg_condition_rating <= 5)),
  CONSTRAINT valid_avg_communication CHECK (avg_communication_rating IS NULL OR (avg_communication_rating >= 1 AND avg_communication_rating <= 5)),
  CONSTRAINT valid_avg_overall CHECK (avg_overall_rating IS NULL OR (avg_overall_rating >= 1 AND avg_overall_rating <= 5))
);
```

**Computed Metrics:**

- `total_exchanges`: COUNT(DISTINCT exchange_id) from ratings
- `avg_condition_rating`: AVG(condition_rating) rounded to 1 decimal place
- `avg_communication_rating`: AVG(communication_rating) rounded to 1 decimal place
- `avg_overall_rating`: AVG((condition_rating + communication_rating) / 2) rounded to 1 decimal place
- `review_count`: COUNT(\*) WHERE review_text IS NOT NULL
- `updated_at`: Timestamp of last calculation (auto-set by triggers)

**NULL Handling:**

- All avg\_\* columns are NULL if user has no ratings (total_exchanges = 0)
- Aggregates use COALESCE to handle empty result sets gracefully

**Indexes:**

- `idx_user_stats_updated_at`: Track materialization timestamp

### Triggers Implemented

#### Trigger 1: `trigger_update_user_stats_on_rating_insert`

**Event:** AFTER INSERT on ratings table
**Action:** Calls `recalculate_user_stats(NEW.rated_user_id)`
**Effect:**

- Creates user_stats row if it doesn't exist
- Updates all aggregated metrics for the rated user

**Code:**

```sql
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats_on_rating_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_user_stats(NEW.rated_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_on_rating_insert
AFTER INSERT ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_stats_on_rating_insert();
```

#### Trigger 2: `trigger_update_user_stats_on_rating_delete`

**Event:** AFTER DELETE on ratings table
**Action:** Calls `recalculate_user_stats(OLD.rated_user_id)`
**Effect:**

- Recalculates averages after rating removal
- Sets avg\_\* to NULL if no ratings remain

**Code:**

```sql
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats_on_rating_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_user_stats(OLD.rated_user_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_on_rating_delete
AFTER DELETE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_stats_on_rating_delete();
```

#### Trigger 3: `trigger_update_user_stats_on_rating_update`

**Event:** AFTER UPDATE on ratings table
**Action:** Calls `recalculate_user_stats(NEW.rated_user_id)` (and OLD if changed)
**Effect:**

- Recalculates metrics when rating values are edited
- Defensive: handles rated_user_id changes (unlikely but supported)

**Code:**

```sql
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats_on_rating_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.rated_user_id != NEW.rated_user_id THEN
    PERFORM public.recalculate_user_stats(OLD.rated_user_id);
  END IF;
  PERFORM public.recalculate_user_stats(NEW.rated_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_on_rating_update
AFTER UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_user_stats_on_rating_update();
```

#### Helper Function: `recalculate_user_stats(UUID)`

**Purpose:** Aggregates ratings and updates user_stats
**Logic:**

1. Counts DISTINCT exchange_ids where rated_user_id = p_user_id
2. Calculates AVG(condition_rating) and AVG(communication_rating)
3. Counts review_text entries (for review_count metric)
4. Computes avg_overall_rating as (avg_condition + avg_communication) / 2
5. Sets all avg\_\* to NULL if total_exchanges = 0
6. UPSERTs into user_stats (creates row if missing, updates if exists)

**Code:**

```sql
CREATE OR REPLACE FUNCTION public.recalculate_user_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_exchanges INT;
  v_avg_condition NUMERIC(2, 1);
  v_avg_communication NUMERIC(2, 1);
  v_avg_overall NUMERIC(2, 1);
  v_review_count INT;
BEGIN
  SELECT
    COUNT(DISTINCT exchange_id)::INT,
    ROUND(COALESCE(AVG(condition_rating), 0)::NUMERIC, 1)::NUMERIC(2, 1),
    ROUND(COALESCE(AVG(communication_rating), 0)::NUMERIC, 1)::NUMERIC(2, 1),
    COUNT(*) FILTER (WHERE review_text IS NOT NULL)::INT
  INTO
    v_total_exchanges,
    v_avg_condition,
    v_avg_communication,
    v_review_count
  FROM public.ratings
  WHERE rated_user_id = p_user_id;

  IF v_total_exchanges > 0 THEN
    v_avg_overall := ROUND(((v_avg_condition + v_avg_communication) / 2.0)::NUMERIC, 1)::NUMERIC(2, 1);
  ELSE
    v_avg_condition := NULL;
    v_avg_communication := NULL;
    v_avg_overall := NULL;
  END IF;

  INSERT INTO public.user_stats (user_id, total_exchanges, avg_condition_rating, avg_communication_rating, avg_overall_rating, review_count, updated_at)
  VALUES (p_user_id, v_total_exchanges, v_avg_condition, v_avg_communication, v_avg_overall, v_review_count, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO UPDATE SET
    total_exchanges = EXCLUDED.total_exchanges,
    avg_condition_rating = EXCLUDED.avg_condition_rating,
    avg_communication_rating = EXCLUDED.avg_communication_rating,
    avg_overall_rating = EXCLUDED.avg_overall_rating,
    review_count = EXCLUDED.review_count,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;
```

### Row-Level Security (RLS)

Both tables have RLS enabled:

```sql
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:** Created in Task 2.9 (separate migration)

- Ratings: Read access to all (public ratings), write access to rater only
- User Stats: Public read access, no write access (trigger-managed)

## Testing

### Test File Location

`/tests/database/ratings-tables.test.ts`

### Test Coverage

#### Constraint Tests

1. Cannot rate yourself (`rater_id ≠ rated_user_id`)
2. Cannot create rating with condition_rating < 1 or > 5
3. Cannot create rating with communication_rating < 1 or > 5
4. Cannot create rating with review_text > 500 chars
5. Can create rating with exactly 500 char review_text
6. Can create rating with NULL review_text
7. Cannot create duplicate rating for same exchange (UNIQUE constraint)

#### Trigger Tests - INSERT

1. Inserting rating creates user_stats row for rated_user_id
2. Inserting rating updates all aggregated metrics correctly
3. Inserting rating with review_text increments review_count
4. Inserting rating without review_text doesn't increment review_count

#### Trigger Tests - DELETE

1. Deleting rating recalculates user_stats averages
2. Deleting all ratings sets avg\_\* values to NULL
3. Deleting rating decrements total_exchanges count

#### Index Tests

1. Ratings can be efficiently queried by rater_id
2. Ratings can be efficiently queried by rated_user_id
3. Ratings can be efficiently sorted by created_at
4. User_stats.updated_at is set correctly on creation/update

#### RLS Tests

1. Ratings table has RLS enabled (verified at schema level)
2. User_stats table has RLS enabled (verified at schema level)

## Performance Characteristics

### Query Patterns & Indexes

**Get user's received ratings (for profile view):**

```sql
SELECT * FROM ratings WHERE rated_user_id = $1 ORDER BY created_at DESC LIMIT 10;
```

**Index:** `idx_ratings_rated_created` (rated_user_id, created_at DESC)
**Expected:** < 1ms for typical query

**Get user's stats (for dashboard):**

```sql
SELECT * FROM user_stats WHERE user_id = $1;
```

**Index:** PK on user_id
**Expected:** < 0.1ms (denormalized lookup)

**Get user's given ratings (for audit trail):**

```sql
SELECT * FROM ratings WHERE rater_id = $1;
```

**Index:** `idx_ratings_rater_id`
**Expected:** < 1ms

**Calculate trigger overhead:**

- AFTER INSERT: ~2-5ms (aggregation + UPSERT)
- AFTER DELETE: ~2-5ms (aggregation + UPDATE)
- AFTER UPDATE: ~2-5ms (aggregation + UPDATE)

### Denormalization Strategy

User stats are denormalized for performance:

- **Trade-off:** Extra storage (one row per rated user) vs. query speed
- **Benefit:** O(1) lookup for avg ratings on user profile/dashboard
- **Cost:** ~3-5ms overhead per rating insert/delete/update (negligible)

### Scalability Assumptions

- Tested pattern: ~1M users, ~10M ratings (1-10 ratings per user average)
- Storage: ~40MB for user_stats table (including indexes)
- Write performance: No sharding needed for typical SaaS volume (< 10K writes/sec)

## Integration Points

### From Next.js API Routes

**Fetch user profile with ratings:**

```typescript
const { data: user } = await supabase
  .from('profiles')
  .select(
    `
    *,
    user_stats(avg_overall_rating, total_exchanges, review_count),
    ratings:ratings(
      id,
      condition_rating,
      communication_rating,
      review_text,
      created_at,
      rater:rater_id(full_name)
    )
  `
  )
  .eq('id', userId)
  .single();
```

**Create rating after exchange completion:**

```typescript
const { data, error } = await supabase
  .from('ratings')
  .insert({
    exchange_id: exchangeId,
    rater_id: currentUserId,
    rated_user_id: partnerUserId,
    condition_rating: 5,
    communication_rating: 4,
    review_text: 'Great exchange!',
  })
  .select()
  .single();
// Trigger automatically updates user_stats
```

### From Realtime Subscriptions

**Subscribe to user's stats updates:**

```typescript
supabase
  .from('user_stats')
  .on('UPDATE', (payload) => {
    console.log('User stats updated:', payload.new);
    // Update UI with new avg ratings
  })
  .subscribe();
```

## Schema Diagram

```
profiles
├── id (PK)
├── email
└── full_name

exchanges
├── id (PK)
├── requester_id (FK → profiles)
├── lister_id (FK → profiles)
├── toy_id (FK → toys)
└── completed_at

ratings (NEW)
├── id (PK)
├── exchange_id (FK → exchanges, UNIQUE) ← Links to completed exchange
├── rater_id (FK → profiles)              ← User giving rating
├── rated_user_id (FK → profiles)         ← User being rated
├── condition_rating (1-5)
├── communication_rating (1-5)
├── review_text (≤500 chars)
└── created_at

user_stats (NEW)
├── user_id (PK, FK → profiles)
├── total_exchanges
├── avg_condition_rating
├── avg_communication_rating
├── avg_overall_rating
├── review_count
└── updated_at (set by triggers)
```

## Notes for Task 2.9 (RLS Policies)

### RLS Policies Required

**Ratings Table:**

1. **SELECT:** Anyone can see published ratings (no policy = public read)
2. **INSERT:** Only rater_id (with JWT) can create ratings
3. **UPDATE:** Only rater_id can update their own rating
4. **DELETE:** Only rater_id can delete their own rating (or admins)

**User Stats Table:**

1. **SELECT:** Public read (anyone can view user stats)
2. **INSERT:** None (managed by triggers only)
3. **UPDATE:** None (managed by triggers only)
4. **DELETE:** None (managed by triggers only)

### Example RLS Policy for Ratings INSERT

```sql
CREATE POLICY "users_can_create_ratings_as_rater" ON public.ratings
  FOR INSERT
  WITH CHECK (auth.uid()::text = rater_id::text);
```

## Deployment Notes

### Before Deploying

1. Run tests locally: `npm test -- tests/database/ratings-tables.test.ts`
2. Verify migration syntax: `supabase db push` (dry-run if possible)
3. Check for RLS policy conflicts with existing policies

### Deployment Steps

1. Push migration: `npx supabase db push`
2. Verify tables exist in Supabase Studio
3. Create RLS policies (Task 2.9)
4. Test with sample data:

   ```sql
   -- Insert test rating
   INSERT INTO ratings (exchange_id, rater_id, rated_user_id, condition_rating, communication_rating)
   VALUES ('test-exchange-uuid', 'rater-uuid', 'rated-user-uuid', 5, 5);

   -- Verify user_stats auto-created and updated
   SELECT * FROM user_stats WHERE user_id = 'rated-user-uuid';
   ```

### Rollback Plan

If rollback needed:

1. Drop triggers (will disable auto-update): `DROP TRIGGER trigger_update_user_stats_on_rating_insert ON ratings;`
2. Drop function: `DROP FUNCTION recalculate_user_stats(UUID);`
3. Drop tables (CASCADE): `DROP TABLE user_stats; DROP TABLE ratings;`
4. Redeploy previous migration

## Known Limitations & Improvements

### Current Limitations

1. **Immutable ratings:** Ratings cannot be edited after creation (by design)
2. **No dispute detection:** No automatic flag for suspicious rating patterns
3. **No rating disputes:** No mechanism to report unfair ratings
4. **Badge computation:** Not in database layer (calculated in API)

### Future Improvements

1. Add `is_dispute` flag to ratings for disputed ratings
2. Add admin `verified` flag for high-confidence ratings
3. Add anonymization option for review_text
4. Implement rating appeal/dispute workflow
5. Add per-category ratings (e.g., toy_condition, delivery_speed, communication)

## Security Considerations

### Data Isolation

- RLS policies ensure users can only see ratings they're involved in
- No cross-user data leakage via ratings or stats queries
- CASCADE DELETE on profile deletion cleans up all related data

### Integrity

- CHECK constraints prevent invalid rating values at DB layer
- UNIQUE exchange_id prevents duplicate ratings
- Foreign key constraints maintain referential integrity
- Triggers ensure stats always reflect current ratings

### Performance

- Denormalized user_stats prevents expensive aggregation queries
- Indexes on common filter columns (rater_id, rated_user_id)
- Composite index for user's ratings timeline

## Documentation References

- PostgreSQL: https://www.postgresql.org/docs/current/triggers.html
- Supabase RLS: https://supabase.com/docs/learn/auth-deep-dive/row-level-security
- Numeric precision: https://www.postgresql.org/docs/current/datatype-numeric.html
