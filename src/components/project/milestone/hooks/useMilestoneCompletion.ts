
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMilestoneCompletion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      console.log("Starting milestone completion for:", milestoneId);

      // 1. First update the milestone status
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId)
        .select(`
          project_id, 
          amount, 
          name,
          project:project_id (
            contractor_id
          )
        `)
        .single();

      if (milestoneError) {
        console.error("Error updating milestone:", milestoneError);
        throw milestoneError;
      }

      console.log("Milestone updated successfully:", milestone);

      if (!milestone?.project?.contractor_id) {
        throw new Error('No contractor found for project');
      }

      // 2. Generate invoice number
      const { data: invoiceNumber, error: invoiceNumberError } = await supabase
        .rpc('generate_invoice_number', {
          milestone_id: milestoneId
        });

      if (invoiceNumberError) {
        console.error("Error generating invoice number:", invoiceNumberError);
        throw invoiceNumberError;
      }

      console.log("Generated invoice number:", invoiceNumber);

      // 3. Create the invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          milestone_id: milestoneId,
          amount: milestone.amount,
          project_id: milestone.project_id,
          contractor_id: milestone.project.contractor_id,
          invoice_number: invoiceNumber,
          status: 'pending_payment'
        });

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        throw invoiceError;
      }

      console.log("Invoice created successfully");
      return milestone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      toast({
        title: "Success",
        description: "Milestone marked as complete and invoice created",
      });
    },
    onError: (error) => {
      console.error('Error completing milestone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete milestone. Please try again.",
      });
    },
  });

  return completeMilestoneMutation;
}
