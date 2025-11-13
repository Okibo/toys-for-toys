# Epic: Database Schema & Core Models (Week 2-3)

## Overview
Design and implement PostgreSQL schema using Supabase, establish Row-Level Security (RLS) policies, and create database migrations.

---

## Task 2.1: Create Core Tables Schema (Users, Profiles, Kids)

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.2

### Description
Create initial database tables for user authentication, parent profiles, and child profiles with proper constraints.

### Acceptance Criteria
- [ ] `auth.users` table: Already provided by Supabase Auth (no action needed)
- [ ] `profiles` table created with:
  - `id` (UUID, PK, references auth.users.id)
  - `email` (TEXT, unique)
  - `full_name` (TEXT)
  - `language` (VARCHAR(2), default: 'en')
  - `notification_preference` (JSONB, default: null)
  - `created_at`, `updated_at` (TIMESTAMP)
- [ ] `kids` table created with:
  - `id` (UUID, PK)
  - `parent_id` (UUID, FK → profiles.id)
  - `name` (TEXT)
  - `birthdate` (DATE)
  - `age_group` (VARCHAR(10) calculated from birthdate)
  - `interests` (TEXT[], array of tags)
  - `allergies` (TEXT, optional)
  - `status` (ENUM: 'active', 'hidden', 'deleted') - soft delete
  - `created_at`, `updated_at` (TIMESTAMP)
- [ ] Indexes: On parent_id, status
- [ ] Constraints: Check age_group is valid enum

### Implementation Notes
- Use `uuid_generate_v4()` for UUIDs
- Enable RLS (but don't create policies yet; done in Task 2.4)
- Use migrations file naming: `202411130001_create_core_tables.sql`
- Create view: `user_age_groups` to categorize kids into age groups

### Testing
- `npx supabase db push` applies schema without errors
- Tables visible in Supabase Studio
- UUID generation works

---

## Task 2.2: Create Tickets & Wallet System Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1

### Description
Implement the ticket economy tables: tickets wallet, fragments, and transaction history.

### Acceptance Criteria
- [ ] `tickets` table created with:
  - `id` (UUID, PK)
  - `user_id` (UUID, unique, FK → profiles.id)
  - `balance` (INT, default: 0)
  - `available` (INT, generated: balance - frozen)
  - `frozen` (INT, default: 0)
  - `earned_from_games` (INT, default: 0) - fragments (0-4)
  - `created_at`, `updated_at` (TIMESTAMP)
- [ ] `transaction_log` table created with:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK)
  - `type` (ENUM: 'issue_starter', 'earned_exchange', 'spent_request', 'refunded', 'fragment_redeemed')
  - `amount` (INT, tickets or fragments)
  - `related_exchange_id` (UUID, nullable)
  - `notes` (TEXT)
  - `created_at` (TIMESTAMP)
- [ ] `game_fragments` table created with:
  - `id` (UUID, PK)
  - `kid_id` (UUID, FK → kids.id)
  - `game_id` (VARCHAR, e.g., 'color-match')
  - `fragments_earned` (NUMERIC, e.g., 0.5)
  - `bonus_earned` (NUMERIC, e.g., 0.25 for ad watch)
  - `timestamp` (TIMESTAMP)
- [ ] Triggers for automatic `available` calculation in `tickets` table
- [ ] Indexes on: user_id, created_at (for transaction history)

### Implementation Notes
- Trigger: Update `available = balance - frozen` whenever balance or frozen changes
- Fragment column uses NUMERIC(2, 2) to store values like 0.5, 0.25
- Transaction log is append-only (audit trail)
- No delete operations on transaction_log; use soft deletes for corrections

### Testing
- New user created → tickets table row inserted automatically (via trigger in next task)
- Fragment stored with correct precision (0.5 displays as 0.5, not 0.50000)
- Transaction logged when balance changes

---

## Task 2.3: Create Toy Listing Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1

### Description
Create tables for toy listings, inventory management, and metadata.

### Acceptance Criteria
- [ ] `toys` table created with:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK → profiles.id)
  - `name` (TEXT)
  - `description` (TEXT)
  - `category` (VARCHAR, e.g., 'toys', 'books', 'games')
  - `tags` (TEXT[], e.g., ['LEGO', 'building'])
  - `age_range` (TEXT[], e.g., ['4-7', '8-12'])
  - `condition` (ENUM: 'like_new', 'good', 'fair', 'poor')
  - `status` (ENUM: 'pending_moderation', 'active', 'unavailable', 'delisted')
  - `photos_count` (INT, default: 0)
  - `created_at`, `updated_at` (TIMESTAMP)
  - `moderation_notes` (TEXT, nullable)
