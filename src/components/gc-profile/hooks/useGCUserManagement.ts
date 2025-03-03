
import { useCurrentUserProfile } from "./useCurrentUserProfile";
import { useGCUsers } from "./useGCUsers";
import { useCreateGCUser } from "./useCreateGCUser";
import { useTeamManagement } from "./useTeamManagement";

export const useGCUserManagement = () => {
  // Get current user profile
  const { 
    currentUserProfile, 
    isLoading: isLoadingCurrentUser,
    canManageUsers,
    isOwner 
  } = useCurrentUserProfile();

  console.log("[useGCUserManagement] Current profile:", currentUserProfile);
  console.log("[useGCUserManagement] Can manage users:", canManageUsers);
  console.log("[useGCUserManagement] Is loading current user:", isLoadingCurrentUser);
  console.log("[useGCUserManagement] GC account ID:", currentUserProfile?.gc_account_id);
  console.log("[useGCUserManagement] Is owner:", isOwner);

  // Get GC users only if we have a gc_account_id and can manage users
  const { 
    gcUsers, 
    isLoadingUsers, 
    refetchUsers 
  } = useGCUsers(
    currentUserProfile?.gc_account_id,
    !!currentUserProfile?.gc_account_id && (canManageUsers || currentUserProfile?.role === 'project_manager')
  );

  console.log("[useGCUserManagement] GC users:", gcUsers);
  console.log("[useGCUserManagement] Is loading users:", isLoadingUsers);

  // Create GC user
  const { 
    isCreatingUser, 
    createUser 
  } = useCreateGCUser(currentUserProfile?.gc_account_id);

  // Team management functions
  const {
    makeGCAdmin,
    isMakingGCAdmin,
    transferOwnership,
    isTransferringOwnership,
    removeTeamMember,
    isRemovingMember
  } = useTeamManagement();

  return {
    gcUsers,
    currentUserProfile,
    isLoadingUsers: isLoadingUsers || isLoadingCurrentUser,
    isCreatingUser,
    createUser,
    refetchUsers,
    canManageUsers,
    isGCAdmin: currentUserProfile?.role === 'gc_admin',
    isOwner,
    // Team management functions
    makeGCAdmin,
    isMakingGCAdmin,
    transferOwnership,
    isTransferringOwnership,
    removeTeamMember,
    isRemovingMember
  };
};
