
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileCompletionHeader } from "@/components/profile-completion/ProfileCompletionHeader";
import { ProfileCompletionForm } from "@/components/profile-completion/ProfileCompletionForm";
import { ProfileCompletionFooter } from "@/components/profile-completion/ProfileCompletionFooter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export default function ProfileCompletion() {
  const { profile, isLoading } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const routeBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'homeowner':
        navigate("/client-dashboard", { replace: true });
        break;
      case 'gc_admin':
      case 'project_manager':
        navigate("/dashboard", { replace: true });
        break;
      case 'admin':
        navigate("/admin", { replace: true });
        break;
      default:
        navigate("/dashboard", { replace: true });
    }
  };

  const updateProfile = async (data: any) => {
    if (isSubmitting || !profile?.role) return;

    try {
      setIsSubmitting(true);
      console.log("Updating profile with data:", data);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          ...data,
          has_completed_profile: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile completed successfully!",
        description: "You will now be redirected to the dashboard.",
      });

      routeBasedOnRole(profile.role);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only render form for contractors and homeowners, not admins
  if (!profile?.role || profile.role === 'admin') {
    console.log("No user role or admin role detected, rendering null");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-2xl py-8">
        <ProfileCompletionHeader />
        
        <ProfileCompletionForm
          userRole={profile.role}
          isSubmitting={isSubmitting}
          onSubmit={updateProfile}
        />

        <ProfileCompletionFooter />
      </div>
    </div>
  );
}
