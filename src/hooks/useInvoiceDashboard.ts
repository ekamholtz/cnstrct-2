import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PaymentFormData } from "@/components/project/invoice/types";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "pending_payment" | "paid" | "cancelled";
  created_at: string;
  milestone: {
    name: string;
    project: {
      name: string;
    };
  };
}

export const useInvoiceDashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      console.log("Fetching invoices for dashboard...");
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          milestone:milestone_id (
            name,
            project:project_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Invoices fetched for dashboard:", data);
      setInvoices(data || []);
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
  }, []);

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