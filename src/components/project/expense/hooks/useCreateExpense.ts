
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseFormStage1Data, Expense } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { generateExpenseNumber } from "../utils/expenseUtils";

export function useCreateExpense(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserProfile } = useCurrentUserProfile();

  return useMutation({
    mutationFn: async (data: ExpenseFormStage1Data) => {
      console.log('Creating expense with data:', data);
      console.log('Project ID from parameter:', projectId);
      console.log('Project ID from data:', data.project_id);
      console.log('User role:', currentUserProfile?.role);
      
      // Ensure we have a project_id - use the one from the data object if present, otherwise use the projectId prop
      const finalProjectId = data.project_id || projectId;
      
      if (!finalProjectId) {
        console.error('No project ID found for expense creation');
        throw new Error("Missing project ID. Cannot create expense without a project ID.");
      }
      
      console.log('Final project ID being used:', finalProjectId);
      
      // First get project info to get contractor_id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('contractor_id')
        .eq('id', finalProjectId)
        .single();

      if (projectError) {
        console.error('Error fetching project for expense creation:', projectError);
        throw projectError;
      }

      if (!project) {
        console.error('Project not found for ID:', finalProjectId);
        throw new Error("Project not found");
      }

      if (!project.contractor_id) {
        console.error('Project missing contractor_id:', project);
        throw new Error("Project is missing contractor_id");
      }

      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid expense amount:', data.amount);
        throw new Error("Invalid expense amount");
      }

      const newExpense = {
        name: data.name,
        amount,
        amount_due: amount,
        payee: data.payee,
        expense_date: data.expense_date,
        expense_type: data.expense_type,
        notes: data.notes || '',
        project_id: finalProjectId,
        contractor_id: project.contractor_id,
        payment_status: 'due' as const,
        expense_number: generateExpenseNumber()
      };

      console.log('Inserting expense with data:', newExpense);
      
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert(newExpense)
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        throw error;
      }
      
      console.log('Expense created successfully:', expense);
      return expense;
    },
    onSuccess: (data) => {
      console.log('Expense creation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating expense (in mutation):', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense. Please try again.",
      });
    }
  });
}
