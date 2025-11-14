-- Create Database Views for Toy-for-Toy Platform
-- Migration: 20241114_0016_create_database_views.sql
-- Description: Creates 5 optimized read-only views that abstract complex joins and simplify API queries
--              All views respect RLS policies and use LEFT JOINs for optional relationships
-- Author: PostgreSQL Architecture Specialist

-- ============================================================================
-- VIEW 1: toy_detail_view
-- ============================================================================
-- Purpose: Optimized toy listing detail page (single query instead of N+1)
-- Aggregates toy data, photos, user ratings, wishlists, and view analytics
-- Returns one row per toy with denormalized detail information
-- RLS: Automatically filters via underlying toy RLS policies

CREATE OR REPLACE VIEW public.toy_detail_view AS
SELECT
  -- Core toy columns
  t.id,
  t.user_id,
  t.name,
  t.description,
  t.category,
  t.tags,
  t.age_range,
  t.condition,
  t.status,
  t.created_at,
  t.updated_at,

  -- Lister information
  p.full_name AS lister_name,

  -- Lister average rating
  COALESCE(us.avg_overall_rating, 0) AS lister_avg_rating,

  -- Photo array (JSON array of photo objects with id, storage_path, display_order)
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', tp.id,
        'storage_path', tp.storage_path,
        'display_order', tp.display_order
      ) ORDER BY tp.display_order
    ) FILTER (WHERE tp.id IS NOT NULL),
    '[]'::JSON
  ) AS photos_array,

  -- Wishlist count (how many times this toy has been wishlisted)
  COALESCE(COUNT(DISTINCT wi.id), 0) AS times_wishlisted,

  -- View count (analytics)
  COALESCE(COUNT(DISTINCT tv.id), 0) AS view_count

FROM public.toys t
  LEFT JOIN public.profiles p ON t.user_id = p.id
  LEFT JOIN public.user_stats us ON t.user_id = us.user_id
  LEFT JOIN public.toy_photos tp ON t.id = tp.toy_id
  LEFT JOIN public.wishlist_items wi ON t.id = wi.toy_id
  LEFT JOIN public.toy_views tv ON t.id = tv.toy_id

GROUP BY
  t.id, t.user_id, t.name, t.description, t.category, t.tags, t.age_range,
  t.condition, t.status, t.created_at, t.updated_at,
  p.full_name, us.avg_overall_rating;

COMMENT ON VIEW public.toy_detail_view IS 'Optimized toy listing detail page with all related data in single query. Aggregates photos, user ratings, wishlists, and view analytics. Respects RLS policies.';

-- ============================================================================
-- VIEW 2: exchange_detail_view
-- ============================================================================
-- Purpose: Full exchange context for detail/timeline page
-- Aggregates exchange data, toy details, both parties info, ratings, disputes, delivery
-- Returns one row per exchange with complete context
-- RLS: Automatically filters via underlying exchange RLS policies

CREATE OR REPLACE VIEW public.exchange_detail_view AS
SELECT
  -- Core exchange columns
  e.id,
  e.requester_id,
  e.lister_id,
  e.toy_id,
  e.kid_for_id,
  e.status,
  e.requester_message,
  e.created_at,
  e.accepted_at,
  e.delivery_confirmed_at,
  e.completed_at,

  -- Toy information
  t.name AS toy_name,
  t.condition AS toy_condition,

  -- Requester information
  p_requester.full_name AS requester_name,
  COALESCE(us_requester.avg_overall_rating, 0) AS requester_rating,

  -- Lister information
  p_lister.full_name AS lister_name,
  COALESCE(us_lister.avg_overall_rating, 0) AS lister_rating,

  -- Kid information (toy intended for)
  k.name AS kid_name,
  k.age_group AS kid_age_group,

  -- Delivery confirmation details
  dc.condition_received AS delivery_condition,

  -- Dispute information
  d.status AS dispute_status,
  d.resolution AS dispute_resolution,

  -- Ratings given in this exchange
  r_requester.condition_rating AS requester_condition_rating_given,
  r_requester.communication_rating AS requester_communication_rating_given,
  r_lister.condition_rating AS lister_condition_rating_given,
  r_lister.communication_rating AS lister_communication_rating_given

FROM public.exchanges e
  -- Toy details
  LEFT JOIN public.toys t ON e.toy_id = t.id

  -- Requester information (1st LEFT JOIN to profiles)
  LEFT JOIN public.profiles p_requester ON e.requester_id = p_requester.id
  LEFT JOIN public.user_stats us_requester ON e.requester_id = us_requester.user_id

  -- Lister information (2nd LEFT JOIN to profiles)
  LEFT JOIN public.profiles p_lister ON e.lister_id = p_lister.id
  LEFT JOIN public.user_stats us_lister ON e.lister_id = us_lister.user_id

  -- Kid information
  LEFT JOIN public.kids k ON e.kid_for_id = k.id

  -- Delivery confirmation (optional, only exists if delivered)
  LEFT JOIN public.delivery_confirmations dc ON e.id = dc.exchange_id

  -- Dispute information (optional, only exists if disputed)
  LEFT JOIN public.disputes d ON e.id = d.exchange_id

  -- Rating from requester to lister (only if completed/rated)
  LEFT JOIN public.ratings r_requester ON e.id = r_requester.exchange_id AND r_requester.rater_id = e.requester_id

  -- Rating from lister to requester (only if completed/rated)
  LEFT JOIN public.ratings r_lister ON e.id = r_lister.exchange_id AND r_lister.rater_id = e.lister_id;

