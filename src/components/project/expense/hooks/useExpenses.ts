
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseFormStage1Data, Expense, PaymentDetailsData } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createPayment } from "@/services/projectService";

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

  const { mutateAsync: processPayment } = useMutation({
    mutationFn: async ({ expenseId, paymentData }: { expenseId: string; paymentData: PaymentDetailsData }) => {
      console.log('Processing payment for expense:', expenseId, paymentData);
      
      // Create the payment record using the service function
      const payment = await createPayment({
        expense_id: expenseId,
        payment_method_code: paymentData.payment_method_code,
        payment_date: new Date(paymentData.payment_date).toISOString(),
        amount: Number(paymentData.amount),
        notes: paymentData.notes,
        direction: 'outgoing',
        status: 'completed'
      });

      // Update the expense status and amount_due
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, amount_due')
        .eq('id', expenseId)
        .single();

      if (expenseError) throw expenseError;

      const newAmountDue = expense.amount_due - Number(paymentData.amount);
      const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;

      await supabase
        .from('expenses')
        .update({
          payment_status: newStatus,
          amount_due: Math.max(0, newAmountDue)
        })
        .eq('id', expenseId);

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
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
    createPayment: processPayment,
  };
}
