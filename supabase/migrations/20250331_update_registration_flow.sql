-- Update database schema for new registration flow
-- 1. Add new fields to gc_accounts table
ALTER TABLE gc_accounts 
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES subscription_tiers(id);

-- 2. Create migration to move data from profiles to gc_accounts (for existing records)
UPDATE gc_accounts
SET 
  website = p.website,
  license_number = p.license_number,
  address = p.address,
  phone_number = p.phone_number,
  subscription_tier_id = p.subscription_tier_id
FROM profiles p
WHERE p.gc_account_id = gc_accounts.id
  AND p.role = 'gc_admin';

-- 3. Keep the fields in profiles table for backward compatibility
-- We'll remove them in a future migration after ensuring everything works
-- ALTER TABLE profiles 
--   DROP COLUMN IF EXISTS website,
--   DROP COLUMN IF EXISTS license_number,
--   DROP COLUMN IF EXISTS address,
--   DROP COLUMN IF EXISTS phone_number,
--   DROP COLUMN IF EXISTS subscription_tier_id;

-- 4. Fix the trigger function to work with the new schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  gc_account_id uuid;
BEGIN
  -- Create a profile record for every new user
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    gc_account_id,
    account_status,
    has_completed_profile,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'gc_admin'),
    NULL, -- Will be updated later for team members
    'active',
    false,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but allow user creation to proceed
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
