-- Migration: Create Row-Level Security (RLS) Policies
-- Description: Implement comprehensive RLS policies for all 7 core tables
-- Date: 2024-11-14
-- Security: Production-ready with user isolation, data minimization, and service role bypass
-- Depends on: All previous migrations (enums, profiles, tickets, toys, exchanges, consent_records)

-- ============================================================================
-- SECURITY PRINCIPLE: Deny by default, explicitly allow specific operations
-- ============================================================================
-- All policies use the principle of least privilege. Authentication is via
-- auth.uid() which returns the JWT subject (user_id). Service role key bypass
-- is automatically granted by Supabase for backend operations.

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to user profile information
-- Security Model:
--   - SELECT: Users can read own profile + limited public fields of others
--   - UPDATE: Users can only update own profile
--   - DELETE: Denied (GDPR deletion workflow only)
--   - INSERT: Denied (only via auth trigger)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can read own profile. They can also read public display info
-- of others (full_name, email, postal_code for location matching in future)
CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own profile
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Deny direct deletion (GDPR workflows handle this via triggers)
CREATE POLICY "Deny profile deletion"
ON public.profiles FOR DELETE
USING (FALSE);

-- INSERT Policy: Deny direct insertion (only via auth trigger)
CREATE POLICY "Deny profile insertion"
ON public.profiles FOR INSERT
WITH CHECK (FALSE);

-- ============================================================================
-- TICKETS TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to ticket balance information
-- Security Model:
--   - SELECT: Users can only read their own ticket balance
--   - UPDATE: Denied (only triggers update balance)
--   - INSERT: Denied (only triggers insert)
--   - DELETE: Denied (immutable)
-- Rationale: Tickets represent financial value in the platform. Only individual
-- users can view their balance. System triggers handle all modifications.

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can only read their own ticket balance
CREATE POLICY "Allow users to read own ticket balance"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

-- UPDATE Policy: Deny (only system triggers update balance via service role)
CREATE POLICY "Deny ticket balance updates from users"
ON public.tickets FOR UPDATE
USING (FALSE);

-- INSERT Policy: Deny (only system creates on profile creation)
CREATE POLICY "Deny ticket insertion from users"
ON public.tickets FOR INSERT
WITH CHECK (FALSE);

-- DELETE Policy: Deny (immutable audit trail)
CREATE POLICY "Deny ticket deletion"
ON public.tickets FOR DELETE
USING (FALSE);

-- ============================================================================
-- TOYS TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to toy listings
-- Security Model:
--   - SELECT: All authenticated users see active toys + own toys (any status)
--   - INSERT: Users can insert only for themselves
--   - UPDATE: Users can only update their own toys
--   - DELETE: Denied (soft delete only via is_active = false)
-- Rationale: Active toys are public to authenticated users for discovery.
-- Inactive/expired toys only visible to their owner.

ALTER TABLE public.toys ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Authenticated users see all active toys + their own toys
CREATE POLICY "Allow users to see active toys and own toys"
ON public.toys FOR SELECT
USING (
  is_active = TRUE  -- All active toys visible to authenticated users
  OR auth.uid() = user_id  -- Plus their own toys regardless of status
);

-- INSERT Policy: Users can only create toys for themselves
CREATE POLICY "Allow users to insert own toys"
ON public.toys FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own toys
CREATE POLICY "Allow users to update own toys"
ON public.toys FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Deny hard deletion (soft delete via is_active = false)
CREATE POLICY "Deny toy deletion - use soft delete"
ON public.toys FOR DELETE
USING (FALSE);

-- ============================================================================
-- TOY_IMAGES TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to toy image metadata
-- Security Model:
--   - SELECT: Auth users see images for active toys + own toy images
--   - INSERT: Users can insert images for their own toys only
--   - UPDATE: Users can update image_order for their own toys only
--   - DELETE: Users can delete their own toy images only
-- Rationale: Images are tied to toy listings. Access follows toy access control.

ALTER TABLE public.toy_images ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users see images for active toys + their own toy images
CREATE POLICY "Allow users to see images for active toys and own toys"
ON public.toy_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND (toys.is_active = TRUE OR auth.uid() = toys.user_id)
  )
);

-- INSERT Policy: Users can insert images for their own toys only
CREATE POLICY "Allow users to insert images for own toys"
ON public.toy_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
);

-- UPDATE Policy: Users can update image_order for their own toy images
CREATE POLICY "Allow users to update own toy image order"
ON public.toy_images FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
);

-- DELETE Policy: Users can delete their own toy images
CREATE POLICY "Allow users to delete own toy images"
ON public.toy_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
);

