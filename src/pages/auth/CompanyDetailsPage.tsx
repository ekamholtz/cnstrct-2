import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { CompanyDetailsForm } from "@/components/auth/CompanyDetailsForm";
import { CompanyDetailsFormData } from "@/components/auth/authSchemas";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

export const CompanyDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateCompanyDetailsMutation } = useAuthForm();

  // Get state passed from register page
  const [companyName, setCompanyName] = useState<string>("");
  const [gcAccountId, setGcAccountId] = useState<string>("");

  useEffect(() => {
    // Check if we have the required state
    const state = location.state as { gcAccountId: string; companyName: string } | undefined;
    
    if (!state?.gcAccountId) {
      toast({
        title: "Error",
        description: "Missing account information. Please start registration again.",
        variant: "destructive",
      });
      navigate("/auth/register");
      return;
    }

    setGcAccountId(state.gcAccountId);
    setCompanyName(state.companyName || "Your Company");
  }, [location, navigate, toast]);

  const handleSubmit = async (data: CompanyDetailsFormData) => {
    try {
      await updateCompanyDetailsMutation.mutateAsync({
        gcAccountId,
        data
      });
    } catch (error) {
      console.error("Error updating company details:", error);
      toast({
        title: "Error",
        description: "Failed to update company details. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        <div className="w-full max-w-md">
          <div className="space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-cnstrct-navy mb-2">Company Details</h1>
              <p className="text-gray-600">Tell us more about {companyName}</p>
            </div>
            <CompanyDetailsForm
              onSubmit={handleSubmit}
              loading={updateCompanyDetailsMutation.isPending}
              companyName={companyName}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyDetailsPage;
