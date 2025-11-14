-- Manual SQL Test Suite for Database Views
-- Run these queries in Supabase SQL Editor to verify views work correctly
-- Tests: toy_detail_view, exchange_detail_view, user_profile_view,
--        active_wishlists_view, notification_feed_view

-- ============================================================================
-- TEST 1: toy_detail_view - Basic Query Test
-- ============================================================================
-- Expected: Returns toy with all required columns
-- Purpose: Verify view returns all columns with correct types

SELECT
  id, user_id, name, description, category, tags, age_range, condition,
  status, created_at, updated_at, lister_name, lister_avg_rating,
  photos_array, times_wishlisted, view_count
FROM public.toy_detail_view
LIMIT 5;

-- Test 1a: Verify photo aggregation structure
SELECT
  id, name,
  JSON_ARRAY_LENGTH(photos_array) as photo_count,
  photos_array
FROM public.toy_detail_view
WHERE JSON_ARRAY_LENGTH(photos_array) > 0
LIMIT 5;

-- Test 1b: Verify lister rating values are within valid range (0-5)
SELECT
  id, name, lister_name, lister_avg_rating,
  CASE
    WHEN lister_avg_rating >= 0 AND lister_avg_rating <= 5 THEN 'VALID'
    ELSE 'INVALID'
  END as rating_validity
FROM public.toy_detail_view
LIMIT 10;

-- Test 1c: Verify aggregate counts are non-negative
SELECT
  id, name,
  times_wishlisted, view_count,
  CASE
    WHEN times_wishlisted >= 0 AND view_count >= 0 THEN 'VALID'
    ELSE 'INVALID'
  END as count_validity
FROM public.toy_detail_view
LIMIT 10;

-- ============================================================================
-- TEST 2: exchange_detail_view - Basic Query Test
-- ============================================================================
-- Expected: Returns exchange with all required columns including both parties
-- Purpose: Verify view correctly joins requester and lister

SELECT
  id, requester_id, lister_id, toy_id, kid_for_id, status,
  requester_message, created_at, accepted_at, delivery_confirmed_at, completed_at,
  toy_name, toy_condition,
  requester_name, requester_rating,
  lister_name, lister_rating,
  kid_name, kid_age_group
FROM public.exchange_detail_view
LIMIT 5;

-- Test 2a: Verify requester and lister are different
SELECT
  id,
  requester_id, requester_name,
  lister_id, lister_name,
  CASE
    WHEN requester_id != lister_id THEN 'VALID'
    ELSE 'INVALID'
  END as party_validity
FROM public.exchange_detail_view
LIMIT 10;

-- Test 2b: Verify delivery confirmation is NULL when not delivered
SELECT
  id, status, delivery_condition,
  CASE
    WHEN status NOT IN ('confirmed', 'completed', 'disputed', 'auto_completed')
         AND delivery_condition IS NOT NULL THEN 'INVALID'
    ELSE 'VALID'
  END as delivery_validity
FROM public.exchange_detail_view
LIMIT 10;

-- Test 2c: Verify ratings only exist for completed exchanges
SELECT
  id, status,
  requester_condition_rating_given,
  lister_condition_rating_given,
  CASE
    WHEN status = 'completed'
         AND (requester_condition_rating_given IS NULL OR lister_condition_rating_given IS NULL)
      THEN 'WARNING: Completed exchange without ratings'
    WHEN status != 'completed'
         AND (requester_condition_rating_given IS NOT NULL OR lister_condition_rating_given IS NOT NULL)
      THEN 'INVALID: Non-completed exchange with ratings'
    ELSE 'VALID'
  END as rating_validity
FROM public.exchange_detail_view
LIMIT 10;

-- Test 2d: Verify valid exchange statuses
SELECT
  id, status,
  CASE
    WHEN status IN ('pending_request', 'accepted', 'in_transit', 'delivered',
                    'confirmed', 'completed', 'disputed', 'auto_completed', 'canceled')
    THEN 'VALID'
    ELSE 'INVALID'
  END as status_validity
FROM public.exchange_detail_view
LIMIT 10;

-- ============================================================================
-- TEST 3: user_profile_view - Basic Query Test
-- ============================================================================
-- Expected: Returns user profile with stats and activity counts
-- Purpose: Verify view correctly aggregates user data

SELECT
  id, full_name, language,
  avg_overall_rating, avg_condition_rating, avg_communication_rating,
  review_count, total_exchanges,
  active_kids_count, active_toys_count, completed_exchanges_count,
  badge_status
