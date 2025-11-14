-- Add birthdate validation trigger
-- Migration: 20241114_0010_validate_birthdate.sql
-- Description: Validate birthdate is not in the future with better error message

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS validate_kids_birthdate ON public.kids;
DROP FUNCTION IF EXISTS validate_kids_birthdate_func();

-- Create function to validate birthdate
CREATE OR REPLACE FUNCTION validate_kids_birthdate_func()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if birthdate is in the future
  IF NEW.birthdate IS NOT NULL AND NEW.birthdate > CURRENT_DATE THEN
    RAISE EXCEPTION 'Birthdate cannot be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate birthdate BEFORE INSERT or UPDATE
CREATE TRIGGER validate_kids_birthdate
BEFORE INSERT OR UPDATE OF birthdate ON public.kids
FOR EACH ROW
EXECUTE FUNCTION validate_kids_birthdate_func();
