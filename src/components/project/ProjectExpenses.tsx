import React, { useState } from "react";
import { ExpenseForm } from "./expense/ExpenseForm";
import { ExpenseList } from "./expense/ExpenseList";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseFormStage1Data, PaymentDetailsData, Expense, DatabaseExpense } from "./expense/types";
import type { Payment, PaymentDirection } from "@/components/payments/types";

interface ProjectExpensesProps {
  projectId: string;
  expenses?: DatabaseExpense[];
}

// Fallback UI for errors
const ErrorDisplay = ({ error, resetError }: { error: Error | null, resetError: () => void }) => (
  <Alert variant="destructive" className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Something went wrong</AlertTitle>
    <AlertDescription>
      {error?.message || "An unexpected error occurred while loading expenses."}
    </AlertDescription>
    <div className="mt-4">
      <Button variant="outline" onClick={resetError}>
        Try Again
      </Button>
    </div>
  </Alert>
);

export function ProjectExpenses({ projectId, expenses = [] }: ProjectExpensesProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Ensure expenses is always a valid array
  const safeExpenses = React.useMemo(() => {
    try {
      return Array.isArray(expenses) ? expenses.filter(Boolean) : [];
    } catch (e) {
      console.error("Error processing expenses array:", e);
      return [];
    }
  }, [expenses]);

  // Reset error state
  const resetError = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
  };

  // Function to create an expense with optional payment
  const handleExpenseSubmit = async (
    data: ExpenseFormStage1Data, 
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Ensure project_id is set and convert amount to number
      const expenseData = {
        project_id: projectId,
        name: data.name,
        payee: data.payee,
        amount: parseFloat(data.amount),
        expense_date: data.expense_date,
        expense_type: data.expense_type,
        notes: data.notes,
        payment_status: status
      };
      
      // Create the expense
      const { data: newExpense, error: createError } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create expense: ${createError.message}`);
      }
      
      if (!newExpense) {
        throw new Error("Failed to create expense - no data returned");
      }
      
      // If payment details are provided and status is not 'due', create a payment
      if (paymentDetails && status !== 'due' && newExpense.id) {
        try {
          await createPayment(newExpense.id, paymentDetails);
        } catch (paymentError) {
          console.error("Payment creation failed but expense was created:", paymentError);
          toast({
            variant: "destructive", // Using "destructive" instead of "warning"
            title: "Partial Success",
            description: "Expense created but payment failed. You can add a payment later.",
          });
        }
      }
      
      // Invalidate queries to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? `Failed to create expense: ${error.message}` 
          : "Failed to create expense. Please try again.",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Simple function to create a payment directly with Supabase
  const createPayment = async (expenseId: string, paymentDetails: PaymentDetailsData) => {
    try {
      setIsLoading(true);
      
      if (!expenseId) {
        throw new Error("Expense ID is required to create a payment");
      }
      
      // Ensure payment amount is a number
      const paymentAmount = typeof paymentDetails.amount === 'string'
        ? parseFloat(paymentDetails.amount) || 0
        : (typeof paymentDetails.amount === 'number' ? paymentDetails.amount : 0);
      
      if (paymentAmount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }
      
      // Create the payment with required fields for the database schema
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          expense_id: expenseId,
          amount: paymentAmount,
          payment_method_code: paymentDetails.payment_method_code || 'transfer',
          payment_date: paymentDetails.payment_date || new Date().toISOString().split('T')[0],
          notes: paymentDetails.notes || '',
          direction: 'outgoing' as PaymentDirection, // Required field
          status: 'completed', // Required field
          simulation_mode: false, // Required field
          payment_reference: `EXP-${expenseId.slice(-5)}` // Add the required payment_reference field
        })
        .select()
        .single();
      
      if (paymentError) {
        console.error('Error creating payment:', JSON.stringify(paymentError));
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }
      
      if (!newPayment) {
        console.error('No payment data returned after insertion');
        throw new Error("Failed to create payment - no data returned");
      }
      
      // Update the expense payment status
      const { data: expenseData, error: fetchError } = await supabase
        .from('expenses')
        .select('amount, payments(amount)')
        .eq('id', expenseId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching expense data:', JSON.stringify(fetchError));
        // Don't throw here, we still created the payment successfully
      } else if (expenseData) {
        // Safely convert expense amount to number
        const expenseAmount = typeof expenseData.amount === 'number'
          ? expenseData.amount
          : parseFloat(String(expenseData.amount)) || 0;
        
        let totalPayments = paymentAmount;
        
        // Add any existing payments
        if (expenseData.payments && Array.isArray(expenseData.payments)) {
          totalPayments += expenseData.payments.reduce((sum, payment) => {
            // Safely convert payment amount to number
            const amt = typeof payment.amount === 'number'
              ? payment.amount
              : parseFloat(String(payment.amount)) || 0;
            return sum + amt;
          }, 0);
        }
        
        // Determine if fully or partially paid
        const paymentStatus = totalPayments >= expenseAmount ? 'paid' : 'partially_paid';
        
        // Update the expense
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            payment_status: paymentStatus,
            amount_due: Math.max(0, expenseAmount - totalPayments)
          })
          .eq('id', expenseId);
          
        if (updateError) {
          console.error('Error updating expense status:', JSON.stringify(updateError));
          // Don't throw here, we still created the payment successfully
        }
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      toast({
        title: "Success",
        description: "Payment created successfully",
      });
      
      return newPayment as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? `Failed to create payment: ${error.message}` 
          : "Failed to create payment. Please try again.",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Convert DatabaseExpense[] to Expense[] for the ExpenseList component
  const expensesForList: Expense[] = safeExpenses.map(expense => ({
    id: expense.id,
    project_id: expense.project_id || projectId,
    name: expense.name || '',
    payee: expense.payee || '',
    amount: typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount)) || 0,
    amount_due: expense.amount_due,
    expense_date: expense.expense_date || '',
    expense_type: expense.expense_type as "labor" | "materials" | "subcontractor" | "other" | undefined,
    payment_status: expense.payment_status as "due" | "partially_paid" | "paid" | undefined,
    expense_number: expense.expense_number,
    notes: expense.notes,
    created_at: expense.created_at,
    updated_at: expense.updated_at,
    payments: expense.payments,
    project: expense.project
  }));

  return (
    <div className="space-y-6">
      {error && <ErrorDisplay error={error} resetError={resetError} />}
      
      <ExpenseForm 
        onSubmit={handleExpenseSubmit}
        defaultProjectId={projectId}
      />
      
      <ExpenseList 
        expenses={expensesForList}
        loading={isLoading}
      />
    </div>
  );
}
