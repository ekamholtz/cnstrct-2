
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
  const { loading, handleLogin, handleRegister } = useAuthForm();
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
    await handleRegister(values, selectedRole);
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
                selectedRole === "gc_admin" ? "General Contractor" : "Homeowner"
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
            onSubmit={onRegisterSubmit}
            loading={loading}
            selectedRole={selectedRole}
          />
        )
      )}
    </div>
  );
};
