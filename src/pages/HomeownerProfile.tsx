
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HomeownerProfileHeader } from "@/components/homeowner-profile/HomeownerProfileHeader";
import { ProfileContent } from "@/components/homeowner-profile/ProfileContent";
import { useHomeownerProfile } from "@/components/homeowner-profile/hooks/useHomeownerProfile";

export default function HomeownerProfile() {
  const profileState = useHomeownerProfile();
  const { isLoading, profile, isEditing, setIsEditing, isInvitingUser, refetchUsers } = profileState;

  useEffect(() => {
    // Refresh the user list when component mounts or when isInvitingUser changes to false
    // (indicating a user might have been added)
    if (!isInvitingUser && !isLoading && refetchUsers) {
      refetchUsers();
    }
  }, [isInvitingUser, isLoading, refetchUsers]);

  if (isLoading || !profile) return null;

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <HomeownerProfileHeader 
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
        />
        
        <ProfileContent profileState={profileState} />
      </div>
    </DashboardLayout>
  );
}
