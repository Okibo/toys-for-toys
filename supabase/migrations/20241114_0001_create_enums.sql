-- Migration: Create Enum Types
-- Description: Define all PostgreSQL enums used across the core schema
-- Date: 2024-11-14

-- Idempotent create enum function
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(enum_name text, values text[])
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = enum_name AND typtype = 'e') THEN
    EXECUTE format('CREATE TYPE %I AS ENUM (%s)',
      enum_name,
      string_agg(quote_literal(v), ', ' ORDER BY v)
    ) FROM unnest(values) AS v;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Language preferences enum
DO $$ BEGIN
  CREATE TYPE language_preference AS ENUM ('en', 'de', 'pl');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Toy categories enum
DO $$ BEGIN
  CREATE TYPE toy_category AS ENUM (
    'blocks',
    'vehicles',
    'dolls',
    'board_games',
    'educational',
    'sports',
    'art',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Age groups enum - represents age ranges in years
DO $$ BEGIN
  CREATE TYPE toy_age_group AS ENUM (
    '0-2',
    '3-5',
    '6-8',
    '9-11',
    '12-14',
    '15+'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Toy condition enum
DO $$ BEGIN
  CREATE TYPE toy_condition AS ENUM (
    'like_new',
    'good',
    'fair',
    'well_loved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Exchange status enum
-- Represents the lifecycle of an exchange transaction
DO $$ BEGIN
  CREATE TYPE exchange_status AS ENUM (
    'pending_requester_confirmation',
    'pending_owner_response',
    'exchange_confirmed',
    'pending_delivery_confirmation',
    'exchange_completed',
    'dispute_filed',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Delivery method enum
DO $$ BEGIN
  CREATE TYPE delivery_method AS ENUM (
    'in_person',
    'mail',
    'courier'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ticket transaction type enum
-- Audit trail for all ticket balance changes
DO $$ BEGIN
  CREATE TYPE ticket_transaction_type AS ENUM (
    'listing_created',
    'listing_removed',
    'exchange_request',
    'exchange_declined',
    'exchange_completed',
    'mini_game_reward',
    'refund'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Consent type enum
-- Tracks different types of user consent for GDPR compliance
DO $$ BEGIN
  CREATE TYPE consent_type AS ENUM (
    'privacy_policy',
    'terms_of_service',
    'behavioral_analytics'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Clean up temporary function
DROP FUNCTION IF EXISTS create_enum_if_not_exists(text, text[]);
