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
      .select('id, email, name, user_id')
      .eq('user_id', user.id)
      .single();
      
    if (clientError) {
      console.error('Error finding client:', clientError);
      
      // If not found, try to find by email
      if (clientError.code === 'PGRST116') {
        console.log('Attempting to link client for email:', user.email, 'to user:', user.id);
        console.log('Searching for client with email:', user.email);
        const { data: clientByEmail, error: emailError } = await supabase
          .from('clients')
          .select('id, email, name, user_id')
          .eq('email', user.email)
          .single();
          
        if (emailError) {
          console.error('Error finding client by email:', emailError);
          
          // Additional fallback: try to find any client with this email
          console.log('Trying broader email search...');
          const { data: clients } = await supabase
            .from('clients')
            .select('id, email, name, user_id')
            .ilike('email', `%${user.email}%`);
            
          if (clients && clients.length > 0) {
            console.log('Found client with similar email:', clients[0].id);
            
            // Update the client record to associate with this user
            const { error: updateError } = await supabase
              .from('clients')
              .update({ user_id: user.id })
              .eq('id', clients[0].id);
              
            if (updateError) {
              console.error('Error updating client with user_id:', updateError);
            } else {
              console.log('Successfully linked client', clients[0].id, 'to user', user.id);
            }
            
            // Use this client for fetching projects
            return getProjectsForClient(clients[0].id);
          }
          
          return [];
        }
        
        if (clientByEmail) {
          console.log('Found existing client with this email:', clientByEmail.id);
          
          // Check if client is already linked to this user
          if (clientByEmail.user_id === user.id) {
            console.log('Client is already linked to this user');
          } else {
            // Update the client record to associate with this user
            const { error: updateError } = await supabase
              .from('clients')
              .update({ user_id: user.id })
              .eq('id', clientByEmail.id);
              
            if (updateError) {
              console.error('Error updating client with user_id:', updateError);
            } else {
              console.log('Successfully linked client', clientByEmail.id, 'to user', user.id);
            }
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
    console.log('Client data:', client);
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
  console.log('Fetching projects for client ID:', clientId);
  
  // First try a direct query without any joins to confirm projects exist
  const { data: simpleProjects, error: simpleError } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId);
    
  if (simpleError) {
    console.error('Error in simple projects query:', simpleError);
  } else {
    console.log('Simple projects query found:', simpleProjects?.length || 0, 'projects');
  }
  
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
  
  // If no projects found, try to find projects that might be associated with this client
  if (!projects || projects.length === 0) {
    console.log('No projects found for client, checking client email...');
    
    // Get client email
    const { data: client } = await supabase
      .from('clients')
      .select('email, user_id')
      .eq('id', clientId)
      .single();
      
    if (client?.email) {
      // Try to find projects with missing client_id
      const { data: orphanedProjects } = await supabase
        .from('projects')
        .select('*')
        .is('client_id', null);
        
      if (orphanedProjects && orphanedProjects.length > 0) {
        console.log('Found', orphanedProjects.length, 'orphaned projects, linking them to client', clientId);
        
        // Update client_id for orphaned projects
        for (const project of orphanedProjects) {
          console.log('Updating orphaned project:', project.id);
          await supabase
            .from('projects')
            .update({ client_id: clientId })
            .eq('id', project.id);
        }
        
        // Try fetching projects again
        const { data: updatedProjects } = await supabase
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
          
        return updatedProjects || [];
      }
      
      // As a last resort, check if there are any projects with status = 'active'
      // that don't have a client_id assigned
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active');
        
      if (activeProjects && activeProjects.length > 0) {
        console.log('Found', activeProjects.length, 'active projects, checking for unassigned ones');
        
        const unassignedProjects = activeProjects.filter(p => !p.client_id);
        if (unassignedProjects.length > 0) {
          console.log('Found', unassignedProjects.length, 'unassigned active projects, linking them to client', clientId);
          
          // Update client_id for unassigned active projects
          for (const project of unassignedProjects) {
            console.log('Updating unassigned active project:', project.id);
            await supabase
              .from('projects')
              .update({ client_id: clientId })
              .eq('id', project.id);
          }
          
          // Try fetching projects again
          const { data: updatedProjects } = await supabase
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
            
          return updatedProjects || [];
        }
      }
    }
  }
  
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
    
    // Get invoices using function call or direct query
    const { data, error } = await supabase
      .rpc('get_client_invoices', { 
        project_ids: projectIds.join(',') 
      });
      
    if (error) {
      console.error('Error calling get_client_invoices function:', error);
      
      // Fallback to direct query if RPC fails
      const { data: invoices, error: queryError } = await supabase
        .from('invoices')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
        
      if (queryError) {
        console.error('Error fetching invoices directly:', queryError);
        return [];
      }
      
      return invoices || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    return [];
  }
};
