
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createProfile } from "@/utils/authUtils";
import type { LoginFormData } from "@/components/auth/authSchemas";

export const useLogin = () => {
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
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, has_completed_profile')
        .eq('id', signInData.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      if (!profile) {
        console.log("No profile found, creating one...");
        await createProfile(
          signInData.user.id,
          signInData.user.user_metadata.full_name || '',
          signInData.user.user_metadata.role || 'gc_admin'
        );
        
        navigate("/profile-completion");
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      if (!profile.has_completed_profile) {
        navigate("/profile-completion");
        return;
      }

      switch (profile.role) {
        case 'admin':
          navigate("/admin");
          break;
        case 'homeowner':
          navigate("/client-dashboard");
          break;
        case 'gc_admin':
          navigate("/dashboard");
          break;
        default:
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
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin
  };
};

