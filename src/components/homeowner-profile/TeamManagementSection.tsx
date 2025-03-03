
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { UserList } from "@/components/gc-profile/UserList";
import { InviteUserForm } from "@/components/gc-profile/InviteUserForm";
import { useGCUserManagement } from "@/components/gc-profile/hooks/useGCUserManagement";
import { UseHomeownerProfileReturn } from "./hooks/useHomeownerProfile";
import type { CreateUserFormValues } from "@/components/gc-profile/types";

interface TeamManagementSectionProps {
  profileState: UseHomeownerProfileReturn;
}

export function TeamManagementSection({ profileState }: TeamManagementSectionProps) {
  const { 
    isGCRole,
    isPlatformAdmin,
    hasGcAccountId,
    isInvitingUser,
    setIsInvitingUser,
    showUserManagement
  } = profileState;

  const {
    gcUsers,
    isLoadingUsers,
    isCreatingUser,
    createUser,
    canManageUsers,
    currentUserProfile,
    refetchUsers
  } = useGCUserManagement();

  // Set the refetchUsers function in the profileState
  if (profileState.refetchUsers === null) {
    profileState.refetchUsers = refetchUsers;
  }

  const handleInviteUser = async (formData: CreateUserFormValues) => {
    try {
      if (!currentUserProfile?.gc_account_id && !isPlatformAdmin) {
        // Handle missing GC account ID
        return;
      }
      
      console.log("Creating user with GC account ID:", currentUserProfile?.gc_account_id);
      
      await createUser({
        ...formData,
        gc_account_id: currentUserProfile?.gc_account_id
      });
      
      setIsInvitingUser(false);
      
      // Force a refetch of users after successful creation
      setTimeout(() => {
        refetchUsers();
      }, 1000);
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  if (!showUserManagement) {
    return null;
  }

  return isInvitingUser ? (
    <div className="mt-8">
      <InviteUserForm 
        onSubmit={handleInviteUser}
        onCancel={() => setIsInvitingUser(false)}
        isLoading={isCreatingUser}
      />
    </div>
  ) : (
    <div className="mt-12">
      {/* Only show GC account ID warning for GC roles, not for platform_admin */}
      {isGCRole && !hasGcAccountId && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing GC Account ID</AlertTitle>
          <AlertDescription>
            You need to set a GC account ID in your profile before you can manage team members.
            Please edit your profile and add a company name to generate a GC account ID.
          </AlertDescription>
        </Alert>
      )}
      
      <UserList 
        users={gcUsers || []}
        isLoading={isLoadingUsers}
        canManageUsers={canManageUsers || isPlatformAdmin} 
        onCreateUser={() => setIsInvitingUser(true)}
        onRefresh={refetchUsers}
      />
    </div>
  );
}
