
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { profileCompletionSchema } from "@/lib/validations/profile";
import type { ProfileCompletionFormData } from "@/lib/validations/profile";
import { ProfileCompletionHeader } from "@/components/profile-completion/ProfileCompletionHeader";
import { ContractorFormFields } from "@/components/profile-completion/ContractorFormFields";
import { HomeownerFormFields } from "@/components/profile-completion/HomeownerFormFields";
import { ProfileCompletionFooter } from "@/components/profile-completion/ProfileCompletionFooter";

// Import the user_role type from Supabase generated types
import type { Database } from "@/integrations/supabase/types";
type UserRole = Database["public"]["Enums"]["user_role"];

export default function ProfileCompletion() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      company_name: "",
      address: "",
      license_number: "",
      phone_number: "",
      website: "",
      full_name: "",
    },
    mode: "all"
  });

  // Debug form state
  console.log("Form values:", form.watch());
  console.log("Form errors:", form.formState.errors);
  console.log("Is form valid?", form.formState.isValid);
  console.log("Is form dirty?", form.formState.isDirty);
  console.log("User role:", userRole);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, has_completed_profile")
        .eq("id", session.user.id)
        .single();

      console.log("Profile data:", profile);

      if (profile?.has_completed_profile) {
        console.log("Profile is completed, routing to dashboard...");
        // Route based on user role
        if (profile.role === 'homeowner') {
          console.log("Routing homeowner to client dashboard");
          navigate("/client-dashboard", { replace: true });
        } else if (profile.role === 'general_contractor') {
          console.log("Routing contractor to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (profile.role === 'admin') {
          console.log("Routing admin to admin dashboard");
          navigate("/admin", { replace: true });
        }
        return;
      }

      setUserRole(profile?.role || null);
    };

    checkSession();
  }, [navigate]);

  const onSubmit = async (data: ProfileCompletionFormData) => {
    // Debug submission attempt
    console.log("Attempting to submit with data:", data);
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log("Form data being submitted:", data);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No active session found. Please log in again.",
        });
        navigate("/auth");
        return;
      }

      const updateData = {
        ...data,
        has_completed_profile: true,
        updated_at: new Date().toISOString(),
      };

      // Log the update data before sending to Supabase
      console.log("Update data being sent to Supabase:", updateData);

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", session.user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      console.log("Profile updated successfully, userRole:", userRole);

      toast({
        title: "Profile completed successfully!",
        description: "You will now be redirected to the dashboard.",
      });

      // Ensure we handle all possible role cases
      switch (userRole) {
        case 'homeowner':
          console.log("Redirecting homeowner to client dashboard");
          navigate("/client-dashboard", { replace: true });
          break;
        case 'general_contractor':
          console.log("Redirecting contractor to dashboard");
          navigate("/dashboard", { replace: true });
          break;
        case 'admin':
          console.log("Redirecting admin to admin dashboard");
          navigate("/admin", { replace: true });
          break;
        default:
          console.error("Unknown user role:", userRole);
          navigate("/dashboard", { replace: true }); // Fallback to main dashboard
      }
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

  // Only render form for contractors and homeowners, not admins
  if (!userRole || userRole === 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-2xl py-8">
        <ProfileCompletionHeader />

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              console.log("Form submit event triggered");
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6"
          >
            {userRole === "general_contractor" ? (
              <ContractorFormFields form={form} />
            ) : (
              <HomeownerFormFields form={form} />
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save and Continue"}
            </Button>
          </form>
        </Form>

        <ProfileCompletionFooter />
      </div>
    </div>
  );
}
