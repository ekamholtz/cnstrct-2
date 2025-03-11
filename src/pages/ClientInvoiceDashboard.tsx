
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ClientInvoiceSummary } from "@/components/client-dashboard/ClientInvoiceSummary";

export default function ClientInvoiceDashboard() {
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
        <ClientInvoiceSummary />
      </div>
    </ClientDashboardLayout>
  );
}
