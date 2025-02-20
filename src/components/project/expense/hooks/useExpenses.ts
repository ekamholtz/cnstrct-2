
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
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('contractor_id')
        .eq('id', data.project_id)
        .single();

      if (projectError) throw projectError;

      const amount = Number(data.amount);

      // Define the type of the expense data explicitly
      type ExpenseInsert = {
        name: string;
        amount: number;
        amount_due: number;
        payee: string;
        expense_date: string;
        expense_type: "labor" | "materials" | "subcontractor" | "other";
        notes: string;
        project_id: string;
        contractor_id: string;
        payment_status: 'due' | 'paid' | 'partially_paid';
      };

      // Create the expense data object with the correct type
      const expenseData: ExpenseInsert = {
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

      // Insert the expense data as an array with a single object
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([expenseData])
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
          vendor_email: paymentData.vendor_email || null,
          vendor_phone: paymentData.vendor_phone || null
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
