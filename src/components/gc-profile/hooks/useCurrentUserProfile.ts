import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GCUserProfile } from "../types";
import { Database } from "@/types/supabase";

export const useCurrentUserProfile = () => {
  const { data: currentUserProfile, isLoading } = useQuery<GCUserProfile>({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log("Current auth user ID:", user.id);
      console.log("Current auth user email:", user.email);

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
      
      // Add email from auth user to the profile data
      const profileWithEmail = {
        ...data,
        email: user.email || '',
        // Ensure all required fields have values
        account_status: data.account_status || '',
        address: data.address || '',
        bio: data.bio || '',
        company_name: data.company_name || '',
        created_at: data.created_at || '',
        has_completed_profile: data.has_completed_profile || false,
        license_number: data.license_number || '',
        phone_number: data.phone_number || '',
        updated_at: data.updated_at || '',
        website: data.website || '',
        // Ensure gc_account_id is defined
        gc_account_id: data.gc_account_id || ''
      } as GCUserProfile;
      
      // If we have a gc_account_id, check if it exists and get its details
      if (data?.gc_account_id) {
        console.log("Checking GC account details...");
        // Using type assertion to handle the table that's in the schema but not in the type
        const { data: gcAccount, error: gcError } = await (supabase as any)
          .from('gc_accounts')
          .select('*')
          .eq('id', data.gc_account_id)
          .single();
          
        if (gcError) {
          console.error("Error fetching GC account details:", gcError);
        } else {
          console.log("GC account details:", gcAccount);
        }
        
        // Check how many users are associated with this gc_account_id
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('gc_account_id', data.gc_account_id);
          
        if (countError) {
          console.error("Error counting team members:", countError);
        } else {
          console.log(`Number of users with gc_account_id ${data.gc_account_id}:`, count);
        }
      } else {
        console.warn("User does not have a gc_account_id");
      }
      
      return profileWithEmail;
    }
  });

  // Check if the user is the owner of their GC account
  const { data: isOwner = false } = useQuery({
    queryKey: ['is-account-owner', currentUserProfile?.id, currentUserProfile?.gc_account_id],
    queryFn: async () => {
      if (!currentUserProfile?.id || !currentUserProfile?.gc_account_id) return false;

      // Using type assertion to handle the table that's in the schema but not in the type
      const { data, error } = await (supabase as any)
        .from('gc_accounts')
        .select('owner_id')
        .eq('id', currentUserProfile.gc_account_id)
        .single();

      if (error) {
        console.error("Error checking ownership:", error);
        return false;
      }

      // Using optional chaining to safely access owner_id
      const isOwner = data && typeof data === 'object' && 'owner_id' in data ? 
        data.owner_id === currentUserProfile.id : false;
      console.log("User is company owner:", isOwner);
      return isOwner;
    },
    enabled: !!currentUserProfile?.id && !!currentUserProfile?.gc_account_id
  });

  const isGCAdmin = currentUserProfile?.role === 'gc_admin';
  const isPlatformAdmin = currentUserProfile?.role === 'platform_admin';
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
