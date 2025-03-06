
import { supabase } from "@/integrations/supabase/client";
import { Invoice, PaymentFormData } from "@/components/project/invoice/types";
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

  // Get gc_account_id from the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('gc_account_id')
    .eq('id', milestone.project_id)
    .single();

  if (projectError) {
    console.error("Error fetching project details:", projectError);
    throw projectError;
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      milestone_id: milestone.id,
      project_id: milestone.project_id,
      gc_account_id: project.gc_account_id,
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

/**
 * Get invoice details by ID with related milestone and project information
 */
export const getInvoiceDetails = async (invoiceId: string): Promise<Invoice> => {
  if (!invoiceId) throw new Error('No invoice ID provided');

  // Use standard Supabase join pattern without table aliases
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      milestone:milestone_id (
        name,
        project:project_id (
          name
        )
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (error) throw error;

  // Helper function to validate payment method
  const validatePaymentMethod = (method: string | null): "cc" | "check" | "transfer" | "cash" | null => {
    if (!method) return null;
    if (["cc", "check", "transfer", "cash"].includes(method)) {
      return method as "cc" | "check" | "transfer" | "cash";
    }
    return null;
  };

  // Transform the data to match the Invoice type
  const transformedData: Invoice = {
    id: data.id,
    invoice_number: data.invoice_number,
    amount: data.amount,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    milestone_id: data.milestone_id,
    project_id: data.project_id,
    payment_method: validatePaymentMethod(data.payment_method),
    payment_date: data.payment_date,
    payment_reference: data.payment_reference,
    payment_gateway: data.payment_gateway,
    simulation_data: data.simulation_data,
    milestone_name: data.milestone?.name || '',
    project_name: data.milestone?.project?.name || ''
  };

  return transformedData;
};

/**
 * Get all invoices for a specific project
 */
export const getProjectInvoices = async (projectId: string): Promise<Invoice[]> => {
  console.log('Fetching invoices for project:', projectId);
  
  // Use standard Supabase join pattern without table aliases
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      milestone:milestone_id (
        name,
        project:project_id (
          name
        )
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }

  const transformedData: Invoice[] = (data || []).map(invoice => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    amount: invoice.amount,
    status: invoice.status as Invoice['status'],
    created_at: invoice.created_at,
    milestone_id: invoice.milestone_id,
    milestone_name: invoice.milestone?.name || '',
    project_name: invoice.milestone?.project?.name || '',
    project_id: invoice.project_id,
    payment_method: invoice.payment_method as Invoice['payment_method'],
    payment_date: invoice.payment_date || null,
    payment_reference: invoice.payment_reference || null,
    payment_gateway: invoice.payment_gateway || null,
    simulation_data: invoice.simulation_data,
    updated_at: invoice.updated_at
  }));

  return transformedData;
};

/**
 * Mark an invoice as paid
 */
export const markInvoiceAsPaid = async (
  invoiceId: string, 
  paymentData: PaymentFormData
) => {
  console.log("Marking invoice as paid:", {
    invoiceId,
    paymentData
  });

  // Get invoice details first
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError) throw invoiceError;

  // Create payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount: invoice.amount,
      direction: 'incoming',
      payment_method_code: paymentData.payment_method,
      payment_date: paymentData.payment_date.toISOString(),
      status: 'completed'
    });

  if (paymentError) throw paymentError;

  // Update invoice status
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      payment_method: paymentData.payment_method,
      payment_date: paymentData.payment_date.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .single();

  if (updateError) throw updateError;

  return true;
};

/**
 * Simulate payment for an invoice (for client/homeowner demo purposes)
 */
export const simulateInvoicePayment = async (
  invoiceId: string,
  simulationDetails: any
) => {
  console.log('Starting payment simulation with invoice:', invoiceId);
  
  if (!invoiceId) {
    console.error('Invalid invoice ID');
    throw new Error('Invalid invoice data');
  }

  const { data, error } = await supabase
    .rpc('simulate_invoice_payment', {
      invoice_id: invoiceId,
      simulation_details: simulationDetails
    });

  if (error) {
    console.error('Payment simulation error:', error);
    throw error;
  }

  console.log('Payment simulation completed successfully:', data);
  return data;
};
