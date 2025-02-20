
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
      company_address: "",
      license_number: "",
      phone_number: "",
      website: "",
      full_name: "",
      address: "",
    },
    mode: "onChange", // Enable real-time validation
  });

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

      if (profile?.has_completed_profile) {
        // Route based on user role
        if (profile.role === 'homeowner') {
          navigate("/client-dashboard");
        } else if (profile.role === 'general_contractor') {
          navigate("/dashboard");
        } else if (profile.role === 'admin') {
          navigate("/admin");
        }
        return;
      }

      setUserRole(profile?.role || null);
    };

    checkSession();
  }, [navigate]);

  const onSubmit = async (data: ProfileCompletionFormData) => {
    if (isSubmitting) return; // Prevent double submission

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

      // Validate form data based on user role
      if (userRole === 'general_contractor' && (!data.company_name || !data.company_address || !data.license_number)) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required contractor fields.",
        });
        return;
      }

      if (userRole === 'homeowner' && (!data.full_name || !data.address)) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required homeowner fields.",
        });
        return;
      }

      const updateData = {
        ...data,
        has_completed_profile: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", session.user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      console.log("Profile updated successfully");

      toast({
        title: "Profile completed successfully!",
        description: "You will now be redirected to the dashboard.",
      });

      // Route based on user role
      if (userRole === 'homeowner') {
        navigate("/client-dashboard");
      } else if (userRole === 'general_contractor') {
        navigate("/dashboard");
      } else if (userRole === 'admin') {
        navigate("/admin");
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
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
            noValidate // Let our custom validation handle it
          >
            {userRole === "general_contractor" ? (
              <ContractorFormFields form={form} />
            ) : (
              <HomeownerFormFields form={form} />
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !form.formState.isValid}
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
