
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentDetailsData } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createExpensePayment, updateExpenseAfterPayment } from "@/pages/ExpenseDashboard/services/paymentService";

export function useProcessPayment(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ expenseId, paymentData }: { expenseId: string; paymentData: PaymentDetailsData }) => {
      console.log('Processing payment for expense:', expenseId, paymentData);
      
      try {
        // First get the expense to validate and get its amount info
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('amount, amount_due')
          .eq('id', expenseId)
          .single();

        if (expenseError) {
          console.error('Error fetching expense for payment update:', expenseError);
          throw expenseError;
        }

        // Create the payment record using the createExpensePayment function
        const payment = await createExpensePayment({
          expenseId,
          paymentDetails: paymentData,
          expensesTable: 'expenses'
        });
        
        console.log('Payment created:', payment);

        // Update the expense status and amount_due using updateExpenseAfterPayment
        const updatedExpense = await updateExpenseAfterPayment(
          expenseId,
          expense.amount,
          Number(paymentData.amount),
          'expenses'
        );
        
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
