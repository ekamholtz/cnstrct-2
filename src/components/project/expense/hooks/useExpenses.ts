
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormStage1Data, Expense, Payment, PaymentDetailsData } from "../types";
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
      return data as (Expense & { project?: { name: string }, payments: Payment[] })[];
    },
  });

  const { mutateAsync: createExpense } = useMutation({
    mutationFn: async (data: ExpenseFormStage1Data & { payment_status: 'due' | 'paid' | 'partially_paid' }) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          name: data.name,
          amount: Number(data.amount),
          amount_due: Number(data.amount),
          payee: data.payee,
          expense_date: data.expense_date,
          expense_type: data.expense_type,
          notes: data.notes,
          project_id: data.project_id,
          payment_status: data.payment_status
        })
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
    mutationFn: async ({ 
      expenseId, 
      paymentData 
    }: { 
      expenseId: string;
      paymentData: PaymentDetailsData;
    }) => {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          expense_id: expenseId,
          payment_type: paymentData.payment_type,
          payment_date: paymentData.payment_date,
          payment_amount: Number(paymentData.payment_amount),
          vendor_email: paymentData.vendor_email,
          vendor_phone: paymentData.vendor_phone
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

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
