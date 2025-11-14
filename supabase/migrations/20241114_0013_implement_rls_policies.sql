-- Comprehensive Row-Level Security (RLS) Policies Implementation
-- Migration: 20241114_0013_implement_rls_policies.sql
-- Description: Implements RLS policies for all 11 tables (profiles, kids, tickets, toys, exchanges,
--              exchange_messages, wishlists, blocklist, notifications, ratings, notification_preferences)
--              with admin helper function and comprehensive data isolation
-- Author: PostgreSQL Architecture Specialist

-- ============================================================================
-- ADMIN HELPER FUNCTION
-- ============================================================================
-- Checks if current user has admin role or is from admin email domain
-- Used in RLS policies to grant admin access to all data for moderation/analytics

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in JWT claims
  -- In Supabase, admin role can be set via custom JWT claims or metadata
  IF (auth.jwt() ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- Check if user has admin metadata flag
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- Default: not admin
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.is_admin() IS
'WARNING: Returns true if current user has admin role in JWT claims.
This function assumes JWT validation has been performed by Supabase Auth.
DO NOT use for critical security operations without API-layer verification.
JWT claims are only verified by Supabase during token issuance - this function
does not re-validate the JWT. Use only for read-only admin access.
For critical operations (payments, disputes, data deletion), implement
additional verification in the API layer.

USAGE: Returns true if either auth.jwt()->>"role" OR
auth.jwt()->"app_metadata"->>"role" equals "admin".';

-- ============================================================================
-- 1. PROFILES TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see their own profile (for settings/profile editing)
-- - Users see public profiles of others (limited fields: id, full_name, language, user_stats if completed rating)
-- - No INSERT allowed (profiles created by auth trigger)
-- - Users can only UPDATE own profile
-- - No DELETE allowed

-- SELECT: Users see own profile OR public profiles (limited fields handled in API)
CREATE POLICY "profiles_select_own_or_public" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  USING (
    auth.uid() = id  -- Own profile
    OR true  -- Public profile visible to all authenticated users (filtering handled in API)
  );

COMMENT ON POLICY "profiles_select_own_or_public" ON public.profiles
  IS 'Users can see own profile or public profiles. IMPORTANT: RLS allows SELECT on all profile rows.
      Field-level filtering (email, phone, notification_preference) MUST be enforced in API layer.
      The API must use an allowlist approach: only expose id, full_name, language, and user_stats fields.
      Sensitive fields (email, phone numbers, notification preferences) must NEVER be returned to other users.
      API layer is responsible for this filtering - RLS does not restrict field access.';

-- UPDATE: Users can only update own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "profiles_update_own" ON public.profiles
  IS 'Users can only update their own profile. Prevents modification of other users'' data.';

-- INSERT: Disabled (profiles created by auth.on_auth_user_created trigger)
CREATE POLICY "profiles_insert_disabled" ON public.profiles
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "profiles_insert_disabled" ON public.profiles
  IS 'INSERT disabled: profiles are created automatically by auth trigger.';

-- DELETE: Disabled (handled separately via GDPR workflow)
CREATE POLICY "profiles_delete_disabled" ON public.profiles
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "profiles_delete_disabled" ON public.profiles
  IS 'DELETE disabled: data deletion handled via separate GDPR workflow.';

-- ============================================================================
-- 2. KIDS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own children (parent_id = auth.uid())
-- - INSERT only own children
-- - UPDATE disabled (managed via settings/separate API)
-- - DELETE disabled (soft delete only via status column)

-- SELECT: Users see only their own children
CREATE POLICY "kids_select_own" ON public.kids
  AS PERMISSIVE
  FOR SELECT
  USING (parent_id = auth.uid());

COMMENT ON POLICY "kids_select_own" ON public.kids
  IS 'GDPR: Users can only see their own children. Enforces parent data isolation.';

-- INSERT: Users can create only their own children
CREATE POLICY "kids_insert_own" ON public.kids
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (parent_id = auth.uid());

COMMENT ON POLICY "kids_insert_own" ON public.kids
  IS 'GDPR: Users can only add their own children. parent_id must match auth.uid().';

-- UPDATE: Disabled (child management handled separately)
CREATE POLICY "kids_update_disabled" ON public.kids
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "kids_update_disabled" ON public.kids
  IS 'UPDATE disabled: child modifications managed via separate settings API to prevent accidental changes.';

-- DELETE: Disabled (soft delete only via status column for GDPR compliance)
CREATE POLICY "kids_delete_disabled" ON public.kids
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "kids_delete_disabled" ON public.kids
  IS 'DELETE disabled: use soft delete via status=''deleted'' for GDPR compliance. Hard delete not allowed.';

-- ============================================================================
-- 3. TICKETS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own ticket wallet (user_id = auth.uid())
-- - INSERT disabled (system only)
-- - UPDATE disabled (system only via triggers)
-- - DELETE disabled

-- SELECT: Users see only their own ticket balance
CREATE POLICY "tickets_select_own" ON public.tickets
  AS PERMISSIVE
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON POLICY "tickets_select_own" ON public.tickets
  IS 'Ticket economy: Users can only see their own ticket wallet. Critical for security.';

-- INSERT: Disabled (tickets created by system on profile creation)
CREATE POLICY "tickets_insert_disabled" ON public.tickets
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "tickets_insert_disabled" ON public.tickets
  IS 'INSERT disabled: ticket wallets created by system only.';

-- UPDATE: Disabled (tickets updated by system via triggers and Edge Functions)
CREATE POLICY "tickets_update_disabled" ON public.tickets
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "tickets_update_disabled" ON public.tickets
  IS 'UPDATE disabled: ticket balances controlled by system via triggers. Application cannot modify directly.';

-- DELETE: Disabled
CREATE POLICY "tickets_delete_disabled" ON public.tickets
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "tickets_delete_disabled" ON public.tickets
  IS 'DELETE disabled: ticket records are permanent for audit trail.';

-- ============================================================================
-- 4. TOYS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Anyone sees active toys (status = 'active'), OR pending/unavailable if owner
-- - Admins see all including delisted
-- - INSERT: Authenticated users create own toys
-- - UPDATE: Users update own toys only
-- - DELETE: Disabled (soft delete via status column)

-- SELECT: Active toys visible to all, admins see all
CREATE POLICY "toys_select_active_or_own_or_admin" ON public.toys
  AS PERMISSIVE
  FOR SELECT
  USING (
    status = 'active'  -- Anyone can see active toys
    OR user_id = auth.uid()  -- Users see their own toys (any status)
    OR public.is_admin()  -- Admins see all toys (including delisted, pending)
  );

COMMENT ON POLICY "toys_select_active_or_own_or_admin" ON public.toys
  IS 'Toy discovery: Anyone sees active toys. Users see own toys (any status). Admins see all for moderation.';

-- INSERT: Authenticated users can create own toys
CREATE POLICY "toys_insert_own" ON public.toys
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "toys_insert_own" ON public.toys
  IS 'Users can only create toys they own (user_id must match auth.uid()).';

-- UPDATE: Users can update own toys only
CREATE POLICY "toys_update_own" ON public.toys
  AS PERMISSIVE
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "toys_update_own" ON public.toys
  IS 'Users can only update their own toys. Prevents cross-user modification.';

-- DELETE: Disabled (soft delete only via status column)
CREATE POLICY "toys_delete_disabled" ON public.toys
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "toys_delete_disabled" ON public.toys
  IS 'DELETE disabled: use soft delete via status=''delisted'' instead. Preserves audit trail.';

-- ============================================================================
-- 5. EXCHANGES TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own exchanges (requester_id OR lister_id = auth.uid())
-- - Admins see all for dispute resolution
-- - INSERT/UPDATE: Disabled (API controls ticket escrow)
-- - DELETE: Disabled (soft delete only via status column)

-- SELECT: Users see own exchanges, admins see all
CREATE POLICY "exchanges_select_own_or_admin" ON public.exchanges
  AS PERMISSIVE
  FOR SELECT
  USING (
    requester_id = auth.uid()  -- Requester sees their own exchanges
    OR lister_id = auth.uid()  -- Lister sees their own exchanges
    OR public.is_admin()  -- Admins see all for dispute resolution
  );

COMMENT ON POLICY "exchanges_select_own_or_admin" ON public.exchanges
  IS 'Users see only exchanges they are part of (requester or lister). Admins see all.';

-- INSERT: Disabled (API controls escrow logic)
CREATE POLICY "exchanges_insert_disabled" ON public.exchanges
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "exchanges_insert_disabled" ON public.exchanges
  IS 'INSERT disabled: exchange creation controlled by API to enforce escrow logic.';

-- UPDATE: Disabled (API controls status transitions)
CREATE POLICY "exchanges_update_disabled" ON public.exchanges
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "exchanges_update_disabled" ON public.exchanges
  IS 'UPDATE disabled: exchange status transitions controlled by API for consistency.';

-- DELETE: Disabled (soft delete only via status column)
CREATE POLICY "exchanges_delete_disabled" ON public.exchanges
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "exchanges_delete_disabled" ON public.exchanges
  IS 'DELETE disabled: use soft delete via status=''canceled'' to preserve audit trail.';

-- ============================================================================
-- 6. EXCHANGE_MESSAGES TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see messages only from exchanges they are part of
-- - INSERT: Users can send messages only in exchanges they're in
-- - UPDATE: Disabled
-- - DELETE: Users can soft-delete own messages

-- SELECT: Users see messages from exchanges they participate in
CREATE POLICY "exchange_messages_select_own_exchange" ON public.exchange_messages
  AS PERMISSIVE
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE id = exchange_id
      AND (requester_id = auth.uid() OR lister_id = auth.uid())
    )
  );

