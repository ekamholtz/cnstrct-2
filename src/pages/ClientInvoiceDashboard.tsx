
import { useEffect } from "react";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ClientInvoiceSummary } from "@/components/client-dashboard/ClientInvoiceSummary";
import { useClientInvoices } from "@/components/client-dashboard/hooks/useClientInvoices";
import { InvoiceList } from "@/components/client-dashboard/components/InvoiceList";

export default function ClientInvoiceDashboard() {
  const { data, isLoading, error } = useClientInvoices();
  
  useEffect(() => {
    // Log data when it changes to help with debugging
    console.log("Invoice data in dashboard:", data);
  }, [data]);

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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48 mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="text-red-500">
            Failed to load invoices. Please try again later.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-[#172b70] mb-6">Recent Invoices</h2>
          <InvoiceList invoices={data?.invoices || []} />
        </div>
      )}
    </ClientDashboardLayout>
  );
}
