
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCurrentUserProfile = () => {
  const { data: currentUserProfile, isLoading } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      console.log("Current user profile:", data);
      return data;
    }
  });

  return {
    currentUserProfile,
    isLoading,
    isGCAdmin: currentUserProfile?.role === 'gc_admin',
    canManageUsers: currentUserProfile?.role === 'gc_admin' || currentUserProfile?.role === 'platform_admin',
  };
};
