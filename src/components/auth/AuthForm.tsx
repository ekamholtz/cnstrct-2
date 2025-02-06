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
      console.log("Starting login process for:", values.email);
      
      // Log sign-in request details
      console.log("Sign-in request:", {
        email: values.email,
        timestamp: new Date().toISOString()
      });

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        console.error("Sign in error details:", {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name,
          body: signInError.cause,
        });
        throw signInError;
      }

      if (!signInData?.user) {
        console.error("No user data returned after login");
        throw new Error("Login failed - no user data returned");
      }

      console.log("Sign in successful, user data:", {
        id: signInData.user.id,
        email: signInData.user.email,
        metadata: signInData.user.user_metadata
      });

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      console.log("Profile data retrieved:", profile);

      if (!profile) {
        console.log("No profile found, creating one...");
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: signInData.user.id,
            full_name: signInData.user.user_metadata.full_name || '',
            role: signInData.user.user_metadata.role || 'admin',
            has_completed_profile: false,
          });

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

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
      // Enhanced error message based on error type
      let errorMessage = "An unexpected error occurred during login";
      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address before logging in";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
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
