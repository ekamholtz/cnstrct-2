import { supabase } from "@/integrations/supabase/client";

/**
 * Debug function to test Supabase connection and query capabilities
 */
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { success: false, error: sessionError, stage: 'session' };
    }
    
    console.log('Session test successful:', !!session);
    
    // Test 2: Try to query clients table
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, email')
      .limit(5);
      
    if (clientsError) {
      console.error('Clients query error:', clientsError);
      return { success: false, error: clientsError, stage: 'clients' };
    }
    
    console.log('Clients query successful:', clients?.length || 0, 'clients found');
    
    // Test 3: Try to query projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .limit(10);
      
    if (projectsError) {
      console.error('Projects query error:', projectsError);
      return { success: false, error: projectsError, stage: 'projects' };
    }
    
    console.log('Projects query successful:', projects?.length || 0, 'projects found');
    
    // Test 4: Try to query projects for specific client
    const clientId = '95b6a19a-4000-4ef8-8df8-62043e6429e1'; // tc1@email.com client
    const { data: clientProjects, error: clientProjectsError } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('client_id', clientId);
      
    if (clientProjectsError) {
      console.error('Client projects query error:', clientProjectsError);
      return { success: false, error: clientProjectsError, stage: 'client_projects' };
    }
    
    console.log('Client projects query successful:', clientProjects?.length || 0, 'projects found for client', clientId);
    
    // Test 5: Check environment variables
    console.log('Environment variables check:');
    console.log('SUPABASE_URL defined:', !!import.meta.env.VITE_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    return { 
      success: true, 
      sessionActive: !!session,
      clientsCount: clients?.length || 0,
      projectsCount: projects?.length || 0,
      clientProjectsCount: clientProjects?.length || 0,
      clientProjects: clientProjects || [],
      environmentVars: {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      }
    };
  } catch (error) {
    console.error('Unexpected error in testSupabaseConnection:', error);
    return { success: false, error, stage: 'unexpected' };
  }
};
