import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchExpenses } from "./useFetchExpenses";
import { useCreateExpense } from "./useCreateExpense";
import { useProcessPayment } from "./useProcessPayment";
import { validateExpenseData } from "../utils/expenseUtils";
import { ExpenseFormStage1Data, PaymentDetailsData, Expense } from "../types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to manage expenses for a specific project
 * @param projectId The ID of the project to manage expenses for
 * @returns Object containing expenses data, loading state, and functions to create expenses and payments
 */
export function useExpenses(projectId: string) {
  if (!projectId) {
    console.error("useExpenses called without a projectId");
    return {
      expenses: [],
      isLoading: false,
      createExpense: async () => { throw new Error("Project ID is required to create expenses"); },
      createPayment: async () => { throw new Error("Project ID is required to create payments"); },
      error: new Error("Project ID is required"),
    };
  }

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use the fetch expenses hook
  const { 
    data: expenses = [], 
    isLoading, 
    error: fetchError 
  } = useFetchExpenses(projectId);
  
  // Use the create expense mutation
  const { 
    mutateAsync: createExpenseMutation,
    isPending: isCreating,
    error: createError
  } = useCreateExpense(projectId);
  
  // Use the process payment mutation
  const {
    mutateAsync: processPaymentMutation,
    isPending: isProcessingPayment,
    error: paymentError
  } = useProcessPayment();

  // Combine all errors
  const combinedError = fetchError || createError || paymentError || null;

  /**
   * Validates and creates an expense
   * @param data The expense data to create
   * @returns The created expense
   */
  const validateAndCreateExpense = async (data: ExpenseFormStage1Data): Promise<Expense | null> => {
    try {
      console.log('Creating expense with data:', data);
      
      // Validate the expense data
      const validationError = validateExpenseData(data);
      if (validationError) {
        console.error('Expense validation failed:', validationError);
        throw new Error(`Expense validation failed: ${validationError}`);
      }
      
      // Ensure project_id is set
      const expenseData = {
        ...data,
        project_id: projectId,
      };
      
      // Create the expense
      const result = await createExpenseMutation(expenseData);
      
      if (!result) {
        console.error('Expense creation returned null result');
        throw new Error('Failed to create expense');
      }
      
      console.log('Expense created successfully:', result);
      
      // Invalidate queries to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      
      return result;
    } catch (error) {
      console.error('Error in validateAndCreateExpense:', error);
      
      // Show toast notification
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense",
      });
      
      throw error;
    }
  };

  /**
   * Creates a payment for an expense
   * @param params Parameters for creating a payment
   * @returns The created payment
   */
  const createPayment = async ({
    expenseId,
    amount,
    paymentDetails,
    expensesTable = 'expenses'
  }: {
    expenseId: string;
    amount: number;
    paymentDetails: PaymentDetailsData;
    expensesTable: string;
  }) => {
    try {
      if (!expenseId) {
        throw new Error("Expense ID is required to create a payment");
      }

      // Ensure payment amount is a valid number
      const paymentAmount = typeof paymentDetails.amount === 'string'
        ? parseFloat(paymentDetails.amount) || 0
        : (typeof paymentDetails.amount === 'number' ? paymentDetails.amount : 0);

      if (paymentAmount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }

      // Create the payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          expense_id: expenseId,
          amount: paymentAmount,
          payment_method_code: paymentDetails.payment_method_code || 'transfer',
          payment_date: paymentDetails.payment_date || new Date().toISOString().split('T')[0],
          notes: paymentDetails.notes || '',
          direction: 'outgoing'
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      if (!paymentData) {
        console.warn("No payment data returned after insertion");
        return null;
      }

      console.log("Payment created successfully:", paymentData);

      // Get the expense to update its payment status
      try {
        // Use a more specific type assertion and add proper null checks
        const { data: expenseData, error: expenseError } = await supabase
          .from(expensesTable as any)
          .select('amount, payments(amount)')
          .eq('id', expenseId)
          .single();

        if (expenseError) {
          console.error("Error fetching expense for payment status update:", expenseError);
          // Don't throw here, we've already created the payment
        } else if (expenseData) {
          // Use a type assertion for expenseData to avoid TypeScript errors
          const typedExpenseData = expenseData as { 
            amount?: number | string; 
            payments?: Array<{ amount?: number | string }> 
          };
          
          // Safely calculate total payments
          const expenseAmount = typeof typedExpenseData.amount === 'number' 
            ? typedExpenseData.amount 
            : (parseFloat(String(typedExpenseData.amount || 0)) || 0);
            
          let totalPayments = 0;
          
          // Ensure payments is an array and calculate total
          if (typedExpenseData.payments && Array.isArray(typedExpenseData.payments)) {
            totalPayments = typedExpenseData.payments.reduce((sum, payment) => {
              const paymentAmount = typeof payment?.amount === 'number'
                ? payment.amount
                : (parseFloat(String(payment?.amount || 0)) || 0);
              return sum + paymentAmount;
            }, 0);
          }
          
          // Add the new payment amount
          totalPayments += paymentAmount;
          
          // Determine payment status
          let paymentStatus: 'due' | 'partially_paid' | 'paid' = 'due';
          if (totalPayments >= expenseAmount) {
            paymentStatus = 'paid';
          } else if (totalPayments > 0) {
            paymentStatus = 'partially_paid';
          }
          
          // Update the expense payment status
          const { error: updateError } = await supabase
            .from(expensesTable as any)
            .update({
              payment_status: paymentStatus,
              amount_due: Math.max(0, expenseAmount - totalPayments)
            })
            .eq('id', expenseId);
            
          if (updateError) {
            console.error("Error updating expense payment status:", updateError);
            // Don't throw here, we've already created the payment
          }
        }
      } catch (err) {
        console.error("Error processing expense payment status update:", err);
        // Continue execution as we've already created the payment
      }

      // Invalidate queries to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      return paymentData;
    } catch (error) {
      console.error("Error in createPayment:", error);
      
      // Show toast notification
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment",
      });
      
      throw error;
    }
  };

  // Return the hook result
  return {
    expenses: Array.isArray(expenses) ? expenses : [],
    isLoading: isLoading || isCreating || isProcessingPayment,
    createExpense: validateAndCreateExpense,
    createPayment,
    error: combinedError,
  };
}
