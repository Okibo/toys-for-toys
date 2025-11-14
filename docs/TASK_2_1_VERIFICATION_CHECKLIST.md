# Task 2.1: Verification Checklist

This checklist guides you through verifying the core tables schema implementation.

## Pre-Deployment Checks

- [ ] Supabase project is active and accessible
- [ ] PostgreSQL version is 15 or higher
- [ ] No conflicting migrations or table names
- [ ] All team members have read the implementation documentation

## Migration Deployment

### Step 1: Backup Current Database (Production Only)

```bash
# For production: create backup before applying migration
# This is handled automatically by Supabase, but document it
```

### Step 2: Apply Migration

```bash
# Navigate to project root
cd /Users/pawelkalkun/Projects/private/toys-for-toys

# Apply migration to local Supabase
npx supabase db push

# Expected output:
# Migration applied successfully
# 20241114_create_core_tables.sql
```

- [ ] Migration applied without errors
- [ ] No warnings during migration
- [ ] Timestamp of migration matches 2024-11-14

### Step 3: Verify Schema in Supabase Studio

```bash
# Open Supabase Studio
# Local: http://localhost:54323
# Production: https://app.supabase.com

# Navigate to SQL Editor and run verification queries
```

#### Verification Query 1: Tables Created

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'kids');
```

**Expected Result:**

```
 table_name
 -----------
 profiles
 kids
```

- [ ] profiles table exists
- [ ] kids table exists

#### Verification Query 2: Enums Created

```sql
SELECT enum_name, enum_range(enum_name::regtype)
FROM pg_type
WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace;
```

**Expected Result:**

```
     enum_name      |       enum_range
 ------------------+----------------------
 age_group_enum     | {0-2,3-5,6-8,9-11,12-14,15+}
 kid_status_enum    | {active,hidden,deleted}
```

- [ ] age_group_enum exists with all 6 values
- [ ] kid_status_enum exists with all 3 values

#### Verification Query 3: Columns in profiles

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Expected Result:**

```
       column_name        |          data_type          | is_nullable | column_default
 ----------------------- | --------------------------- | ----------- | --------------------------------
 id                      | uuid                        | NO          |
 email                   | text                        | NO          |
 full_name               | text                        | YES         |
 language                | character varying           | NO          | 'en'::character varying
 notification_preference | jsonb                       | YES         | NULL::jsonb
 created_at              | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
 updated_at              | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
```

- [ ] id column is UUID primary key
- [ ] email column is TEXT, unique, NOT NULL
- [ ] language has default 'en'
- [ ] created_at and updated_at are TIMESTAMP WITH TIME ZONE
- [ ] notification_preference is JSONB

#### Verification Query 4: Columns in kids

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kids'
ORDER BY ordinal_position;
```

**Expected Result:**

```
    column_name     |          data_type          | is_nullable | column_default
 ------------------- | --------------------------- | ----------- | -------------------
 id                  | uuid                        | NO          | uuid_generate_v4()
 parent_id           | uuid                        | NO          |
 name                | text                        | NO          |
 birthdate           | date                        | YES         |
 age_group           | age_group_enum              | YES         |
 interests           | text[]                      | YES         | '{}'::text[]
 allergies           | text                        | YES         |
 status              | kid_status_enum             | NO          | 'active'::kid_status_enum
 created_at          | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
 updated_at          | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
```

- [ ] id column is UUID with uuid_generate_v4() default
- [ ] parent_id is UUID, NOT NULL
- [ ] birthdate is DATE
- [ ] age_group is age_group_enum
- [ ] interests is TEXT array with empty array default
- [ ] status is kid_status_enum with 'active' default
- [ ] All timestamps are TIMESTAMP WITH TIME ZONE

#### Verification Query 5: Indexes Created

```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'kids')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected Result:**

```
         indexname          | tablename |
 ----------------------- | --------- |
 idx_kids_parent_id      | kids      |
 idx_kids_parent_status  | kids      |
 idx_kids_status         | kids      |
 idx_profiles_email      | profiles  |
```

- [ ] idx_profiles_email exists
- [ ] idx_kids_parent_id exists
- [ ] idx_kids_status exists
- [ ] idx_kids_parent_status exists (composite)

#### Verification Query 6: Foreign Keys

```sql
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
WHERE table_name IN ('profiles', 'kids');
```

**Expected Result:**

```
     constraint_name      | table_name | column_name | foreign_table_name | foreign_column_name
 ----------------------- | --------- | --------- | ------------------- | -------------------
 profiles_id_fkey         | profiles  | id        | auth               | users
 kids_parent_id_fkey      | kids      | parent_id | public             | profiles
