
import { useCurrentUserProfile } from "./useCurrentUserProfile";
import { useGCUsers } from "./useGCUsers";
import { useCreateGCUser } from "./useCreateGCUser";

export const useGCUserManagement = () => {
  // Get current user profile
  const { 
    currentUserProfile, 
    isLoading: isLoadingCurrentUser,
    canManageUsers 
  } = useCurrentUserProfile();

  // Get GC users
  const { 
    gcUsers, 
    isLoadingUsers, 
    refetchUsers 
  } = useGCUsers(
    currentUserProfile?.gc_account_id,
    canManageUsers
  );

  // Create GC user
  const { 
    isCreatingUser, 
    createUser 
  } = useCreateGCUser(currentUserProfile?.gc_account_id);

  return {
    gcUsers,
    currentUserProfile,
    isLoadingUsers: isLoadingUsers || isLoadingCurrentUser,
    isCreatingUser,
    createUser,
    refetchUsers,
    canManageUsers,
    isGCAdmin: currentUserProfile?.role === 'gc_admin',
  };
};
