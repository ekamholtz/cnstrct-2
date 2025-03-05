import { supabase } from "@/integrations/supabase/client";

export const markMilestoneComplete = async (milestoneId: string) => {
  console.log('Starting milestone completion process for milestone:', milestoneId);
  
  // Get the milestone details for the invoice
  const { data: milestone, error: fetchError } = await supabase
    .from('milestones')
    .select('*, project:project_id (*)')
    .eq('id', milestoneId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!milestone) throw new Error('Milestone not found');
  
  console.log('Fetched milestone details:', milestone);

  // Generate invoice number with milestone ID
  const { data: invoiceNumber, error: invoiceNumberError } = await supabase
    .rpc('generate_invoice_number', { milestone_id: milestoneId });

  if (invoiceNumberError) throw invoiceNumberError;
  console.log('Generated invoice number:', invoiceNumber);

  // Create invoice - now using gc_account_id instead of contractor_id
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      milestone_id: milestoneId,
      project_id: milestone.project_id,
      gc_account_id: milestone.project.gc_account_id,
      amount: milestone.amount,
      invoice_number: invoiceNumber,
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;
  console.log('Created invoice:', invoice);

  // Update milestone status
  const { error: milestoneError } = await supabase
    .from('milestones')
    .update({ status: 'completed' })
    .eq('id', milestoneId);

  if (milestoneError) throw milestoneError;
  console.log('Updated milestone status to completed');

  return invoice;
};

export const calculateCompletion = (milestones: any[]) => {
  if (!milestones || milestones.length === 0) {
    console.log('No milestones found');
    return 0;
  }

  const totalAmount = milestones.reduce((sum, milestone) => 
    sum + (milestone.amount || 0), 0);
  
  const completedAmount = milestones
    .filter(milestone => milestone.status === 'completed')
    .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

  console.log('Project completion calculation:', {
    totalAmount,
    completedAmount,
    percentage: totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0
  });

  return totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
};
