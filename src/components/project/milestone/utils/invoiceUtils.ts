
import { supabase } from "@/integrations/supabase/client";
import { Milestone } from "@/types/project-types";

/**
 * Generates an invoice number for a milestone
 */
export const generateInvoiceNumber = async (milestoneId: string): Promise<string> => {
  console.log('Generating invoice number for milestone:', milestoneId);

  const { data: invoiceNumber, error } = await supabase
    .rpc('generate_invoice_number', { milestone_id: milestoneId });

  if (error) {
    console.error("Error generating invoice number:", error);
    throw error;
  }
  
  console.log('Generated invoice number:', invoiceNumber);
  return invoiceNumber;
};

/**
 * Creates an invoice for a completed milestone
 */
export const createMilestoneInvoice = async (
  milestone: Milestone & { project: any },
  invoiceNumber: string
) => {
  console.log('Creating invoice for milestone:', milestone.id);

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      milestone_id: milestone.id,
      project_id: milestone.project_id,
      contractor_id: milestone.project.contractor_id,
      amount: milestone.amount,
      invoice_number: invoiceNumber,
      status: 'pending_payment'
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
  
  console.log('Created invoice:', invoice);
  return invoice;
};

/**
 * Deletes invoices associated with a milestone
 */
export const deleteInvoicesForMilestone = async (milestoneId: string) => {
  console.log("Deleting invoices for milestone:", milestoneId);
  
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('milestone_id', milestoneId);
    
  if (error) {
    console.error("Error deleting invoices:", error);
    throw error;
  }
  
  console.log('Successfully deleted invoices for milestone');
  return true;
};
