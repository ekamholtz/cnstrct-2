
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { UserRole } from "@/components/admin/users/types";

// Define the UI role type that's expected by components
export type UIRole = "contractor" | "homeowner" | "project_manager";

// Define a team member with properly typed fields
export interface TeamMember {
  id: string;
  gc_account_id?: string;
  full_name: string;
  email: string;
  role: UIRole | UserRole;
  // Include additional fields that are accessed by components
  company_name?: string;
  phone_number?: string;
  address?: string;
  license_number?: string;
  website?: string;
  bio?: string;
  has_completed_profile?: boolean;
  account_status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Safely map user roles from auth system to UI roles
 * This ensures backward compatibility with components expecting specific role values
 */
export function mapUserRoleToUIRole(userRole: UserRole | null | undefined): UIRole {
  if (!userRole) return "contractor"; // Default fallback
  
  // Map admin roles to project_manager for UI compatibility
  switch(userRole) {
    case "gc_admin":
    case "platform_admin":
    case "employee":
      return "project_manager";
    case "homeowner":
      return "homeowner";
    case "contractor":
    case "client":
    default:
      return "contractor";
  }
}

/**
 * Hook to fetch team members associated with the current user's gc_account_id
 */
export function useTeamMembers() {
  const { currentUserProfile, isLoading: isLoadingProfile } = useCurrentUserProfile();
  const gcAccountId = currentUserProfile?.gc_account_id;
  
  // Determine admin status
  const isGCAdmin = currentUserProfile?.role === 'gc_admin';
  const isPlatformAdmin = currentUserProfile?.role === 'platform_admin';
  
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["teamMembers", gcAccountId],
    queryFn: async () => {
      if (!gcAccountId) {
        console.log("No gc_account_id found for current user");
        return [];
      }
      
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id,gc_account_id,full_name,email,role,company_name,phone_number,address,license_number,website,bio,has_completed_profile,account_status,created_at,updated_at')
          .eq('gc_account_id', gcAccountId);
          
        if (error) {
          throw error;
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No team members found, using current user as fallback");
          // Return current user as fallback
          return [{
            id: currentUserProfile.id,
            gc_account_id: currentUserProfile.gc_account_id,
            full_name: currentUserProfile.full_name || 'Unknown',
            email: currentUserProfile.email || '',
            role: mapUserRoleToUIRole(currentUserProfile.role as UserRole),
            company_name: currentUserProfile.company_name || '',
            phone_number: currentUserProfile.phone_number || '',
            address: currentUserProfile.address || '',
            license_number: currentUserProfile.license_number || '',
            website: currentUserProfile.website || '',
            bio: currentUserProfile.bio || '',
            has_completed_profile: currentUserProfile.has_completed_profile || false,
            account_status: currentUserProfile.account_status || '',
            created_at: currentUserProfile.created_at || '',
            updated_at: currentUserProfile.updated_at || ''
          }];
        }
        
        // Map the profiles to ensure they have the correct role type
        return profiles.map((profile: any) => ({
          id: profile.id,
          gc_account_id: profile.gc_account_id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || '',
          // Map the user role to a UI role
          role: profile.role, // Keep the original role, let components map as needed
          company_name: profile.company_name || '',
          phone_number: profile.phone_number || '',
          address: profile.address || '',
          license_number: profile.license_number || '',
          website: profile.website || '',
          bio: profile.bio || '',
          has_completed_profile: profile.has_completed_profile || false,
          account_status: profile.account_status || '',
          created_at: profile.created_at || '',
          updated_at: profile.updated_at || ''
        }));
      } catch (err) {
        console.error("Error fetching team members:", err);
        
        if (currentUserProfile) {
          // Return current user as fallback in case of error
          return [{
            id: currentUserProfile.id,
            gc_account_id: currentUserProfile.gc_account_id,
            full_name: currentUserProfile.full_name || 'Unknown',
            email: currentUserProfile.email || '',
            role: mapUserRoleToUIRole(currentUserProfile.role as UserRole),
            company_name: currentUserProfile.company_name || '',
            phone_number: currentUserProfile.phone_number || '',
            address: currentUserProfile.address || '',
            license_number: currentUserProfile.license_number || '',
            website: currentUserProfile.website || '',
            bio: currentUserProfile.bio || '',
            has_completed_profile: currentUserProfile.has_completed_profile || false,
            account_status: currentUserProfile.account_status || '',
            created_at: currentUserProfile.created_at || '',
            updated_at: currentUserProfile.updated_at || ''
          }];
        }
        
        return [];
      }
    },
    enabled: !!gcAccountId,
  });
  
  // Create a type-safe return object
  return {
    teamMembers: data || [],
    isLoadingTeam: isLoading || isLoadingProfile,
    refetch,
    teamMembersError: error,
    gcAccountId,
    isGCAdmin,
    isPlatformAdmin
  };
}
