
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { completeMilestoneService, undoMilestoneCompletionService } from "../services/milestoneService";

export function useMilestoneCompletion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeMilestoneMutation = useMutation({
    mutationFn: completeMilestoneService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      toast({
        title: "Success",
        description: "Milestone marked as complete and invoice created",
      });
    },
    onError: (error) => {
      console.error("Error completing milestone:", error);
      toast({
        title: "Error",
        description: "Failed to complete milestone. Please try again.",
        variant: "destructive",
      });
    }
  });

  const undoMilestoneMutation = useMutation({
    mutationFn: undoMilestoneCompletionService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      toast({
        title: "Success",
        description: "Milestone status reverted and invoice removed",
      });
    },
    onError: (error) => {
      console.error("Error undoing milestone completion:", error);
      toast({
        title: "Error",
        description: "Failed to revert milestone status. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    completeMilestone: completeMilestoneMutation.mutateAsync,
    undoMilestone: undoMilestoneMutation.mutateAsync,
  };
}
