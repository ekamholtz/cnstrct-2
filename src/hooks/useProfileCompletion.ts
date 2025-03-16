
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

      // Get the default tier ID for this user
      const { data: defaultTier } = await supabase
        .from('subscription_tiers')
        .select('id')
        .eq('name', 'Platform Basics')
        .single();

      if (!defaultTier) {
        console.error("Default subscription tier not found");
        throw new Error("Default subscription tier not found");
      }

      // First update the profile
      const profileData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        address: formData.address,
        has_completed_profile: true,
        updated_at: new Date().toISOString(),
        subscription_tier_id: defaultTier.id
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

      // If user is a gc_admin, check if they already have a GC account
      // If not, create one and set up default subscription
      if (userRole === 'gc_admin') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('gc_account_id')
          .eq('id', user.id)
          .single();
          
        // If they don't have a GC account yet, create one
        if (!profile?.gc_account_id) {
          console.log("Creating GC account for new GC admin");
          // Use the company name if provided or create a default name
          const companyName = user.user_metadata?.company_name || `${formData.fullName}'s Company`;
          
          // Create the GC account
          const { data: gcAccount, error: gcError } = await supabase
            .from('gc_accounts')
            .insert({
              company_name: companyName,
              owner_id: user.id
            })
            .select('id')
            .single();
            
          if (gcError) {
            console.error("Error creating GC account:", gcError);
          } else if (gcAccount) {
            // Link GC account to user's profile
            await supabase
              .from('profiles')
              .update({ gc_account_id: gcAccount.id })
              .eq('id', user.id);
              
            // We will rely on Stripe subscription for billing features
            // Create a basic subscription record for tracking
            await supabase
              .from('account_subscriptions')
              .insert({
                gc_account_id: gcAccount.id,
                tier_id: defaultTier.id,
                status: 'active',
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days trial
              });
          }
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
