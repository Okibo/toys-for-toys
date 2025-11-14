# Task P1-W1-SETUP-002: Core Database Schema & Migrations

## Task ID
P1-W1-SETUP-002

## Epic
Phase 1 Week 1-2: Project Setup & Authentication

## Title
Core Database Schema & Migrations

## Description
Create the core PostgreSQL database schema for Toy-for-Toy. This includes user profiles, tickets, toys, exchanges, and foundational tables. Migrations will be idempotent and version-controlled in Supabase migrations folder.

## Acceptance Criteria

### User & Authentication Tables
- [ ] `auth.users` table (Supabase auth table)
- [ ] `public.profiles` table with fields:
  - user_id (FK to auth.users, PK)
  - email (from auth)
  - full_name (optional)
  - language_preference (en, de, pl)
  - postal_code (required, searchable)
  - created_at, updated_at
  - is_email_verified (boolean)

### Ticket System Tables
- [ ] `public.tickets` table with fields:
  - id (PK, uuid)
  - user_id (FK, unique - one record per user)
  - total_balance (integer, default 10 for new users)
  - frozen_listing_tickets (integer, default 0)
  - frozen_exchange_tickets (integer, default 0)
  - created_at, updated_at
  - Constraint: total_balance >= frozen_listing_tickets + frozen_exchange_tickets

- [ ] `public.ticket_transactions` table for audit trail:
  - id (PK, uuid)
  - user_id (FK)
  - transaction_type (enum: listing_created, listing_removed, exchange_request, exchange_declined, exchange_completed, mini_game_reward, refund)
  - amount (integer, can be negative)
  - reference_id (FK to related record: toy_id, exchange_id)
  - created_at

### Toy Listing Tables
- [ ] `public.toys` table with fields:
  - id (PK, uuid)
  - user_id (FK)
  - category (enum: blocks, vehicles, dolls, board_games, educational, sports, art, other)
  - description (text, max 500 chars)
  - tags (text array, 1-3 items)
  - age_group (enum: 0-2, 3-5, 6-8, 9-11, 12-14, 15+)
  - condition (enum: like_new, good, fair, well_loved)
  - postal_code (searchable index)
  - is_active (boolean, default true)
  - frozen_listing_tickets (integer, default 1)
  - created_at, updated_at, expires_at (90 days from creation)
  - Indexes: user_id, category, tags, age_group, postal_code, is_active, created_at

- [ ] `public.toy_images` table with fields:
  - id (PK, uuid)
  - toy_id (FK, cascade delete)
  - storage_path (text, unique in bucket scope)
  - image_order (integer, 1-5)
  - created_at
  - Constraint: max 5 images per toy

### Exchange Tables
- [ ] `public.exchanges` table with fields:
  - id (PK, uuid)
  - toy_id (FK, soft link)
  - requester_id (FK to profiles)
  - owner_id (FK to profiles)
  - status (enum: pending_requester_confirmation, pending_owner_response, exchange_confirmed, pending_delivery_confirmation, exchange_completed, dispute_filed, closed)
  - delivery_method (enum: in_person, mail, courier)
  - requester_message (text, max 500 chars)
  - frozen_requester_tickets (integer, default 1)
  - frozen_owner_tickets (integer, default 0, becomes 1 when confirmed)
  - created_at, updated_at
  - owner_response_deadline (timestamp, 7 days from creation)
  - delivery_deadline (timestamp, 48 hours from confirmation)
  - Indexes: requester_id, owner_id, toy_id, status, created_at

### Consent & Compliance Tables
- [ ] `public.consent_records` table with fields:
  - id (PK, uuid)
  - user_id (FK)
  - consent_type (enum: privacy_policy, terms_of_service, behavioral_analytics)
  - consent_given (boolean)
  - timestamp (at creation)
  - ip_address (for audit)
  - user_agent (for audit)
  - withdrawn_at (nullable, when user withdraws consent)

### Indexes & Performance
- [ ] Composite indexes:
  - (user_id, is_active) on toys
  - (category, age_group, is_active) on toys
  - (postal_code, is_active) on toys
  - (requester_id, status) on exchanges
  - (owner_id, status) on exchanges
