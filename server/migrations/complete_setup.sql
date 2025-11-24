-- Complete database setup without Supabase dependencies
-- Run this after the main migration if you want a clean setup

-- 1. Fix profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- 2. Create test admin user if it doesn't exist
DO $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT id INTO admin_id FROM profiles WHERE email = 'admin@service.ru';
    
    IF admin_id IS NULL THEN
        admin_id := gen_random_uuid();
        INSERT INTO profiles (id, email, full_name, role) 
        VALUES (admin_id, 'admin@service.ru', 'Администратор', 'admin');
        RAISE NOTICE 'Test admin user created with ID: %', admin_id;
    ELSE
        RAISE NOTICE 'Test admin user already exists with ID: %', admin_id;
    END IF;
END $$;

