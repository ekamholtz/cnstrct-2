import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth/AuthForm";
import { Building, House } from "lucide-react";

const Auth = () => {
  const [selectedRole, setSelectedRole] = useState<"general_contractor" | "homeowner" | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cnstrct-navy to-cnstrct-navy/90 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto">
          <img
            src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
            alt="CNSTRCT Logo"
            className="h-8 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {!isLogin && !selectedRole ? (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Create Your Account</h1>
                <p className="text-gray-300">Choose your account type to get started</p>
              </div>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-white hover:bg-gray-100"
                  onClick={() => setSelectedRole("general_contractor")}
                >
                  <Building className="mr-2 h-5 w-5" />
                  Register as General Contractor
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-white hover:bg-gray-100"
                  onClick={() => setSelectedRole("homeowner")}
                >
                  <House className="mr-2 h-5 w-5" />
                  Register as Homeowner
                </Button>
              </div>
              <div className="text-center">
                <p className="text-gray-300">
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-cnstrct-orange hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <AuthForm
              isLogin={isLogin}
              selectedRole={selectedRole}
              onBack={() => {
                setSelectedRole(null);
                setIsLogin(false);
              }}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            By continuing, you agree to CNSTRCT's{" "}
            <a href="#" className="text-cnstrct-orange hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-cnstrct-orange hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;