
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data, Expense, Payment } from "../types";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name),
          payments(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Expense & { project?: { name: string }, payments?: Payment[] })[];
    },
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data) => {
      // Get the contractor_id from the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('contractor_id')
        .eq('id', data.project_id)
        .single();

      if (projectError) throw projectError;

      const { data: expense, error } = await supabase
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
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating expense:", error);
        throw error;
      }

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
    },
  });

  const { mutateAsync: createPayment } = useMutation({
    mutationFn: async ({ 
      expenseId, 
      paymentData 
    }: { 
      expenseId: string, 
      paymentData: {
        payment_type: "cc" | "check" | "transfer" | "cash";
        payment_date: string;
        payment_amount: number;
        vendor_email?: string;
        vendor_phone?: string;
        simulation_data?: any;
      }
    }) => {
      const { error } = await supabase
        .from('payments')
        .insert({
          expense_id: expenseId,
          ...paymentData,
        });

      if (error) {
        console.error("Error creating payment:", error);
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
    createPayment,
  };
}
