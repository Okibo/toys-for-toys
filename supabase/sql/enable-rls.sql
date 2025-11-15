-- Enable Row-Level Security (RLS) Foundation
-- Purpose: Enable RLS on all tables that require it (deny by default)
-- Task: P1-W1-SETUP-002
-- NOTE: Actual RLS policies will be created in P1-W2-RLS-003
--
-- RLS Tables:
--   - profiles: User account data (requires user isolation)
--   - toys: Toy listings (requires user isolation + public read)
--   - exchanges: Exchange transactions (requires user isolation)
--   - tickets: Ticket balance (requires user isolation)
--   - ticket_transactions: Audit trail (requires user isolation)
--   - consent_records: GDPR consent (requires user isolation)
--
-- No RLS Tables:
--   - toy_images: Controlled via toy RLS + Storage RLS

-- ============================================================================
-- ENABLE RLS ON ALL REQUIRED TABLES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON POLICY "profiles rls stub" ON public.profiles IS 'RLS enabled - deny by default until policies are created in P1-W2-RLS-003';

-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
COMMENT ON POLICY "tickets rls stub" ON public.tickets IS 'RLS enabled - deny by default until policies are created in P1-W2-RLS-003';

-- Enable RLS on ticket_transactions table
ALTER TABLE public.ticket_transactions ENABLE ROW LEVEL SECURITY;
COMMENT ON POLICY "ticket_transactions rls stub" ON public.ticket_transactions IS 'RLS enabled - deny by default until policies are created in P1-W2-RLS-003';

-- Enable RLS on toys table
ALTER TABLE public.toys ENABLE ROW LEVEL SECURITY;
COMMENT ON POLICY "toys rls stub" ON public.toys IS 'RLS enabled - deny by default until policies are created in P1-W2-RLS-003';

-- Enable RLS on exchanges table
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
COMMENT ON POLICY "exchanges rls stub" ON public.exchanges IS 'RLS enabled - deny by default until policies are created in P1-W2-RLS-003';

-- Enable RLS on consent_records table
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
COMMENT ON POLICY "consent_records rls stub" ON public.consent_records IS 'RLS enabled - deny by default until policies are created in P1-W2-RLS-003';

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================

-- Verification query: Shows which tables have RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Expected output (all should show TRUE):
--   profiles          | t
--   tickets           | t
--   ticket_transactions | t
--   toys              | t
--   exchanges         | t
--   consent_records   | t
--   toy_images        | f  (no RLS - controlled via toy.user_id)

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
╔═════════════════════════════════════════════════════════════════════════╗
║                   RLS ENABLEMENT COMPLETE                              ║
╠═════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║ RLS Status: ENABLED on 6 tables                                        ║
║                                                                         ║
║ Protected Tables:                                                       ║
║   ✓ profiles - User data isolation                                     ║
║   ✓ tickets - Wallet isolation                                         ║
║   ✓ ticket_transactions - Audit trail isolation                        ║
║   ✓ toys - Listing access control                                      ║
║   ✓ exchanges - Transaction isolation                                   ║
║   ✓ consent_records - GDPR compliance data                             ║
║                                                                         ║
║ Unprotected Tables:                                                     ║
║   • toy_images - No RLS (controlled via toy.user_id + Storage RLS)     ║
║                                                                         ║
║ Security Posture: DENY BY DEFAULT                                       ║
║   - All tables configured to deny all access until policies created    ║
║   - Supabase auth.users role will have explicit GRANT statements       ║
║   - Service role has unrestricted access (for admin operations)        ║
║                                                                         ║
║ Next Step: Create RLS policies (P1-W2-RLS-003)                        ║
║   Policy categories:                                                    ║
║   1. User self-access (own profile, own tickets, own consents)         ║
║   2. Toy read access (public listing discovery)                         ║
║   3. Exchange isolation (requester/owner access only)                   ║
║   4. Audit trail access (user's own transactions)                       ║
║   5. Admin overrides (service role exceptions)                          ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
  ';
END $$;
