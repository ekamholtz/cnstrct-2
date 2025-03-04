import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GCUserProfile } from "../types";

export const useGCUsers = (gcAccountId?: string, canFetch: boolean = true) => {
  console.log("[useGCUsers] Initializing with gcAccountId:", gcAccountId, "canFetch:", canFetch);
  
  const { data: gcUsers, isLoading: isLoadingUsers, refetch } = useQuery({
    queryKey: ['gc-users', gcAccountId],
    queryFn: async () => {
      if (!gcAccountId) {
        console.log('[useGCUsers] No GC account ID found, not fetching users');
        return [];
      }

      console.log('[useGCUsers] Fetching users for GC account:', gcAccountId);
      
      // First get all profiles matching the GC account ID
      // Use explicit column reference for gc_account_id
      const { data: profiles, error } = await supabase
        .from('profiles as p')
        .select('p.*')
        .eq('p.gc_account_id', gcAccountId);

      if (error) {
        console.error('[useGCUsers] Error fetching GC users:', error);
        throw error;
      }

      // Debug log to understand what's retrieved
      console.log(`[useGCUsers] Found ${profiles?.length || 0} profiles with gc_account_id ${gcAccountId}`);

      if (!profiles || profiles.length === 0) {
        console.log('[useGCUsers] No profiles found for GC account ID:', gcAccountId);
        return [];
      }

      try {
        // Add detailed logging for user IDs being passed to the function
        const userIds = profiles.map(profile => profile.id);
        console.log('[useGCUsers] Fetching emails for user IDs:', userIds);

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
          console.error('[useGCUsers] Error fetching user emails:', funcError);
          // Return profiles without emails if function call fails
          return profiles.map(profile => ({
            ...profile,
            email: 'Email not available'
          })) as GCUserProfile[];
        }

        console.log('[useGCUsers] Email data received:', usersWithEmails);

        // Make sure usersWithEmails is an array
        if (!Array.isArray(usersWithEmails)) {
          console.error('[useGCUsers] Received invalid email data format:', usersWithEmails);
          return profiles.map(profile => ({
            ...profile,
            email: 'Email data error'
          })) as GCUserProfile[];
        }

        // Merge profile data with emails
        const profilesWithEmails = profiles.map(profile => {
          const userEmailObj = usersWithEmails?.find(u => u.id === profile.id);
          const userEmail = userEmailObj?.email || 'Email not available';
          
          console.log(`[useGCUsers] Mapping profile ${profile.id} (${profile.full_name}) with email:`, userEmail);
          
          return {
            ...profile,
            email: userEmail
          };
        });

        console.log('[useGCUsers] Returning users with profiles and emails:', profilesWithEmails.length);
        return profilesWithEmails as GCUserProfile[];
      } catch (e) {
        console.error('[useGCUsers] Error in email fetching process:', e);
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

  console.log("[useGCUsers] Query enabled:", !!gcAccountId && canFetch);
  console.log("[useGCUsers] Users data:", gcUsers);
  console.log("[useGCUsers] Is loading:", isLoadingUsers);

  return {
    gcUsers,
    isLoadingUsers,
    refetchUsers: refetch
  };
};
