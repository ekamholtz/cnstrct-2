
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ExpenseFormStage1Data, PaymentDetailsData } from "@/components/project/expense/types";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { createHomeownerExpense, createGCExpense, createExpensePayment, updateExpenseAfterPayment, generateExpenseNumber } from "../services";
import { CreateExpenseFunction } from "./types";

export function useCreateExpenseDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserProfile } = useCurrentUserProfile();

  const handleCreateExpense: CreateExpenseFunction = async (
    data: ExpenseFormStage1Data,
    status: 'due' | 'paid' | 'partially_paid',
    paymentDetails?: PaymentDetailsData
  ): Promise<void> => {
    try {
      console.log('Attempting to create expense with data:', data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const expenseNumber = generateExpenseNumber();
      console.log('Creating expense with expense number:', expenseNumber);
      
      let newExpense;
      const isHomeowner = currentUserProfile?.role === 'homeowner';
      
      if (isHomeowner) {
        newExpense = await createHomeownerExpense({
          data,
          status,
          userId: user.id,
          expenseNumber
        });
      } else {
        newExpense = await createGCExpense({
          data,
          status,
          expenseNumber
        });
      }

      if (paymentDetails && newExpense) {
        const payment = await createExpensePayment({
          expenseId: newExpense.id,
          paymentDetails: {
            ...paymentDetails,
            payment_method_code: paymentDetails.payment_method_code,
            payment_date: paymentDetails.payment_date,
            amount: Number(paymentDetails.amount),
          },
          expensesTable: isHomeowner ? 'homeowner_expenses' : 'expenses'
        });
        
        await updateExpenseAfterPayment(
          newExpense.id,
          newExpense.amount,
          Number(paymentDetails.amount),
          isHomeowner ? 'homeowner_expenses' : 'expenses'
        );
      }

      Promise.all([
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

  return { handleCreateExpense };
}
