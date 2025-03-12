
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseFormStage1Data, PaymentDetailsData, Expense, DatabaseExpense } from "../types";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);

  // Fetch expenses for the given project
  const { data: expensesData = [], isLoading } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            payments(*)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as DatabaseExpense[];
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        return [];
      }
    },
    enabled: !!projectId,
  });

  // Transform database expenses to the Expense type
  const expenses: Expense[] = expensesData.map(expense => ({
    id: expense.id,
    project_id: expense.project_id || '',
    name: expense.name || '',
    payee: expense.payee || '',
    amount: typeof expense.amount === 'number' ? expense.amount : 
           parseFloat(String(expense.amount)) || 0,
    amount_due: typeof expense.amount_due === 'number' ? expense.amount_due :
               parseFloat(String(expense.amount_due)) || 0,
    expense_date: expense.expense_date || '',
    expense_type: expense.expense_type as "labor" | "materials" | "subcontractor" | "other" | undefined,
    payment_status: expense.payment_status as "due" | "partially_paid" | "paid" | undefined,
    notes: expense.notes,
    created_at: expense.created_at,
    updated_at: expense.updated_at,
    payments: expense.payments,
    project: expense.project
  }));

  // Create a new expense
  const createExpenseMutation = useMutation({
    mutationFn: async ({ 
      data, 
      status 
    }: { 
      data: ExpenseFormStage1Data; 
      status: 'due' | 'paid' | 'partially_paid';
    }) => {
      try {
        // Parse amount to ensure it's a number
        const amount = parseFloat(data.amount);
        
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Amount must be a positive number");
        }

        const expenseData = {
          project_id: data.project_id,
          name: data.name,
          payee: data.payee,
          amount,
          expense_date: data.expense_date,
          expense_type: data.expense_type,
          notes: data.notes || '',
          payment_status: status
        };

        const { data: newExpense, error } = await supabase
          .from('expenses')
          .insert(expenseData)
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
    }
  });

  // Process payment for an expense
  const processPaymentMutation = useMutation({
    mutationFn: async ({ 
      expenseId, 
      amount, 
      paymentDetails,
      expensesTable = 'expenses'
    }: { 
      expenseId: string; 
      amount: number; 
      paymentDetails: PaymentDetailsData;
      expensesTable?: 'expenses' | 'homeowner_expenses';
    }) => {
      try {
        if (!expenseId) {
          throw new Error("Expense ID is required to process payment");
        }

        // Ensure payment amount is a number
        const paymentAmount = typeof paymentDetails.amount === 'string'
          ? parseFloat(paymentDetails.amount) || 0
          : paymentDetails.amount;

        if (paymentAmount <= 0) {
          throw new Error("Payment amount must be greater than zero");
        }

        // Create the payment with required fields
        const { data: newPayment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            expense_id: expenseId,
            amount: paymentAmount,
            payment_method_code: paymentDetails.payment_method_code || 'transfer',
            payment_date: paymentDetails.payment_date || new Date().toISOString().split('T')[0],
            notes: paymentDetails.notes || '',
            direction: 'outgoing',
            status: 'completed',
            simulation_mode: false,
            payment_reference: `EXP-${expenseId.slice(-5)}`
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Update the expense payment status
        const { data: expenseData, error: fetchError } = await supabase
          .from(expensesTable)
          .select('amount, amount_due')
          .eq('id', expenseId)
          .single();

        if (fetchError) throw fetchError;

        // Calculate new amount due
        const expenseAmount = typeof expenseData.amount === 'number' 
          ? expenseData.amount 
          : parseFloat(String(expenseData.amount)) || 0;
        
        const currentAmountDue = typeof expenseData.amount_due === 'number' 
          ? expenseData.amount_due 
          : parseFloat(String(expenseData.amount_due)) || 0;
          
        const newAmountDue = Math.max(0, currentAmountDue - paymentAmount);
        
        // Determine status
        const paymentStatus = newAmountDue <= 0 ? 'paid' : 'partially_paid';

        // Update the expense
        const { error: updateError } = await supabase
          .from(expensesTable)
          .update({
            payment_status: paymentStatus,
            amount_due: newAmountDue
          })
          .eq('id', expenseId);

        if (updateError) throw updateError;

        return { expense: { id: expenseId, payment_status: paymentStatus }, payment: newPayment };
      } catch (err) {
        console.error('Error processing payment:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
    }
  });

  // Wrapper function that handles both expense creation and optional payment
  const handleCreateExpense = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ) => {
    try {
      // First create the expense
      const expense = await createExpenseMutation.mutateAsync({ data, status });
      
      // If payment details are provided and status is not 'due', process the payment
      if (paymentDetails && status !== 'due' && expense?.id) {
        await processPaymentMutation.mutateAsync({
          expenseId: expense.id,
          amount: parseFloat(data.amount),
          paymentDetails
        });
      }
      
      return expense;
    } catch (error) {
      console.error('Error in handleCreateExpense:', error);
      throw error;
    }
  };

  return {
    expenses,
    isLoading: isLoading || createExpenseMutation.isPending || processPaymentMutation.isPending,
    handleCreateExpense,
    processPayment: processPaymentMutation.mutate,
    isProcessingPayment: processPaymentMutation.isPending,
    error: error || createExpenseMutation.error || processPaymentMutation.error
  };
}
