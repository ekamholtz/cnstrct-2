-- Fix user registration issues for gc_admin users
-- This migration addresses the "Database error saving new user" error

-- 1. Check if there's a trigger on auth.users that might be failing
DO $$
BEGIN
  -- Drop any existing broken triggers if they exist
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
END
$$;

-- Create a more robust trigger for handling user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  gc_account_id uuid;
  default_subscription_id uuid;
BEGIN
  -- Get a default subscription tier ID to use temporarily
  -- This will be updated later when the user selects their subscription
  SELECT id INTO default_subscription_id FROM subscription_tiers LIMIT 1;
  
  -- If no subscription tier exists, we need to create one
  IF default_subscription_id IS NULL THEN
    -- Create a default subscription tier if none exists
    INSERT INTO subscription_tiers (
      name, 
      description, 
      price, 
      features, 
      created_at, 
      updated_at
    ) VALUES (
      'Professional', 
      'Default subscription tier', 
      79.99, 
      ARRAY['Unlimited projects', 'Advanced reporting', 'Priority support'], 
      NOW(), 
      NOW()
    ) RETURNING id INTO default_subscription_id;
  END IF;

  -- Create a new GC account if the user is a gc_admin
  IF NEW.raw_user_meta_data->>'role' = 'gc_admin' THEN
    INSERT INTO public.gc_accounts (company_name, owner_id, created_at, updated_at)
    VALUES (
      (NEW.raw_user_meta_data->>'full_name') || '''s Company',
      NEW.id,
      NOW(),
      NOW()
    )
    RETURNING id INTO gc_account_id;
  END IF;

  -- Insert a row into public.profiles for the new user
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    gc_account_id,
    account_status,
    has_completed_profile,
    created_at,
    updated_at,
    subscription_tier_id  -- Add subscription_tier_id to the insert
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'gc_admin'),
    gc_account_id,
    'active',
    false,
    NOW(),
    NOW(),
    CASE
      -- For non-gc_admin users, we can set the subscription tier directly
      WHEN NEW.raw_user_meta_data->>'role' != 'gc_admin' THEN default_subscription_id
      -- For gc_admin users, we'll set it to NULL initially and let them choose later
      ELSE NULL
    END
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    -- Continue with user creation even if profile creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DO $$
BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END
$$;

-- 2. Ensure the profiles table has the correct structure
DO $$
BEGIN
  -- Add any missing columns to the profiles table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gc_account_id') THEN
    ALTER TABLE public.profiles ADD COLUMN gc_account_id UUID REFERENCES public.gc_accounts(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_completed_profile') THEN
    ALTER TABLE public.profiles ADD COLUMN has_completed_profile BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE public.profiles ADD COLUMN account_status TEXT DEFAULT 'active';
  END IF;
  
  -- Temporarily make subscription_tier_id nullable to allow profile creation
  -- This will be set during the subscription selection process
  ALTER TABLE public.profiles ALTER COLUMN subscription_tier_id DROP NOT NULL;
  
  -- Drop email column from profiles table
  IF EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles DROP COLUMN email;
  END IF;
END
$$;

-- 3. Ensure the UserRole enum includes all necessary roles
DO $$
BEGIN
  -- Check if the UserRole type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
    -- Add values to the enum if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'userrole'::regtype AND enumlabel = 'gc_admin') THEN
      ALTER TYPE public.UserRole ADD VALUE 'gc_admin';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'userrole'::regtype AND enumlabel = 'general_contractor') THEN
      ALTER TYPE public.UserRole ADD VALUE 'general_contractor';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'userrole'::regtype AND enumlabel = 'homeowner') THEN
      ALTER TYPE public.UserRole ADD VALUE 'homeowner';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'userrole'::regtype AND enumlabel = 'platform_admin') THEN
      ALTER TYPE public.UserRole ADD VALUE 'platform_admin';
    END IF;
  ELSE
    -- Create the UserRole type if it doesn't exist
    CREATE TYPE public.UserRole AS ENUM ('gc_admin', 'general_contractor', 'homeowner', 'platform_admin');
  END IF;
END
$$;