```

- [ ] profiles.id references auth.users.id
- [ ] kids.parent_id references profiles.id
- [ ] Both have ON DELETE CASCADE

#### Verification Query 7: Constraints

```sql
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('profiles', 'kids')
ORDER BY table_name, constraint_name;
```

**Expected Result:**

```
      constraint_name       | table_name | constraint_type
 ----------------------- | --------- | ----------------
 kids_pkey                | kids      | PRIMARY KEY
 kids_parent_id_fkey      | kids      | FOREIGN KEY
 valid_age_group          | kids      | CHECK
 valid_birthdate          | kids      | CHECK
 valid_status             | kids      | CHECK
 profiles_pkey            | profiles  | PRIMARY KEY
 profiles_email_key       | profiles  | UNIQUE
 profiles_id_fkey         | profiles  | FOREIGN KEY
```

- [ ] profiles has PRIMARY KEY and UNIQUE on email
- [ ] kids has PRIMARY KEY
- [ ] valid_age_group CHECK constraint
- [ ] valid_status CHECK constraint
- [ ] valid_birthdate CHECK constraint

#### Verification Query 8: RLS Status

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'kids');
```

**Expected Result:**

```
 schemaname | tablename | rowsecurity
 ---------- | --------- | -----------
 public     | profiles  | t
 public     | kids      | t
```

- [ ] profiles has rowsecurity = true
- [ ] kids has rowsecurity = true

#### Verification Query 9: View Exists

```sql
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name = 'user_age_groups';
```

**Expected Result:**

```
 table_schema |   table_name    | table_type
 ------------ | --------------- | ----------
 public       | user_age_groups | VIEW
```

- [ ] user_age_groups view exists
- [ ] View is of type VIEW

#### Verification Query 10: View Definition

```sql
SELECT view_definition
FROM information_schema.views
WHERE table_name = 'user_age_groups';
```

**Expected Result:** Should show aggregation query with:

- `parent_id`
- `age_group`
- `child_count`
- `active_child_ids`
- `active_count`
- `hidden_count`
- `deleted_count`
- `last_updated`

- [ ] View includes parent_id
- [ ] View includes age_group
- [ ] View includes COUNT aggregation
- [ ] View includes status-filtered counts
- [ ] View includes ARRAY_AGG of active child IDs

## Test Suite Verification

### Step 4: Run Test Suite

```bash
# Ensure Supabase is running
npx supabase start

# Run the test suite
npm test -- core-tables.test.ts

# Expected output: All tests pass
```

**Test Results:**

- [ ] All tests pass
- [ ] No connection errors
- [ ] No timeout errors

### Test Coverage Summary

Run with coverage:

```bash
npm test -- core-tables.test.ts --coverage
```

- [ ] UUID generation tests pass
- [ ] Foreign key constraint tests pass
- [ ] Enum validation tests pass
- [ ] Soft delete tests pass
- [ ] Index verification tests pass
- [ ] RLS enablement tests pass
- [ ] View aggregation tests pass
- [ ] Data integrity tests pass

## Data Integrity Verification

### Verify Constraints Work

```bash
# Open Supabase Studio and run:
```

#### Test 1: Duplicate Email Prevention

```sql
-- First profile (should succeed)
INSERT INTO public.profiles (id, email, full_name)
VALUES (uuid_generate_v4(), 'test@example.com', 'Test Parent')
RETURNING id, email;

-- Second profile with same email (should fail with unique constraint)
INSERT INTO public.profiles (id, email, full_name)
VALUES (uuid_generate_v4(), 'test@example.com', 'Another Parent')
RETURNING id, email;
```

- [ ] First insert succeeds
- [ ] Second insert fails with unique constraint violation

#### Test 2: Foreign Key Enforcement

```sql
-- Create parent
INSERT INTO public.profiles (id, email, full_name)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d000', 'parent@example.com', 'Parent')
RETURNING id;

-- Create child with valid parent_id (should succeed)
INSERT INTO public.kids (parent_id, name, birthdate)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d000', 'Child', '2020-01-01')
RETURNING id, parent_id;

-- Create child with invalid parent_id (should fail)
INSERT INTO public.kids (parent_id, name, birthdate)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3ffff', 'Orphan', '2020-01-01')
RETURNING id, parent_id;
```

