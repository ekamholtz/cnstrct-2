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

  const registerMutation = useMutation(
    async (data: RegisterFormData) => {
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
        throw error;
      }
    },
    {
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
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to register. Please try again.",
        });
      },
    }
  );

  const loginMutation = useMutation(
    async (data: LoginFormData) => {
      setIsLoading(true);
      const { data: authResponse, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      if (!authResponse?.user) {
        throw new Error("Could not authenticate user");
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authResponse.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return profileData;
    },
    {
      onSuccess: (data) => {
        setIsLoading(false);
        toast({
          title: "Success",
          description: "Login successful!",
        });

        if (data?.role === 'platform_admin') {
          navigate('/admin');
        } else if (data?.role === 'homeowner') {
          navigate('/client-dashboard');
        }
        else {
          navigate('/dashboard');
        }
      },
      onError: (error: any) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to login. Please try again.",
        });
      },
    }
  );

  return {
    isLoading,
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
  };
};
