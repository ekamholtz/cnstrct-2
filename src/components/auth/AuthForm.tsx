
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import type { LoginFormData, RegisterFormData } from "./authSchemas";

interface AuthFormProps {
  isLogin: boolean;
  selectedRole: "general_contractor" | "homeowner" | null;
  onBack: () => void;
}

export const AuthForm = ({ isLogin, selectedRole, onBack }: AuthFormProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      console.log("Attempting to sign in with:", values.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user returned after login");
      }

      console.log("Sign in successful, user:", data.user);

      // Check profile completion status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_completed_profile')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      console.log("Profile data:", profile);

      if (profile && !profile.has_completed_profile) {
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
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormData) => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a role before registering",
      });
      return;
    }

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

      console.log("Registration successful:", data);

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

  const handleForgotPassword = () => {
    toast({
      title: "Coming Soon",
      description: "Password reset functionality will be available soon.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-gray-300"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h1>
        <p className="text-gray-300">
          {isLogin
            ? "Sign in to your account"
            : `Register as a ${
                selectedRole === "general_contractor" ? "General Contractor" : "Homeowner"
              }`}
        </p>
      </div>

      {isLogin ? (
        <LoginForm
          onSubmit={handleLogin}
          loading={loading}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        selectedRole && (
          <RegisterForm
            onSubmit={handleRegister}
            loading={loading}
            selectedRole={selectedRole}
          />
        )
      )}
    </div>
  );
};
