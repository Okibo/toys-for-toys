-- Migration: Create Consent Records Table
-- Description: GDPR compliance tracking for user consents
-- Date: 2024-11-14
-- Depends on: 20241114_0001_create_enums.sql, 20241114_0002_create_profiles.sql

-- Create consent_records table
-- Tracks all user consent decisions for privacy policy, terms of service, and analytics
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  consent_type consent_type NOT NULL,
  consent_given BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  withdrawn_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT user_agent_not_empty CHECK (user_agent IS NULL OR TRIM(user_agent) <> ''),
  CONSTRAINT withdrawn_after_timestamp CHECK (withdrawn_at IS NULL OR withdrawn_at > timestamp),
  CONSTRAINT unique_active_consent UNIQUE(user_id, consent_type) WHERE withdrawn_at IS NULL
);

-- Create indexes for consent_records table
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON public.consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON public.consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_timestamp ON public.consent_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_given ON public.consent_records(consent_given);
CREATE INDEX IF NOT EXISTS idx_consent_records_withdrawn ON public.consent_records(withdrawn_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_consent_records_user_type ON public.consent_records(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_timestamp ON public.consent_records(user_id, timestamp DESC);

-- Index for checking active consents (not withdrawn)
CREATE INDEX IF NOT EXISTS idx_consent_records_active ON public.consent_records(user_id, consent_type)
  WHERE withdrawn_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE public.consent_records IS 'GDPR compliance audit trail. Records all user consent decisions for privacy policy, terms of service, and behavioral analytics.';
COMMENT ON COLUMN public.consent_records.id IS 'Unique identifier for consent record.';
COMMENT ON COLUMN public.consent_records.user_id IS 'User who gave/withdrew consent.';
COMMENT ON COLUMN public.consent_records.consent_type IS 'Type of consent: privacy_policy, terms_of_service, or behavioral_analytics.';
COMMENT ON COLUMN public.consent_records.consent_given IS 'True if consent was given, false if declined.';
COMMENT ON COLUMN public.consent_records.timestamp IS 'When consent decision was made.';
COMMENT ON COLUMN public.consent_records.ip_address IS 'IP address for audit trail (GDPR compliance requirement).';
COMMENT ON COLUMN public.consent_records.user_agent IS 'User agent string for audit trail and device tracking.';
COMMENT ON COLUMN public.consent_records.withdrawn_at IS 'If set, indicates when user withdrew consent.';
