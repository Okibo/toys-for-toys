-- Migration: Create Exchange Tables
-- Description: Implement toy exchange workflow with status tracking
-- Date: 2024-11-14
-- Depends on: 20241114_0001_create_enums.sql, 20241114_0002_create_profiles.sql, 20241114_0004_create_toys.sql

-- Create exchanges table
-- Represents active toy exchange requests between users
CREATE TABLE IF NOT EXISTS public.exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toy_id UUID REFERENCES public.toys(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status exchange_status DEFAULT 'pending_requester_confirmation' NOT NULL,
  delivery_method delivery_method NOT NULL,
  requester_message TEXT,
  frozen_requester_tickets INTEGER DEFAULT 1 NOT NULL,
  frozen_owner_tickets INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  owner_response_deadline TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::TEXT, NOW()) + INTERVAL '7 days') NOT NULL,
  delivery_deadline TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT requester_message_length CHECK (requester_message IS NULL OR LENGTH(TRIM(requester_message)) <= 500),
  CONSTRAINT frozen_requester_tickets_valid CHECK (frozen_requester_tickets >= 0),
  CONSTRAINT frozen_owner_tickets_valid CHECK (frozen_owner_tickets >= 0),
  CONSTRAINT different_users CHECK (requester_id <> owner_id),
  CONSTRAINT delivery_deadline_after_created CHECK (delivery_deadline IS NULL OR delivery_deadline > created_at),
  CONSTRAINT owner_response_deadline_future CHECK (owner_response_deadline > created_at)
);

-- Create indexes for exchanges table
CREATE INDEX IF NOT EXISTS idx_exchanges_requester_id ON public.exchanges(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_owner_id ON public.exchanges(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_toy_id ON public.exchanges(toy_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_status ON public.exchanges(status);
CREATE INDEX IF NOT EXISTS idx_exchanges_created_at ON public.exchanges(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_exchanges_requester_status ON public.exchanges(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_exchanges_owner_status ON public.exchanges(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_exchanges_toy_status ON public.exchanges(toy_id, status);

-- Index for deadline-based queries (finding expired exchanges)
CREATE INDEX IF NOT EXISTS idx_exchanges_response_deadline ON public.exchanges(owner_response_deadline);
CREATE INDEX IF NOT EXISTS idx_exchanges_delivery_deadline ON public.exchanges(delivery_deadline);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exchanges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exchanges_updated_at
BEFORE UPDATE ON public.exchanges
FOR EACH ROW
EXECUTE FUNCTION update_exchanges_updated_at();

-- Create trigger to set delivery_deadline when exchange is confirmed
-- This sets delivery_deadline to 48 hours from confirmation
CREATE OR REPLACE FUNCTION set_delivery_deadline_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to exchange_confirmed, set delivery_deadline to 48h from now
  IF NEW.status = 'exchange_confirmed' AND OLD.status <> 'exchange_confirmed' THEN
    NEW.delivery_deadline = TIMEZONE('utc'::TEXT, NOW()) + INTERVAL '48 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exchanges_set_delivery_deadline
BEFORE UPDATE ON public.exchanges
FOR EACH ROW
EXECUTE FUNCTION set_delivery_deadline_on_confirm();

-- Add comments for documentation
COMMENT ON TABLE public.exchanges IS 'Exchange requests between users. Tracks the lifecycle of toy exchanges from request to completion.';
COMMENT ON COLUMN public.exchanges.id IS 'Unique identifier for exchange transaction.';
COMMENT ON COLUMN public.exchanges.toy_id IS 'Reference to requested toy. Soft link (can be null if toy deleted).';
COMMENT ON COLUMN public.exchanges.requester_id IS 'User requesting the toy.';
COMMENT ON COLUMN public.exchanges.owner_id IS 'User offering/owning the toy.';
COMMENT ON COLUMN public.exchanges.status IS 'Exchange lifecycle: pending_requester_confirmation -> pending_owner_response -> exchange_confirmed -> pending_delivery_confirmation -> exchange_completed. Can transition to dispute_filed or closed.';
COMMENT ON COLUMN public.exchanges.delivery_method IS 'How toy will be transferred: in_person, mail, or courier.';
COMMENT ON COLUMN public.exchanges.requester_message IS 'Optional message from requester explaining interest in toy.';
COMMENT ON COLUMN public.exchanges.frozen_requester_tickets IS 'Tickets frozen from requester during exchange (typically 1).';
COMMENT ON COLUMN public.exchanges.frozen_owner_tickets IS 'Tickets frozen from owner when exchange confirmed (typically 1).';
COMMENT ON COLUMN public.exchanges.owner_response_deadline IS 'Deadline for owner to respond (7 days from creation). Auto-close if missed.';
COMMENT ON COLUMN public.exchanges.delivery_deadline IS 'Deadline to confirm delivery (48 hours from confirmation). Set when status changes to exchange_confirmed.';
