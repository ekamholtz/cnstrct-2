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
        routeBasedOnRole(profile.role);
        return;
      }

      setUserRole(profile?.role || null);
    };

    checkSession();
  }, [navigate]);

  const routeBasedOnRole = (role: UserRole) => {
    console.log("Routing based on role:", role);
    switch (role) {
      case 'homeowner':
        console.log("Routing homeowner to client dashboard");
        navigate("/client-dashboard", { replace: true });
        break;
      case 'gc_admin':
        console.log("Routing contractor to dashboard");
        navigate("/dashboard", { replace: true });
        break;
      case 'admin':
        console.log("Routing admin to admin dashboard");
        navigate("/admin", { replace: true });
        break;
      default:
        console.error("Unknown user role:", role);
        navigate("/dashboard", { replace: true });
    }
  };

  const onSubmit = async (data: ProfileCompletionFormData) => {
    if (isSubmitting || !userRole) return;

    try {
      setIsSubmitting(true);
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

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("role, has_completed_profile")
        .eq("id", session.user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedProfile.has_completed_profile) {
        throw new Error("Profile update did not save correctly");
      }

      toast({
        title: "Profile completed successfully!",
        description: "You will now be redirected to the dashboard.",
      });

      routeBasedOnRole(userRole);

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

  if (!userRole || userRole === 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-2xl py-8">
        <ProfileCompletionHeader />

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            {userRole === "gc_admin" ? (
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