- [ ] First insert succeeds
- [ ] Second insert fails with foreign key constraint

#### Test 3: Age Group Calculation

```sql
-- Create child with various birthdates and verify age_group
INSERT INTO public.kids (parent_id, name, birthdate)
VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d000', 'Infant', '2024-01-01'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d000', 'Preschooler', '2021-05-15'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d000', 'Schoolchild', '2017-06-20')
RETURNING name, birthdate, age_group;
```

- [ ] Infant shows age_group '0-2'
- [ ] Preschooler shows age_group '3-5'
- [ ] Schoolchild shows age_group '6-8'

#### Test 4: Soft Delete Pattern

```sql
-- Create child
INSERT INTO public.kids (parent_id, name, birthdate)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d000', 'Deletable Child', '2020-01-01')
RETURNING id, status;

-- Get the child's ID from above, then:
-- Hide child
UPDATE public.kids
SET status = 'hidden'
WHERE name = 'Deletable Child'
RETURNING id, name, status;

-- Mark for deletion
UPDATE public.kids
SET status = 'deleted'
WHERE name = 'Deletable Child'
RETURNING id, name, status;

-- Verify data still exists (not physically deleted)
SELECT id, name, status
FROM public.kids
WHERE name = 'Deletable Child';
```

- [ ] Initial status is 'active'
- [ ] Status updates to 'hidden' successfully
- [ ] Status updates to 'deleted' successfully
- [ ] Record still exists (soft delete working)

#### Test 5: View Aggregation

```sql
-- After creating multiple children with different ages:
SELECT parent_id, age_group, child_count, active_count, hidden_count, deleted_count
FROM public.user_age_groups
WHERE parent_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d000';
```

- [ ] View returns aggregated data
- [ ] child_count reflects total children
- [ ] active_count reflects only active children
- [ ] hidden_count reflects only hidden children
- [ ] deleted_count reflects only deleted children

## Performance Verification

### Step 5: Check Query Performance

```sql
-- Check index usage on parent_id query
EXPLAIN ANALYZE
SELECT * FROM public.kids
WHERE parent_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d000'
AND status = 'active';
```

- [ ] Query uses idx_kids_parent_status index
- [ ] Query execution time is acceptable (typically <1ms)
- [ ] No sequential scans on large tables

### Check Index Size

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_stat_user_indexes ON pg_indexes.indexname = pg_stat_user_indexes.relname
WHERE tablename IN ('profiles', 'kids');
```

- [ ] Index sizes are reasonable (typically <1MB for test data)
- [ ] Index bloat is minimal

## Deployment Sign-Off

### Development Environment

- [ ] Migration applied successfully to local Supabase
- [ ] All verification queries return expected results
- [ ] Test suite passes with 100% success rate
- [ ] Data integrity constraints work as expected
- [ ] Query performance meets expectations
- [ ] Documentation is complete and accurate

### Staging Environment (if applicable)

- [ ] Migration applied successfully to staging database
- [ ] Load test with staging data volume completes successfully
- [ ] RLS policies will be tested in next phase

### Production Environment (when ready)

- [ ] Database backup created before migration
- [ ] Migration applied to production database
- [ ] All verification queries pass in production
- [ ] Team notified of schema changes
- [ ] Monitoring alerts configured for table growth
- [ ] Documentation updated in knowledge base

## Rollback Plan (if needed)

If migration needs to be rolled back:

```bash
# This will undo the migration
npx supabase migration repair --status reverted 20241114_create_core_tables
```

**Rollback impact:**

- Deletes profiles and kids tables
- Removes enums and view
- Removes indexes
- All data is lost (use backup if needed)

- [ ] Rollback procedure documented
- [ ] Backup restoration procedure documented
- [ ] Team trained on rollback procedures

## Sign-Off

| Role               | Name | Date | Signature |
| ------------------ | ---- | ---- | --------- |
| Database Architect |      |      |           |
| Lead Developer     |      |      |           |
| QA Lead            |      |      |           |
| DevOps             |      |      |           |

## Next Steps

After verification is complete:

1. [ ] Schedule RLS policy implementation (Task 2.2)
2. [ ] Plan dependent table schema (tickets, exchanges, toys)
3. [ ] Create API route documentation
4. [ ] Schedule team training on new schema
5. [ ] Update system architecture diagram
6. [ ] Schedule performance baseline testing

---

**Created:** 2024-11-14
**Last Updated:** 2024-11-14
**Status:** Ready for Verification
