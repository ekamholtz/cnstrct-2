import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HomeownerExpense, HomeownerExpenseFormFields, PaymentDetailsData } from "../types";

export function useHomeownerExpenses(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['homeowner-expenses', projectId],
    queryFn: async () => {
      if (!projectId) {
        console.warn("Missing projectId for homeowner expenses");
        return [];
      }

      console.log('Fetching homeowner expenses for project:', projectId);
      
      try {
        // Use REST API instead of Supabase client to avoid TypeScript errors with unrecognized tables
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses?project_id=eq.${projectId}&order=created_at.desc`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error fetching homeowner expenses via REST API:', response.statusText);
          return [];
        }
        
        const data = await response.json();
        console.log('Homeowner expenses fetched successfully:', data?.length || 0, 'items');
        
        return data as (HomeownerExpense & { project: { name: string } })[];
      } catch (error) {
        console.error('Error in homeowner expenses query:', error);
        return [];
      }
    },
    enabled: !!projectId,
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
        payment_status: 'due' as const,
        expense_number: '' // This will be overwritten by the trigger, but we need to satisfy TS
      };

      // Use REST API for consistent approach
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newExpense)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error creating expense: ${errorText}`);
      }

      const expense = await response.json();
      return expense[0]; // Return the first item as the API returns an array
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
      // First, get the current expense using REST API
      const getResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses?id=eq.${expenseId}`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        throw new Error(`Error fetching expense: ${getResponse.statusText}`);
      }

      const expenses = await getResponse.json();
      if (!expenses || expenses.length === 0) {
        throw new Error('Expense not found');
      }
      
      const expense = expenses[0];
      const newAmountDue = expense.amount_due - paymentData.amount;
      const newStatus = newAmountDue <= 0 ? 'paid' as const : 'partially_paid' as const;

      // Update the expense using REST API
      const updateResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/homeowner_expenses?id=eq.${expenseId}`, {
        method: 'PATCH',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          payment_status: newStatus,
          amount_due: Math.max(0, newAmountDue)
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Error updating expense payment status: ${errorText}`);
      }

      const updatedExpense = await updateResponse.json();
      return updatedExpense[0]; // Return the first item as the API returns an array
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