FROM public.user_profile_view
LIMIT 5;

-- Test 3a: Verify rating values are within range (0-5)
SELECT
  id, full_name,
  avg_overall_rating, avg_condition_rating, avg_communication_rating,
  CASE
    WHEN (avg_overall_rating >= 0 AND avg_overall_rating <= 5) AND
         (avg_condition_rating >= 0 AND avg_condition_rating <= 5) AND
         (avg_communication_rating >= 0 AND avg_communication_rating <= 5)
    THEN 'VALID'
    ELSE 'INVALID'
  END as rating_validity
FROM public.user_profile_view
LIMIT 10;

-- Test 3b: Verify badge_status computation (Trusted if avg >= 4.5 AND reviews >= 10)
SELECT
  id, full_name,
  avg_overall_rating, review_count, badge_status,
  CASE
    WHEN badge_status = 'Trusted' AND (avg_overall_rating >= 4.5 AND review_count >= 10)
      THEN 'VALID'
    WHEN badge_status IS NULL AND NOT (avg_overall_rating >= 4.5 AND review_count >= 10)
      THEN 'VALID'
    ELSE 'INVALID'
  END as badge_validity
FROM public.user_profile_view
LIMIT 10;

-- Test 3c: Verify counts are non-negative
SELECT
  id, full_name,
  active_kids_count, active_toys_count, completed_exchanges_count,
  review_count, total_exchanges,
  CASE
    WHEN active_kids_count >= 0 AND active_toys_count >= 0 AND
         completed_exchanges_count >= 0 AND review_count >= 0 AND
         total_exchanges >= 0
    THEN 'VALID'
    ELSE 'INVALID'
  END as count_validity
FROM public.user_profile_view
LIMIT 10;

-- Test 3d: Verify only active kids and toys are counted
-- (This requires checking against underlying data - conceptual test)
SELECT
  id, full_name, active_kids_count,
  'Test: Compare active_kids_count against (SELECT COUNT(*) FROM kids WHERE parent_id = user_id AND status = ''active'')'
FROM public.user_profile_view
WHERE active_kids_count > 0
LIMIT 5;

-- ============================================================================
-- TEST 4: active_wishlists_view - Basic Query Test
-- ============================================================================
-- Expected: Returns wishlist items only for active kids
-- Purpose: Verify view filters by kid status = 'active'

SELECT
  id, wishlist_id, kid_id, parent_id,
  toy_id, custom_wish_text,
  category_preference, tag_preferences, condition_preference, priority_order,
  kid_age_group, kid_interests, kid_allergies
FROM public.active_wishlists_view
LIMIT 10;

-- Test 4a: Verify XOR constraint - exactly one of toy_id or custom_wish_text
SELECT
  id,
  CASE
    WHEN toy_id IS NOT NULL AND custom_wish_text IS NULL THEN 'TOY_ONLY'
    WHEN toy_id IS NULL AND custom_wish_text IS NOT NULL THEN 'CUSTOM_ONLY'
    ELSE 'INVALID'
  END as wish_type,
  toy_id, custom_wish_text
FROM public.active_wishlists_view
LIMIT 10;

-- Test 4b: Verify valid age groups
SELECT
  id, kid_age_group,
  CASE
    WHEN kid_age_group IN ('0-2', '3-5', '6-8', '9-11', '12-14', '15+')
    THEN 'VALID'
    ELSE 'INVALID'
  END as age_group_validity
FROM public.active_wishlists_view
LIMIT 10;

-- Test 4c: Verify valid condition preferences
SELECT
  id, condition_preference,
  CASE
    WHEN condition_preference IN ('any', 'like_new', 'good_plus', 'good')
    THEN 'VALID'
    ELSE 'INVALID'
  END as condition_validity
FROM public.active_wishlists_view
LIMIT 10;

-- Test 4d: Verify positive priority_order
SELECT
  id, wishlist_id, priority_order,
  CASE
    WHEN priority_order > 0 THEN 'VALID'
    ELSE 'INVALID'
  END as priority_validity
FROM public.active_wishlists_view
LIMIT 10;

-- ============================================================================
-- TEST 5: notification_feed_view - Basic Query Test
-- ============================================================================
-- Expected: Returns non-deleted notifications ordered by creation date DESC
-- Purpose: Verify view filters soft-deleted notifications and returns in order

SELECT
  id, user_id, type, title, body, is_read, created_at,
  related_toy_id, related_toy_name,
  related_exchange_id, related_exchange_status,
  related_user_id
