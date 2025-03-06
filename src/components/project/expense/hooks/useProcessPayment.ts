import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { createExpensePayment, updateExpenseAfterPayment } from "@/services/expenseService";

export function useProcessPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    async ({
      expenseId,
      amount,
      paymentDetails,
      expensesTable,
    }: {
      expenseId: string;
      amount: number;
      paymentDetails: {
        payment_method_code: string;
        payment_date: string;
        amount: number;
        notes?: string;
      };
      expensesTable: "expenses" | "homeowner_expenses";
    }) => {
      console.log("Processing payment:", {
        expenseId,
        amount,
        paymentDetails,
        expensesTable,
      });

      // Create payment record
      const payment = await createExpensePayment({
        expenseId,
        paymentDetails,
        expensesTable,
      });

      // Update expense status
      await updateExpenseAfterPayment(
        expenseId,
        amount,
        paymentDetails.amount,
        expensesTable
      );

      return payment;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["expenses"]);
        toast({
          title: "Success",
          description: "Payment processed successfully",
        });
      },
      onError: (error) => {
        console.error("Error processing payment:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process payment. Please try again.",
        });
      },
    }
  );

  return mutation;
}
