import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useUpdateProjectPM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      pmUserId 
    }: { 
      projectId: string; 
      pmUserId: string | null;
    }) => {
      try {
        console.log(`Updating project ${projectId} PM to ${pmUserId || 'none'}`);
        
        const { data, error } = await supabase
          .from('projects')
          .update({ pm_user_id: pmUserId })
          .eq('id', projectId)
          .select()
          .single();

        if (error) {
          console.error("Error updating project PM:", error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error("Error in useUpdateProjectPM:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate the project query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      
      toast({
        title: "Project Manager Updated",
        description: "The project manager has been successfully updated.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      
      toast({
        title: "Error",
        description: "Failed to update project manager. Please try again.",
        variant: "destructive",
      });
    }
  });
};

// Add backwards compatibility for older versions of React Query
export type MutationResultCompat<TData, TError, TVariables, TContext> = 
  UseMutationResult<TData, TError, TVariables, TContext> & {
    // Include both properties for compatibility
    isLoading: boolean;
    isPending: boolean;
    status: 'idle' | 'loading' | 'success' | 'error' | 'pending';
  };
