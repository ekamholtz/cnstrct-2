import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with admin privileges
// This client is used in API routes to bypass RLS policies
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
