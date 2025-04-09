
-- This script fixes missing profiles for existing users
-- Run this in the Supabase SQL Editor to create profiles for users that don't have them

-- Insert profiles for users who don't have them
INSERT INTO public.profiles (
  id, 
  full_name, 
  role, 
  email,
  account_status,
  has_completed_profile,
  created_at,
  updated_at
)
SELECT 
  au.id, 
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    CONCAT(
      COALESCE(au.raw_user_meta_data->>'first_name', ''), 
      ' ', 
      COALESCE(au.raw_user_meta_data->>'last_name', '')
    ),
    au.email,
    'New User'
  ),
  COALESCE(au.raw_user_meta_data->>'role', 'gc_admin')::user_role,
  au.email,
  'active',
  false,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Output count of created profiles
SELECT COUNT(*) as profiles_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
