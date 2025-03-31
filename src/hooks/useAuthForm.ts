
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { LoginFormData, RegisterFormData } from "@/components/auth/authSchemas";
import { v4 as uuidv4 } from "uuid";

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      // Get the user's role to determine where to navigate
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not found after login");
      }
      
      // Check if the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, gc_account_id, has_completed_profile")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }
      
      // Determine where to navigate based on role
      const role = profile?.role || "contractor";
      
      if (profile?.has_completed_profile === false) {
        navigate("/profile-completion");
        return;
      }
      
      if (role === "homeowner") {
        navigate("/client-dashboard");
      } else if (role === "gc_admin" || role === "general_contractor") {
        navigate("/dashboard");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Check if email already exists
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", values.email);

      if (existingUsers && existingUsers.length > 0) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "An account with this email already exists.",
        });
        setIsLoading(false);
        return;
      }

      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: values.role,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("User not created");
      }

      // Create user record in profiles table
      let gcAccountId = null;
      
      // If user is a GC, create a GC account record
      if (values.role === "gc_admin") {
        const newGcAccountId = uuidv4();
        
        const { error: gcAccountError } = await supabase
          .from("gc_accounts")
          .insert({
            id: newGcAccountId,
            name: values.companyName || "New Company",
            owner_id: data.user.id,
            created_by: data.user.id,
          });

        if (gcAccountError) {
          console.error("Error creating GC account:", gcAccountError);
          throw new Error(`Failed to create GC account: ${gcAccountError.message}`);
        }
        
        gcAccountId = newGcAccountId;
      }
      
      // Create profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: values.email,
          full_name: values.fullName,
          role: values.role,
          gc_account_id: gcAccountId,
          has_completed_profile: values.role !== "gc_admin", // GC admins need to complete company details
        });

      if (profileError) {
        throw profileError;
      }

      toast({
        title: "Registration Successful",
        description: "Your account has been created!",
      });
      
      // For GC admins, navigate to company details
      if (values.role === "gc_admin") {
        navigate("/auth/company-details", { 
          state: { 
            gcAccountId, 
            companyName: values.companyName,
            isNewUser: true
          } 
        });
      } else {
        // For other users, navigate to dashboard
        if (values.role === "homeowner") {
          navigate("/client-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompanyDetailsMutation = {
    mutateAsync: async ({ 
      gcAccountId, 
      data: { website, licenseNumber, address, phoneNumber } 
    }) => {
      setIsLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        // Update gc_account with company details
        const { error: updateError } = await supabase
          .from("gc_accounts")
          .update({
            website,
            license_number: licenseNumber,
            address,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString(),
          })
          .eq("id", gcAccountId);
          
        if (updateError) {
          throw updateError;
        }
        
        // Update profile to mark as completed
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ has_completed_profile: true })
          .eq("id", user.id);
          
        if (profileError) {
          throw profileError;
        }
        
        toast({
          title: "Company Details Updated",
          description: "Your company details have been saved successfully.",
        });
        
        // Navigate to the subscription selection page
        navigate("/subscription-selection", {
          state: { userId: user.id, isNewUser: true }
        });
        
      } catch (error) {
        console.error("Error updating company details:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message || "Failed to update company details. Please try again.",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    isPending: isLoading
  };

  return {
    isLoading,
    handleLogin,
    handleRegister,
    updateCompanyDetailsMutation,
  };
};
