import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { GCUserProfile } from "@/components/gc-profile/types";

// The specific gc_account_id from the user's profile (corrected from the screenshot)
const TARGET_GC_ACCOUNT_ID = "eed9e4ee-3110-4267-80ac-cd8e98be59f3";

// Define a type for our profile with email
interface ProfileWithEmail extends GCUserProfile {
  email: string | null;
  account_status: string;
  address: string;
  bio: string;
  company_name: string;
  created_at: string;
  has_completed_profile: boolean;
  license_number: string;
  phone_number: string;
  updated_at: string;
  website: string;
}

export const useTeamMembers = () => {
  const { 
    currentUserProfile,
    isGCAdmin,
    isPlatformAdmin,
    isLoading: isLoadingProfile 
  } = useCurrentUserProfile();

  console.log("useTeamMembers hook called with currentUserProfile:", {
    id: currentUserProfile?.id,
    gc_account_id: currentUserProfile?.gc_account_id,
    role: currentUserProfile?.role
  });

  // Check if this user has the target gc_account_id we're debugging
  const hasTargetGcAccountId = currentUserProfile?.gc_account_id === TARGET_GC_ACCOUNT_ID;
  if (hasTargetGcAccountId) {
    console.log("IMPORTANT: This user has the target gc_account_id we're debugging!");
  }

  // Query to fetch team members based on gc_account_id
  const { data: teamMembers, isLoading: isLoadingTeam, refetch, error: teamMembersError } = useQuery({
    queryKey: ['team-members', currentUserProfile?.gc_account_id],
    queryFn: async () => {
      console.log("Fetching team members with gc_account_id:", currentUserProfile?.gc_account_id);
      
      if (!currentUserProfile?.gc_account_id) {
        console.log("No gc_account_id available, returning empty array");
        return [];
      }

      try {
        // IMPORTANT FIX: Get all profiles and manually filter
        // This is the most reliable approach for UUID comparison
        console.log("Fetching all profiles and manually filtering");
        
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*');

        if (allProfilesError) {
          console.error("Error fetching all profiles:", allProfilesError);
          throw allProfilesError;
        }

        console.log(`Found ${allProfiles?.length || 0} total profiles in database`);
        
        // Manually filter profiles with matching gc_account_id
        // IMPORTANT: We need to normalize the UUID format to ensure consistent comparison
        const normalizeUUID = (uuid: string | null | undefined): string => {
          if (!uuid) return '';
          // Remove all non-alphanumeric characters and convert to lowercase
          return uuid.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        };
        
        const normalizedTargetUUID = normalizeUUID(currentUserProfile.gc_account_id);
        console.log("Normalized target UUID:", normalizedTargetUUID);
        
        let profiles = allProfiles?.filter(p => {
          const normalizedProfileUUID = normalizeUUID(p.gc_account_id);
          const isMatch = normalizedProfileUUID === normalizedTargetUUID;
          
          if (isMatch) {
            console.log(`Found matching profile: ${p.full_name} (${p.id})`);
            console.log(`  Original UUID: ${p.gc_account_id}`);
            console.log(`  Normalized UUID: ${normalizedProfileUUID}`);
          }
          
          return isMatch;
        }) || [];
        
        console.log(`Manual filtering found ${profiles.length} matching profiles with gc_account_id: ${currentUserProfile.gc_account_id}`);
        
        // Debug: Check if the current user's profile is in the results
        const currentUserInResults = profiles?.some(profile => profile.id === currentUserProfile.id);
        console.log("Current user found in results:", currentUserInResults);
        
        // If no team members found but we have the current user's profile,
        // create a fallback array with just the current user
        if ((!profiles || profiles.length === 0) && currentUserProfile) {
          console.log("No team members found in database, using fallback with current user");
          const fallbackProfiles = [{
            ...currentUserProfile,
            email: null // We'll try to fetch this below
          }];
          
          console.log("Fallback profiles:", fallbackProfiles);
          profiles = fallbackProfiles;
        }
        
        // Instead of using the admin API, we'll use the profile data we already have
        // We won't have emails, but we can still display names and roles
        const profilesWithEmails = profiles.map(profile => {
          return { 
            ...profile, 
            email: null, // We can't get emails without admin access
            // Ensure all required fields have values
            account_status: profile.account_status || '',
            address: profile.address || '',
            bio: profile.bio || '',
            company_name: profile.company_name || '',
            created_at: profile.created_at || '',
            has_completed_profile: profile.has_completed_profile || false,
            license_number: profile.license_number || '',
            phone_number: profile.phone_number || '',
            updated_at: profile.updated_at || '',
            website: profile.website || ''
          };
        });

        console.log("Team members processed:", profilesWithEmails);
        return profilesWithEmails;
      } catch (error) {
        console.error("Error in team members fetching process:", error);
        
        // If there's an error but we have the current user profile, return that as a fallback
        if (currentUserProfile) {
          console.log("Using fallback with current user due to error");
          return [{
            ...currentUserProfile,
            email: null,
            // Ensure all required fields have values
            account_status: currentUserProfile.account_status || '',
            address: currentUserProfile.address || '',
            bio: currentUserProfile.bio || '',
            company_name: currentUserProfile.company_name || '',
            created_at: currentUserProfile.created_at || '',
            has_completed_profile: currentUserProfile.has_completed_profile || false,
            license_number: currentUserProfile.license_number || '',
            phone_number: currentUserProfile.phone_number || '',
            updated_at: currentUserProfile.updated_at || '',
            website: currentUserProfile.website || ''
          }];
        }
        
        return [];
      }
    },
    enabled: !!currentUserProfile?.gc_account_id && !isLoadingProfile,
  });

  // Function to refetch team members
  const refetchTeam = () => {
    console.log("Refetching team members...");
    return refetch();
  };

  // Log any errors that occurred
  if (teamMembersError) {
    console.error("Error in useTeamMembers hook:", teamMembersError);
  }

  // Special debugging for our target gc_account_id
  if (hasTargetGcAccountId && teamMembers) {
    console.log(`DEBUGGING TARGET GC_ACCOUNT_ID: Hook returned ${teamMembers.length} team members`);
    teamMembers.forEach((member, index) => {
      console.log(`Team member ${index + 1}:`, {
        id: member.id,
        name: member.full_name,
        role: member.role,
        gc_account_id: member.gc_account_id,
        email: member.email
      });
    });
  }

  return {
    teamMembers: teamMembers || [],
    isLoadingTeam: isLoadingTeam || isLoadingProfile,
    refetchTeam,
    gcAccountId: currentUserProfile?.gc_account_id,
    isGCAdmin,
    isPlatformAdmin,
    error: teamMembersError
  };
};
