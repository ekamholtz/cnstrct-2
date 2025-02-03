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
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      console.log("Starting user registration...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      console.log("User created successfully:", signUpData);

      // Only proceed with profile update if we have a user
      if (signUpData.user) {
        console.log("Updating profile for user:", signUpData.user.id);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: values.fullName,
            role: selectedRole,
          })
          .eq("id", signUpData.user.id);

        if (updateError) {
          console.error("Profile update error:", updateError);
          throw updateError;
        }
        console.log("Profile updated successfully");
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
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