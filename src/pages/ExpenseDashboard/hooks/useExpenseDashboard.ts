import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ExpenseFilters } from "../types";
import { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { useFetchExpenses } from "./useFetchExpenses";
import { 
  createHomeownerExpense, 
  createGCExpense, 
  createExpensePayment, 
  updateExpenseAfterPayment,
  generateExpenseNumber
} from "../services";
import { UseExpenseDashboardResult } from "./types/dashboardTypes";
import { makeMutationCompatible } from "@/utils/queryCompatibility";

export function useExpenseDashboard(): UseExpenseDashboardResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserProfile } = useCurrentUserProfile();
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateRange: undefined,
    status: "all",
    projectId: "all",
    expenseType: "all"
  });

  // Determine if the current user is a homeowner
  const isHomeowner = currentUserProfile?.role === 'homeowner';
  const expensesTable = isHomeowner ? 'homeowner_expenses' : 'expenses';

  // Use the extracted fetch hook
  const { data: expenses, isLoading } = useFetchExpenses(filters);

  const handleCreateExpense = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      console.log('Attempting to create expense with data:', data);
      console.log('User role:', currentUserProfile?.role);
      console.log('Using table:', expensesTable);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const expenseNumber = generateExpenseNumber();
      console.log('Creating expense with expense number:', expenseNumber);
      
      let expenseId: string;
      
      if (isHomeowner) {
        // Create homeowner expense
        const homeownerExpense = await createHomeownerExpense({
          data,
          status,
          userId: user.id,
          expenseNumber
        });
        expenseId = homeownerExpense.id;
      } else {
        // Create GC expense
        const gcExpense = await createGCExpense({
          data,
          status,
          expenseNumber
        });
        expenseId = gcExpense.id;
      }
      
      console.log('Created expense with ID:', expenseId);
      
      // If payment details are provided and the expense is paid, create payment record
      if (paymentDetails && (status === 'paid' || status === 'partially_paid')) {
        console.log('Creating payment record for expense:', expenseId);
        
        // Ensure all required fields are present in paymentDetails
        const validPaymentDetails = {
          payment_method_code: paymentDetails.payment_method_code || 'check',
          payment_date: paymentDetails.payment_date || new Date().toISOString().split('T')[0],
          amount: typeof paymentDetails.amount === 'number' ? paymentDetails.amount : parseFloat(paymentDetails.amount || '0'),
          notes: paymentDetails.notes
        };
        
        await createExpensePayment({
          expenseId,
          paymentDetails: validPaymentDetails,
          expensesTable
        });
      }
      
      // Refresh expenses list
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      toast({
        title: "Expense Created",
        description: "The expense has been successfully created.",
      });
      
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to create expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a payment for an expense
  const processPaymentMutation = useMutation({
    mutationFn: async ({
      expenseId,
      amount,
      paymentDetails,
      expensesTable = 'expenses'
    }: {
      expenseId: string;
      amount: number;
      paymentDetails: {
        payment_method_code: string;
        payment_date: string;
        amount: number;
        notes?: string;
      };
      expensesTable?: 'expenses' | 'homeowner_expenses';
    }) => {
      console.log('Processing payment:', { expenseId, amount, paymentDetails, expensesTable });
      
      // Create payment record
      const paymentId = await createExpensePayment({
        expenseId,
        paymentDetails,
        expensesTable
      });
      
      // Update expense record
      await updateExpenseAfterPayment(expenseId, amount, paymentDetails.amount, expensesTable);
      
      return paymentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Payment Processed",
        description: "The payment has been successfully processed.",
      });
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Use the compatibility wrapper to ensure isLoading is available
  const processPaymentMutationWithCompat = makeMutationCompatible(processPaymentMutation);

  return {
    filters,
    setFilters,
    expenses: Array.isArray(expenses) ? expenses : [],
    isLoading,
    handleCreateExpense,
    processPaymentMutation: processPaymentMutationWithCompat
  };
}
