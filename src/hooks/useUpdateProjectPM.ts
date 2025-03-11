import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { makeMutationCompatible, MutationResultCompat } from "@/utils/queryCompatibility";

export const useUpdateProjectPM = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
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
          .eq('id', projectId);
        
        if (error) {
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error("Error updating project PM:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      
      toast({
        title: "Project updated",
        description: "Project manager has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error in project PM update mutation:", error);
      
      toast({
        title: "Update failed",
        description: "There was an error updating the project manager. Please try again.",
        variant: "destructive",
      });
    }
  });

  return makeMutationCompatible(mutation);
};

export type { MutationResultCompat } from "@/utils/queryCompatibility";
