
import { supabase } from "@/integrations/supabase/client";

/**
 * Get client projects for the current logged in user
 */
export const getClientProjects = async () => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting current user:', userError);
      throw userError;
    }
    
    if (!user) {
      console.error('No user found');
      return [];
    }
    
    console.log('Current user:', user.id, user.email);
    
    // First find the client record associated with this user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, name')
      .eq('user_id', user.id)
      .single();
      
    if (clientError) {
      console.error('Error finding client:', clientError);
      
      // If not found, try to find by email
      if (clientError.code === 'PGRST116') {
        console.log('Trying to find client by email...');
        const { data: clientByEmail, error: emailError } = await supabase
          .from('clients')
          .select('id, email, name')
          .eq('email', user.email)
          .single();
          
        if (emailError) {
          console.error('Error finding client by email:', emailError);
          return [];
        }
        
        if (clientByEmail) {
          console.log('Found client by email:', clientByEmail.id);
          
          // Update the client record to associate with this user
          const { error: updateError } = await supabase
            .from('clients')
            .update({ user_id: user.id })
            .eq('id', clientByEmail.id);
            
          if (updateError) {
            console.error('Error updating client with user_id:', updateError);
          }
          
          // Use this client for fetching projects
          return getProjectsForClient(clientByEmail.id);
        }
      }
      
      return [];
    }

    if (!client) {
      console.log('No client record found for user:', user.id);
      return [];
    }
    
    console.log('Found client:', client.id);
    return getProjectsForClient(client.id);
  } catch (error) {
    console.error('Error fetching client projects:', error);
    return [];
  }
};

/**
 * Helper function to get projects for a specific client ID
 */
async function getProjectsForClient(clientId: string) {
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
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
    
  if (projectError) {
    console.error('Error fetching client projects:', projectError);
    throw projectError;
  }
  
  console.log('Fetched projects for client', clientId, ':', projects?.length || 0);
  return projects || [];
}

/**
 * Get client invoices for the specified projects
 */
export const getClientInvoices = async (projectIds: string[] = []) => {
  if (!projectIds.length) {
    console.log('No project IDs provided for invoice fetch');
    return [];
  }
  
  try {
    console.log('Fetching invoices for projects:', projectIds);
    
    // Get invoices using RPC function or direct query
    const { data, error } = await supabase.rpc(
      'get_client_invoices', 
      { project_ids: projectIds.join(',') }
    );
      
    if (error) {
      console.error('Error fetching client invoices:', error);
      
      // Fallback to direct query if RPC fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('invoices')
        .select(`
          id, 
          invoice_number,
          amount,
          status,
          project_id,
          milestone_id,
          created_at,
          updated_at
        `)
        .in('project_id', projectIds);
        
      if (fallbackError) {
        console.error('Error with fallback invoice fetch:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }
    
    console.log('Fetched invoices:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    return [];
  }
};
