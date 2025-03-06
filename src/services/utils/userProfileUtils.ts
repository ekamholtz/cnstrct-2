
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the current user profile from Supabase
 */
export const getCurrentUserProfile = async () => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  // Get user's profile to determine role and gc_account_id
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role, gc_account_id, full_name')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;
  
  return { user, userProfile };
};
