-- Migration: Create Profiles Table
-- Description: User profile information linked to Supabase auth.users
-- Date: 2024-11-14
-- Depends on: 20241114_0001_create_enums.sql

-- Create profiles table
-- This table extends Supabase auth.users with additional profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  language_preference language_preference DEFAULT 'en' NOT NULL,
  postal_code TEXT NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT postal_code_not_empty CHECK (TRIM(postal_code) <> '')
);

-- Create indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_postal_code ON public.profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_language_pref ON public.profiles(language_preference);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase auth.users. Extends auth system with additional user data.';
COMMENT ON COLUMN public.profiles.user_id IS 'Foreign key to auth.users(id). Primary key for profiles.';
COMMENT ON COLUMN public.profiles.email IS 'User email address from auth system. Must be unique.';
COMMENT ON COLUMN public.profiles.full_name IS 'Optional full name of the user (parent).';
COMMENT ON COLUMN public.profiles.language_preference IS 'User language preference: en (English), de (German), pl (Polish).';
COMMENT ON COLUMN public.profiles.postal_code IS 'Postal code for toy exchange location matching.';
COMMENT ON COLUMN public.profiles.is_email_verified IS 'Flag indicating if email has been verified.';
