
import { supabase } from "@/integrations/supabase/client";
import { MilestoneStatus } from "@/types/project-types";

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
 * Get project details including PM information
 */
export const getProjectWithPMDetails = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      pm:profiles!projects_pm_user_id_fkey(id, full_name, role)
    `)
    .eq('id', projectId)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Checks if current user is the PM for a project
 */
export const isProjectManagerForProject = async (projectId: string) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  const { data, error } = await supabase
    .from('projects')
    .select('pm_user_id')
    .eq('id', projectId)
    .eq('pm_user_id', user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking PM status:', error);
    return false;
  }
  
  return !!data;
};
