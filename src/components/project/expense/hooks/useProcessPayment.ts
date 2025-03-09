
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { createExpensePayment, updateExpenseAfterPayment } from "@/services/expenseService";
import { supabase } from "@/integrations/supabase/client";

export interface ProcessPaymentParams {
  expenseId: string;
  amount: number;
  paymentDetails: {
    payment_method_code: string;
    payment_date: string;
    amount: number;
    notes?: string;
  };
  expensesTable: "expenses" | "homeowner_expenses";
}

export interface PaymentData {
  expenseId: string;
  paymentData: {
    payment_method_code: string;
    payment_date: string;
    amount: string | number;
    notes?: string;
  };
}

export function useProcessPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      expenseId,
      paymentData,
    }: PaymentData) => {
      console.log("Processing payment:", {
        expenseId,
        paymentData,
      });

      // Get the expense details using Supabase directly instead of API fetch
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .select("amount, amount_due, gc_account_id")
        .eq("id", expenseId)
        .single();
      
      if (expenseError) {
        console.error("Error fetching expense details:", expenseError);
        throw new Error(`Failed to fetch expense details: ${expenseError.message}`);
      }
      
      if (!expense) {
        throw new Error("Expense not found");
      }
      
      // Convert amount to number if it's a string
      const paymentAmount = typeof paymentData.amount === 'string'
        ? parseFloat(paymentData.amount)
        : paymentData.amount;

      // Create payment record
      const payment = await createExpensePayment({
        expenseId,
        paymentDetails: {
          payment_method_code: paymentData.payment_method_code,
          payment_date: paymentData.payment_date,
          amount: paymentAmount,
          notes: paymentData.notes || '',
        },
        expensesTable: "expenses" // Default to regular expenses table
      });

      // Update expense status
      await updateExpenseAfterPayment(
        expenseId,
        expense.amount || 0,
        paymentAmount,
        "expenses"
      );

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
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
  });

  return mutation;
}
