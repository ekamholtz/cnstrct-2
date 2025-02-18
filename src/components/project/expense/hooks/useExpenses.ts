
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
        .select(`
          *,
          project:projects(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Expense & { project?: { name: string } })[];
    },
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data) => {
      // First get the contractor_id from the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('contractor_id')
        .eq('id', data.project_id)
        .single();

      if (projectError) throw projectError;

      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: data.project_id,
          contractor_id: project.contractor_id,
          name: data.name,
          amount: Number(data.amount),
          payee: data.payee,
          expense_date: data.expense_date,
          expense_type: data.expense_type,
          notes: data.notes,
          payment_status: 'due',
          payment_type: 'cash', // Setting a default payment_type
        });

      if (error) {
        console.error("Error creating expense:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
    },
  });

  return {
    expenses,
    isLoading,
    createExpense,
  };
}
