
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createProfile, handleLoginError } from "@/utils/authUtils";
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
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      if (!signInData?.user) {
        console.error("No user data returned from sign in");
        throw new Error("Login failed - no user data returned");
      }

      console.log("Sign in successful, fetching profile...");
      
      // Fetch profile directly without a separate utility function
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Handle navigation based on profile status and role
      if (!profile.has_completed_profile) {
        navigate("/profile-completion");
        return;
      }

      if (profile.role === 'admin') {
        navigate("/admin");
      } else if (profile.role === 'homeowner') {
        navigate("/client-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (error: any) {
      console.error("Login error details:", {
        error,
        message: error.message,
        status: error.status,
        name: error.name,
        timestamp: new Date().toISOString()
      });
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

  const handleRegister = async (values: RegisterFormData, selectedRole: 'homeowner' | 'gc_admin') => {
    setLoading(true);
    try {
      console.log("Starting registration with:", {
        email: values.email,
        role: selectedRole,
        fullName: values.fullName,
      });

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: selectedRole,
          },
          emailRedirectTo: `${window.location.origin}/auth`
        },
      });

      if (signUpError) {
        console.error("Registration error:", signUpError);
        throw signUpError;
      }

      if (!signUpData.user) {
        console.error("No user data returned after registration");
        throw new Error("Registration failed - no user data returned");
      }

      console.log("Registration successful, creating profile...");

      // Create profile after successful registration
      await createProfile(
        signUpData.user.id,
        values.fullName,
        selectedRole
      );

      // Automatically sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        console.error("Auto-login error:", signInError);
        throw signInError;
      }

      toast({
        title: "Welcome to CNSTRCT!",
        description: "Please complete your profile to get started.",
      });

      // Redirect to profile completion
      navigate("/profile-completion");

    } catch (error: any) {
      console.error("Registration error details:", {
        error,
        message: error.message,
        status: error.status,
        name: error.name,
        timestamp: new Date().toISOString()
      });
      const errorMessage = handleLoginError(error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
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
