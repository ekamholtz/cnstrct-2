
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
      
      // Get all profiles matching the GC account ID including all roles (gc_admin and project_manager)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gc_account_id', currentUserProfile.gc_account_id);

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      console.log(`Found ${profiles?.length || 0} team members`);

      if (!profiles || profiles.length === 0) {
        return [];
      }

      try {
        // Get emails via the edge function
        const userIds = profiles.map(profile => profile.id);
        
        console.log('Fetching emails for user IDs:', userIds);
        
        const { data: usersWithEmails, error: funcError } = await supabase
          .functions.invoke('get-user-emails', {
            body: {
              userIds: userIds
            }
          });

        if (funcError) {
          console.error('Error fetching user emails:', funcError);
          return profiles.map(profile => ({
            ...profile,
            email: 'Email not available'
          })) as GCUserProfile[];
        }

        // Check if any company owner exists
        const { data: gcAccount } = await supabase
          .from('gc_accounts')
          .select('owner_id')
          .eq('id', currentUserProfile.gc_account_id)
          .single();

        // Merge profile data with emails and owner information
        const profilesWithEmails = profiles.map(profile => {
          const userEmailObj = usersWithEmails?.find(u => u.id === profile.id);
          const userEmail = userEmailObj?.email || 'Email not available';
          
          // Mark if this profile is the owner
          const isOwner = gcAccount && gcAccount.owner_id === profile.id;
          
          return {
            ...profile,
            email: userEmail,
            is_owner: isOwner
          };
        });

        console.log('Team members data with emails:', profilesWithEmails);
        return profilesWithEmails as GCUserProfile[];
      } catch (e) {
        console.error('Error in email fetching process:', e);
        return profiles.map(profile => ({
          ...profile,
          email: 'Email not available'
        })) as GCUserProfile[];
      }
    },
    enabled: !!currentUserProfile?.gc_account_id,
    refetchOnWindowFocus: false,
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
