
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data, Expense } from "../types";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data) => {
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            project_id: data.project_id,
            name: data.name,
            amount: Number(data.amount),
            payee: data.payee,
            expense_date: data.expense_date,
            expense_type: data.expense_type,
            notes: data.notes,
            payment_status: 'due',
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', projectId]);
    },
  });

  return {
    expenses,
    isLoading,
    createExpense,
  };
}
