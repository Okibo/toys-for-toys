# Toy-for-Toy Core Database Schema Reference

**Document Version:** 1.0
**Created:** 2024-11-14
**Database:** PostgreSQL 14+ (Supabase)
**Purpose:** Complete documentation of core tables, columns, constraints, and indexes

---

## Table of Contents

1. [Enum Types](#enum-types)
2. [Tables Overview](#tables-overview)
3. [Detailed Table Specifications](#detailed-table-specifications)
4. [Constraints & Validations](#constraints--validations)
5. [Indexes & Performance](#indexes--performance)
6. [Data Relationships](#data-relationships)
7. [Migration Execution Order](#migration-execution-order)

---

## Enum Types

PostgreSQL custom types used across the schema:

### `language_preference`
Supported languages for user interface.

| Value | Description |
|-------|-------------|
| `en` | English |
| `de` | German (Deutsch) |
| `pl` | Polish (Polski) |

### `toy_category`
Categories for toy listings.

| Value | Description |
|-------|-------------|
| `blocks` | Building blocks, Lego, construction sets |
| `vehicles` | Cars, trains, planes, toy vehicles |
| `dolls` | Dolls, action figures, plushies |
| `board_games` | Board games, card games, puzzles |
| `educational` | STEM toys, learning tools |
| `sports` | Sports equipment, outdoor toys |
| `art` | Art supplies, craft kits |
| `other` | Miscellaneous toys |

### `toy_age_group`
Age ranges for toy recommendations.

| Value | Description |
|-------|-------------|
| `0-2` | Infants to 2 years |
| `3-5` | Toddlers 3-5 years |
| `6-8` | Children 6-8 years |
| `9-11` | Children 9-11 years |
| `12-14` | Teenagers 12-14 years |
| `15+` | Teenagers 15+ years |

### `toy_condition`
Physical condition of toy.

| Value | Description |
|-------|-------------|
| `like_new` | Never used or minimal use |
| `good` | Minor wear, fully functional |
| `fair` | Noticeable wear, fully functional |
| `well_loved` | Heavy wear but still usable |

### `exchange_status`
Lifecycle states of exchange transactions.

```
pending_requester_confirmation
  ↓
pending_owner_response (owner must respond within 7 days)
  ↓
exchange_confirmed (delivery_deadline set to 48 hours from now)
  ↓
pending_delivery_confirmation (waiting for receiver to confirm receipt)
  ↓
exchange_completed ✓

Alternate paths:
- exchange_confirmed → dispute_filed
- Any state → closed (cancelled or archived)
```

| Status | Duration | Meaning |
|--------|----------|---------|
| `pending_requester_confirmation` | Immediate | Requester sent request, awaiting their confirmation |
| `pending_owner_response` | Up to 7 days | Owner has up to 7 days to respond |
| `exchange_confirmed` | Up to 48 hours | Both parties confirmed, delivery in progress |
| `pending_delivery_confirmation` | Up to 48 hours | Recipient must confirm receipt |
| `exchange_completed` | N/A | Exchange finished successfully |
| `dispute_filed` | N/A | Dispute resolution in progress |
| `closed` | N/A | Exchange cancelled or archived |

### `delivery_method`
How toy will be transferred.

| Value | Description |
|-------|-------------|
| `in_person` | Hand-to-hand exchange |
| `mail` | Standard postal mail |
| `courier` | Courier/overnight service |

### `ticket_transaction_type`
Reasons for ticket balance changes.

| Type | Effect | Trigger |
|------|--------|---------|
| `listing_created` | -1 | When user creates toy listing (frozen) |
| `listing_removed` | +1 | When user deletes/archives toy (unfrozen) |
| `exchange_request` | -1 | When requester submits exchange request (frozen) |
| `exchange_declined` | +1 | When owner declines exchange (unfrozen) |
| `exchange_completed` | -1 or +1 | Requester: -1 (paid), Owner: +1 (received) |
| `mini_game_reward` | +1 | Mini-game reward completion |
| `refund` | +1 | Manual refund for dispute/error |

### `consent_type`
Types of user consents tracked for GDPR compliance.

| Type | Description | Required |
|------|-------------|----------|
| `privacy_policy` | User accepts data processing terms | Yes |
| `terms_of_service` | User accepts platform TOS | Yes |
| `behavioral_analytics` | User allows behavior tracking for ads | No (optional) |

---

## Tables Overview

| Table | Purpose | Records | Dependencies |
|-------|---------|---------|--------------|
| `profiles` | User account info | 1 per user | auth.users |
| `tickets` | Ticket balance wallet | 1 per user | profiles |
| `ticket_transactions` | Audit trail of balance changes | Many | profiles |
| `toys` | Toy listings | Variable | profiles |
| `toy_images` | Toy photos | 1-5 per toy | toys |
| `exchanges` | Exchange transactions | Variable | profiles, toys |
| `consent_records` | GDPR consent audit trail | Many | profiles |

---

## Detailed Table Specifications

### `public.profiles`

**Purpose:** Extend Supabase auth.users with additional profile data.

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `user_id` | UUID | PK, FK→auth.users, ON DELETE CASCADE | - | User identifier from auth system |
| `email` | TEXT | UNIQUE, NOT NULL, Email format CHECK | - | Email address (from auth) |
| `full_name` | TEXT | NULLABLE | NULL | Full name of parent/user |
| `language_preference` | language_preference | NOT NULL, enum | 'en' | UI language preference |
| `postal_code` | TEXT | NOT NULL, NOT EMPTY CHECK | - | Location for toy matching |
| `is_email_verified` | BOOLEAN | NOT NULL | FALSE | Email verification status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Account creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Last update (auto-trigger) |

**Indexes:**
- `idx_profiles_email` (BTREE) - Email lookups
- `idx_profiles_postal_code` (BTREE) - Location filtering
- `idx_profiles_created_at` DESC (BTREE) - Recent users
- `idx_profiles_language_pref` (BTREE) - Language-based features

**Constraints:**
- Email must be valid format: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
- Postal code cannot be empty

**Triggers:**
- `trigger_profiles_updated_at` - Auto-updates `updated_at` on any change

---

### `public.tickets`

**Purpose:** Maintain current ticket balance for each user (wallet system).

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `id` | UUID | PK | gen_random_uuid() | Ticket record ID |
| `user_id` | UUID | UNIQUE, FK→profiles.user_id, ON DELETE CASCADE | - | One record per user |
| `total_balance` | INTEGER | NOT NULL, ≥0 CHECK | 10 | Available tickets |
| `frozen_listing_tickets` | INTEGER | NOT NULL, ≥0 CHECK | 0 | Frozen by active listings |
| `frozen_exchange_tickets` | INTEGER | NOT NULL, ≥0 CHECK | 0 | Frozen by active exchanges |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Record creation |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Last update (auto-trigger) |

**Key Constraint:**
```sql
total_balance >= (frozen_listing_tickets + frozen_exchange_tickets)
```

**Indexes:**
- `idx_tickets_user_id` (BTREE) - User lookups
- `idx_tickets_total_balance` (BTREE) - Balance queries
- `idx_tickets_created_at` DESC (BTREE) - Timeline

**Triggers:**
- `trigger_tickets_updated_at` - Auto-updates `updated_at`

**Example Flows:**
```
New user (no activity):
  total_balance=10, frozen_listing=0, frozen_exchange=0

User creates 1 toy listing:
  total_balance=9, frozen_listing=1, frozen_exchange=0
  (1 ticket frozen)

User requests exchange while 1 listing active:
  total_balance=8, frozen_listing=1, frozen_exchange=1
  (2 tickets frozen total)

Exchange completed (tickets released to both parties):
  total_balance=9, frozen_listing=1, frozen_exchange=0
```

---

### `public.ticket_transactions`

**Purpose:** Audit trail of all ticket balance changes for accounting and disputes.

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `id` | UUID | PK | gen_random_uuid() | Transaction ID |
| `user_id` | UUID | FK→profiles.user_id, ON DELETE CASCADE | - | User affected |
| `transaction_type` | ticket_transaction_type | NOT NULL, enum | - | Type of change |
| `amount` | INTEGER | NOT NULL | - | Tickets ±, can be negative |
| `reference_id` | UUID | NULLABLE, UUID CHECK | NULL | Link to toy_id or exchange_id |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Transaction timestamp |

**Indexes:**
- `idx_ticket_transactions_user_id` (BTREE)
- `idx_ticket_transactions_created_at` DESC (BTREE)
- `idx_ticket_transactions_type` (BTREE)
- `idx_ticket_transactions_user_created` (BTREE) - User timeline
- `idx_ticket_transactions_reference` (BTREE) - Reference lookups

---

### `public.toys`

**Purpose:** Toy listings available for exchange.

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `id` | UUID | PK | gen_random_uuid() | Toy listing ID |
| `user_id` | UUID | FK→profiles.user_id, ON DELETE CASCADE | - | Toy owner |
| `category` | toy_category | NOT NULL, enum | - | Toy category |
| `description` | TEXT | NOT NULL, 1-500 chars CHECK | - | Detailed description |
| `tags` | TEXT[] | 1-3 items CHECK | ARRAY[] | Discovery tags |
| `age_group` | toy_age_group | NOT NULL, enum | - | Target age range |
| `condition` | toy_condition | NOT NULL, enum | - | Physical condition |
| `postal_code` | TEXT | NOT NULL, NOT EMPTY CHECK | - | Location |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Soft delete flag |
| `frozen_listing_tickets` | INTEGER | NOT NULL, ≥0 CHECK | 1 | Always 1 if active |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Listing creation |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Last update (auto-trigger) |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, >created_at CHECK | NOW() + 90 days | Auto-expiration |

**Indexes:**
- `idx_toys_user_id` (BTREE)
- `idx_toys_category` (BTREE)
- `idx_toys_age_group` (BTREE)
- `idx_toys_postal_code` (BTREE)
- `idx_toys_is_active` (BTREE)
- `idx_toys_created_at` DESC (BTREE)
- `idx_toys_expires_at` (BTREE)
- `idx_toys_user_active` (COMPOSITE) - User's active listings
- `idx_toys_category_age_active` (COMPOSITE) - Discovery queries
- `idx_toys_postal_active` (COMPOSITE) - Location-based discovery
- `idx_toys_active_created` (COMPOSITE) - Feed/recent listings
- `idx_toys_description_fts` (GIN) - Full-text search
- `idx_toys_tags_gin` (GIN) - Array membership

**Triggers:**
- `trigger_toys_updated_at` - Auto-updates `updated_at`
- `trigger_toys_set_expires_at` - Sets 90-day expiration if null

**Example Query Patterns:**
```sql
-- Find active toys by category near postal code
SELECT * FROM toys
WHERE is_active = TRUE
  AND category = 'educational'
  AND age_group = '6-8'
  AND postal_code = '10115'
ORDER BY created_at DESC;

-- Full-text search
SELECT * FROM toys
WHERE is_active = TRUE
  AND to_tsvector('english', description) @@ plainto_tsquery('educational puzzle')
LIMIT 20;
```

---

### `public.toy_images`

**Purpose:** Store references to toy photos in Supabase Storage.

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `id` | UUID | PK | gen_random_uuid() | Image record ID |
| `toy_id` | UUID | FK→toys.id, ON DELETE CASCADE | - | Referenced toy |
| `storage_path` | TEXT | NOT NULL, UNIQUE, NOT EMPTY CHECK | - | Path in Supabase Storage |
| `image_order` | INTEGER | NOT NULL, 1-5 CHECK, UNIQUE per toy | 1 | Display position |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Upload time |

**Constraints:**
- Max 5 images per toy (enforced via CHECK constraint)
- Only one image per `(toy_id, image_order)` pair

**Indexes:**
- `idx_toy_images_toy_id` (BTREE) - Lookup by toy
- `idx_toy_images_created_at` DESC (BTREE) - Upload timeline
- `idx_toy_images_order` (BTREE) - Carousel ordering

**Storage Path Pattern:**
```
toys/{user_id}/{toy_id}/{image_id}.jpg
Example: toys/f47ac10b-58cc-4372-a567-0e02b2c3d479/a1b2c3d4-e5f6-47a8-9b1c-2d3e4f5a6b7c/img1.jpg
```

---

### `public.exchanges`

**Purpose:** Exchange transactions between users (complex state machine).

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `id` | UUID | PK | gen_random_uuid() | Exchange ID |
| `toy_id` | UUID | FK→toys.id ON DELETE SET NULL | NULL | Requested toy (soft link) |
| `requester_id` | UUID | FK→profiles.user_id ON DELETE CASCADE | - | User requesting toy |
| `owner_id` | UUID | FK→profiles.user_id ON DELETE CASCADE | - | Toy owner |
| `status` | exchange_status | NOT NULL, enum | 'pending_requester_confirmation' | Current state |
| `delivery_method` | delivery_method | NOT NULL, enum | - | Transfer method |
| `requester_message` | TEXT | NULLABLE, ≤500 chars CHECK | NULL | Requester's message |
| `frozen_requester_tickets` | INTEGER | NOT NULL, ≥0 CHECK | 1 | Frozen from requester |
| `frozen_owner_tickets` | INTEGER | NOT NULL, ≥0 CHECK | 0 | Frozen from owner |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Request timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | Last update (auto-trigger) |
| `owner_response_deadline` | TIMESTAMP WITH TIME ZONE | NOT NULL, >created_at CHECK | NOW() + 7 days | Owner response deadline |
| `delivery_deadline` | TIMESTAMP WITH TIME ZONE | NULLABLE, >created_at CHECK | NULL | Delivery deadline (48h from confirm) |

**Key Constraints:**
- `requester_id <> owner_id` - Can't exchange with self
- `owner_response_deadline > created_at` - Always in future
- `delivery_deadline IS NULL OR delivery_deadline > created_at` - Optional, if set must be future

**Indexes:**
- `idx_exchanges_requester_id` (BTREE)
- `idx_exchanges_owner_id` (BTREE)
- `idx_exchanges_toy_id` (BTREE)
- `idx_exchanges_status` (BTREE)
- `idx_exchanges_created_at` DESC (BTREE)
- `idx_exchanges_requester_status` (COMPOSITE) - User's exchanges by status
- `idx_exchanges_owner_status` (COMPOSITE) - Owner's pending actions
- `idx_exchanges_toy_status` (COMPOSITE) - Toy's active exchanges
- `idx_exchanges_response_deadline` (BTREE) - Find expired responses
- `idx_exchanges_delivery_deadline` (BTREE) - Find overdue deliveries

**Triggers:**
- `trigger_exchanges_updated_at` - Auto-updates `updated_at`
- `trigger_exchanges_set_delivery_deadline` - Sets 48-hour deadline on confirm

**Status Flow Diagram:**
```
[pending_requester_confirmation] -- Requester confirms -->
[pending_owner_response] -- (7-day timeout) -->
  ├─ Owner accepts -->  [exchange_confirmed] -- (auto 48-hour deadline) -->
  │                       [pending_delivery_confirmation] -- Receiver confirms -->
  │                         [exchange_completed] ✓
  │
  ├─ Owner declines --> [closed]
  │
  └─ Timeout --> [closed]

Any state --> [dispute_filed] (manual escalation)
Any state --> [closed] (cancellation)
```

---

### `public.consent_records`

**Purpose:** GDPR compliance audit trail for user consents.

**Column Specifications:**

| Column | Type | Constraints | Default | Description |
|--------|------|-----------|---------|-------------|
| `id` | UUID | PK | gen_random_uuid() | Record ID |
| `user_id` | UUID | FK→profiles.user_id ON DELETE CASCADE | - | User |
| `consent_type` | consent_type | NOT NULL, enum | - | Type of consent |
| `consent_given` | BOOLEAN | NOT NULL | - | True=given, False=declined |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | When decision made |
| `ip_address` | INET | NULLABLE | NULL | IP for audit |
| `user_agent` | TEXT | NULLABLE, NOT EMPTY CHECK | NULL | Device/browser info |
| `withdrawn_at` | TIMESTAMP WITH TIME ZONE | NULLABLE, >timestamp CHECK | NULL | Withdrawal date if any |

**Unique Constraint:**
- `(user_id, consent_type)` WHERE `withdrawn_at IS NULL` - Only one active consent per type

**Indexes:**
- `idx_consent_records_user_id` (BTREE)
- `idx_consent_records_consent_type` (BTREE)
- `idx_consent_records_timestamp` DESC (BTREE)
- `idx_consent_records_consent_given` (BTREE)
- `idx_consent_records_withdrawn` (BTREE)
- `idx_consent_records_user_type` (COMPOSITE) - User's consents by type
- `idx_consent_records_user_timestamp` (COMPOSITE) - User's consent timeline
- `idx_consent_records_active` (PARTIAL) WHERE withdrawn_at IS NULL - Current active consents only

---

## Constraints & Validations

### Data Integrity Rules

| Rule | Table | SQL | Purpose |
|------|-------|-----|---------|
| Email format | profiles | `email ~* '^[A-Za-z0-9._%+-]+@...'` | Valid email addresses |
| Non-empty postal code | profiles | `TRIM(postal_code) <> ''` | Prevent blank locations |
| Non-negative balance | tickets | `total_balance >= 0` | Prevent negative tickets |
| Frozen ≤ total | tickets | `total_balance >= (frozen_listing + frozen_exchange)` | Consistency |
| Non-empty description | toys | `LENGTH(TRIM(description)) > 0 AND LENGTH(...) <= 500` | Valid toy descriptions |
| Tag array size | toys | `ARRAY_LENGTH(tags, 1) BETWEEN 1 AND 3` | 1-3 tags required |
| Expiration future | toys | `expires_at > created_at` | Always forward in time |
| Max 5 images | toy_images | `(SELECT COUNT(*) FROM toy_images ti WHERE ti.toy_id = NEW.toy_id) <= 5` | Limit storage |
| Different users | exchanges | `requester_id <> owner_id` | Can't trade with self |
| Valid deadlines | exchanges | `owner_response_deadline > created_at` AND `delivery_deadline > created_at` | Time constraints |
| Consent withdrawal | consent_records | `withdrawn_at IS NULL OR withdrawn_at > timestamp` | Forward in time |

---

## Indexes & Performance

### Index Strategy

| Category | Indexes | Purpose | Impact |
|----------|---------|---------|--------|
| **Lookups** | Single columns on FK/PK | Fast point queries | O(log N) |
| **Filtering** | Columns in WHERE clauses | Quick result sets | O(log N) |
| **Composite** | (col1, col2) pairs | Multi-column filters | O(log N) + reduced IO |
| **Full-text** | GIN on description | Keyword search | O(log N) for phrases |
| **Arrays** | GIN on tags | Array membership | O(log N) |
| **Partial** | WHERE withdrawn_at IS NULL | Filter to relevant rows | Smaller index, faster |

### Query Performance Expectations

Assuming 1M users, 2M toys, 5M exchanges:

| Query Pattern | Index | Expected Time |
|---------------|-------|----------------|
| Find user's active toys | `idx_toys_user_active` | <5ms |
| List toys by category + age + location | `idx_toys_category_age_active` | <10ms |
| Search toys by keyword | `idx_toys_description_fts` | <20ms |
| Find user's pending exchanges | `idx_exchanges_owner_status` | <5ms |
| Find overdue deliveries | `idx_exchanges_delivery_deadline` | <10ms |
| Get user's consent history | `idx_consent_records_user_timestamp` | <5ms |

### Index Maintenance

All indexes are automatically maintained by PostgreSQL. Monitor with:

```sql
-- Check index size and usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelname) DESC;
```

---

## Data Relationships

### Entity Relationship Overview

```
auth.users (Supabase)
  |
  └── profiles (1:1) -- email, language, location
       |
       ├── tickets (1:1) -- balance wallet
       |    └── ticket_transactions (1:many) -- audit trail
       |
       ├── toys (1:many) -- toy listings
       |    └── toy_images (1:many, 1-5) -- photos
       |
       ├── exchanges (many) -- as requester
       |    └── toy_id --> toys (soft link)
       |
       └── exchanges (many) -- as owner
       └── consent_records (1:many) -- GDPR audit trail
```

### Cascade Delete Behavior

| Parent Delete | Child Tables | Action |
|---------------|-------------|--------|
| `auth.users` → `profiles` | Cascade: tickets, toys, exchanges, consent_records | Everything deleted |
| `profiles` → `toys` | Cascade: toy_images, exchanges (toy_id = NULL) | Listings archived |
| `toys` → `toy_images` | Cascade: all images deleted | Photos removed |
| `toys` → `exchanges` | SET NULL on toy_id | Exchanges preserved, toy link cleared |

---

## Migration Execution Order

**All migrations are idempotent and can be run multiple times safely.**

Execute in this order:

1. **20241114_0001_create_enums.sql**
   - Creates all PostgreSQL enum types
   - Dependencies: None (Supabase auth already exists)
   - Duration: <100ms

2. **20241114_0002_create_profiles.sql**
   - Creates `profiles` table extending `auth.users`
   - Creates indexes and update trigger
   - Dependencies: auth.users (Supabase), enums
   - Duration: <500ms

3. **20241114_0003_create_tickets.sql**
   - Creates `tickets` wallet table (1 per user)
   - Creates `ticket_transactions` audit trail
   - Creates indexes and triggers
   - Dependencies: profiles
   - Duration: <500ms

4. **20241114_0004_create_toys.sql**
   - Creates `toys` listings table with comprehensive indexes
   - Creates `toy_images` table for photos
   - Creates full-text search and array indexes
   - Creates update triggers
   - Dependencies: profiles
   - Duration: <1s (many indexes)

5. **20241114_0005_create_exchanges.sql**
   - Creates `exchanges` transaction table
   - Creates status and deadline triggers
   - Creates composite indexes
   - Dependencies: profiles, toys
   - Duration: <1s

6. **20241114_0006_create_consent_records.sql**
   - Creates `consent_records` GDPR audit table
   - Creates active consent unique constraint
   - Creates partial indexes
   - Dependencies: profiles
   - Duration: <500ms

**Total Migration Time:** ~4 seconds for new database

### Testing After Migration

```sql
-- Verify all tables exist
\dt public.*

-- Verify all indexes created
\di public.*

-- Test constraints (should fail)
INSERT INTO profiles (user_id, email, postal_code)
  VALUES ('invalid-uuid', 'bad-email', '');

-- Test trigger (should auto-populate)
SELECT * FROM tickets WHERE user_id = '...';

-- Test cascade delete
DELETE FROM profiles WHERE user_id = '...';
SELECT * FROM toys WHERE user_id = '...'; -- Should be gone
```

---

## Notes for Developers

### Important Patterns

1. **Always use user_id for RLS policies** - Every table references profiles.user_id
2. **Tickets are frozen, not debited** - Balance stays same, frozen amounts track reservations
3. **Toy images must have ordered positions** - Use image_order 1-5 for carousel
4. **Exchanges have dual deadlines** - Response (7 days), then delivery (48 hours)
5. **Consent records are immutable** - Set withdrawn_at to record withdrawal, never delete
6. **Triggers maintain consistency** - updated_at, delivery_deadline, expires_at are automatic

### Backup & Recovery

```sql
-- Backup a user's data (GDPR)
SELECT * FROM profiles WHERE user_id = '...';
SELECT * FROM tickets WHERE user_id = '...';
SELECT * FROM toys WHERE user_id = '...';
SELECT * FROM exchanges WHERE requester_id = '...' OR owner_id = '...';
SELECT * FROM consent_records WHERE user_id = '...';

-- Soft delete (archive without data loss)
UPDATE toys SET is_active = FALSE WHERE id = '...';
-- Hard delete (GDPR right to be forgotten):
DELETE FROM profiles WHERE user_id = '...'; -- Cascades everything
```

### Performance Tuning

Monitor these queries periodically:

```sql
-- Largest tables (for partitioning decisions)
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size DESC;

-- Unused indexes (cleanup)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Query plans for slow queries
EXPLAIN ANALYZE SELECT ... ;
```

---

**Document End**
