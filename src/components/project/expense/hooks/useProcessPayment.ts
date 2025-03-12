
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { PaymentDetailsData } from "../types";

export const useProcessPayment = (onSuccess?: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ 
      expenseId, 
      amount, 
      paymentDetails, 
      expensesTable 
    }: { 
      expenseId: string; 
      amount: number; 
      paymentDetails: PaymentDetailsData; 
      expensesTable: "expenses" | "homeowner_expenses"; 
    }) => {
      console.log("Processing payment for expense:", expenseId);
      console.log("Payment details:", paymentDetails);
      console.log("Using table:", expensesTable);

      // First, create a payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          expense_id: expenseId,
          amount: Number(amount),
          payment_method_code: paymentDetails.payment_method_code,
          payment_date: paymentDetails.payment_date,
          notes: paymentDetails.notes,
          direction: "outgoing",
          payment_reference: `payment-${Date.now()}`, // Required field
          status: "completed", // Required field
          simulation_mode: false // Required field
        })
        .select("*")
        .single();

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      console.log("Payment created:", payment);

      // Then update the expense's amount_due
      const { error: expenseError } = await supabase
        .from(expensesTable)
        .update({
          amount_due: supabase.rpc('calculate_remaining_due', { 
            expense_id: expenseId, 
            expense_table: expensesTable 
          }),
          payment_status: supabase.rpc('determine_payment_status', { 
            expense_id: expenseId, 
            expense_table: expensesTable 
          })
        })
        .eq("id", expenseId);

      if (expenseError) {
        console.error("Error updating expense:", expenseError);
        throw new Error(`Failed to update expense: ${expenseError.message}`);
      }

      return payment;
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Processed",
        description: `Payment of ${data.amount} processed successfully`,
      });
      
      // Invalidate relevant queries to update the UI
      queryClient.invalidateQueries({ 
        queryKey: ['expenses'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['expense-details'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['payments'] 
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
      });
    }
  });

  return {
    processPayment: mutation.mutate,
    isProcessing: mutation.isPending,
    error: mutation.error
  };
};
