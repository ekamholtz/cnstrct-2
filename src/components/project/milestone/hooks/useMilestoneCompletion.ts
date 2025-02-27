
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMilestoneCompletion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      console.log("Starting milestone completion for:", milestoneId);

      // Step 1: Get the milestone details for the invoice
      const { data: milestone, error: fetchError } = await supabase
        .from('milestones')
        .select('*, project:project_id (*)')
        .eq('id', milestoneId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching milestone details:", fetchError);
        throw fetchError;
      }
      
      if (!milestone) {
        console.error("Milestone not found");
        throw new Error('Milestone not found');
      }
      
      console.log('Fetched milestone details:', milestone);

      // Step 2: Generate invoice number with milestone ID
      const { data: invoiceNumber, error: invoiceNumberError } = await supabase
        .rpc('generate_invoice_number', { milestone_id: milestoneId });

      if (invoiceNumberError) {
        console.error("Error generating invoice number:", invoiceNumberError);
        throw invoiceNumberError;
      }
      
      console.log('Generated invoice number:', invoiceNumber);

      // Step 3: Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          milestone_id: milestoneId,
          project_id: milestone.project_id,
          contractor_id: milestone.project.contractor_id,
          amount: milestone.amount,
          invoice_number: invoiceNumber,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        throw invoiceError;
      }
      
      console.log('Created invoice:', invoice);

      // Step 4: Update milestone status
      const { error: milestoneError } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId);

      if (milestoneError) {
        console.error("Error updating milestone status:", milestoneError);
        throw milestoneError;
      }
      
      console.log('Updated milestone status to completed');

      return { milestone, invoice };
    },
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
    mutationFn: async (milestoneId: string) => {
      console.log("Starting milestone undo for:", milestoneId);
      
      // Get milestone details
      const { data: milestone, error: fetchError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();
        
      if (fetchError) throw fetchError;

      // Delete associated invoice(s)
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('milestone_id', milestoneId);
        
      if (deleteError) throw deleteError;

      // Update milestone status back to pending
      const { data: updatedMilestone, error: updateError } = await supabase
        .from('milestones')
        .update({ status: 'pending' })
        .eq('id', milestoneId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedMilestone;
    },
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
