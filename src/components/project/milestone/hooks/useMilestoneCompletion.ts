
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMilestoneCompletion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      console.log("Starting milestone completion for:", milestoneId);

      const { data: milestone, error } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;
      return milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast({
        title: "Success",
        description: "Milestone marked as complete",
      });
    }
  });

  const undoMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const { data: milestone, error } = await supabase
        .from('milestones')
        .update({ status: 'pending' })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;
      return milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast({
        title: "Success",
        description: "Milestone status reverted",
      });
    }
  });

  return {
    completeMilestone: completeMilestoneMutation.mutateAsync,
    undoMilestone: undoMilestoneMutation.mutateAsync,
  };
}
