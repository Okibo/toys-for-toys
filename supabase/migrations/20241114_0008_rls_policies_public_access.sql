-- RLS Policies for Public Access (Testing)
-- Migration: 20241114_0008_rls_policies_public_access.sql
-- Description: Create RLS policies allowing public INSERT/SELECT for testing
-- Note: These policies should be replaced with proper auth-based policies in production

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.profiles;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kids;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.kids;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kids;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kids;

-- Profiles table policies (allow all operations for testing)
CREATE POLICY "Allow all operations on profiles for testing" ON public.profiles
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Kids table policies (allow all operations for testing)
CREATE POLICY "Allow all operations on kids for testing" ON public.kids
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on profiles for testing" ON public.profiles 
  IS 'TESTING ONLY: Allow all operations without authentication';

COMMENT ON POLICY "Allow all operations on kids for testing" ON public.kids 
  IS 'TESTING ONLY: Allow all operations without authentication';