- [ ] Full-text search index on toys.description

### Data Validation
- [ ] NOT NULL constraints on required fields
- [ ] CHECK constraints (e.g., total_balance >= frozen totals)
- [ ] UNIQUE constraints (email, postal_code in profiles)
- [ ] Foreign key constraints with proper cascade behavior

### Migrations
- [ ] All changes in versioned migration files: `20241114_0001_create_profiles.sql`, etc.
- [ ] Migrations are idempotent (can run multiple times safely)
- [ ] `supabase/migrations/` directory organized and documented

## Estimated Hours
10-14 hours

## Dependencies
- Task P1-W1-SETUP-001 (Docker environment must be running)

## Testing Requirements

### Schema Verification
- [ ] Run migration: `supabase db push`
- [ ] Verify all tables created: `\dt public.*` in psql
- [ ] Check columns: `\d public.profiles`, `\d public.toys`, etc.
- [ ] Verify indexes: `\di` in psql
- [ ] Verify constraints: check NOT NULL, UNIQUE, CHECK constraints

### Data Integrity Tests
- [ ] Test NOT NULL constraints (insert without required field, should fail)
- [ ] Test UNIQUE constraints (duplicate email, should fail)
- [ ] Test CHECK constraints (ticket balance negative, should fail)
- [ ] Test cascade delete (delete user, verify toy listings deleted)
- [ ] Test foreign keys (invalid FK reference, should fail)

### Insert/Query Tests
- [ ] Insert sample profile: verify defaults applied
- [ ] Insert sample toy: verify indexes work, expires_at is 90 days future
- [ ] Insert sample exchange: verify status enum enforced
- [ ] Query all toys for user: verify RLS ready (policy not yet applied)
- [ ] Query by postal_code: verify index performance

## Database/Schema Changes
See acceptance criteria - this is the primary schema creation task.

## Technology Stack
- PostgreSQL 14+ (via Supabase)
- Supabase Migrations
- SQL (DDL/DML)

## Implementation Notes

### Migration Files Structure
Create migration files following Supabase naming: `{timestamp}_{description}.sql`

Example migrations:
1. `20241114_0001_create_profiles.sql` - User profiles
2. `20241114_0002_create_tickets.sql` - Ticket system
3. `20241114_0003_create_toys.sql` - Toy listings
4. `20241114_0004_create_exchanges.sql` - Exchange flow
5. `20241114_0005_create_consent_records.sql` - GDPR compliance

### Naming Conventions
- Tables: snake_case, singular or plural (choose consistently)
- Columns: snake_case
- Foreign keys: {table_name}_id
- Indexes: idx_{table}_{columns}
- Constraints: constraint_{table}_{purpose}

### Performance Considerations
- Indexes on frequently filtered columns (category, postal_code, status)
- Composite indexes for common WHERE combinations
- Full-text search index for toy descriptions

### Audit Trail
- ticket_transactions table logs all balance changes
- consent_records stores IP and user_agent for compliance audit
- created_at/updated_at on all main tables

## Success Metrics
- All 8 core tables created and accessible
- Indexes perform efficiently (query <100ms for sample data)
- Migrations are reversible (can rollback if needed)
- Schema adheres to naming conventions
- Team can review schema via Supabase Studio

## Related Stories (from PRD)
- Story 1: User Registration (depends on profiles, consent_records)
- Story 2: List a Toy (depends on toys, toy_images)
- Story 5: Initiate Exchange Request (depends on exchanges)

## Related Functional Requirements
- FR-AUTH-002: Parental Consent Management
- FR-TICKET-001: Initial Allocation
- FR-TOY-001: Toy Data Model
- FR-EXCH-001: Exchange States

## Risk Factors
- Incorrect constraints blocking legitimate operations (mitigate: thorough testing)
- Missing indexes causing slow queries (mitigate: performance testing with sample data)
- Ambiguous column names causing confusion (mitigate: review naming conventions)
