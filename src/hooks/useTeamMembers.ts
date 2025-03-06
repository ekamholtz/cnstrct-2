
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { GCUserProfile } from "@/components/gc-profile/types";

export const useTeamMembers = () => {
  const { currentUserProfile, isLoading: isLoadingProfile } = useCurrentUserProfile();

  const { data: teamMembers, isLoading: isLoadingTeam, refetch } = useQuery({
    queryKey: ['team-members', currentUserProfile?.gc_account_id],
    queryFn: async () => {
      if (!currentUserProfile?.gc_account_id) {
        console.log('No GC account ID found, not fetching team members');
        return [];
      }

      console.log('Fetching team members for gc_account_id:', currentUserProfile.gc_account_id);
      
      // Get all profiles matching the GC account ID
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gc_account_id', currentUserProfile.gc_account_id);

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      console.log(`Found ${profiles?.length || 0} team members with gc_account_id ${currentUserProfile.gc_account_id}:`, profiles);

      if (!profiles || profiles.length === 0) {
        return [];
      }

      try {
        // Check if any company owner exists
        const { data: gcAccount } = await supabase
          .from('gc_accounts')
          .select('owner_id')
          .eq('id', currentUserProfile.gc_account_id)
          .single();

        console.log('GC account data:', gcAccount);
        
        // Add owner information to profiles
        const profilesWithOwnership = profiles.map(profile => {
          // Mark if this profile is the owner
          const isOwner = gcAccount && gcAccount.owner_id === profile.id;
          
          console.log(`Mapping profile ${profile.id} (${profile.full_name}), isOwner: ${isOwner}`);
          
          return {
            ...profile,
            is_owner: isOwner
          };
        });

        console.log('Team members data with ownership:', profilesWithOwnership);
        return profilesWithOwnership as GCUserProfile[];
      } catch (e) {
        console.error('Error in owner checking process:', e);
        return profiles.map(profile => ({
          ...profile,
          is_owner: false
        })) as GCUserProfile[];
      }
    },
    enabled: !!currentUserProfile?.gc_account_id,
    refetchOnWindowFocus: false,
  });

  console.log("useTeamMembers hook returning:", { 
    teamMembers: teamMembers?.length,
    teamMembersData: teamMembers,
    isLoadingTeam: isLoadingTeam || isLoadingProfile,
    gcAccountId: currentUserProfile?.gc_account_id,
    isGCAdmin: currentUserProfile?.role === 'gc_admin',
    isPlatformAdmin: currentUserProfile?.role === 'platform_admin'
  });

  return {
    teamMembers,
    isLoadingTeam: isLoadingTeam || isLoadingProfile,
    refetchTeam: refetch,
    gcAccountId: currentUserProfile?.gc_account_id,
    isGCAdmin: currentUserProfile?.role === 'gc_admin',
    isPlatformAdmin: currentUserProfile?.role === 'platform_admin'
  };
};
