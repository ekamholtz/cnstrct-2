import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Expense, ExpenseFormStage1Data, PaymentDetailsData } from "../types";

interface ProcessPaymentParams {
  expenseId: string;
  amount: number;
  paymentDetails: {
    payment_method_code: string;
    payment_date: string;
    amount: number;
    notes?: string;
  };
  expensesTable?: 'expenses' | 'homeowner_expenses';
}

const processPaymentFn = async ({ expenseId, amount, paymentDetails, expensesTable = 'expenses' }: ProcessPaymentParams) => {
  const { payment_method_code, payment_date, notes } = paymentDetails;

  const { data, error } = await supabase.from(expensesTable).update({
    payment_status: 'paid',
  }).eq('id', expenseId);

  if (error) {
    console.error("Error updating expense payment status:", error);
    throw new Error("Failed to update expense payment status");
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    amount,
    payment_method_code,
    payment_date,
    notes,
    expense_id: expenseId,
    direction: 'outgoing',
    status: 'completed'
  });

  if (paymentError) {
    console.error("Error creating payment:", paymentError);
    throw new Error("Failed to create payment");
  }

  return data;
};

export function useExpenses(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error("Error fetching expenses:", error);
        throw error;
      }

      return data as Expense[];
    },
    enabled: !!projectId,
  });

  const paymentMutation = useMutation({
    mutationFn: processPaymentFn,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', projectId]);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process payment. Please try again.",
      });
    },
  });

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      const amount = Number(data.amount);
      const expenseDate = data.expense_date;

      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            ...data,
            amount: amount,
            expense_date: expenseDate,
            payment_status: status,
          },
        ]);

      if (error) {
        console.error("Error creating expense:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create expense. Please try again.",
        });
        return;
      }

      toast({
        title: "Expense created",
        description: "The expense has been created successfully.",
      });

      // If the status is 'paid', process the payment immediately
      if (status === 'paid' && paymentDetails) {
        // Cast to number to ensure it's handled correctly
        paymentDetails.amount = Number(paymentDetails.amount);

        // Get the newly created expense
        const { data: newExpense, error: newExpenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('project_id', projectId)
          .eq('name', data.name)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (newExpenseError) {
          console.error("Error fetching new expense:", newExpenseError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch new expense. Please try again.",
          });
          return;
        }

        // Using processPayment function directly instead of mutateAsync
        await paymentMutation.mutateAsync({
          expenseId: newExpense.id,
          amount: paymentDetails.amount,
          paymentDetails: {
            payment_method_code: paymentDetails.payment_method_code,
            payment_date: paymentDetails.payment_date,
            amount: paymentDetails.amount,
            notes: paymentDetails.notes
          },
          expensesTable: 'expenses'
        });
      }

      // Refetch expenses after creating a new expense
      refetchExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
    }
  };
  
  const processPayment = async (expense: Expense, paymentDetails: PaymentDetailsData) => {
    try {
      // Cast to number to ensure it's handled correctly
      const amount = Number(paymentDetails.amount);
      
      // Using processPayment function directly instead of mutateAsync
      await paymentMutation.mutateAsync({
        expenseId: expense.id,
        amount,
        paymentDetails: {
          payment_method_code: paymentDetails.payment_method_code,
          payment_date: paymentDetails.payment_date,
          amount: paymentDetails.amount,
          notes: paymentDetails.notes
        },
        expensesTable: 'expenses'
      });
      
      // Refetch expenses after payment processing
      refetchExpenses();
      
      toast({
        title: "Payment processed",
        description: "The payment has been processed successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process payment. Please try again.",
      });
      return false;
    }
  };
  
  // Replace isPending with isProcessing for consistency
  const isProcessingPayment = paymentMutation.isPending;

  return {
    expenses,
    isLoading,
    handleCreateExpense,
    processPayment,
    isProcessingPayment,
    error: paymentMutation.error,
  };
}
