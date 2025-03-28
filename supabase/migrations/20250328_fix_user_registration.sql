-- Fix user registration issues for gc_admin users
-- This migration addresses the "Database error saving new user" error

-- 1. Check if there's a trigger on auth.users that might be failing
DO $$
BEGIN
  -- Drop any existing broken triggers if they exist
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create a more robust trigger for handling user creation
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  DECLARE
    gc_account_id uuid;
  BEGIN
    -- Create a new GC account if the user is a gc_admin
    IF NEW.raw_user_meta_data->>'role' = 'gc_admin' THEN
      INSERT INTO public.gc_accounts (name, owner_id, created_at, updated_at)
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
      email,
      role,
      gc_account_id,
      account_status,
      has_completed_profile,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'gc_admin')::public.UserRole,
      gc_account_id,
      'active',
      false,
      NOW(),
      NOW()
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
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
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
END
$$;

-- 3. Ensure the UserRole enum includes all necessary roles
DO $$
BEGIN
  -- Check if the UserRole type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
    -- Add any missing roles to the UserRole enum
    -- Note: This is a safe operation as it will only add values that don't already exist
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'gc_admin';
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'homeowner';
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'platform_admin';
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'project_manager';
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'client';
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'contractor';
    ALTER TYPE public.UserRole ADD VALUE IF NOT EXISTS 'employee';
  END IF;
END
$$;
