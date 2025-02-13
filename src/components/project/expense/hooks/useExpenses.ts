
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseFormData, Expense } from "../types";
import { useEffect } from "react";

export function useExpenses(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['project-expenses', projectId],
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

  // Get the contractor_id from the project
  const getContractorId = async () => {
    const { data: project, error } = await supabase
      .from('projects')
      .select('contractor_id')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return project.contractor_id;
  };

  // Create expense mutation
  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const contractor_id = await getContractorId();
      
      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: projectId,
          contractor_id,
          name: data.name,
          payee: data.payee,
          amount: Number(data.amount),
          expense_date: data.expense_date,
          payment_type: data.payment_type,
          expense_type: data.expense_type,
          notes: data.notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      toast({
        title: "Success",
        description: "Expense has been created",
      });
    },
    onError: (error) => {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense. Please try again.",
      });
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return {
    expenses,
    isLoading,
    createExpense: (data: ExpenseFormData) => createExpense.mutate(data),
  };
}