- [ ] `toy_photos` table created with:
  - `id` (UUID, PK)
  - `toy_id` (UUID, FK)
  - `storage_path` (TEXT, Supabase Storage path)
  - `display_order` (INT)
  - `created_at` (TIMESTAMP)
- [ ] `toy_views` table created for analytics:
  - `id` (UUID, PK)
  - `toy_id` (UUID, FK)
  - `viewer_user_id` (UUID, nullable)
  - `viewed_at` (TIMESTAMP)
- [ ] Indexes: On user_id, status, category, tags (GIN index for array)
- [ ] Soft delete: Use status='delisted' instead of hard delete

### Implementation Notes
- Photos stored in Supabase Storage, not as BLOBs
- `photos_count` is denormalized for query performance
- Toy views tracked for analytics (matching algorithm needs popularity signal)
- Tags stored as PostgreSQL array for flexibility

### Testing
- Toy creation fails if user_id doesn't exist (FK constraint)
- Toy status can only be one of allowed enums
- Indexes created and visible in Supabase

---

## Task 2.4: Create Exchange & Escrow Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1, 2.3

### Description
Implement exchange transactions with escrow mechanism, status tracking, and dispute handling.

### Acceptance Criteria
- [ ] `exchanges` table created with:
  - `id` (UUID, PK)
  - `requester_id` (UUID, FK → profiles.id)
  - `lister_id` (UUID, FK → profiles.id)
  - `toy_id` (UUID, FK → toys.id)
  - `kid_for_id` (UUID, FK → kids.id, which child the toy is for)
  - `status` (ENUM: 'pending_request', 'accepted', 'in_transit', 'delivered', 'confirmed', 'completed', 'disputed', 'auto_completed', 'canceled')
  - `requester_message` (TEXT, optional message to lister)
  - `created_at`, `updated_at` (TIMESTAMP)
  - `accepted_at` (TIMESTAMP, nullable)
  - `delivery_confirmed_at` (TIMESTAMP, nullable)
  - `completed_at` (TIMESTAMP, nullable)
- [ ] `delivery_confirmations` table created with:
  - `id` (UUID, PK)
  - `exchange_id` (UUID, FK, unique)
  - `condition_received` (ENUM: 'like_listed', 'minor_wear', 'damage', 'missing_parts')
  - `photos_count` (INT, default: 0)
  - `notes` (TEXT, optional)
  - `confirmed_at` (TIMESTAMP)
- [ ] `disputes` table created with:
  - `id` (UUID, PK)
  - `exchange_id` (UUID, FK)
  - `reported_by_id` (UUID, FK → profiles.id)
  - `reason` (VARCHAR, e.g., 'damage', 'wrong_item', 'not_received')
  - `description` (TEXT)
  - `status` (ENUM: 'open', 'admin_review', 'resolved', 'closed')
  - `admin_notes` (TEXT, nullable)
  - `resolution` (VARCHAR, nullable, e.g., 'refund', 'accepted', 'rejected')
  - `created_at`, `updated_at` (TIMESTAMP)
- [ ] Constraints: Check status transitions are valid
- [ ] Indexes: On requester_id, lister_id, toy_id, status, created_at

### Implementation Notes
- Status enum defines valid transitions (pending_request → accepted → in_transit → etc.)
- No hard deletes on exchanges (audit trail for fraud investigation)
- Disputes created only after delivery confirmation
- Soft delete: Use status='canceled' instead of deleting

### Testing
- Exchange created with valid status
- Cannot update toy_id after exchange created
- Status transitions validate (e.g., cannot go from 'completed' to 'pending_request')

---

## Task 2.5: Create Messaging & Communication Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.4

### Description
Implement in-app messaging system scoped to exchanges only.

### Acceptance Criteria
- [ ] `exchange_messages` table created with:
  - `id` (UUID, PK)
  - `exchange_id` (UUID, FK)
  - `sender_id` (UUID, FK → profiles.id)
  - `content` (TEXT, max 500 chars)
  - `created_at` (TIMESTAMP)
  - `deleted_at` (TIMESTAMP, nullable, soft delete)
  - `is_deleted_by_sender` (BOOLEAN, default: false)
- [ ] `blocklist` table created with:
  - `id` (UUID, PK)
  - `blocker_id` (UUID, FK)
  - `blocked_id` (UUID, FK)
  - `reason` (TEXT, optional)
  - `created_at` (TIMESTAMP)
  - Constraint: blocker_id ≠ blocked_id
  - Unique: (blocker_id, blocked_id)
- [ ] Triggers:
  - Prevent messaging if sender is blocked by recipient
  - Auto-flag messages containing phone numbers, addresses, payment terms
- [ ] Indexes: On exchange_id, sender_id, created_at

