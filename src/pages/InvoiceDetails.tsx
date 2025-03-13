import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceInformationCard } from "@/components/project/invoice/InvoiceInformationCard";
import { PaymentDetailsCard } from "@/components/project/invoice/PaymentDetailsCard";
import { useInvoiceDetails } from "@/components/project/invoice/hooks/useInvoiceDetails";
import { useSyncInvoiceToQBO } from "@/hooks/useSyncInvoiceToQBO";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const { syncInvoiceToQBO, isLoading: isSyncing } = useSyncInvoiceToQBO();
  const [isSynced, setIsSynced] = useState(false);

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

  // Check if the invoice is already synced to QBO
  useEffect(() => {
    if (invoiceId) {
      const checkSyncStatus = async () => {
        const { data } = await supabase
          .from('qbo_references')
          .select('qbo_id')
          .eq('entity_type', 'invoice')
          .eq('entity_id', invoiceId)
          .maybeSingle();
        
        setIsSynced(!!data?.qbo_id);
      };
      
      checkSyncStatus();
    }
  }, [invoiceId]);

  const handleSyncToQBO = async () => {
    if (invoiceId) {
      const result = await syncInvoiceToQBO(invoiceId);
      if (result) {
        setIsSynced(true);
      }
    }
  };

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
  const isGC = profile?.role === 'gc' || profile?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <Link to="/invoices">
          <Button variant="ghost" className="text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        
        {isGC && (
          <div className="flex items-center gap-3">
            {isSynced ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                Synced to QuickBooks
              </Badge>
            ) : null}
            
            <Button 
              onClick={handleSyncToQBO} 
              disabled={isSyncing || isSynced}
              variant={isSynced ? "outline" : "default"}
              className={isSynced ? "border-blue-200 text-blue-700" : ""}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : isSynced ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-sync to QuickBooks
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync to QuickBooks
                </>
              )}
            </Button>
          </div>
        )}
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
