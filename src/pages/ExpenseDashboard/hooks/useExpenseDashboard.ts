
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
      
      let newExpense;
      
      if (isHomeowner) {
        // Homeowner flow - save to homeowner_expenses
        newExpense = await createHomeownerExpense({
          data,
          status,
          userId: user.id,
          expenseNumber
        });
      } else {
        // GC or Project Manager flow - save to expenses
        newExpense = await createGCExpense({
          data,
          status,
          expenseNumber
        });
      }

      // If payment details are provided, create a payment
      if (paymentDetails && newExpense) {
        const payment = await createExpensePayment({
          expenseId: newExpense.id,
          paymentDetails,
          expensesTable
        });
        
        // Update expense amount_due and status based on payment
        await updateExpenseAfterPayment(
          newExpense.id,
          newExpense.amount,
          parseFloat(paymentDetails.amount),
          expensesTable
        );
      }

      // Invalidate both the expenses list and the project-specific queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['project', data.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['homeowner-expenses', data.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['expenses', data.project_id] })
      ]);

      toast({
        title: "Success",
        description: "Expense created successfully" + (paymentDetails ? " with payment" : ""),
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense. Please try again.",
      });
      throw error;
    }
  };

  return {
    filters,
    setFilters,
    expenses,
    isLoading,
    handleCreateExpense,
  };
}
