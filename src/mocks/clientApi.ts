
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
      
    if (clientError) {
      console.error('Error finding client:', clientError);
      throw clientError;
    }

    if (!clients) {
      console.log('No client record found for user:', user.id);
      return [];
    }
    
    console.log('Found client:', clients.id);
    
    // Get all projects for this client, including milestones
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
      
    if (projectError) {
      console.error('Error fetching client projects:', projectError);
      throw projectError;
    }
    
    console.log('Fetched projects:', projects?.length || 0);
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
  if (!projectIds.length) {
    console.log('No project IDs provided for invoice fetch');
    return [];
  }
  
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
      
    if (error) {
      console.error('Error fetching client invoices:', error);
      throw error;
    }
    
    console.log('Fetched invoices:', invoices?.length || 0);
    return invoices || [];
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    return [];
  }
};
