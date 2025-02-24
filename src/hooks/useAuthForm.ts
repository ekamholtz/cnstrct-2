
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RegisterFormData, LoginFormData } from "@/components/auth/authSchemas";

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'homeowner',
          },
        },
      });
      if (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsLoading(false);
      toast({
        title: "Success",
        description:
          "Registration successful! Check your email to verify your account.",
      });
      navigate("/auth");
    },
    onError: (error: any) => {
      setIsLoading(false);
      console.error("Registration error details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to register. Please try again.",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log("Attempting login for:", data.email);
      setIsLoading(true);
      const { data: authResponse, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      if (!authResponse?.user) {
        console.error("No user data returned");
        throw new Error("Could not authenticate user");
      }

      console.log("Auth response:", authResponse);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authResponse.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.error("No profile found for user");
        // Default to dashboard if no profile found
        return { role: 'gc_admin' };
      }

      console.log("Profile data:", profileData);
      return profileData;
    },
    onSuccess: (data) => {
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Login successful!",
      });

      console.log("Navigating based on role:", data?.role);
      if (data?.role === 'platform_admin') {
        navigate('/admin');
      } else if (data?.role === 'homeowner') {
        navigate('/client-dashboard');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      console.error("Login error details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to login. Please try again.",
      });
    },
  });

  const handleLogin = async (values: LoginFormData) => {
    console.log("Handle login called with:", values);
    await loginMutation.mutateAsync(values);
  };

  const handleRegister = async (values: RegisterFormData) => {
    console.log("Handle register called with:", values);
    await registerMutation.mutateAsync(values);
  };

  return {
    isLoading,
    handleLogin,
    handleRegister,
  };
};