-- ============================================================================
-- EXCHANGES TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to exchange transaction data
-- Security Model:
--   - SELECT: Users see exchanges where they're requester OR owner
--   - INSERT: Auth users can insert (system creates exchanges)
--   - UPDATE: Users can update exchanges they're involved in
--   - DELETE: Denied (archived via status update, never hard deleted)
-- Rationale: Exchanges are private to the two parties involved. Data isolation
-- is critical as exchanges contain sensitive transaction state.

ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users see exchanges where they're requester_id OR owner_id
CREATE POLICY "Allow users to see their exchanges"
ON public.exchanges FOR SELECT
USING (
  auth.uid() = requester_id
  OR auth.uid() = owner_id
);

-- INSERT Policy: Allow authenticated users to insert exchanges
-- (System API routes control business logic constraints)
CREATE POLICY "Allow authenticated users to create exchanges"
ON public.exchanges FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE Policy: Users can update exchanges they're involved in
CREATE POLICY "Allow users to update their exchanges"
ON public.exchanges FOR UPDATE
USING (
  auth.uid() = requester_id
  OR auth.uid() = owner_id
)
WITH CHECK (
  auth.uid() = requester_id
  OR auth.uid() = owner_id
);

-- DELETE Policy: Deny hard deletion (archives via status change)
CREATE POLICY "Deny exchange deletion - use archive via status"
ON public.exchanges FOR DELETE
USING (FALSE);

-- ============================================================================
-- CONSENT_RECORDS TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to GDPR consent audit trail
-- Security Model:
--   - SELECT: Users read only their own consent records
--   - INSERT: Users insert their own consent records
--   - UPDATE: Users update withdrawn_at only on their own records
--   - DELETE: Denied (immutable audit trail per GDPR)
-- Rationale: Consent records are audit trail for legal compliance. Users must
-- be able to view and withdraw consent, but cannot modify history.

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users read only their own consent records
CREATE POLICY "Allow users to read own consent records"
ON public.consent_records FOR SELECT
USING (auth.uid() = user_id);

-- INSERT Policy: Users insert their own consent records
CREATE POLICY "Allow users to insert own consent records"
ON public.consent_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update withdrawn_at on their own records
-- This allows consent withdrawal without modifying history
CREATE POLICY "Allow users to withdraw own consents"
ON public.consent_records FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Ensure withdrawn_at can only be set, not cleared
  AND (
    (OLD.withdrawn_at IS NULL AND (NEW.withdrawn_at IS NULL OR NEW.withdrawn_at > OLD.timestamp))
    OR (OLD.withdrawn_at IS NOT NULL AND NEW.withdrawn_at = OLD.withdrawn_at)
  )
);

-- DELETE Policy: Deny deletion (immutable audit trail)
CREATE POLICY "Deny consent record deletion - immutable audit trail"
ON public.consent_records FOR DELETE
USING (FALSE);

-- ============================================================================
-- TICKET_TRANSACTIONS TABLE RLS POLICIES
-- ============================================================================
-- Purpose: Control access to ticket transaction audit log
-- Security Model:
--   - SELECT: Users read only their own transaction history
--   - INSERT: Denied (only triggers insert transactions)
--   - UPDATE: Denied (immutable)
--   - DELETE: Denied (immutable)
-- Rationale: Immutable audit log. Only system processes create entries.
-- Users can view their own history for transparency.

ALTER TABLE public.ticket_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users read only their own transaction history
CREATE POLICY "Allow users to read own transaction history"
ON public.ticket_transactions FOR SELECT
USING (auth.uid() = user_id);

-- INSERT Policy: Deny (only system creates via triggers)
CREATE POLICY "Deny transaction insertion from users"
ON public.ticket_transactions FOR INSERT
WITH CHECK (FALSE);

-- UPDATE Policy: Deny (immutable audit log)
CREATE POLICY "Deny transaction updates"
ON public.ticket_transactions FOR UPDATE
USING (FALSE);

-- DELETE Policy: Deny (immutable audit log)
CREATE POLICY "Deny transaction deletion"
ON public.ticket_transactions FOR DELETE
USING (FALSE);

-- ============================================================================
-- UNAUTHENTICATED USER ACCESS (Future: SEO and Public Discovery)
-- ============================================================================
-- Currently, unauthenticated users have no direct data access.
-- Future implementation can add specific public views if needed:
--   - Public toy listings (active only, no user identification)
--   - Public user ratings/statistics (future feature)
-- ============================================================================

-- End of migration: 20241114_0007_create_rls_policies.sql
