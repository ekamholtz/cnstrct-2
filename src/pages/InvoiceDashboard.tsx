
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { InvoiceFilters } from "@/components/invoice-dashboard/InvoiceFilters";
import { InvoiceTable } from "@/components/invoice-dashboard/InvoiceTable";
import { useInvoiceDashboard } from "@/hooks/useInvoiceDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { Invoice } from "@/components/project/invoice/types";

export default function InvoiceDashboard() {
  const {
    invoices,
    loading,
    statusFilter,
    setStatusFilter,
    handleMarkAsPaid,
  } = useInvoiceDashboard();

  // Fetch user role to determine the correct dashboard route and UI
  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],  // Changed to match GCProjects implementation
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role, company_name, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const dashboardRoute = profile?.role === 'homeowner' ? '/client-dashboard' : '/dashboard';

  console.log("Profile data:", profile); // Add logging to debug

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link to={dashboardRoute}>
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {profile?.role === 'general_contractor' ? (
            <div className="space-y-1">
              <p className="text-xl font-bold text-gray-700">{profile?.company_name || profile?.full_name}</p>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
              <p className="text-gray-600">Track and manage all project invoices</p>
            </div>
          ) : (
            <ClientPageHeader 
              pageTitle="Invoices"
              pageDescription="View and manage all your payment invoices"
            />
          )}
        </div>

        <InvoiceFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          invoices={invoices as Invoice[]}
        />

        <InvoiceTable
          invoices={invoices as Invoice[]}
          loading={loading}
          onMarkAsPaid={handleMarkAsPaid}
        />
      </div>
    </DashboardLayout>
  );
}
