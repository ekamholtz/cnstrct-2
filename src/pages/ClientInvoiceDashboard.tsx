
import { useState, useEffect } from "react";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ClientInvoiceSummary } from "@/components/client-dashboard/ClientInvoiceSummary";

export default function ClientInvoiceDashboard() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simple effect to mark component as loaded after initial render
    setIsLoaded(true);
    
    // Log for debugging
    console.log("ClientInvoiceDashboard mounted");
    
    return () => {
      console.log("ClientInvoiceDashboard unmounted");
    };
  }, []);

  return (
    <ClientDashboardLayout>
      <div className="mb-8">
        <Link to="/client-dashboard">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <ClientPageHeader 
        pageTitle="Invoices"
        pageDescription="View and manage your construction project invoices"
      />
      
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-xl font-semibold text-[#172b70] mb-6">Invoice Summary</h2>
        {isLoaded ? (
          <ClientInvoiceSummary />
        ) : (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </ClientDashboardLayout>
  );
}
