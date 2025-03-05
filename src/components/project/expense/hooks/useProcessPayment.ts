
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentDetailsData } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createPayment } from "@/services/projectService";

export function useProcessPayment(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ expenseId, paymentData }: { expenseId: string; paymentData: PaymentDetailsData }) => {
      console.log('Processing payment for expense:', expenseId, paymentData);
      
      try {
        // First get the expense to get its gc_account_id
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('amount, amount_due, gc_account_id')
          .eq('id', expenseId)
          .single();

        if (expenseError) {
          console.error('Error fetching expense for payment update:', expenseError);
          throw expenseError;
        }

        // Create the payment record using the service function
        const payment = await createPayment({
          expense_id: expenseId,
          payment_method_code: paymentData.payment_method_code,
          payment_date: new Date(paymentData.payment_date).toISOString(),
          amount: Number(paymentData.amount),
          notes: paymentData.notes || '',
          direction: 'outgoing',
          status: 'completed'
        });
        
        console.log('Payment created:', payment);

        // Update the expense status and amount_due
        const newAmountDue = expense.amount_due - Number(paymentData.amount);
        const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;

        const { data: updatedExpense, error: updateError } = await supabase
          .from('expenses')
          .update({
            payment_status: newStatus,
            amount_due: Math.max(0, newAmountDue)
          })
          .eq('id', expenseId)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating expense after payment:', updateError);
          throw updateError;
        }
        
        console.log('Expense updated after payment:', updatedExpense);

        return payment;
      } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    },
    onError: (error) => {
      console.error('Error processing payment (in mutation):', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
      });
    }
  });
}
