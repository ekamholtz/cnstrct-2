
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientPageHeader } from "@/components/client-dashboard/ClientPageHeader";
import { format } from "date-fns";
import { StatusBadge } from "@/components/project/invoice/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvoiceDetails() {
  const { invoiceId } = useParams();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_project_invoices', { p_id: null })
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Invoice not found</h2>
          <p className="text-gray-600">The invoice you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link to="/invoices">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>

      <ClientPageHeader 
        pageTitle={`Invoice #${invoice.invoice_number}`}
        pageDescription="View invoice details and payment information"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Status</h3>
                <StatusBadge status={invoice.status} />
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Amount</h3>
                <p className="text-lg font-semibold">${invoice.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Project</h3>
                <p>{invoice.project_name}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Milestone</h3>
                <p>{invoice.milestone_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Created Date</h3>
                <p>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {invoice.status === "paid" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Payment Method</h3>
                  <p className="capitalize">{invoice.payment_method}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Payment Date</h3>
                  <p>{invoice.payment_date ? format(new Date(invoice.payment_date), 'MMM d, yyyy') : 'N/A'}</p>
                </div>
              </div>
              {invoice.payment_reference && (
                <div>
                  <h3 className="font-medium text-gray-500">Payment Reference</h3>
                  <p>{invoice.payment_reference}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
