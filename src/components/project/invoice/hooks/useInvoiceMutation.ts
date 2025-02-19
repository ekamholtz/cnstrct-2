import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Invoice } from "../types";
import { useToast } from "@/components/ui/use-toast";

export function useInvoiceMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const markInvoiceAsPaidMutation = useMutation(
    async (invoiceId: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Invoice;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        toast({
          title: "Success",
          description: "Invoice marked as paid successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to mark invoice as paid: ${error.message}`,
        });
      },
    }
  );

  return {
    markInvoiceAsPaid: markInvoiceAsPaidMutation.mutateAsync,
    isLoading: markInvoiceAsPaidMutation.isLoading,
  };
}
