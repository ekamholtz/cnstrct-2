
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

  console.log("[useGCUserManagement] Current profile:", currentUserProfile);
  console.log("[useGCUserManagement] Can manage users:", canManageUsers);
  console.log("[useGCUserManagement] Is loading current user:", isLoadingCurrentUser);
  console.log("[useGCUserManagement] GC account ID:", currentUserProfile?.gc_account_id);

  // Get GC users
  const { 
    gcUsers, 
    isLoadingUsers, 
    refetchUsers 
  } = useGCUsers(
    currentUserProfile?.gc_account_id,
    canManageUsers
  );

  console.log("[useGCUserManagement] GC users:", gcUsers);
  console.log("[useGCUserManagement] Is loading users:", isLoadingUsers);

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