FROM public.notification_feed_view
LIMIT 10;

-- Test 5a: Verify notifications are ordered by created_at DESC
SELECT
  id, user_id, type, created_at,
  LAG(created_at) OVER (ORDER BY created_at DESC) as prev_created_at,
  CASE
    WHEN LAG(created_at) OVER (ORDER BY created_at DESC) IS NULL THEN 'FIRST'
    WHEN created_at >= LAG(created_at) OVER (ORDER BY created_at DESC) THEN 'INVALID'
    ELSE 'VALID'
  END as order_validity
FROM public.notification_feed_view
LIMIT 10;

-- Test 5b: Verify valid notification types
SELECT
  id, type,
  CASE
    WHEN type IN ('match_found', 'request_received', 'exchange_status', 'game_reward',
                  'message_received', 'delivery_confirmed', 'dispute_opened')
    THEN 'VALID'
    ELSE 'INVALID'
  END as type_validity
FROM public.notification_feed_view
LIMIT 10;

-- Test 5c: Verify non-empty title and body
SELECT
  id, type,
  LENGTH(title) as title_length,
  LENGTH(body) as body_length,
  CASE
    WHEN LENGTH(title) > 0 AND LENGTH(body) > 0 THEN 'VALID'
    ELSE 'INVALID'
  END as content_validity
FROM public.notification_feed_view
LIMIT 10;

-- Test 5d: Verify related_toy_name only when related_toy_id exists
SELECT
  id, related_toy_id, related_toy_name,
  CASE
    WHEN related_toy_id IS NOT NULL AND related_toy_name IS NOT NULL THEN 'VALID'
    WHEN related_toy_id IS NULL AND related_toy_name IS NULL THEN 'VALID'
    ELSE 'INVALID'
  END as toy_link_validity
FROM public.notification_feed_view
LIMIT 10;

-- Test 5e: Verify related_exchange_status only when related_exchange_id exists
SELECT
  id, related_exchange_id, related_exchange_status,
  CASE
    WHEN related_exchange_id IS NOT NULL AND related_exchange_status IS NOT NULL THEN 'VALID'
    WHEN related_exchange_id IS NULL AND related_exchange_status IS NULL THEN 'VALID'
    ELSE 'INVALID'
  END as exchange_link_validity
FROM public.notification_feed_view
LIMIT 10;

-- Test 5f: Verify is_read is boolean
SELECT
  id, is_read,
  CASE
    WHEN is_read IN (true, false) THEN 'VALID'
    ELSE 'INVALID'
  END as is_read_validity
FROM public.notification_feed_view
LIMIT 10;

-- ============================================================================
-- COMPREHENSIVE VIEW STATISTICS
-- ============================================================================

-- Summary: Count of rows in each view
SELECT
  'toy_detail_view' as view_name,
  (SELECT COUNT(*) FROM public.toy_detail_view) as row_count
UNION ALL
SELECT
  'exchange_detail_view',
  (SELECT COUNT(*) FROM public.exchange_detail_view)
UNION ALL
SELECT
  'user_profile_view',
  (SELECT COUNT(*) FROM public.user_profile_view)
UNION ALL
SELECT
  'active_wishlists_view',
  (SELECT COUNT(*) FROM public.active_wishlists_view)
UNION ALL
SELECT
  'notification_feed_view',
  (SELECT COUNT(*) FROM public.notification_feed_view);

-- ============================================================================
-- PERFORMANCE TEST: Verify indexes support view queries
-- ============================================================================

-- Check that toy_detail_view uses indexes efficiently
EXPLAIN ANALYZE
SELECT id, name, lister_name, photos_array, times_wishlisted, view_count
FROM public.toy_detail_view
LIMIT 5;

-- Check that exchange_detail_view uses indexes efficiently
EXPLAIN ANALYZE
SELECT id, requester_id, lister_id, requester_name, lister_name
FROM public.exchange_detail_view
LIMIT 5;

-- Check that user_profile_view uses indexes efficiently
EXPLAIN ANALYZE
SELECT id, full_name, avg_overall_rating, badge_status
FROM public.user_profile_view
LIMIT 5;

-- Check that active_wishlists_view uses indexes efficiently
EXPLAIN ANALYZE
SELECT id, wishlist_id, kid_id, condition_preference
FROM public.active_wishlists_view
LIMIT 10;

-- Check that notification_feed_view uses indexes efficiently
EXPLAIN ANALYZE
SELECT id, user_id, type, created_at, is_read
FROM public.notification_feed_view
LIMIT 10;
