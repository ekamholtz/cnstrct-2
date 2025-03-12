
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseFormStage1Data, PaymentDetailsData, Expense } from "../types";

// Define a more specific type for the expense object from the database
interface ExpenseWithPayments extends Expense {
  payments?: any[];
}

export function useExpenses(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          payments (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }

      // Transform data to match Expense type
      return (data || []).map(expense => ({
        ...expense,
        // Ensure amount is a number
        amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount,
        // Ensure amount_due is a number or undefined
        amount_due: expense.amount_due !== undefined ? 
          (typeof expense.amount_due === 'string' ? parseFloat(expense.amount_due) : expense.amount_due) : 
          undefined
      })) as ExpenseWithPayments[];
    },
    enabled: !!projectId,
  });

  // Create expense mutation
  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data) => {
      try {
        // Convert amount to number
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
        
        // Create expense
        const { data: newExpense, error } = await supabase
          .from('expenses')
          .insert({
            name: data.name,
            payee: data.payee,
            amount: amount,
            expense_date: data.expense_date,
            expense_type: data.expense_type,
            notes: data.notes || '',
            project_id: data.project_id,
            payment_status: 'due',
          })
          .select()
          .single();

        if (error) throw error;
        return newExpense;
      } catch (err) {
        console.error('Error creating expense:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense",
      });
    },
  });

  // Process payment mutation
  const { mutate: processPayment, isLoading: isProcessingPayment } = useMutation({
    mutationFn: async ({
      expenseId,
      amount,
      paymentDetails,
    }: {
      expenseId: string;
      amount: number;
      paymentDetails: PaymentDetailsData;
    }) => {
      try {
        // Convert payment amount to number if it's a string
        const paymentAmount = typeof paymentDetails.amount === 'string' 
          ? parseFloat(paymentDetails.amount) 
          : paymentDetails.amount;
        
        // Create payment
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            expense_id: expenseId,
            amount: paymentAmount,
            payment_method_code: paymentDetails.payment_method_code,
            payment_date: paymentDetails.payment_date,
            notes: paymentDetails.notes || '',
            direction: 'outgoing',
            status: 'completed',
            payment_reference: `EXP-${expenseId.slice(-5)}`,
            simulation_mode: false
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Get the current expense to update amount_due
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('amount, amount_due')
          .eq('id', expenseId)
          .single();

        if (expenseError) throw expenseError;

        // Calculate new amount due
        const currentAmount = typeof expense.amount === 'string' 
          ? parseFloat(expense.amount) 
          : expense.amount;
          
        const currentAmountDue = expense.amount_due !== undefined 
          ? (typeof expense.amount_due === 'string' 
              ? parseFloat(expense.amount_due) 
              : expense.amount_due) 
          : currentAmount;
          
        const newAmountDue = Math.max(0, currentAmountDue - paymentAmount);

        // Update expense with new amount_due and payment_status
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            amount_due: newAmountDue,
            payment_status: newAmountDue <= 0 ? 'paid' : 'partially_paid'
          })
          .eq('id', expenseId);

        if (updateError) throw updateError;

        return payment;
      } catch (err) {
        console.error('Error processing payment:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
      });
    },
  });

  return {
    expenses,
    isLoading,
    createExpense,
    processPayment,
    isProcessingPayment
  };
}
