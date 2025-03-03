
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GCUserProfile } from "../types";

export const useGCUsers = (gcAccountId?: string, canFetch: boolean = false) => {
  const { data: gcUsers, isLoading: isLoadingUsers, refetch } = useQuery({
    queryKey: ['gc-users', gcAccountId],
    queryFn: async () => {
      if (!gcAccountId) {
        console.log('No GC account ID found, not fetching users');
        return [];
      }

      console.log('Fetching users for GC account:', gcAccountId);
      
      // First get all profiles matching the GC account ID
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gc_account_id', gcAccountId);

      if (error) {
        console.error('Error fetching GC users:', error);
        throw error;
      }

      // Debug log to understand what's retrieved
      console.log(`Found ${profiles?.length || 0} profiles with gc_account_id ${gcAccountId}:`, profiles);

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found for GC account ID:', gcAccountId);
        return [];
      }

      try {
        // Add detailed logging for user IDs being passed to the function
        const userIds = profiles.map(profile => profile.id);
        console.log('Fetching emails for user IDs:', userIds);

        if (userIds.length === 0) {
          return [];
        }

        // Get emails via the edge function
        const { data: usersWithEmails, error: funcError } = await supabase
          .functions.invoke('get-user-emails', {
            body: {
              userIds: userIds
            }
          });

        if (funcError) {
          console.error('Error fetching user emails:', funcError);
          // Return profiles without emails if function call fails
          return profiles.map(profile => ({
            ...profile,
            email: 'Email not available'
          })) as GCUserProfile[];
        }

        console.log('Email data received:', usersWithEmails);

        // Make sure usersWithEmails is an array
        if (!Array.isArray(usersWithEmails)) {
          console.error('Received invalid email data format:', usersWithEmails);
          return profiles.map(profile => ({
            ...profile,
            email: 'Email data error'
          })) as GCUserProfile[];
        }

        // Merge profile data with emails
        const profilesWithEmails = profiles.map(profile => {
          const userEmailObj = usersWithEmails?.find(u => u.id === profile.id);
          const userEmail = userEmailObj?.email || 'Email not available';
          
          console.log(`Mapping profile ${profile.id} (${profile.full_name}) with email:`, userEmail);
          
          return {
            ...profile,
            email: userEmail
          };
        });

        console.log('Returning users with profiles and emails:', profilesWithEmails.length);
        return profilesWithEmails as GCUserProfile[];
      } catch (e) {
        console.error('Error in email fetching process:', e);
        // Return profiles without emails if function call throws
        return profiles.map(profile => ({
          ...profile,
          email: 'Email not available'
        })) as GCUserProfile[];
      }
    },
    enabled: !!gcAccountId && canFetch,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  return {
    gcUsers,
    isLoadingUsers,
    refetchUsers: refetch
  };
};
