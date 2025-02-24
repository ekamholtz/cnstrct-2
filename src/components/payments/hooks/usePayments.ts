
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PaymentFilters, Payment } from "../types";

export function usePayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      console.log('Fetching payments');
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoice_id (
            invoice_number,
            amount,
            project:project_id (
              name
            )
          ),
          expense:expense_id (
            name,
            project:project_id (
              name
            )
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data as Payment[];
    },
  });

  const createPayment = useMutation({
    mutationFn: async ({
      invoice_id,
      amount,
      payment_method_code,
      payment_date,
      notes
    }: {
      invoice_id: string;
      amount: number;
      payment_method_code: string;
      payment_date: Date;
      notes?: string;
    }) => {
      console.log('Creating payment record:', {
        invoice_id,
        amount,
        payment_method_code,
        payment_date
      });

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id,
          amount,
          direction: 'incoming',
          payment_method_code,
          payment_date: payment_date.toISOString(),
          status: 'completed',
          notes
        });

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        throw paymentError;
      }

      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_method: payment_method_code,
          payment_date: payment_date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice_id)
        .single();

      if (updateError) {
        console.error('Error updating invoice:', updateError);
        throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      toast({
        title: "Success",
        description: "Payment record has been created",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error in createPayment mutation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment record. Please try again.",
      });
    },
  });

  return {
    payments,
    isLoading,
    createPayment: createPayment.mutateAsync,
  };
}
