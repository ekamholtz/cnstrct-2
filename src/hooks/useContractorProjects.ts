
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";

export function useContractorProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Starting project fetch...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user found or error:', userError);
        throw new Error('No user found');
      }

      // Get user's profile with role - single direct query
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      console.log('User profile:', profile);

      // If user is a homeowner
      if (profile?.role === 'homeowner') {
        console.log('Fetching projects as homeowner');
        
        // Get the client record for this user - single direct query
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (clientError) {
          console.error('Error fetching client:', clientError);
          throw clientError;
        }

        if (!clientData) {
          console.log('No client record found');
          return [];
        }

        // Get projects for this client with a simple select
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, status, address, created_at, contractor_id, client_id')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching client projects:', projectsError);
          throw projectsError;
        }

        console.log('Client projects:', projects);
        return projects as Project[];
      }

      // For contractors and admins - simple direct query
      console.log('Fetching projects as contractor/admin');
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, address, created_at, contractor_id, client_id')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching contractor projects:', projectsError);
        throw projectsError;
      }

      console.log('Contractor/admin projects:', projects);
      return projects as Project[];
    },
    meta: {
      errorHandler: (error: Error) => {
        console.error('Projects query error:', error);
      }
    }
  });
}
