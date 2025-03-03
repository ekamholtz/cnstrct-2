
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCurrentUserProfile = () => {
  const { data: currentUserProfile, isLoading } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log("Current auth user ID:", user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching current user profile:", error);
        throw error;
      }
      
      console.log("Current user profile:", data);
      console.log("Current user role:", data?.role);
      console.log("Current user gc_account_id:", data?.gc_account_id);
      console.log("Current user is_owner:", data?.is_owner);
      
      return data;
    }
  });

  const isGCAdmin = currentUserProfile?.role === 'gc_admin';
  const isPlatformAdmin = currentUserProfile?.role === 'platform_admin';
  const isOwner = currentUserProfile?.is_owner || false;
  const canManageUsers = isGCAdmin || isPlatformAdmin;
  
  console.log("User can manage users:", canManageUsers);
  console.log("User is GC admin:", isGCAdmin);
  console.log("User is platform admin:", isPlatformAdmin);
  console.log("User is company owner:", isOwner);

  return {
    currentUserProfile,
    isLoading,
    isGCAdmin,
    isPlatformAdmin,
    isOwner,
    canManageUsers,
  };
};
