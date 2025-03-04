
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
    .select('role, gc_account_id, is_owner, full_name')
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
  contractor_id: string;
  pm_user_id?: string;
}) => {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (projectError) throw projectError;
  return project;
};

/**
 * Assigns a project manager to a project
 */
export const assignProjectManager = async (projectId: string, userId: string) => {
  const { error: pmError } = await supabase
    .from('project_managers')
    .insert({
      project_id: projectId,
      user_id: userId
    });
    
  if (pmError) {
    console.error('Error adding PM to project_managers:', pmError);
    // Non-fatal error, continue with project creation
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
    // Try the standard insert first
    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(milestonesData);
      
    if (milestonesError) {
      throw milestonesError;
    }
    
    return { success: true };
  } catch (insertError) {
    console.error('Error inserting milestones with standard method:', insertError);
    
    // Fallback to our custom function if normal insert fails
    const { error: rpcError } = await supabase.rpc(
      'insert_milestones',
      { milestones_data: JSON.stringify(milestonesData) }
    );
    
    if (rpcError) {
      console.error('Error with RPC milestone insertion:', rpcError);
      throw rpcError;
    }
    
    return { success: true };
  }
};

/**
 * Finds a contractor ID for a GC account
 */
export const findContractorId = async (gcAccountId: string, currentUserId: string, userRole: string) => {
  // If user is a GC admin, they are the contractor
  if (userRole === 'gc_admin') {
    console.log('GC admin creating project - setting contractor_id to self:', currentUserId);
    return currentUserId;
  }
  
  // For PMs, find the associated GC admin (owner or creator)
  console.log('PM creating project - finding GC admin for gc_account_id:', gcAccountId);
  
  // First check for the account creator/owner
  const { data: gcAccount, error: gcAccountError } = await supabase
    .from('gc_accounts')
    .select('creator_id')
    .eq('id', gcAccountId)
    .single();
    
  if (gcAccountError) {
    console.error('Error finding GC account:', gcAccountError);
    throw new Error('Could not find associated General Contractor account');
  }
  
  if (gcAccount.creator_id) {
    console.log('Using gc_account creator_id as contractor_id:', gcAccount.creator_id);
    return gcAccount.creator_id;
  } 
  
  // If no creator_id, find a GC admin in this company, preferring owner
  const { data: gcAdmins, error: gcAdminsError } = await supabase
    .from('profiles')
    .select('id, is_owner')
    .eq('gc_account_id', gcAccountId)
    .eq('role', 'gc_admin')
    .order('is_owner', { ascending: false });
    
  if (gcAdminsError) {
    console.error('Error finding GC admins:', gcAdminsError);
    throw new Error('Could not find any General Contractor admin');
  }
  
  if (gcAdmins && gcAdmins.length > 0) {
    const contractorId = gcAdmins[0].id;
    console.log('Found GC admin to use as contractor_id:', contractorId);
    
    // Update gc_account's creator_id for future use
    await supabase
      .from('gc_accounts')
      .update({ creator_id: contractorId })
      .eq('id', gcAccountId);
      
    return contractorId;
  } 
  
  throw new Error('Could not find any General Contractor admin for this company');
};
