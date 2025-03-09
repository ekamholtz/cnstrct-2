
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
        .select("amount, amount_due, gc_account_id, payment_status")
        .eq("id", expenseId)
        .single();
      
      if (expenseError) {
        console.error("Error fetching expense details:", expenseError);
        throw new Error(`Failed to fetch expense details: ${expenseError.message}`);
      }
      
      if (!expense) {
        throw new Error("Expense not found");
      }
      
      console.log("Retrieved expense details:", expense);
      
      // Convert amount to number if it's a string
      const paymentAmount = typeof paymentData.amount === 'string'
        ? parseFloat(paymentData.amount)
        : paymentData.amount;

      // Check if the amount_due is showing as zero when it shouldn't
      if (expense.amount_due === 0 && expense.amount > 0 && expense.payment_status !== 'paid') {
        console.error("Inconsistent expense data detected: amount_due is 0 but payment_status is not 'paid'");
        // Force update the amount_due to match the amount for expenses with inconsistent data
        const { data: updatedExpense, error: updateError } = await supabase
          .from("expenses")
          .update({ amount_due: expense.amount })
          .eq("id", expenseId)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating expense amount_due:", updateError);
          throw new Error(`Failed to fix expense data: ${updateError.message}`);
        }
        
        console.log("Updated expense with corrected amount_due:", updatedExpense);
        expense.amount_due = updatedExpense.amount_due;
      }

      // Check if payment amount exceeds amount due
      if (paymentAmount > expense.amount_due) {
        throw new Error(`Payment amount (${paymentAmount}) exceeds amount due (${expense.amount_due})`);
      }

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
