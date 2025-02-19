
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Invoice, PaymentFormData } from "../types";
import { useToast } from "@/components/ui/use-toast";

export function useInvoiceMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markInvoiceAsPaidMutation = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      payment_method, 
      payment_date 
    }: { 
      invoiceId: string;
    } & PaymentFormData) => {
      const { data, error } = await supabase
        .rpc('get_project_invoices', { p_id: invoiceId })
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method,
          payment_date: payment_date.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice marked as paid successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to mark invoice as paid: ${error.message}`,
      });
    },
  });

  return {
    markInvoiceAsPaid: markInvoiceAsPaidMutation.mutate,
    isLoading: markInvoiceAsPaidMutation.isPending
  };
}