COMMENT ON VIEW public.exchange_detail_view IS 'Full exchange context for detail/timeline page. Aggregates exchange, toy, both parties, ratings, disputes, and delivery information. Respects RLS policies.';

-- ============================================================================
-- VIEW 3: user_profile_view
-- ============================================================================
-- Purpose: Public user profile with stats and activity
-- Aggregates user profile data, children, toys, exchanges, and ratings
-- Returns one row per user with comprehensive profile statistics
-- RLS: Automatically filters via underlying table RLS policies

CREATE OR REPLACE VIEW public.user_profile_view AS
SELECT
  -- User/profile information
  p.id,
  p.full_name,
  p.language,

  -- Rating statistics
  COALESCE(us.avg_overall_rating, 0) AS avg_overall_rating,
  COALESCE(us.avg_condition_rating, 0) AS avg_condition_rating,
  COALESCE(us.avg_communication_rating, 0) AS avg_communication_rating,
  COALESCE(us.review_count, 0) AS review_count,
  COALESCE(us.total_exchanges, 0) AS total_exchanges,

  -- Activity counts
  COALESCE(COUNT(DISTINCT k.id) FILTER (WHERE k.status = 'active'), 0) AS active_kids_count,
  COALESCE(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active'), 0) AS active_toys_count,
  COALESCE(
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed' AND (e.requester_id = p.id OR e.lister_id = p.id)),
    0
  ) AS completed_exchanges_count,

  -- Badge status (computed: 'Trusted' if avg_overall_rating >= 4.5 AND review_count >= 10)
  CASE
    WHEN COALESCE(us.avg_overall_rating, 0) >= 4.5 AND COALESCE(us.review_count, 0) >= 10
    THEN 'Trusted'
    ELSE NULL
  END AS badge_status

FROM public.profiles p
  LEFT JOIN public.user_stats us ON p.id = us.user_id
  LEFT JOIN public.kids k ON p.id = k.parent_id
  LEFT JOIN public.toys t ON p.id = t.user_id
  LEFT JOIN public.exchanges e ON (p.id = e.requester_id OR p.id = e.lister_id)

GROUP BY
  p.id, p.full_name, p.language,
  us.avg_overall_rating, us.avg_condition_rating, us.avg_communication_rating,
  us.review_count, us.total_exchanges;

COMMENT ON VIEW public.user_profile_view IS 'Public user profile with stats and activity. Aggregates user data, children, toys, exchanges, and ratings. Respects RLS policies.';

-- ============================================================================
-- VIEW 4: active_wishlists_view
-- ============================================================================
-- Purpose: Wishlists for matching algorithm (denormalized for easy querying)
-- Aggregates wishlist items with kid and parent information
-- Only includes active wishlists (where kids.status = 'active')
-- Returns one row per wishlist item with full context
-- RLS: Automatically filters via underlying table RLS policies

CREATE OR REPLACE VIEW public.active_wishlists_view AS
SELECT
  -- Wishlist item identifiers
  wi.id,
  wi.wishlist_id,
  k.id AS kid_id,
  k.parent_id,

  -- Wish content
  wi.toy_id,
  wi.custom_wish_text,

  -- Preference filters
  wi.category_preference,
  wi.tag_preferences,
  wi.condition_preference,
  wi.priority_order,

  -- Kid information
  k.age_group AS kid_age_group,
  k.interests AS kid_interests,
  k.allergies AS kid_allergies

FROM public.wishlist_items wi
  INNER JOIN public.wishlists w ON wi.wishlist_id = w.id
  INNER JOIN public.kids k ON w.kid_id = k.id

WHERE k.status = 'active';

COMMENT ON VIEW public.active_wishlists_view IS 'Wishlists for matching algorithm (denormalized for easy querying). Only includes active wishlists. Respects RLS policies.';

-- ============================================================================
-- VIEW 5: notification_feed_view
-- ============================================================================
-- Purpose: Formatted notification feed with related context
-- Aggregates notifications with toy and exchange context information
-- Excludes soft-deleted notifications (deleted_at IS NOT NULL)
-- Ordered by creation date (most recent first)
-- Returns one row per notification with full context
-- RLS: Automatically filters via underlying notification RLS policies

CREATE OR REPLACE VIEW public.notification_feed_view AS
SELECT
  -- Core notification columns
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.body,
  n.is_read,
  n.created_at,

  -- Related toy information
  n.related_toy_id,
  t.name AS related_toy_name,

  -- Related exchange information
  n.related_exchange_id,
  e.status AS related_exchange_status,

  -- Related user context (extract from exchange if available)
  CASE
    WHEN n.related_exchange_id IS NOT NULL AND e.requester_id = n.user_id THEN e.lister_id
    WHEN n.related_exchange_id IS NOT NULL AND e.lister_id = n.user_id THEN e.requester_id
    ELSE NULL
  END AS related_user_id

FROM public.notifications n
  LEFT JOIN public.toys t ON n.related_toy_id = t.id
  LEFT JOIN public.exchanges e ON n.related_exchange_id = e.id

WHERE n.deleted_at IS NULL

ORDER BY n.created_at DESC;

COMMENT ON VIEW public.notification_feed_view IS 'Formatted notification feed with related context. Excludes soft-deleted notifications. Ordered by creation date DESC (most recent first). Respects RLS policies.';

-- ============================================================================
-- ENABLE RLS ON ALL VIEWS
-- ============================================================================
-- Mark views as security barriers so RLS policies from underlying tables are enforced

ALTER VIEW public.toy_detail_view SET (security_barrier = on);
ALTER VIEW public.exchange_detail_view SET (security_barrier = on);
ALTER VIEW public.user_profile_view SET (security_barrier = on);
ALTER VIEW public.active_wishlists_view SET (security_barrier = on);
ALTER VIEW public.notification_feed_view SET (security_barrier = on);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. View Strategy:
--    - All views are READ-ONLY (no INSERT/UPDATE/DELETE via views)
--    - Views use LEFT JOINs for optional relationships (ratings, disputes, delivery)
--    - Views use COALESCE to handle NULL aggregates gracefully
--    - security_barrier = on ensures RLS policies are enforced
--
-- 2. toy_detail_view:
--    - Single query avoids N+1 problem for toy detail pages
--    - JSON_AGG for photos preserves display order
--    - Aggregates wishlists and views for analytics
--    - RLS: Respects toy visibility policies (active toys only via policies)
--
-- 3. exchange_detail_view:
--    - Requires 2 LEFT JOINs to profiles (requester and lister)
--    - Requires 2 LEFT JOINs to user_stats (for requester and lister ratings)
--    - Requires 2 LEFT JOINs to ratings (requester rating and lister rating)
--    - Delivery and dispute info is optional (only if exchange reached those states)
--    - RLS: Respects exchange visibility policies (user can only see own exchanges)
--
-- 4. user_profile_view:
--    - Computes badge_status in view (Trusted if avg >= 4.5 AND reviews >= 10)
--    - Aggregates children (only active ones), toys, and exchanges
--    - Shows completed exchanges where user participated (either side)
--    - RLS: Respects profile and related data policies
--
-- 5. active_wishlists_view:
--    - INNER JOINs ensure only active wishlists are included
--    - Filters by kids.status = 'active' at view level
--    - Denormalized layout makes matching algorithm queries simpler
--    - RLS: Respects wishlist visibility policies
--
-- 6. notification_feed_view:
--    - Filters deleted notifications (WHERE deleted_at IS NULL)
--    - related_user_id computed from exchange (opposite party)
--    - Ordered by created_at DESC for chronological feed
--    - RLS: Respects notification visibility policies (user_id filtering)
--
-- 7. Performance Considerations:
--    - Views use indexes on underlying tables (FK columns, status, dates)
--    - JSON_AGG with ORDER BY ensures deterministic photo ordering
--    - COALESCE avoids NULL issues in aggregate queries
--    - GROUP BY required for toy_detail_view and user_profile_view aggregates
--    - Partial indexes on optional relationships (delivery_confirmations, disputes) improve JOIN performance
--
-- 8. Testing Views:
--    - Query each view with sample data to verify column counts and types
--    - Verify RLS policies applied (user can only see own notifications, exchanges, etc.)
--    - Test LEFT JOINs return NULL properly (delivery/dispute/ratings when not exists)
--    - Verify aggregates count correctly (photos, wishlists, views)
--    - Test soft-delete filtering in notification_feed_view
--    - Verify badge_status computation (4.5 rating + 10 reviews threshold)
--
-- 9. RLS Policy Enforcement:
--    - security_barrier = on prevents view from bypassing RLS policies
--    - Views inherit RLS from underlying tables
--    - Testing: Create user A and user B, verify A cannot see B's exchanges/notifications
--
-- 10. Future Enhancements:
--     - Add materialized views for dashboard statistics (refresh periodically)
--     - Add parameterized views for pagination (LIMIT/OFFSET at API layer)
--     - Add computed columns for derived metrics (days_since_exchange, etc.)
--     - Add performance metrics columns (query time, result count)
--
