-- Fix age_group calculation using BEFORE INSERT/UPDATE trigger
-- Migration: 20241114_0009_fix_age_group_with_trigger.sql
-- Description: Replace GENERATED column with trigger-based calculation

-- Add the column back if it doesn't exist (non-generated)
ALTER TABLE public.kids
ADD COLUMN IF NOT EXISTS age_group public.age_group_enum;

-- Drop any existing triggers
DROP TRIGGER IF EXISTS set_age_group_on_kids ON public.kids;
DROP FUNCTION IF EXISTS calculate_age_group();

-- Create function to calculate age group
CREATE OR REPLACE FUNCTION calculate_age_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate age group based on birthdate
  IF NEW.birthdate IS NOT NULL THEN
    NEW.age_group := CASE
      WHEN EXTRACT(YEAR FROM age(NEW.birthdate)) < 3 THEN '0-2'::public.age_group_enum
      WHEN EXTRACT(YEAR FROM age(NEW.birthdate)) < 6 THEN '3-5'::public.age_group_enum
      WHEN EXTRACT(YEAR FROM age(NEW.birthdate)) < 9 THEN '6-8'::public.age_group_enum
      WHEN EXTRACT(YEAR FROM age(NEW.birthdate)) < 12 THEN '9-11'::public.age_group_enum
      WHEN EXTRACT(YEAR FROM age(NEW.birthdate)) < 15 THEN '12-14'::public.age_group_enum
      ELSE '15+'::public.age_group_enum
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate age_group before INSERT or UPDATE
CREATE TRIGGER set_age_group_on_kids
BEFORE INSERT OR UPDATE OF birthdate ON public.kids
FOR EACH ROW
EXECUTE FUNCTION calculate_age_group();

-- Recreate the view
CREATE OR REPLACE VIEW public.user_age_groups AS
SELECT
  k.parent_id,
  k.age_group,
  COUNT(k.id) AS child_count,
  ARRAY_AGG(k.id) FILTER (WHERE k.status = 'active') AS active_child_ids,
  COUNT(k.id) FILTER (WHERE k.status = 'active') AS active_count,
  COUNT(k.id) FILTER (WHERE k.status = 'hidden') AS hidden_count,
  COUNT(k.id) FILTER (WHERE k.status = 'deleted') AS deleted_count,
  MAX(k.updated_at) AS last_updated
FROM public.kids k
GROUP BY k.parent_id, k.age_group;

-- Update existing records' age_group
UPDATE public.kids
SET age_group = CASE
  WHEN EXTRACT(YEAR FROM age(birthdate)) < 3 THEN '0-2'::public.age_group_enum
  WHEN EXTRACT(YEAR FROM age(birthdate)) < 6 THEN '3-5'::public.age_group_enum
  WHEN EXTRACT(YEAR FROM age(birthdate)) < 9 THEN '6-8'::public.age_group_enum
  WHEN EXTRACT(YEAR FROM age(birthdate)) < 12 THEN '9-11'::public.age_group_enum
  WHEN EXTRACT(YEAR FROM age(birthdate)) < 15 THEN '12-14'::public.age_group_enum
  ELSE '15+'::public.age_group_enum
END
WHERE birthdate IS NOT NULL;

-- Update documentation
COMMENT ON COLUMN public.kids.age_group IS 'Computed age group (0-2, 3-5, 6-8, 9-11, 12-14, 15+) from birthdate - calculated by trigger';
