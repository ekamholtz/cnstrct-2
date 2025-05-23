
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth/AuthForm";
import { Building, House, ArrowRight } from "lucide-react";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { UserRole } from "@/components/admin/users/types";

type AuthRole = "gc_admin" | "homeowner";

const Auth = () => {
  const [selectedRole, setSelectedRole] = useState<AuthRole | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cnstrct-navy/5 to-cnstrct-navy/10 z-0"></div>
      <AnimatedGridPattern 
        className="z-0" 
        lineColor="rgba(16, 24, 64, 0.07)" 
        dotColor="rgba(16, 24, 64, 0.15)"
        lineOpacity={0.3}
        dotOpacity={0.5}
        speed={0.2}
        size={35}
      />

      {/* Header */}
      <header className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto">
          <img
            src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
            alt="CNSTRCT Logo"
            className="h-10 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center z-10 relative">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Decorative */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-cnstrct-navy to-cnstrct-navyLight rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cnstrct-orange/20 rounded-bl-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cnstrct-orange/10 rounded-tr-[80px] -z-10"></div>
            
            <AnimatedGridPattern 
              className="opacity-20" 
              lineColor="rgba(255, 255, 255, 0.3)" 
              dotColor="rgba(255, 255, 255, 0.5)"
              lineOpacity={0.3}
              dotOpacity={0.5}
              speed={0.3}
              size={25}
            />
            
            <img 
              src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png" 
              alt="CNSTRCT Logo" 
              className="h-16 mb-8 relative z-10"
            />
            <h2 className="text-3xl font-bold text-white mb-4 text-center relative z-10">Building Better Projects Together</h2>
            <p className="text-gray-200 text-center mb-6 relative z-10">
              Streamline your construction management with our powerful platform designed for contractors and homeowners.
            </p>
            <div className="flex space-x-2 relative z-10">
              <div className="w-3 h-3 rounded-full bg-cnstrct-orange"></div>
              <div className="w-3 h-3 rounded-full bg-white/50"></div>
              <div className="w-3 h-3 rounded-full bg-white/50"></div>
            </div>
          </div>

          {/* Right Column - Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            {!isLogin && !selectedRole ? (
              <div className="space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-cnstrct-navy mb-3">Create Your Account</h1>
                  <p className="text-gray-600">Choose your account type to get started</p>
                </div>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-cnstrct-navy text-cnstrct-navy hover:bg-cnstrct-navy hover:text-white transition-all duration-300 py-6 rounded-xl"
                    onClick={() => setSelectedRole("gc_admin")}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-cnstrct-navy/10 flex items-center justify-center mr-3">
                          <Building className="h-6 w-6 text-cnstrct-navy" />
                        </div>
                        <span>Register as General Contractor</span>
                      </div>
                      <ArrowRight className="h-5 w-5 opacity-70" />
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-cnstrct-orange text-cnstrct-orange hover:bg-cnstrct-orange hover:text-white transition-all duration-300 py-6 rounded-xl"
                    onClick={() => setSelectedRole("homeowner")}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-cnstrct-orange/10 flex items-center justify-center mr-3">
                          <House className="h-6 w-6 text-cnstrct-orange" />
                        </div>
                        <span>Register as Homeowner</span>
                      </div>
                      <ArrowRight className="h-5 w-5 opacity-70" />
                    </div>
                  </Button>
                </div>
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <button
                      onClick={() => setIsLogin(true)}
                      className="text-cnstrct-orange font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
                <AuthForm
                  isLogin={isLogin}
                  selectedRole={selectedRole}
                  onBack={() => {
                    setSelectedRole(null);
                    setIsLogin(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to CNSTRCT's{" "}
            <a href="#" className="text-cnstrct-orange hover:underline font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-cnstrct-orange hover:underline font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
