
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { UserList } from "@/components/gc-profile/UserList";
import { InviteUserForm } from "@/components/gc-profile/InviteUserForm";
import { useGCUserManagement } from "@/components/gc-profile/hooks/useGCUserManagement";
import { UseHomeownerProfileReturn } from "./hooks/useHomeownerProfile";
import type { CreateUserFormValues } from "@/components/gc-profile/types";
import { useEffect } from "react";

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
    showUserManagement,
    setRefetchUsers,
    profile
  } = profileState;

  console.log("[TeamManagementSection] Profile state:", {
    isGCRole,
    isPlatformAdmin,
    hasGcAccountId,
    showUserManagement,
    profile: {
      id: profile?.id,
      role: profile?.role,
      gc_account_id: profile?.gc_account_id
    }
  });

  const {
    gcUsers,
    isLoadingUsers,
    isCreatingUser,
    createUser,
    canManageUsers,
    currentUserProfile,
    refetchUsers
  } = useGCUserManagement();

  console.log("[TeamManagementSection] GC User Management:", {
    usersCount: gcUsers?.length,
    isLoadingUsers,
    canManageUsers,
    currentUserProfile: {
      id: currentUserProfile?.id,
      role: currentUserProfile?.role,
      gc_account_id: currentUserProfile?.gc_account_id
    }
  });

  // Set the refetchUsers function in the profileState
  useEffect(() => {
    if (refetchUsers) {
      console.log("[TeamManagementSection] Setting refetchUsers function");
      setRefetchUsers(() => refetchUsers);
    }
  }, [refetchUsers, setRefetchUsers]);

  const handleInviteUser = async (formData: CreateUserFormValues) => {
    try {
      if (!currentUserProfile?.gc_account_id && !isPlatformAdmin) {
        console.error("[TeamManagementSection] Missing GC account ID:", currentUserProfile?.gc_account_id);
        return;
      }
      
      console.log("[TeamManagementSection] Creating user with GC account ID:", currentUserProfile?.gc_account_id);
      console.log("[TeamManagementSection] Form data:", formData);
      
      await createUser({
        ...formData,
        gc_account_id: currentUserProfile?.gc_account_id
      });
      
      setIsInvitingUser(false);
      
      // Force a refetch of users after successful creation
      console.log("[TeamManagementSection] Scheduling refetch after user creation");
      setTimeout(() => {
        console.log("[TeamManagementSection] Executing delayed refetch");
        refetchUsers();
      }, 1000);
    } catch (error) {
      console.error("[TeamManagementSection] Error inviting user:", error);
    }
  };

  if (!showUserManagement) {
    console.log("[TeamManagementSection] Not showing user management - conditions not met");
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
