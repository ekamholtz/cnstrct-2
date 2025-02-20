
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
import { PaymentModal } from "@/components/project/invoice/PaymentModal";
import { PaymentSimulationModal } from "@/components/project/invoice/PaymentSimulationModal";
import { Invoice } from "@/components/project/invoice/types";

export default function InvoiceDetails() {
  const { invoiceId } = useParams();

  // Fetch user profile to determine role
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: invoiceData, isLoading: isInvoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          created_at,
          updated_at,
          payment_method,
          payment_date,
          payment_reference,
          payment_gateway,
          milestone_id,
          milestones (
            name,
            project:project_id (
              name,
              id
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      
      // Transform the data to match the Invoice type
      const invoice: Invoice = {
        id: data.id,
        invoice_number: data.invoice_number,
        amount: data.amount,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        milestone_id: data.milestone_id,
        milestone_name: data.milestones.name,
        project_name: data.milestones.project.name,
        project_id: data.milestones.project.id,
        payment_method: data.payment_method as "cc" | "check" | "transfer" | "cash" | null,
        payment_date: data.payment_date,
        payment_reference: data.payment_reference,
        payment_gateway: data.payment_gateway,
        payment_method_type: data.payment_method as "cc" | "check" | "transfer" | "cash" | "simulated" | null,
        simulation_data: null
      };
      
      return invoice;
    },
  });

  const isLoading = isProfileLoading || isInvoiceLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoiceData) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Invoice not found</h2>
          <p className="text-gray-600">The invoice you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isClient = profile?.role === 'homeowner';

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
        pageTitle={`Invoice #${invoiceData.invoice_number}`}
        pageDescription="View invoice details and payment information"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Information</CardTitle>
            {invoiceData.status === 'pending_payment' && (
              <div>
                {isClient ? (
                  <PaymentSimulationModal
                    invoice={invoiceData}
                    onPaymentComplete={() => {
                      window.location.reload();
                    }}
                  />
                ) : (
                  <PaymentModal
                    invoice={invoiceData}
                    onSubmit={async (data) => {
                      // This is a placeholder - the actual implementation would come from props
                      console.log('Payment marked:', data);
                      window.location.reload();
                    }}
                  />
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Status</h3>
                <StatusBadge status={invoiceData.status} />
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Amount</h3>
                <p className="text-lg font-semibold">${invoiceData.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Project</h3>
                <p>{invoiceData.project_name}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Milestone</h3>
                <p>{invoiceData.milestone_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Created Date</h3>
                <p>{format(new Date(invoiceData.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {invoiceData.status === "paid" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Payment Method</h3>
                  <p className="capitalize">{invoiceData.payment_method}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Payment Date</h3>
                  <p>{invoiceData.payment_date ? format(new Date(invoiceData.payment_date), 'MMM d, yyyy') : 'N/A'}</p>
                </div>
              </div>
              {invoiceData.payment_reference && (
                <div>
                  <h3 className="font-medium text-gray-500">Payment Reference</h3>
                  <p>{invoiceData.payment_reference}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
