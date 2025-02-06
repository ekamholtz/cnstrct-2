
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createProfile, fetchUserProfile, handleLoginError } from "@/utils/authUtils";
import type { LoginFormData, RegisterFormData } from "@/components/auth/authSchemas";

export const useAuthForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      console.log("Starting login process for:", values.email);
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!signInData?.user) {
        throw new Error("Login failed - no user data returned");
      }

      const profile = await fetchUserProfile(signInData.user.id);

      if (!profile) {
        console.log("No profile found, creating one...");
        await createProfile(
          signInData.user.id, 
          signInData.user.user_metadata.full_name || '',
          signInData.user.user_metadata.role || 'admin'
        );
        navigate("/profile-completion");
      } else if (!profile.has_completed_profile) {
        navigate("/profile-completion");
      } else {
        navigate("/dashboard");
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

    } catch (error: any) {
      console.error("Login process error:", error);
      const errorMessage = handleLoginError(error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormData, selectedRole: "general_contractor" | "homeowner") => {
    setLoading(true);
    try {
      console.log("Starting registration with:", {
        email: values.email,
        role: selectedRole,
        fullName: values.fullName,
      });

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: selectedRole,
          },
        },
      });

      if (error) {
        console.error("Registration error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data returned after registration");
      }

      navigate("/profile-completion");
      
      toast({
        title: "Registration successful!",
        description: "Please complete your profile information.",
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "An unexpected error occurred during registration",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
    handleRegister
  };
};