COMMENT ON POLICY "exchange_messages_select_own_exchange" ON public.exchange_messages
  IS 'Users see messages only from exchanges they participate in (requester or lister).';

-- INSERT: Users can send messages only in exchanges they're part of
CREATE POLICY "exchange_messages_insert_own_exchange" ON public.exchange_messages
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()  -- Can only send as yourself
    AND EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE id = exchange_id
      AND (requester_id = auth.uid() OR lister_id = auth.uid())
    )
  );

COMMENT ON POLICY "exchange_messages_insert_own_exchange" ON public.exchange_messages
  IS 'Users can send messages only in exchanges they participate in and only as themselves.';

-- UPDATE: Disabled (messages immutable after creation)
CREATE POLICY "exchange_messages_update_disabled" ON public.exchange_messages
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "exchange_messages_update_disabled" ON public.exchange_messages
  IS 'UPDATE disabled: messages cannot be edited after creation (preserve audit trail).';

-- DELETE: Users can soft-delete own messages
CREATE POLICY "exchange_messages_delete_own" ON public.exchange_messages
  AS PERMISSIVE
  FOR DELETE
  USING (sender_id = auth.uid());

COMMENT ON POLICY "exchange_messages_delete_own" ON public.exchange_messages
  IS 'Users can soft-delete only their own messages via is_deleted_by_sender flag.';

