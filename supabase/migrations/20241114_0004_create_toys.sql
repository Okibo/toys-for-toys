-- Migration: Create Toy Listings Tables
-- Description: Implement toy catalog with images and metadata
-- Date: 2024-11-14
-- Depends on: 20241114_0001_create_enums.sql, 20241114_0002_create_profiles.sql

-- Create toys table
-- Represents all toy listings available on the platform
CREATE TABLE IF NOT EXISTS public.toys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category toy_category NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  age_group toy_age_group NOT NULL,
  condition toy_condition NOT NULL,
  postal_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  frozen_listing_tickets INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::TEXT, NOW()) + INTERVAL '90 days') NOT NULL,

  -- Constraints
  CONSTRAINT description_length CHECK (LENGTH(TRIM(description)) > 0 AND LENGTH(description) <= 500),
  CONSTRAINT description_not_empty CHECK (TRIM(description) <> ''),
  CONSTRAINT tags_count CHECK (ARRAY_LENGTH(tags, 1) IS NULL OR ARRAY_LENGTH(tags, 1) BETWEEN 1 AND 3),
  CONSTRAINT postal_code_not_empty CHECK (TRIM(postal_code) <> ''),
  CONSTRAINT frozen_tickets_valid CHECK (frozen_listing_tickets >= 0),
  CONSTRAINT expires_after_created CHECK (expires_at > created_at)
);

-- Create indexes for toys table
CREATE INDEX IF NOT EXISTS idx_toys_user_id ON public.toys(user_id);
CREATE INDEX IF NOT EXISTS idx_toys_category ON public.toys(category);
CREATE INDEX IF NOT EXISTS idx_toys_age_group ON public.toys(age_group);
CREATE INDEX IF NOT EXISTS idx_toys_postal_code ON public.toys(postal_code);
CREATE INDEX IF NOT EXISTS idx_toys_is_active ON public.toys(is_active);
CREATE INDEX IF NOT EXISTS idx_toys_created_at ON public.toys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_toys_expires_at ON public.toys(expires_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_toys_user_active ON public.toys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_toys_category_age_active ON public.toys(category, age_group, is_active);
CREATE INDEX IF NOT EXISTS idx_toys_postal_active ON public.toys(postal_code, is_active);
CREATE INDEX IF NOT EXISTS idx_toys_active_created ON public.toys(is_active, created_at DESC);

-- Full-text search index on description for toy discovery
CREATE INDEX IF NOT EXISTS idx_toys_description_fts ON public.toys
  USING GIN(to_tsvector('english'::regconfig, description));

-- GIN index on tags for array searches
CREATE INDEX IF NOT EXISTS idx_toys_tags_gin ON public.toys USING GIN(tags);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_toys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_toys_updated_at
BEFORE UPDATE ON public.toys
FOR EACH ROW
EXECUTE FUNCTION update_toys_updated_at();

-- Create trigger to auto-set expires_at if not provided
CREATE OR REPLACE FUNCTION set_toys_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = TIMEZONE('utc'::TEXT, NOW()) + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_toys_set_expires_at
BEFORE INSERT ON public.toys
FOR EACH ROW
EXECUTE FUNCTION set_toys_expires_at();

-- Create toy_images table
-- Stores references to toy images in Supabase Storage
CREATE TABLE IF NOT EXISTS public.toy_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toy_id UUID NOT NULL REFERENCES public.toys(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  image_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT image_order_valid CHECK (image_order >= 1 AND image_order <= 5),
  CONSTRAINT storage_path_not_empty CHECK (TRIM(storage_path) <> ''),
  CONSTRAINT unique_toy_image_order UNIQUE(toy_id, image_order),
  CONSTRAINT max_5_images_per_toy CHECK (
    (SELECT COUNT(*) FROM public.toy_images ti WHERE ti.toy_id = toy_id) <= 5
  )
);

-- Create indexes for toy_images table
CREATE INDEX IF NOT EXISTS idx_toy_images_toy_id ON public.toy_images(toy_id);
CREATE INDEX IF NOT EXISTS idx_toy_images_created_at ON public.toy_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_toy_images_order ON public.toy_images(toy_id, image_order);

-- Add comments for documentation
COMMENT ON TABLE public.toys IS 'Active toy listings available for exchange. Links to toy_images for photos and to exchanges for active requests.';
COMMENT ON COLUMN public.toys.id IS 'Unique identifier for toy listing.';
COMMENT ON COLUMN public.toys.user_id IS 'Owner of the toy listing.';
COMMENT ON COLUMN public.toys.category IS 'Category: blocks, vehicles, dolls, board_games, educational, sports, art, other.';
COMMENT ON COLUMN public.toys.description IS 'Detailed description of toy condition and characteristics (max 500 chars).';
COMMENT ON COLUMN public.toys.tags IS 'Array of 1-3 tags for discovery (e.g., ARRAY[''wooden'', ''educational'']).';
COMMENT ON COLUMN public.toys.age_group IS 'Target age group: 0-2, 3-5, 6-8, 9-11, 12-14, 15+.';
COMMENT ON COLUMN public.toys.condition IS 'Condition rating: like_new, good, fair, well_loved.';
COMMENT ON COLUMN public.toys.postal_code IS 'Postal code for geographic matching with other users.';
COMMENT ON COLUMN public.toys.is_active IS 'Soft delete flag: inactive listings are archived but not removed.';
COMMENT ON COLUMN public.toys.frozen_listing_tickets IS 'Tickets frozen by this listing (always 1 while active).';
COMMENT ON COLUMN public.toys.expires_at IS 'Automatic expiration after 90 days. Admin may archive expired listings.';

COMMENT ON TABLE public.toy_images IS 'Image references for toy listings stored in Supabase Storage.';
COMMENT ON COLUMN public.toy_images.toy_id IS 'Foreign key to toys(id). Cascade delete removes images when toy is deleted.';
COMMENT ON COLUMN public.toy_images.storage_path IS 'Path to image in Supabase Storage (includes bucket and folder).';
COMMENT ON COLUMN public.toy_images.image_order IS 'Display order for carousel (1-5). Primary image is typically order 1.';
