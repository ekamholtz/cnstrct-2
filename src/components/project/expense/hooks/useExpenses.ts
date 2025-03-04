
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseFormStage1Data, Expense, PaymentDetailsData } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createPayment } from "@/services/projectService";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserProfile } = useCurrentUserProfile();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      console.log('Fetching expenses for project:', projectId);
      console.log('User role:', currentUserProfile?.role);
      
      // Always query the expenses table (not homeowner_expenses) for project details page
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name),
          payments(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
      
      console.log('Fetched expenses:', data);
      return data as Expense[];
    },
    enabled: !!projectId && !!currentUserProfile,
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data & { payment_status?: 'due' | 'paid' | 'partially_paid' }) => {
      console.log('Creating expense with data:', data);
      console.log('Project ID:', projectId);
      console.log('User role:', currentUserProfile?.role);
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('contractor_id')
        .eq('id', data.project_id)
        .single();

      if (projectError) {
        console.error('Error fetching project for expense creation:', projectError);
        throw projectError;
      }

      if (!project) {
        throw new Error("Project not found");
      }

      if (!project.contractor_id) {
        throw new Error("Project is missing contractor_id");
      }

      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid expense amount");
      }

      const newExpense = {
        name: data.name,
        amount,
        amount_due: amount,
        payee: data.payee,
        expense_date: data.expense_date,
        expense_type: data.expense_type,
        notes: data.notes || '',
        project_id: data.project_id,
        contractor_id: project.contractor_id,
        payment_status: data.payment_status || 'due',
        expense_number: `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase()
      };

      console.log('Inserting expense into expenses table:', newExpense);
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert(newExpense)
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        throw error;
      }
      
      console.log('Expense created successfully:', expense);
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating expense (in mutation):', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense. Please try again.",
      });
    }
  });

  const { mutateAsync: processPayment } = useMutation({
    mutationFn: async ({ expenseId, paymentData }: { expenseId: string; paymentData: PaymentDetailsData }) => {
      console.log('Processing payment for expense:', expenseId, paymentData);
      
      try {
        // Create the payment record using the service function
        const payment = await createPayment({
          expense_id: expenseId,
          payment_method_code: paymentData.payment_method_code,
          payment_date: new Date(paymentData.payment_date).toISOString(),
          amount: Number(paymentData.amount),
          notes: paymentData.notes || '',
          direction: 'outgoing',
          status: 'completed'
        });
        
        console.log('Payment created:', payment);

        // Update the expense status and amount_due
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('amount, amount_due')
          .eq('id', expenseId)
          .single();

        if (expenseError) {
          console.error('Error fetching expense for payment update:', expenseError);
          throw expenseError;
        }

        const newAmountDue = expense.amount_due - Number(paymentData.amount);
        const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;

        const { data: updatedExpense, error: updateError } = await supabase
          .from('expenses')
          .update({
            payment_status: newStatus,
            amount_due: Math.max(0, newAmountDue)
          })
          .eq('id', expenseId)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating expense after payment:', updateError);
          throw updateError;
        }
        
        console.log('Expense updated after payment:', updatedExpense);

        return payment;
      } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    },
    onError: (error) => {
      console.error('Error processing payment (in mutation):', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
      });
    }
  });

  return {
    expenses,
    isLoading,
    createExpense,
    createPayment: processPayment,
  };
}