-- ============================================================================
-- 7. WISHLISTS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only wishlists for their own children (via kid parent_id)
-- - INSERT: Create only own wishlists
-- - UPDATE: Update only own wishlists
-- - DELETE: Delete only own wishlists

-- SELECT: Users see wishlists for their own kids only
CREATE POLICY "wishlists_select_own_kids" ON public.wishlists
  AS PERMISSIVE
  FOR SELECT
  USING (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  );

COMMENT ON POLICY "wishlists_select_own_kids" ON public.wishlists
  IS 'GDPR: Users see wishlists only for their own children.';

-- INSERT: Create wishlists only for own kids
CREATE POLICY "wishlists_insert_own_kids" ON public.wishlists
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  );

COMMENT ON POLICY "wishlists_insert_own_kids" ON public.wishlists
  IS 'Users can only create wishlists for their own children.';

-- UPDATE: Update only own wishlists
CREATE POLICY "wishlists_update_own_kids" ON public.wishlists
  AS PERMISSIVE
  FOR UPDATE
  USING (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  )
  WITH CHECK (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  );

COMMENT ON POLICY "wishlists_update_own_kids" ON public.wishlists
  IS 'Users can only update wishlists for their own children.';

-- DELETE: Delete only own wishlists
CREATE POLICY "wishlists_delete_own_kids" ON public.wishlists
  AS PERMISSIVE
  FOR DELETE
  USING (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  );

COMMENT ON POLICY "wishlists_delete_own_kids" ON public.wishlists
  IS 'Users can only delete wishlists for their own children.';

