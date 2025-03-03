
import { HomeownerProfileForm } from "./HomeownerProfileForm";
import { TeamManagementSection } from "./TeamManagementSection";
import { UseHomeownerProfileReturn } from "./hooks/useHomeownerProfile";

interface ProfileContentProps {
  profileState: UseHomeownerProfileReturn;
}

export function ProfileContent({ profileState }: ProfileContentProps) {
  const { 
    profile,
    isEditing,
    setIsEditing,
    isInvitingUser,
    handleProfileSave
  } = profileState;

  if (!profile) return null;

  return (
    <>
      {!isInvitingUser && (
        <HomeownerProfileForm 
          profile={profile}
          isEditing={isEditing}
          onCancel={() => setIsEditing(false)}
          onSave={handleProfileSave}
        />
      )}
      
      <TeamManagementSection profileState={profileState} />
    </>
  );
}
