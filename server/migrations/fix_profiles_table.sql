-- Fix profiles table to work without Supabase Auth
-- Remove dependency on auth.users if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make sure password_hash column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- Update the table to not require auth.users reference
-- The id will be a regular UUID primary key
DO $$
BEGIN
  -- Check if the foreign key constraint exists and remove it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;