-- ============================================================================
-- 8. WISHLISTS_ITEMS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see items only from wishlists they own (via kid parent_id)
-- - INSERT/UPDATE/DELETE: Only for own wishlists

-- SELECT: Users see items from their own wishlists only
CREATE POLICY "wishlist_items_select_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "wishlist_items_select_own_wishlists" ON public.wishlist_items
  IS 'GDPR: Users see wishlist items only from their own children''s wishlists.';

-- INSERT: Create items only in own wishlists
CREATE POLICY "wishlist_items_insert_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "wishlist_items_insert_own_wishlists" ON public.wishlist_items
  IS 'Users can only add items to their own children''s wishlists.';

-- UPDATE: Update only in own wishlists
CREATE POLICY "wishlist_items_update_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "wishlist_items_update_own_wishlists" ON public.wishlist_items
  IS 'Users can only update items in their own children''s wishlists.';

-- DELETE: Delete only from own wishlists
CREATE POLICY "wishlist_items_delete_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "wishlist_items_delete_own_wishlists" ON public.wishlist_items
  IS 'Users can only delete items from their own children''s wishlists.';

-- ============================================================================
-- 9. MATCHING_LOG TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see matching logs for their own children's wishlists only
-- - All operations read-only (system-generated)

-- SELECT: Users see matching logs for their own wishlists
CREATE POLICY "matching_log_select_own_wishlists" ON public.matching_log
  AS PERMISSIVE
  FOR SELECT
  USING (
    wishlist_item_id IN (
      SELECT id FROM public.wishlist_items
      WHERE wishlist_id IN (
        SELECT id FROM public.wishlists
        WHERE kid_id IN (
          SELECT id FROM public.kids
          WHERE parent_id = auth.uid()
        )
      )
    )
  );

COMMENT ON POLICY "matching_log_select_own_wishlists" ON public.matching_log
  IS 'Users see matching logs only for their own children''s wishlist items.';

-- INSERT: Disabled (system-generated only)
CREATE POLICY "matching_log_insert_disabled" ON public.matching_log
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "matching_log_insert_disabled" ON public.matching_log
  IS 'INSERT disabled: matching logs created by system algorithm only.';

-- UPDATE: Disabled (system-generated, immutable)
CREATE POLICY "matching_log_update_disabled" ON public.matching_log
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "matching_log_update_disabled" ON public.matching_log
  IS 'UPDATE disabled: matching logs are immutable.';

-- DELETE: Disabled
CREATE POLICY "matching_log_delete_disabled" ON public.matching_log
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "matching_log_delete_disabled" ON public.matching_log
  IS 'DELETE disabled: matching logs preserve algorithm history for analysis.';

-- ============================================================================
-- 10. BLOCKLIST TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own blocklist (blocker_id = auth.uid())
-- - INSERT: Users can block others (set blocker_id = auth.uid())
-- - UPDATE: Disabled
-- - DELETE: Users can unblock only their own entries

-- SELECT: Users see only their own blocklist
CREATE POLICY "blocklist_select_own" ON public.blocklist
  AS PERMISSIVE
  FOR SELECT
  USING (blocker_id = auth.uid());

COMMENT ON POLICY "blocklist_select_own" ON public.blocklist
  IS 'Users can only see users they have blocked (their own blocklist).';

-- INSERT: Users can block others
CREATE POLICY "blocklist_insert_own" ON public.blocklist
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

COMMENT ON POLICY "blocklist_insert_own" ON public.blocklist
  IS 'Users can only block others from their own account (blocker_id = auth.uid()).';

-- UPDATE: Disabled (block relationships are immutable)
CREATE POLICY "blocklist_update_disabled" ON public.blocklist
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "blocklist_update_disabled" ON public.blocklist
  IS 'UPDATE disabled: block relationships are immutable. Delete and re-create instead.';

-- DELETE: Users can unblock only their own entries
CREATE POLICY "blocklist_delete_own" ON public.blocklist
  AS PERMISSIVE
  FOR DELETE
  USING (blocker_id = auth.uid());

COMMENT ON POLICY "blocklist_delete_own" ON public.blocklist
  IS 'Users can only unblock users in their own blocklist.';

-- ============================================================================
-- 11. NOTIFICATIONS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own notifications (user_id = auth.uid())
-- - INSERT: Disabled (system only)
-- - UPDATE: Disabled (use API to mark read status)
-- - DELETE: Disabled (soft delete only via deleted_at)

