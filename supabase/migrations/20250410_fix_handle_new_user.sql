
-- Updated handle_new_user function to properly handle the user_role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  gc_account_id uuid;
  valid_role user_role;
BEGIN
  -- Log the start of the function for debugging
  RAISE NOTICE 'Creating profile for new user: %', NEW.id;
  RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Map common role names to valid enum values
  CASE LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'gc_admin'))
    WHEN 'admin' THEN valid_role := 'platform_admin'::user_role;
    WHEN 'gc_admin' THEN valid_role := 'gc_admin'::user_role;
    WHEN 'homeowner' THEN valid_role := 'homeowner'::user_role;
    WHEN 'client' THEN valid_role := 'client'::user_role;
    WHEN 'contractor' THEN valid_role := 'contractor'::user_role;
    WHEN 'employee' THEN valid_role := 'employee'::user_role;
    WHEN 'project_manager' THEN valid_role := 'project_manager'::user_role;
    ELSE valid_role := 'gc_admin'::user_role;
  END CASE;
  
  RAISE NOTICE 'Mapped role value: %', valid_role;
  
  -- Insert a profile record
  BEGIN
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
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        CONCAT(
          COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 
          ' ', 
          COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
      ),
      valid_role,
      NULL, -- Will be updated later for team members
      'active',
      false,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but allow user creation
    RAISE WARNING 'Error creating profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
