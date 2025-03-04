import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseFormStage1Data, Expense, PaymentDetailsData } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useExpenses(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      return data as Expense[];
    },
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data & { payment_status: 'due' | 'paid' | 'partially_paid' }) => {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('contractor_id')
        .eq('id', data.project_id)
        .single();

      if (projectError) throw projectError;

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
        contractor_id: project.contractor_id,
        payment_status: data.payment_status
      };

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([newExpense])
        .select()
        .single();

      if (error) throw error;
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
  });

  const { mutateAsync: createPayment } = useMutation({
    mutationFn: async ({ expenseId, paymentData }: { expenseId: string; paymentData: PaymentDetailsData }) => {
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('id', expenseId)
        .single();

      if (expenseError) throw expenseError;

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          direction: 'outgoing',
          expense_id: expenseId,
          payment_method_code: paymentData.payment_method_code,
          payment_date: paymentData.payment_date,
          amount: Number(paymentData.amount),
          notes: paymentData.notes,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
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
    createPayment,
  };
}
