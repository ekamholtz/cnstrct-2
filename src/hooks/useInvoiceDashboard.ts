
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Invoice, PaymentFormData } from "@/components/project/invoice/types";

export type InvoiceStatus = "pending_payment" | "paid" | "cancelled" | "all";

export const useInvoiceDashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      console.log("Fetching invoices for dashboard...");
      const { data, error } = await supabase
        .rpc('get_project_invoices', { p_id: null });

      if (error) throw error;

      console.log("Invoices fetched for dashboard:", data);
      setInvoices(data as Invoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoices. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    const channel = supabase
      .channel('invoice-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          console.log('Real-time update received in dashboard:', payload);
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const handleMarkAsPaid = async (invoiceId: string, data: PaymentFormData) => {
    try {
      console.log('Marking invoice as paid in dashboard:', {
        invoiceId,
        payment_method: data.payment_method,
        payment_date: data.payment_date
      });

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: data.payment_method,
          payment_date: data.payment_date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice has been marked as paid",
      });
      
      await fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid in dashboard:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark invoice as paid. Please try again.",
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === "all") return true;
    return invoice.status === statusFilter;
  });

  return {
    invoices: filteredInvoices,
    loading,
    statusFilter,
    setStatusFilter,
    handleMarkAsPaid,
  };
};
