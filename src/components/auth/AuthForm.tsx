
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useAuthForm } from "@/hooks/useAuthForm";
import type { LoginFormData, RegisterFormData } from "./authSchemas";

interface AuthFormProps {
  isLogin: boolean;
  selectedRole: "gc_admin" | "homeowner" | null;
  onBack: () => void;
}

export const AuthForm = ({ isLogin, selectedRole, onBack }: AuthFormProps) => {
  const { isLoading, signIn, signUp } = useAuthForm();
  const { toast } = useToast();

  const handleForgotPassword = () => {
    toast({
      title: "Coming Soon",
      description: "Password reset functionality will be available soon.",
    });
  };

  const onRegisterSubmit = async (values: RegisterFormData) => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a role before registering",
      });
      return;
    }
    
    console.log("AuthForm - Registration submitted with role:", selectedRole);
    console.log("AuthForm - Form values:", values);
    
    try {
      // Make sure we're passing the role correctly
      await signUp({
        ...values,
        role: selectedRole, // Ensure role is explicitly set
      });
    } catch (error) {
      console.error("Registration error in AuthForm:", error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "Failed to create account. Please try again.",
      });
    }
  };

  const onLoginSubmit = async (values: LoginFormData) => {
    try {
      await signIn(values.email, values.password);
      // The navigation will be handled in the useAuthForm hook
    } catch (error) {
      // Error will be handled in the useAuthForm hook
      console.error("Login error in AuthForm:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-cnstrct-navy flex items-center gap-1 p-0 group"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-cnstrct-navy mb-2">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h1>
        <p className="text-gray-600">
          {isLogin
            ? "Sign in to your account"
            : `Register as a ${
                selectedRole === "gc_admin" ? "General Contractor" : "Homeowner"
              }`}
        </p>
      </div>

      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-cnstrct-orange/5 rounded-full -z-10"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-cnstrct-navy/5 rounded-full -z-10"></div>
        
        {isLogin ? (
          <LoginForm
            onSubmit={onLoginSubmit}
            loading={isLoading}
            onForgotPassword={handleForgotPassword}
          />
        ) : (
          selectedRole && (
            <RegisterForm
              onSubmit={onRegisterSubmit}
              loading={isLoading}
              selectedRole={selectedRole}
            />
          )
        )}
      </div>
    </div>
  );
};
