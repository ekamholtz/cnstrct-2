
import { useEffect } from "react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProfileCompletionHeader } from "@/components/profile-completion/ProfileCompletionHeader";
import { ProfileCompletionForm } from "@/components/profile-completion/ProfileCompletionForm";
import { ProfileCompletionFooter } from "@/components/profile-completion/ProfileCompletionFooter";
import { Loader2 } from "lucide-react";

export default function ProfileCompletion() {
  const {
    userRole,
    isSubmitting,
    isLoading,
    checkSession,
    updateProfile
  } = useProfileCompletion();

  useEffect(() => {
    let mounted = true;

    const initializeProfile = async () => {
      if (mounted) {
        await checkSession();
      }
    };

    initializeProfile();

    return () => {
      mounted = false;
    };
  }, [checkSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only render form for contractors and homeowners, not admins
  if (!userRole || userRole === 'admin') {
    console.log("No user role or admin role detected, rendering null");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-2xl py-8">
        <ProfileCompletionHeader />
        
        <ProfileCompletionForm
          userRole={userRole}
          isSubmitting={isSubmitting}
          onSubmit={updateProfile}
        />

        <ProfileCompletionFooter />
      </div>
    </div>
  );
}