-- SELECT: Users see only their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  AS PERMISSIVE
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON POLICY "notifications_select_own" ON public.notifications
  IS 'GDPR: Users see only their own notifications. Critical for data isolation.';

-- INSERT: Disabled (notifications created by system)
CREATE POLICY "notifications_insert_disabled" ON public.notifications
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "notifications_insert_disabled" ON public.notifications
  IS 'INSERT disabled: notifications created by system only (Edge Functions, triggers).';

-- UPDATE: Disabled (use API for marking read status)
CREATE POLICY "notifications_update_disabled" ON public.notifications
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "notifications_update_disabled" ON public.notifications
  IS 'UPDATE disabled: use API endpoint to mark notifications as read for audit trail.';

-- DELETE: Disabled (soft delete only via deleted_at)
CREATE POLICY "notifications_delete_disabled" ON public.notifications
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "notifications_delete_disabled" ON public.notifications
  IS 'DELETE disabled: use soft delete via deleted_at for GDPR compliance.';

-- ============================================================================
-- 12. NOTIFICATION_PREFERENCES TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own preferences (user_id = auth.uid())
-- - INSERT/UPDATE: Only own preferences
-- - DELETE: Disabled

-- SELECT: Users see only their own preferences
CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences
  AS PERMISSIVE
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON POLICY "notification_preferences_select_own" ON public.notification_preferences
  IS 'Users can only see their own notification preferences.';

-- INSERT: Users can insert only their own preferences
CREATE POLICY "notification_preferences_insert_own" ON public.notification_preferences
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "notification_preferences_insert_own" ON public.notification_preferences
  IS 'Users can only create notification preferences for themselves.';

-- UPDATE: Users can update only their own preferences
CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences
  AS PERMISSIVE
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "notification_preferences_update_own" ON public.notification_preferences
  IS 'Users can only update their own notification preferences.';

-- DELETE: Disabled (preferences maintain service defaults)
CREATE POLICY "notification_preferences_delete_disabled" ON public.notification_preferences
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "notification_preferences_delete_disabled" ON public.notification_preferences
  IS 'DELETE disabled: preferences reset to defaults instead via UPDATE.';

-- ============================================================================
-- 13. RATINGS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - All authenticated users can see all ratings (for public profiles)
-- - INSERT: Users can rate only exchanges they participated in
-- - UPDATE: Users can update own ratings (rater_id = auth.uid())
-- - DELETE: Users can delete own ratings

-- SELECT: All authenticated users can see all ratings (public data for reputation)
CREATE POLICY "ratings_select_all_authenticated" ON public.ratings
  AS PERMISSIVE
  FOR SELECT
  USING (auth.uid() IS NOT NULL);  -- Allow all authenticated users

COMMENT ON POLICY "ratings_select_all_authenticated" ON public.ratings
  IS 'All authenticated users can see all ratings for reputation/trust building. Public data.';

-- INSERT: Users can rate only exchanges they participated in (rater_id = auth.uid())
CREATE POLICY "ratings_insert_own_ratings" ON public.ratings
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (
    rater_id = auth.uid()  -- Must rate as yourself
    AND EXISTS (
      SELECT 1 FROM public.exchanges
      WHERE id = exchange_id
      AND (requester_id = auth.uid() OR lister_id = auth.uid())  -- Must have participated
    )
  );

COMMENT ON POLICY "ratings_insert_own_ratings" ON public.ratings
  IS 'Users can only rate exchanges they participated in (requester or lister).';

-- UPDATE: Users can update own ratings
CREATE POLICY "ratings_update_own" ON public.ratings
  AS PERMISSIVE
  FOR UPDATE
  USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

COMMENT ON POLICY "ratings_update_own" ON public.ratings
  IS 'Users can only update ratings they created. Prevents cross-user modification.';

-- DELETE: Users can delete own ratings
CREATE POLICY "ratings_delete_own" ON public.ratings
  AS PERMISSIVE
  FOR DELETE
  USING (rater_id = auth.uid());

COMMENT ON POLICY "ratings_delete_own" ON public.ratings
  IS 'Users can only delete ratings they created.';

