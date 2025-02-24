
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
import { Loader2 } from "lucide-react";

// Import the user_role type from Supabase generated types
import type { Database } from "@/integrations/supabase/types";
type UserRole = Database["public"]["Enums"]["user_role"];

export default function ProfileCompletion() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    let mounted = true;

    const checkSession = async () => {
      try {
        console.log("Starting session check...");
        setIsLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log("No session found, redirecting to auth...");
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Please log in again",
          });
          navigate("/auth");
          return;
        }

        console.log("Session found, user ID:", session.user.id);

        // First try to get the role from user metadata
        const userRole = session.user.user_metadata.role as UserRole;
        console.log("Role from user metadata:", userRole);

        if (!userRole) {
          // If no role in metadata, try to fetch from profiles table
          console.log("Fetching profile data...");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, has_completed_profile")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw profileError;
          }

          console.log("Profile data:", profile);

          if (profile?.has_completed_profile) {
            console.log("Profile already completed, routing based on role...");
            routeBasedOnRole(profile.role);
            return;
          }

          if (mounted) {
            setUserRole(profile?.role || null);
          }
        } else {
          if (mounted) {
            setUserRole(userRole);
          }
        }

      } catch (error) {
        console.error("Error in checkSession:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data. Please try again.",
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate, toast]);

  const routeBasedOnRole = (role: UserRole) => {
    console.log("Routing based on role:", role);
    switch (role) {
      case 'homeowner':
        console.log("Routing homeowner to client dashboard");
        navigate("/client-dashboard", { replace: true });
        break;
      case 'gc_admin':
      case 'project_manager':
        console.log("Routing contractor/PM to dashboard");
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

      console.log("Updating profile with data:", updateData);

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      // Verify the update was successful
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("role, has_completed_profile")
        .eq("id", session.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error verifying profile update:", fetchError);
        throw fetchError;
      }

      if (!updatedProfile?.has_completed_profile) {
        throw new Error("Profile update did not save correctly");
      }

      toast({
        title: "Profile completed successfully!",
        description: "You will now be redirected to the dashboard.",
      });

      // Use the separate routing function
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

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            {userRole === "gc_admin" || userRole === "project_manager" ? (
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