### Implementation Notes
- Messages are soft-deleted (deleted_at set, not removed)
- Moderation flag stored in separate column for admins
- Blocklist is one-directional (A blocks B doesn't auto-block A)
- Retention: Delete messages 30 days after exchange completion (see Task 7.x for background job)

### Testing
- Messages sorted chronologically in exchange
- Soft delete works (message still exists in DB, marked deleted)
- Cannot create message if sender blocked by recipient

---

## Task 2.6: Create Wishlist & Matching Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1, 2.3

### Description
Implement wishlist management and matching algorithm data structures.

### Acceptance Criteria
- [ ] `wishlists` table created with:
  - `id` (UUID, PK)
  - `kid_id` (UUID, FK → kids.id, unique per kid)
  - `created_at`, `updated_at` (TIMESTAMP)
- [ ] `wishlist_items` table created with:
  - `id` (UUID, PK)
  - `wishlist_id` (UUID, FK)
  - `toy_id` (UUID, FK → toys.id, nullable for custom wishes)
  - `custom_wish_text` (TEXT, nullable for user-entered wishes)
  - `category_preference` (VARCHAR, optional)
  - `tag_preferences` (TEXT[], optional)
  - `condition_preference` (ENUM: 'any', 'like_new', 'good_plus', 'good')
  - `priority_order` (INT)
  - `created_at`, `updated_at` (TIMESTAMP)
  - Constraint: Either toy_id OR custom_wish_text must be non-null (not both null)
  - Unique: (wishlist_id, display_order)
- [ ] `matching_log` table created (for analytics/debugging):
  - `id` (UUID, PK)
  - `wishlist_item_id` (UUID, FK)
  - `matched_toy_id` (UUID, FK)
  - `score` (NUMERIC(3, 2))
  - `scored_at` (TIMESTAMP)
- [ ] Indexes: On kid_id, wishlist_id, priority_order

### Implementation Notes
- Wishlists are private (not public to other users)
- Max 50 items per wishlist (enforced in API layer)
- Wishlist items are ordered by priority (drag-to-reorder on UI)
- Matching happens via daily Edge Function (not in this task; see Task 5.x)
- Matching log tracks algorithm effectiveness

### Testing
- Create wishlist for kid
- Add up to 50 items
- Order items by priority
- Cannot add custom_wish without text or toy
- Cannot add >50 items (API validation)

---

## Task 2.7: Create Notification & Preference Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1

### Description
Implement notification center, delivery tracking, and user preferences.

### Acceptance Criteria
- [ ] `notifications` table created with:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK)
  - `type` (VARCHAR, e.g., 'match_found', 'request_received', 'exchange_status', 'game_reward')
  - `title` (TEXT)
  - `body` (TEXT)
  - `related_toy_id` (UUID, nullable)
  - `related_exchange_id` (UUID, nullable)
  - `is_read` (BOOLEAN, default: false)
  - `created_at` (TIMESTAMP)
  - `deleted_at` (TIMESTAMP, nullable, soft delete)
- [ ] `notification_preferences` table created with:
  - `id` (UUID, PK)
  - `user_id` (UUID, unique, FK)
  - `match_found` (JSONB: {channel: 'email', frequency: 'daily_digest'})
  - `request_received` (JSONB: {channel: 'push', frequency: 'instant'})
  - `exchange_status` (JSONB: {channel: 'push', frequency: 'instant'})
  - `game_reward` (JSONB: {channel: 'in_app', frequency: 'instant'})
  - `quiet_hours_start` (TIME, e.g., '21:00')
  - `quiet_hours_end` (TIME, e.g., '08:00')
  - `updated_at` (TIMESTAMP)
- [ ] Indexes: On user_id, created_at

### Implementation Notes
- JSONB structure: `{channel: 'email'|'push'|'in_app', frequency: 'instant'|'daily_digest'|'weekly'|'never'}`
- Quiet hours respect timezone (stored per user in profile)
- Retention: 30 days, auto-delete old notifications
- Soft delete prevents accidental permanent loss

### Testing
- Notification created and visible in user's inbox
- Preferences load with defaults if first time
- Read/unread toggle works
- Soft delete doesn't return deleted notifications in queries

---

## Task 2.8: Create Ratings & Review Tables

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.4

### Description
Implement user ratings system after successful exchanges.

### Acceptance Criteria
- [ ] `ratings` table created with:
  - `id` (UUID, PK)
  - `exchange_id` (UUID, FK, unique) - one rating pair per exchange
  - `rater_id` (UUID, FK → profiles.id)
  - `rated_user_id` (UUID, FK → profiles.id)
  - `condition_rating` (INT, 1-5)
  - `communication_rating` (INT, 1-5)
  - `review_text` (TEXT, max 500 chars, nullable)
  - `created_at` (TIMESTAMP)
  - Constraint: rater_id ≠ rated_user_id
  - Constraint: created_at >= exchange.completed_at (cannot rate before completion)
