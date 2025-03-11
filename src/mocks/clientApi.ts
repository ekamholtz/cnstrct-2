
import { supabase } from "@/integrations/supabase/client";

/**
 * Get client projects for the current logged in user
 */
export const getClientProjects = async () => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    // First find the client record associated with this user
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (clientError) throw clientError;
    
    // Get all projects for this client
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        milestones (
          id,
          name,
          amount,
          status
        )
      `)
      .eq('client_id', clients.id)
      .order('created_at', { ascending: false });
      
    if (projectError) throw projectError;
    
    return projects || [];
  } catch (error) {
    console.error('Error fetching client projects:', error);
    return [];
  }
};

/**
 * Get client invoices for the specified projects
 */
export const getClientInvoices = async (projectIds: string[] = []) => {
  if (!projectIds.length) return [];
  
  try {
    const { data: invoices, error } = await supabase
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
      .in('project_id', projectIds);
      
    if (error) throw error;
    return invoices || [];
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    return [];
  }
};
