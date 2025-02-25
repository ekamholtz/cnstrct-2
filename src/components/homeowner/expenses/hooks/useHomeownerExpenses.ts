
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HomeownerExpense, HomeownerExpenseFormFields, PaymentDetailsData } from "../types";

export function useHomeownerExpenses(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      const query = supabase
        .from('homeowner_expenses')
        .select(`
          *,
          project:projects(name)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching homeowner expenses:', error);
        throw error;
      }

      return data as (HomeownerExpense & { project: { name: string } })[];
    },
    enabled: true,
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: HomeownerExpenseFormFields) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('No authenticated user');

      const amount = Number(data.amount);
      const newExpense = {
        name: data.name,
        amount,
        amount_due: amount,
        payee: data.payee,
        expense_date: data.expense_date,
        expense_type: data.expense_type,
        notes: data.notes || '',
        project_id: data.project_id,
        homeowner_id: session.session.user.id,
        payment_status: 'due' as const
      };

      const { data: expense, error } = await supabase
        .from('homeowner_expenses')
        .insert([newExpense])
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeowner-expenses'] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
  });

  const { mutateAsync: updatePaymentStatus } = useMutation({
    mutationFn: async ({ 
      expenseId, 
      paymentData 
    }: { 
      expenseId: string; 
      paymentData: PaymentDetailsData 
    }) => {
      const { data: expense, error: expenseError } = await supabase
        .from('homeowner_expenses')
        .select('amount, amount_due')
        .eq('id', expenseId)
        .single();

      if (expenseError) throw expenseError;

      const newAmountDue = expense.amount_due - paymentData.amount;
      const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;

      const { data: updatedExpense, error } = await supabase
        .from('homeowner_expenses')
        .update({
          payment_status: newStatus,
          amount_due: Math.max(0, newAmountDue)
        })
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;
      return updatedExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeowner-expenses'] });
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
    },
  });

  return {
    expenses,
    isLoading,
    createExpense,
    updatePaymentStatus,
  };
}