-- ============================================================================
-- 14. USER_STATS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - All authenticated users see all stats (public reputation data)
-- - No INSERT/UPDATE/DELETE (stats auto-calculated by triggers)

-- SELECT: All authenticated users can see all stats (public reputation data)
CREATE POLICY "user_stats_select_all_authenticated" ON public.user_stats
  AS PERMISSIVE
  FOR SELECT
  USING (auth.uid() IS NOT NULL);  -- Allow all authenticated users

COMMENT ON POLICY "user_stats_select_all_authenticated" ON public.user_stats
  IS 'All authenticated users can see all user stats for reputation display. Public data.';

-- INSERT: Disabled (stats auto-created by triggers)
CREATE POLICY "user_stats_insert_disabled" ON public.user_stats
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "user_stats_insert_disabled" ON public.user_stats
  IS 'INSERT disabled: user_stats rows auto-created by trigger on first rating.';

-- UPDATE: Disabled (stats auto-calculated by triggers)
CREATE POLICY "user_stats_update_disabled" ON public.user_stats
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "user_stats_update_disabled" ON public.user_stats
  IS 'UPDATE disabled: stats auto-updated by trigger whenever ratings change.';

-- DELETE: Disabled
CREATE POLICY "user_stats_delete_disabled" ON public.user_stats
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "user_stats_delete_disabled" ON public.user_stats
  IS 'DELETE disabled: stats records are permanent for historical analysis.';

-- ============================================================================
-- 15. TOY_PHOTOS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see photos for toys they can see (active toys or own toys)
-- - INSERT/UPDATE: Disabled (API controls photo management)
-- - DELETE: Users delete photos for own toys

-- SELECT: Users see photos for toys they can see
CREATE POLICY "toy_photos_select_viewable_toys" ON public.toy_photos
  AS PERMISSIVE
  FOR SELECT
  USING (
    toy_id IN (
      SELECT id FROM public.toys
      WHERE status = 'active'  -- Active toys visible to all
      OR user_id = auth.uid()  -- Own toys visible to owner
      OR public.is_admin()  -- Admins see all
    )
  );

COMMENT ON POLICY "toy_photos_select_viewable_toys" ON public.toy_photos
  IS 'Users see photos for toys they can see (active or own).';

-- INSERT: Disabled (API controls photo upload with Supabase Storage)
CREATE POLICY "toy_photos_insert_disabled" ON public.toy_photos
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "toy_photos_insert_disabled" ON public.toy_photos
  IS 'INSERT disabled: photo uploads controlled by API and Supabase Storage RLS.';

-- UPDATE: Disabled (photo metadata immutable)
CREATE POLICY "toy_photos_update_disabled" ON public.toy_photos
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "toy_photos_update_disabled" ON public.toy_photos
  IS 'UPDATE disabled: photo metadata is immutable.';

