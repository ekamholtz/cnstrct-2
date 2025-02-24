
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payment, PaymentFilters, CreatePaymentData } from "../types";
import { useToast } from "@/hooks/use-toast";

export function usePayments(filters: PaymentFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch payments with filters
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let query = supabase
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
        `);

      // Apply filters
      if (filters.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentMethodCode) {
        query = query.eq('payment_method_code', filters.paymentMethodCode);
      }
      if (filters.dateRange.from) {
        query = query.gte('payment_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('payment_date', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Payment[];
    },
  });

  // Create new payment
  const createPayment = useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const { error } = await supabase
        .from('payments')
        .insert([{
          ...data,
          direction: data.invoice_id ? 'incoming' : 'outgoing',
          status: 'completed' // For now, we'll mark it as completed immediately
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment. Please try again.",
      });
    },
  });

  // Get payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supported_payment_methods')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  return {
    payments,
    isLoading,
    createPayment: createPayment.mutateAsync,
    paymentMethods,
  };
}