- [ ] `user_stats` table (denormalized, updated by trigger):
  - `user_id` (UUID, PK, FK)
  - `total_exchanges` (INT)
  - `avg_condition_rating` (NUMERIC(2, 1))
  - `avg_communication_rating` (NUMERIC(2, 1))
  - `avg_overall_rating` (NUMERIC(2, 1))
  - `review_count` (INT)
  - `updated_at` (TIMESTAMP)
- [ ] Badge logic (computed, not stored):
  - "Trusted" badge when avg_overall_rating ≥ 4.5 AND review_count ≥ 10
  - "Rising Star" badge when recent improvement trend
- [ ] Indexes: On exchange_id, rater_id, rated_user_id, created_at

### Implementation Notes
- Ratings are mutual (both parties rate each other independently)
- Visibility rule: Both parties must rate before mutual visibility (enforced in API)
- `user_stats` denormalized for query performance (updated by trigger on INSERT into ratings)
- Badge status computed on-the-fly, not stored (can change as ratings accumulate)

### Testing
- Rating created after exchange completed
- Cannot rate before completion
- User stats calculated correctly
- Badge appears when thresholds met

---

## Task 2.9: Set Up Row-Level Security (RLS) Policies

**Status:** Pending
**Effort:** 2 days (complex security rules)
**Dependencies:** Task 2.1-2.8

### Description
Implement Row-Level Security policies to enforce data isolation at the database level.

### Acceptance Criteria
- [ ] Enable RLS on all tables
- [ ] `profiles` RLS:
  - Users can SELECT own profile
  - Users can UPDATE own profile
  - Public profiles visible for rating context (limited fields: name, avg_rating, badge)
- [ ] `kids` RLS:
  - Users can only see own children
  - Cannot update/delete; parent controls via settings only (hard delete separate workflow)
- [ ] `tickets` RLS:
  - Users can only SELECT own ticket wallet
  - System updates (not user-accessible via API)
- [ ] `toys` RLS:
  - Anyone can SELECT active/available toys
  - Users can INSERT own toys
  - Users can UPDATE/DELETE own toys only (if no active exchange)
  - Admins can SELECT pending toys for moderation
- [ ] `exchanges` RLS:
  - Users can SELECT own exchanges (as requester or lister)
  - Admins can SELECT all exchanges
  - Users cannot INSERT/UPDATE exchanges directly (API layer controls)
- [ ] `exchange_messages` RLS:
  - Users can SELECT messages in exchanges they're part of
  - Users can INSERT messages only in own exchanges
  - Users can DELETE own messages (soft delete via trigger)
- [ ] `wishlists` RLS:
  - Users can only see own wishlists
  - Wishlists never visible to other users
- [ ] `blocklist` RLS:
  - Users can only see own blocklist
  - Cannot block/unblock others (except own account)
- [ ] `notifications` RLS:
  - Users can only SELECT own notifications
  - System creates (not user-accessible for INSERT)
- [ ] `ratings` RLS:
  - Users can SELECT all ratings (for public profiles)
  - Users can INSERT ratings for exchanges they participated in
  - Users can UPDATE own ratings (within time window)

### Implementation Notes
- Use `auth.uid()` to identify current user
- Create helper function `is_admin()` for admin checks
- Test policies with multiple user sessions
- Document policy decisions in comments

### Testing
- User A cannot see User B's tickets
- User A cannot create toy in User B's account
- Rating only possible for participated exchanges
- Admin can see all exchanges
- Performance: Queries with RLS enabled still fast (<200ms)

---

## Task 2.10: Create Database Views for Common Queries

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1-2.9

### Description
Create views to optimize common queries and simplify API layer.

### Acceptance Criteria
- [ ] `toy_detail_view` created:
  - Joins toys, toy_photos, user profile, user_stats, wish count
  - Columns: toy.*, photos_array, lister_name, lister_rating, times_wishlisted
- [ ] `exchange_detail_view` created:
  - Joins exchanges, toys, profiles, ratings (if completed)
  - Returns full exchange context for detail page
- [ ] `user_profile_view` created:
  - Joins profiles, user_stats, exchange counts, kid profiles (non-deleted)
  - Used for public profile viewing
- [ ] `active_wishlists_view` created:
  - Joins wishlists, wishlist_items, kids
  - Used for matching algorithm
- [ ] `notification_feed_view` created:
  - Formatted notifications with related toy/exchange details
  - Ordered by recency

### Implementation Notes
- Views are read-only (cannot UPDATE via views; enforce in API)
- Use views to abstract complex joins from API code
- Views obey RLS policies (test thoroughly)

### Testing
- Query each view and verify results
- Verify RLS policies applied through views
- Performance check (no N+1 queries)