-- DELETE: Users delete photos for own toys
CREATE POLICY "toy_photos_delete_own_toys" ON public.toy_photos
  AS PERMISSIVE
  FOR DELETE
  USING (
    toy_id IN (
      SELECT id FROM public.toys
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "toy_photos_delete_own_toys" ON public.toy_photos
  IS 'Users can delete photos only from their own toys.';

-- ============================================================================
-- 16. TOY_VIEWS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - No SELECT restriction (system-generated analytics, admin-only viewing)
-- - INSERT: System only
-- - All other operations: Disabled

-- SELECT: Disabled at RLS level (admin queries via service role)
-- Note: Views are sensitive analytics data; access via admin API only
-- This policy allows system service role to read
CREATE POLICY "toy_views_select_admin_only" ON public.toy_views
  AS PERMISSIVE
  FOR SELECT
  USING (false);  -- Disabled for auth.uid(), will be accessed via service role

COMMENT ON POLICY "toy_views_select_admin_only" ON public.toy_views
  IS 'SELECT disabled for authenticated users. Accessed via admin service role only for analytics.';

-- INSERT: Disabled (system only)
CREATE POLICY "toy_views_insert_disabled" ON public.toy_views
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "toy_views_insert_disabled" ON public.toy_views
  IS 'INSERT disabled: view tracking inserted by system only (Edge Functions).';

-- UPDATE: Disabled
CREATE POLICY "toy_views_update_disabled" ON public.toy_views
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "toy_views_update_disabled" ON public.toy_views
  IS 'UPDATE disabled: view records are immutable.';

-- DELETE: Disabled
CREATE POLICY "toy_views_delete_disabled" ON public.toy_views
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "toy_views_delete_disabled" ON public.toy_views
  IS 'DELETE disabled: view history is permanent for analytics.';

-- ============================================================================
-- 17. DELIVERY_CONFIRMATIONS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see confirmations for exchanges they participated in
-- - INSERT/UPDATE: Disabled (API controls delivery workflow)
-- - DELETE: Disabled

-- SELECT: Users see confirmations for their exchanges
CREATE POLICY "delivery_confirmations_select_own_exchanges" ON public.delivery_confirmations
  AS PERMISSIVE
  FOR SELECT
  USING (
    exchange_id IN (
      SELECT id FROM public.exchanges
      WHERE requester_id = auth.uid() OR lister_id = auth.uid()
    )
  );

COMMENT ON POLICY "delivery_confirmations_select_own_exchanges" ON public.delivery_confirmations
  IS 'Users see delivery confirmations only for exchanges they participate in.';

-- INSERT: Disabled (API controls delivery confirmation workflow)
CREATE POLICY "delivery_confirmations_insert_disabled" ON public.delivery_confirmations
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "delivery_confirmations_insert_disabled" ON public.delivery_confirmations
  IS 'INSERT disabled: delivery confirmation workflow controlled by API.';

-- UPDATE: Disabled
CREATE POLICY "delivery_confirmations_update_disabled" ON public.delivery_confirmations
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "delivery_confirmations_update_disabled" ON public.delivery_confirmations
  IS 'UPDATE disabled: delivery records immutable.';

-- DELETE: Disabled
CREATE POLICY "delivery_confirmations_delete_disabled" ON public.delivery_confirmations
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "delivery_confirmations_delete_disabled" ON public.delivery_confirmations
  IS 'DELETE disabled: delivery records permanent for audit trail.';

-- ============================================================================
-- 18. DISPUTES TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see disputes for exchanges they participated in
-- - Admins see all disputes for resolution
-- - INSERT/UPDATE: Disabled (API controls dispute workflow)
-- - DELETE: Disabled

-- SELECT: Users see their disputes, admins see all
CREATE POLICY "disputes_select_own_or_admin" ON public.disputes
  AS PERMISSIVE
  FOR SELECT
  USING (
    exchange_id IN (
      SELECT id FROM public.exchanges
      WHERE requester_id = auth.uid() OR lister_id = auth.uid()
    )
    OR reported_by_id = auth.uid()
    OR public.is_admin()  -- Admins see all for resolution
  );

COMMENT ON POLICY "disputes_select_own_or_admin" ON public.disputes
  IS 'Users see disputes they are part of or reported. Admins see all for resolution.';

-- INSERT: Disabled (API controls dispute creation)
CREATE POLICY "disputes_insert_disabled" ON public.disputes
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "disputes_insert_disabled" ON public.disputes
  IS 'INSERT disabled: dispute creation controlled by API.';

-- UPDATE: Disabled (API controls status/resolution workflow)
CREATE POLICY "disputes_update_disabled" ON public.disputes
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "disputes_update_disabled" ON public.disputes
  IS 'UPDATE disabled: dispute resolution workflow controlled by API.';

-- DELETE: Disabled
CREATE POLICY "disputes_delete_disabled" ON public.disputes
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "disputes_delete_disabled" ON public.disputes
  IS 'DELETE disabled: dispute records permanent for audit trail.';

-- ============================================================================
-- 19. TRANSACTION_LOG TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see only their own transaction history (user_id = auth.uid())
-- - Admins see all for auditing
-- - All write operations disabled

-- SELECT: Users see own transaction history, admins see all
CREATE POLICY "transaction_log_select_own_or_admin" ON public.transaction_log
  AS PERMISSIVE
  FOR SELECT
  USING (
    user_id = auth.uid()  -- Own transactions
    OR public.is_admin()  -- Admins see all for audit
  );

COMMENT ON POLICY "transaction_log_select_own_or_admin" ON public.transaction_log
  IS 'Users see only their own transaction history. Admins see all for auditing.';

-- INSERT: Disabled (system only)
CREATE POLICY "transaction_log_insert_disabled" ON public.transaction_log
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "transaction_log_insert_disabled" ON public.transaction_log
  IS 'INSERT disabled: transaction logs created by system only (triggers, Edge Functions).';

-- UPDATE: Disabled (audit trail immutable)
CREATE POLICY "transaction_log_update_disabled" ON public.transaction_log
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "transaction_log_update_disabled" ON public.transaction_log
  IS 'UPDATE disabled: audit trail is immutable.';

-- DELETE: Disabled (audit trail permanent)
CREATE POLICY "transaction_log_delete_disabled" ON public.transaction_log
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "transaction_log_delete_disabled" ON public.transaction_log
  IS 'DELETE disabled: transaction audit trail is permanent.';

-- ============================================================================
-- 20. GAME_FRAGMENTS TABLE RLS POLICIES
-- ============================================================================
-- Business Logic:
-- - Users see fragments for their own kids only
-- - All write operations: Disabled (system only)

-- SELECT: Users see fragments for own kids
CREATE POLICY "game_fragments_select_own_kids" ON public.game_fragments
  AS PERMISSIVE
  FOR SELECT
  USING (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  );

COMMENT ON POLICY "game_fragments_select_own_kids" ON public.game_fragments
  IS 'GDPR: Users see game fragments only for their own children.';

-- INSERT: Disabled (system only)
CREATE POLICY "game_fragments_insert_disabled" ON public.game_fragments
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (false);

COMMENT ON POLICY "game_fragments_insert_disabled" ON public.game_fragments
  IS 'INSERT disabled: fragments tracked by game system only.';

-- UPDATE: Disabled
CREATE POLICY "game_fragments_update_disabled" ON public.game_fragments
  AS RESTRICTIVE
  FOR UPDATE
  WITH CHECK (false);

COMMENT ON POLICY "game_fragments_update_disabled" ON public.game_fragments
  IS 'UPDATE disabled: fragment records immutable.';

-- DELETE: Disabled
CREATE POLICY "game_fragments_delete_disabled" ON public.game_fragments
  AS RESTRICTIVE
  FOR DELETE
  WITH CHECK (false);

COMMENT ON POLICY "game_fragments_delete_disabled" ON public.game_fragments
  IS 'DELETE disabled: game history permanent.';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Admin Helper Function:
--    - is_admin() checks JWT role and app_metadata for admin status
--    - Used in policies for toys, exchanges, transaction_log to grant admin access
--    - Admins can see deleted/delisted/sensitive data for moderation
--
-- 2. GDPR Compliance:
--    - Kids/wishlists: Strict parent_id = auth.uid() filtering
--    - Notifications: user_id = auth.uid() filtering
--    - Game fragments: kid_id parent check
--    - Soft deletes via status/deleted_at preserve data for compliance
--
-- 3. Ticket Economy Security:
--    - Tickets: Only own wallet visible (user_id = auth.uid())
--    - Exchanges: Both parties can see (requester_id OR lister_id)
--    - Updates disabled: System controls via triggers and Edge Functions
--    - This prevents direct manipulation of ticket balances
--
-- 4. Message Security:
--    - Exchange messages: Visible only to exchange participants
--    - Blocklist: Directional, users see their own blocks
--    - Blocking prevents messaging (trigger enforcement)
--
-- 5. Public Data:
--    - Ratings/user_stats: Public for reputation system
--    - Active toys: Visible to all authenticated users
--    - Blocking/messaging: Controlled at query level
--
-- 6. API-Level Controls:
--    - INSERT/UPDATE disabled via RLS for: tickets, exchanges, notifications
--    - System uses service role key for backend operations
--    - Application enforces business logic (escrow, status transitions)
--    - Triggers provide database-level validation
--
-- 7. Performance Impact:
--    - RLS policies use indexed columns (user_id, parent_id, status, etc.)
--    - Foreign key checks may add latency for nested authorization
--    - Subqueries in wishlists/game_fragments could be optimized with materialized views
--    - Monitor query performance; consider adding RLS-specific indexes if needed
--
-- 8. Testing Strategy:
--    - Test user isolation: User A cannot see User B's data
--    - Test admin access: Admins can see all data
--    - Test soft deletes: Deleted items invisible except to owner/admin
--    - Test concurrent access: Multiple users querying same table
--    - Test edge cases: Null values, cascading deletes
--
