import { supabase } from "@/integrations/supabase/client";

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return false;
    }

    const isAdmin = data?.role === 'platform_admin';
    return isAdmin;
  } catch (error) {
    console.error("Error in checkIsAdmin:", error);
    return false;
  }
};
