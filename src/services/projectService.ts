
import { supabase } from "@/integrations/supabase/client";
import { MilestoneStatus } from "@/types/project-types";

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
  contractor_id: string;
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
