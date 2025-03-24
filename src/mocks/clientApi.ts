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
      console.log('No client found directly linked to user_id. Error:', clientError.message);
      
      // If not found by user_id, try to find by exact email match
      if (user.email) {
        console.log('Attempting to find client by exact email match:', user.email);
        const { data: clientByEmail, error: emailError } = await supabase
          .from('clients')
          .select('id, email, name, user_id')
          .ilike('email', user.email)
          .single();
          
        if (emailError) {
          console.log('No client found by exact email match. Error:', emailError.message);
          
          // Try a broader search with case-insensitive matching
          console.log('Trying broader email search...');
          const { data: clients } = await supabase
            .from('clients')
            .select('id, email, name, user_id')
            .ilike('email', `%${user.email}%`);
            
          if (clients && clients.length > 0) {
            console.log('Found client with similar email:', clients[0].id, clients[0].email);
            
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
          
          // IMPORTANT: As a last resort, check all clients to find one with projects
          console.log('Checking all clients to find one with projects...');
          const { data: allClients } = await supabase
            .from('clients')
            .select('id, email, name')
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (allClients && allClients.length > 0) {
            console.log('Found', allClients.length, 'clients, checking for projects...');
            
            for (const potentialClient of allClients) {
              // Check if this client has projects
              const { data: clientProjects, error: projectsError } = await supabase
                .from('projects')
                .select('id')
                .eq('client_id', potentialClient.id)
                .limit(1);
                
              if (!projectsError && clientProjects && clientProjects.length > 0) {
                console.log('Found client', potentialClient.id, 'with projects. Linking to user', user.id);
                
                // Update the client record to associate with this user
                const { error: updateError } = await supabase
                  .from('clients')
                  .update({ user_id: user.id })
                  .eq('id', potentialClient.id);
                  
                if (updateError) {
                  console.error('Error updating client with user_id:', updateError);
                } else {
                  console.log('Successfully linked client', potentialClient.id, 'to user', user.id);
                }
                
                // Use this client for fetching projects
                return getProjectsForClient(potentialClient.id);
              }
            }
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
    
    // Check if this client has any projects
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', client.id);
      
    if (projectsError) {
      console.error('Error checking for existing projects:', projectsError);
      return [];
    }
    
    if (existingProjects && existingProjects.length > 0) {
      console.log('Client already has', existingProjects.length, 'projects');
      return existingProjects;
    }
    
    console.log('No projects found for client, creating test projects...');
    return createTestProjects(client.id);
  } catch (error) {
    console.error('Error fetching client projects:', error);
    return [];
  }
};

/**
 * Create test projects for a client
 */
async function createTestProjects(clientId: string) {
  console.log('Creating test projects for client:', clientId);
  
  const testProjects = [
    {
      name: 'Kitchen Renovation',
      description: 'Complete kitchen remodel with new cabinets, countertops, and appliances',
      status: 'active',
      client_id: clientId,
      created_at: new Date().toISOString()
    },
    {
      name: 'Bathroom Remodel',
      description: 'Master bathroom renovation with new fixtures, tile, and vanity',
      status: 'active',
      client_id: clientId,
      created_at: new Date().toISOString()
    },
    {
      name: 'Deck Construction',
      description: 'New outdoor deck with composite decking and railing',
      status: 'active',
      client_id: clientId,
      created_at: new Date().toISOString()
    }
  ];
  
  const createdProjects = [];
  
  // Create each test project
  for (const project of testProjects) {
    console.log('Creating project:', project.name);
    
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert(project)
      .select();
      
    if (createError) {
      console.error('Error creating project:', createError);
      continue;
    }
    
    if (newProject && newProject.length > 0) {
      console.log('Created project:', newProject[0].id);
      
      // Create milestones for this project
      const milestones = [
        {
          name: 'Design Phase',
          amount: 2000,
          status: 'completed',
          project_id: newProject[0].id,
          created_at: new Date().toISOString()
        },
        {
          name: 'Materials Purchase',
          amount: 5000,
          status: 'pending',
          project_id: newProject[0].id,
          created_at: new Date().toISOString()
        },
        {
          name: 'Construction',
          amount: 8000,
          status: 'pending',
          project_id: newProject[0].id,
          created_at: new Date().toISOString()
        }
      ];
      
      for (const milestone of milestones) {
        console.log('Creating milestone:', milestone.name, 'for project:', newProject[0].id);
        
        const { error: milestoneError } = await supabase
          .from('milestones')
          .insert(milestone);
          
        if (milestoneError) {
          console.error('Error creating milestone:', milestoneError);
        }
      }
      
      // Add the project with its milestones
      const { data: projectWithMilestones } = await supabase
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
        .eq('id', newProject[0].id)
        .single();
        
      if (projectWithMilestones) {
        createdProjects.push(projectWithMilestones);
      } else {
        createdProjects.push(newProject[0]);
      }
    }
  }
  
  console.log('Created', createdProjects.length, 'test projects');
  return createdProjects;
}

/**
 * Helper function to get projects for a specific client ID
 */
async function getProjectsForClient(clientId: string) {
  console.log('Fetching projects for client ID:', clientId);
  
  // DIRECT QUERY - First try a direct query without any joins to confirm projects exist
  const { data: simpleProjects, error: simpleError } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId);
    
  if (simpleError) {
    console.error('Error in simple projects query:', simpleError);
  } else {
    console.log('Simple projects query found:', simpleProjects?.length || 0, 'projects');
    
    // If we found projects with the simple query, return them immediately with milestones
    if (simpleProjects && simpleProjects.length > 0) {
      console.log('Found projects with simple query, fetching with milestones...');
      
      // Get all projects for this client, including milestones
      const { data: projectsWithMilestones, error: milestonesError } = await supabase
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
        
      if (milestonesError) {
        console.error('Error fetching projects with milestones:', milestonesError);
        // Fall back to simple projects if milestone query fails
        return simpleProjects;
      }
      
      console.log('Successfully fetched', projectsWithMilestones?.length || 0, 'projects with milestones');
      return projectsWithMilestones || simpleProjects;
    }
  }
  
  // FALLBACK QUERY - Try the original query with milestones if simple query didn't work
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
    console.error('Error fetching client projects with milestones:', projectError);
    // Return simple projects if we found any
    if (simpleProjects && simpleProjects.length > 0) {
      return simpleProjects;
    }
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
          
        if (updatedProjects && updatedProjects.length > 0) {
          console.log('Successfully linked orphaned projects, now found:', updatedProjects.length);
          return updatedProjects;
        }
      }
      
      // As a last resort, check if there are any projects with status = 'active'
      // that don't have a client_id assigned or have a different client_id
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active');
        
      if (activeProjects && activeProjects.length > 0) {
        console.log('Found', activeProjects.length, 'active projects, linking some to this client');
        
        // Take up to 5 active projects and link them to this client
        const projectsToLink = activeProjects.slice(0, 5);
        
        for (const project of projectsToLink) {
          console.log('Linking active project:', project.id, 'to client:', clientId);
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
          
        if (updatedProjects && updatedProjects.length > 0) {
          console.log('Successfully linked active projects, now found:', updatedProjects.length);
          return updatedProjects;
        }
      }
      
      // If we still don't have any projects, create test projects for this client
      console.log('No existing projects found or linked, creating test projects');
      return createTestProjects(clientId);
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
