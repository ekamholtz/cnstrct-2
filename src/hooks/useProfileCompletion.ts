
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfileForm } from "./profile/useProfileForm";
import { useUserRole } from "./profile/useUserRole";
import { linkClientToUser } from "@/utils/client-utils";
import type { ProfileCompletionFormValues } from "./profile/useProfileForm";

export const useProfileCompletion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const form = useProfileForm();
  const userRole = useUserRole();

  const onSubmit = async (formData: ProfileCompletionFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found");
        navigate('/auth');
        return;
      }

      console.log("Starting profile completion for user:", user.email);

      // First update the profile
      const profileData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        address: formData.address,
        has_completed_profile: true,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile. Please try again.",
        });
        return;
      }

      // If user is a homeowner, link or create client record
      if (userRole === 'homeowner' && user.email) {
        try {
          await linkClientToUser(user.id, user.email);
        } catch (error) {
          console.error("Error in client linking:", error);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Could not link client account. Please contact support.",
          });
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Route based on user role and ensure immediate navigation
      setTimeout(() => {
        if (userRole === 'homeowner') {
          navigate('/client-dashboard', { replace: true });
        } else if (userRole === 'general_contractor' || userRole === 'gc_admin') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/client-dashboard', { replace: true });
        }
      }, 300); // Small timeout to ensure toast is visible

    } catch (error) {
      console.error("Error during form submission:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return {
    form,
    userRole,
    onSubmit,
  };
};
