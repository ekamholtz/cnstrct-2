
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceInformationCard } from "@/components/project/invoice/InvoiceInformationCard";
import { PaymentDetailsCard } from "@/components/project/invoice/PaymentDetailsCard";
import { useInvoiceDetails } from "@/components/project/invoice/hooks/useInvoiceDetails";

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

  const { data: invoiceData, isLoading: isInvoiceLoading } = useInvoiceDetails(invoiceId);
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
        <div className="mt-1">
          <h2 className="text-xl font-semibold text-gray-700">Invoice #{invoiceData.invoice_number}</h2>
          <p className="text-gray-600">View invoice details and payment information</p>
        </div>
      </div>

      <div className="grid gap-6">
        <InvoiceInformationCard invoice={invoiceData} isClient={isClient} />
        <PaymentDetailsCard invoice={invoiceData} />
      </div>
    </DashboardLayout>
  );
}
