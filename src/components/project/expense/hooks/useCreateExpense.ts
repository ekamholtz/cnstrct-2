
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseFormStage1Data, Expense } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { generateExpenseNumber } from "../utils/expenseUtils";
import { isProjectManagerForProject, getProjectWithPMDetails } from "@/services/projectService";

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
      console.log('User ID:', currentUserProfile?.id);
      console.log('User GC account ID:', currentUserProfile?.gc_account_id);
      
      // Ensure we have a project_id - use the one from the data object if present, otherwise use the projectId prop
      const finalProjectId = data.project_id || projectId;
      
      if (!finalProjectId) {
        console.error('No project ID found for expense creation');
        throw new Error("Missing project ID. Cannot create expense without a project ID.");
      }
      
      if (!currentUserProfile) {
        console.error('No user profile found for expense creation');
        throw new Error("Unable to create expense: User not authenticated or profile not found.");
      }
      
      console.log('Final project ID being used:', finalProjectId);
      
      // First get project info to get gc_account_id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('gc_account_id, pm_user_id')
        .eq('id', finalProjectId)
        .single();

      if (projectError) {
        console.error('Error fetching project for expense creation:', projectError);
        throw new Error(`Error fetching project: ${projectError.message}`);
      }

      if (!project) {
        console.error('Project not found for ID:', finalProjectId);
        throw new Error("Project not found");
      }

      console.log('Project details:', project);
      
      // Check if user is the PM for this project
      const isPM = currentUserProfile.id === project.pm_user_id;
      console.log('Is user the PM for this project?', isPM ? 'Yes' : 'No');
      console.log('Project PM user ID:', project.pm_user_id);
      
      // Validate user permission for expense creation
      const isGcAdmin = currentUserProfile.role === 'gc_admin' && currentUserProfile.gc_account_id === project.gc_account_id;
      const isPlatformAdmin = currentUserProfile.role === 'platform_admin';
      
      // Allow project managers to create expenses for their projects
      if (!isPM && !isGcAdmin && !isPlatformAdmin) {
        console.error('Permission denied: User cannot create expenses for this project');
        console.error('Authorization details:', {
          userRole: currentUserProfile.role,
          userGcAccountId: currentUserProfile.gc_account_id,
          projectGcAccountId: project.gc_account_id,
          isPM,
          pmUserId: project.pm_user_id,
          userId: currentUserProfile.id
        });
        throw new Error("You don't have permission to create expenses for this project.");
      }
      
      console.log('Authorization checks passed:', {
        isPlatformAdmin,
        isGcAdmin,
        isPM,
        userRole: currentUserProfile.role,
        userGcAccountId: currentUserProfile.gc_account_id,
        projectGcAccountId: project.gc_account_id
      });

      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid expense amount:', data.amount);
        throw new Error("Invalid expense amount");
      }

      // Generate a unique expense number
      const expenseNumber = generateExpenseNumber();

      const newExpense = {
        name: data.name,
        amount,
        amount_due: amount,
        payee: data.payee,
        expense_date: data.expense_date,
        expense_type: data.expense_type,
        notes: data.notes || '',
        project_id: finalProjectId,
        payment_status: 'due' as const,
        expense_number: expenseNumber,
        gc_account_id: project.gc_account_id
      };

      console.log('Inserting expense with data:', newExpense);
      
      try {
        console.log('About to insert expense with project_id:', finalProjectId);
        console.log('Expense will be associated with gc_account_id:', project.gc_account_id);
        
        // Insert the expense with gc_account_id
        const { data: expense, error } = await supabase
          .from('expenses')
          .insert(newExpense)
          .select()
          .single();

        if (error) {
          console.error('Error creating expense:', error);
          
          // Additional context for RLS policy errors
          if (error.code === '42501') {
            console.error('Row-level security policy violation. Check if user has proper permissions:', {
              userRole: currentUserProfile.role,
              userId: currentUserProfile.id,
              projectId: finalProjectId,
              isPM,
              pmUserId: project.pm_user_id,
              gcAccountId: currentUserProfile.gc_account_id,
              projectGcAccountId: project.gc_account_id
            });
            throw new Error("Permission denied: You don't have access to create expenses for this project. Make sure you're logged in with the correct account that has permission to manage this project.");
          }
          
          throw new Error(`Failed to create expense: ${error.message}`);
        }
        
        console.log('Expense created successfully:', expense);
        return expense;
      } catch (error) {
        console.error('Exception during expense creation:', error);
        throw error;
      }
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
