
import { supabase } from "@/integrations/supabase/client";
import { MilestoneStatus } from "@/types/project-types";
import { ProjectFormValues } from "@/components/projects/types";

/**
 * Fetches the current user profile from Supabase
 */
export const getCurrentUserProfile = async () => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  // Get user's profile to determine role and gc_account_id
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role, gc_account_id, full_name')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;
  
  return { user, userProfile };
};

/**
 * Creates a client in the database
 */
export const createClient = async (clientData: {
  name: string;
  address: string;
  email: string;
  phone_number?: string;
}) => {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single();

  if (clientError) throw clientError;
  return client;
};

/**
 * Creates a project in the database
 */
export const createProject = async (projectData: {
  name: string;
  address: string;
  status: 'active' | 'draft' | 'completed' | 'cancelled';
  client_id: string;
  gc_account_id: string;
  pm_user_id: string;
  description?: string;
}) => {
  console.log('Creating project with data:', projectData);
  
  // Validate that the PM belongs to the GC account
  const { data: pmProfile, error: pmError } = await supabase
    .from('profiles')
    .select('gc_account_id, role')
    .eq('id', projectData.pm_user_id)
    .single();
    
  if (pmError) {
    console.error('Error validating PM for project creation:', pmError);
    throw new Error('Could not validate project manager');
  }
  
  // Check that PM belongs to the same GC account as the project
  if (pmProfile.gc_account_id !== projectData.gc_account_id) {
    throw new Error('Project manager must belong to the same GC account as the project');
  }
  
  // Try to create the project with a transaction to ensure consistency
  try {
    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }
    
    console.log('Project created successfully:', project);
    return project;
  } catch (error) {
    console.error('Project creation failed with error:', error);
    throw error;
  }
};

/**
 * Creates milestones for a project
 */
export const createMilestones = async (milestonesData: {
  name: string;
  amount: number;
  description: string;
  project_id: string;
  status: MilestoneStatus;
}[]) => {
  try {
    // Important: We need to avoid using RPC function for PMs due to permissions
    // So we'll use direct inserts with explicit fields
    const insertData = milestonesData.map(milestone => ({
      name: milestone.name,
      amount: milestone.amount,
      description: milestone.description,
      project_id: milestone.project_id,
      status: milestone.status
    }));
    
    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(insertData);
      
    if (milestonesError) {
      console.error('Error inserting milestones:', milestonesError);
      throw milestonesError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating milestones:', error);
    throw error;
  }
};

/**
 * Creates a payment for an expense in the database
 */
export const createPayment = async (paymentData: {
  expense_id: string;
  payment_method_code: string;
  payment_date: string;
  amount: number;
  notes?: string;
  direction: 'outgoing';
  status: 'completed';
}) => {
  console.log('Creating payment with data:', paymentData);
  
  if (!paymentData.expense_id) {
    throw new Error('Missing expense_id in payment data');
  }
  
  // Validate the expense exists before creating payment
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .select('id, amount, gc_account_id')
    .eq('id', paymentData.expense_id)
    .single();
    
  if (expenseError) {
    console.error('Error validating expense before payment:', expenseError);
    throw new Error(`Cannot create payment: ${expenseError.message}`);
  }
  
  if (!expense) {
    throw new Error(`Cannot create payment: Expense with ID ${paymentData.expense_id} not found`);
  }
  
  // Add gc_account_id to payment data
  const fullPaymentData = {
    ...paymentData,
    gc_account_id: expense.gc_account_id
  };
  
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert(fullPaymentData)
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }
  
  console.log('Payment created successfully:', payment);
  return payment;
};
