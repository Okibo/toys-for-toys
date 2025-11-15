-- Migration: Create Tickets & Ticket Transactions Tables
-- Description: Implement ticket wallet system with audit trail
-- Date: 2024-11-14
-- Depends on: 20241114_0001_create_enums.sql, 20241114_0002_create_profiles.sql

-- Create tickets table
-- Stores current ticket balance and frozen amounts for each user
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  total_balance INTEGER DEFAULT 10 NOT NULL,
  frozen_listing_tickets INTEGER DEFAULT 0 NOT NULL,
  frozen_exchange_tickets INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT total_balance_non_negative CHECK (total_balance >= 0),
  CONSTRAINT frozen_listings_non_negative CHECK (frozen_listing_tickets >= 0),
  CONSTRAINT frozen_exchanges_non_negative CHECK (frozen_exchange_tickets >= 0),
  CONSTRAINT balance_ge_frozen_sum CHECK (
    total_balance >= (frozen_listing_tickets + frozen_exchange_tickets)
  )
);

-- Create indexes for tickets table
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_total_balance ON public.tickets(total_balance);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- Create trigger to update updated_at timestamp on tickets
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION update_tickets_updated_at();

-- Create ticket_transactions table
-- Audit trail for all ticket balance changes
CREATE TABLE IF NOT EXISTS public.ticket_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  transaction_type ticket_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT amount_can_be_negative CHECK (amount IS NOT NULL),
  CONSTRAINT reference_id_is_uuid CHECK (reference_id IS NULL OR reference_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::TEXT)
);

-- Create indexes for ticket_transactions table
CREATE INDEX IF NOT EXISTS idx_ticket_transactions_user_id ON public.ticket_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_transactions_created_at ON public.ticket_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_transactions_type ON public.ticket_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ticket_transactions_user_created ON public.ticket_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_transactions_reference ON public.ticket_transactions(reference_id);

-- Add comments for documentation
COMMENT ON TABLE public.tickets IS 'Current ticket balances for users. One record per user.';
COMMENT ON COLUMN public.tickets.id IS 'Unique identifier for ticket record.';
COMMENT ON COLUMN public.tickets.user_id IS 'Foreign key to profiles(user_id). Unique constraint ensures one record per user.';
COMMENT ON COLUMN public.tickets.total_balance IS 'Current available ticket balance. Starts at 10 for new users.';
COMMENT ON COLUMN public.tickets.frozen_listing_tickets IS 'Tickets frozen by active toy listings (costs 1 ticket per listing).';
COMMENT ON COLUMN public.tickets.frozen_exchange_tickets IS 'Tickets frozen by active exchange requests.';

COMMENT ON TABLE public.ticket_transactions IS 'Audit trail of all ticket balance changes for accounting and dispute resolution.';
COMMENT ON COLUMN public.ticket_transactions.user_id IS 'User whose balance was affected.';
COMMENT ON COLUMN public.ticket_transactions.transaction_type IS 'Type of transaction: listing_created, exchange_request, exchange_completed, etc.';
COMMENT ON COLUMN public.ticket_transactions.amount IS 'Number of tickets added (positive) or removed (negative).';
COMMENT ON COLUMN public.ticket_transactions.reference_id IS 'Optional reference to toy_id or exchange_id for traceability.';
