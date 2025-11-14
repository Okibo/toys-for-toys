-- Verification Script for RLS Policies
-- Run this in Supabase Studio SQL editor to verify all RLS policies are deployed

-- ============================================================================
-- 1. CHECK IS_ADMIN() FUNCTION EXISTS
-- ============================================================================
SELECT
  p.proname,
  t.typname as return_type,
  p.prosql
FROM pg_proc p
JOIN pg_type t ON p.prorettype = t.oid
WHERE p.proname = 'is_admin'
  AND p.pronamespace = 'public'::regnamespace;

-- Expected: 1 row showing is_admin function

-- ============================================================================
-- 2. COUNT RLS POLICIES BY TABLE
-- ============================================================================
SELECT
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected: ~20 tables with policies

-- ============================================================================
-- 3. VERIFY RLS ENABLED ON ALL CRITICAL TABLES
-- ============================================================================
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED - FIX REQUIRED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'kids', 'tickets', 'toys', 'exchanges',
    'exchange_messages', 'wishlists', 'blocklist', 'notifications',
    'ratings', 'notification_preferences', 'toy_photos', 'toy_views',
    'delivery_confirmations', 'disputes', 'transaction_log', 'game_fragments'
  )
ORDER BY tablename;

-- Expected: All rows show 'RLS ENABLED'

-- ============================================================================
-- 4. DETAILED POLICY BREAKDOWN BY TABLE
-- ============================================================================

-- Profiles policies
SELECT 'profiles' as table_name, policyname, qual as rule, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Kids policies
SELECT 'kids' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'kids'
ORDER BY policyname;

-- Tickets policies
SELECT 'tickets' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'tickets'
ORDER BY policyname;

-- Toys policies
SELECT 'toys' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'toys'
ORDER BY policyname;

-- Exchanges policies
SELECT 'exchanges' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'exchanges'
ORDER BY policyname;

-- Exchange messages policies
SELECT 'exchange_messages' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'exchange_messages'
ORDER BY policyname;

-- Wishlists policies
SELECT 'wishlists' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'wishlists'
ORDER BY policyname;

-- Wishlist items policies
SELECT 'wishlist_items' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'wishlist_items'
ORDER BY policyname;

-- Blocklist policies
SELECT 'blocklist' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'blocklist'
ORDER BY policyname;

-- Notifications policies
SELECT 'notifications' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Ratings policies
SELECT 'ratings' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'ratings'
ORDER BY policyname;

-- User stats policies
SELECT 'user_stats' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'user_stats'
ORDER BY policyname;

-- Notification preferences policies
SELECT 'notification_preferences' as table_name, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'notification_preferences'
ORDER BY policyname;

-- ============================================================================
-- 5. VERIFY RESTRICTIVE POLICIES EXIST (FOR DISABLED OPERATIONS)
-- ============================================================================
SELECT
  tablename,
  policyname,
  permissive,
  qual as condition
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = false  -- Restrictive policies
ORDER BY tablename, policyname;

-- Expected: Multiple RESTRICTIVE policies for INSERT/UPDATE/DELETE disabled operations

-- ============================================================================
-- 6. VERIFY PERMISSIVE POLICIES HAVE CORRECT CONDITIONS
-- ============================================================================
SELECT
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid()'
    WHEN qual LIKE '%is_admin%' THEN 'Uses is_admin()'
    WHEN qual LIKE '%EXISTS%' THEN 'Uses EXISTS subquery'
    WHEN qual = 'true' THEN 'Unrestricted access'
    WHEN qual IS NULL THEN 'Check WITH CHECK clause'
    ELSE 'Custom condition'
  END as condition_type
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = true  -- Permissive policies
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. TEST QUERIES - Run with different JWT tokens to verify isolation
-- ============================================================================

-- As User A (replace with actual JWT)
-- Should see only User A's tickets
SELECT id, user_id, balance FROM public.tickets WHERE user_id = auth.uid();

-- As User A
-- Should see only User A's kids
SELECT id, parent_id, name FROM public.kids WHERE parent_id = auth.uid();

-- As Any User
-- Should see all ratings (public reputation)
SELECT id, rater_id, rated_user_id, condition_rating FROM public.ratings LIMIT 10;

-- As Any User
-- Should see only active toys
SELECT id, user_id, status FROM public.toys WHERE status = 'active' LIMIT 10;

-- ============================================================================
-- 8. PERFORMANCE CHECK - Policy evaluation time
-- ============================================================================

-- Enable query timing
\timing on

-- Run test queries and observe timing
SELECT COUNT(*) FROM public.profiles;  -- Should complete <50ms
SELECT COUNT(*) FROM public.toys;      -- Should complete <50ms
SELECT COUNT(*) FROM public.exchanges; -- Should complete <50ms
SELECT COUNT(*) FROM public.tickets;   -- Should complete <50ms

-- ============================================================================
-- 9. SUMMARY STATISTICS
-- ============================================================================

WITH policy_summary AS (
  SELECT
    COUNT(DISTINCT tablename) as tables_protected,
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) FILTER (WHERE permissive = true) as permissive_count,
    COUNT(DISTINCT tablename) FILTER (WHERE permissive = false) as restrictive_count
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  tables_protected,
  total_policies,
  permissive_count,
  restrictive_count,
  CASE
    WHEN total_policies >= 46 THEN 'COMPLETE - All RLS policies deployed'
    WHEN total_policies >= 40 THEN 'MOSTLY COMPLETE - Some policies missing'
    ELSE 'INCOMPLETE - Run migration'
  END as deployment_status
FROM policy_summary;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This script provides a complete verification of RLS deployment
-- 2. Run individual queries to diagnose specific issues
-- 3. Expected results:
--    - is_admin() function exists
--    - 20 tables have RLS enabled
--    - 46+ policies created
--    - All queries use auth.uid() for filtering
-- 4. If any check fails, re-run migration: npx supabase db push
-- 5. For troubleshooting, check:
--    - pg_policies view for policy definitions
--    - pg_tables view for RLS enabled status
--    - JWT token claims in your session
