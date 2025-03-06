
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { createExpensePayment, updateExpenseAfterPayment } from "../services";
import { ProcessPaymentParams, PaymentResponse, ProcessPaymentMutation } from "./types";

export function useProcessPaymentDashboard(): { processPaymentMutation: ProcessPaymentMutation } {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const processPaymentMutation = useMutation<
    PaymentResponse,
    Error,
    ProcessPaymentParams,
    unknown
  >({
    mutationFn: async ({
      expenseId,
      amount,
      paymentDetails,
      expensesTable,
    }: ProcessPaymentParams) => {
      console.log('Processing payment:', { expenseId, amount, paymentDetails, expensesTable });
      
      const payment = await createExpensePayment({
        expenseId,
        paymentDetails,
        expensesTable
      });
      
      await updateExpenseAfterPayment(
        expenseId,
        amount,
        paymentDetails.amount,
        expensesTable
      );
      
      return payment;
    },
    onSuccess: () => {
      // Fix: Using proper invalidateQueries format
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['project'] }),
        queryClient.invalidateQueries({ queryKey: ['homeowner-expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
      ]);
      
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
      });
    },
  });

  return { processPaymentMutation };
}
