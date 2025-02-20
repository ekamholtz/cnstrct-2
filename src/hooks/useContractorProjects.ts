
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

      try {
        // First try a direct role check without using profiles table
        const { data: projects, error: directProjectsError } = await supabase
          .from('projects')
          .select('id, name, status, address, created_at, contractor_id, client_id')
          .eq('contractor_id', user.id)
          .order('created_at', { ascending: false });

        if (!directProjectsError && projects && projects.length > 0) {
          console.log('Found contractor projects directly:', projects);
          return projects as Project[];
        }

        // If no contractor projects found, try client projects
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!clientError && clientData) {
          console.log('Found client record:', clientData);
          
          const { data: clientProjects, error: clientProjectsError } = await supabase
            .from('projects')
            .select('id, name, status, address, created_at, contractor_id, client_id')
            .eq('client_id', clientData.id)
            .order('created_at', { ascending: false });

          if (clientProjectsError) {
            console.error('Error fetching client projects:', clientProjectsError);
            throw clientProjectsError;
          }

          console.log('Found client projects:', clientProjects);
          return clientProjects as Project[];
        }

        // If no projects found in either case, return empty array
        console.log('No projects found for user');
        return [];

      } catch (error) {
        console.error('Error in projects query:', error);
        throw error;
      }
    },
    meta: {
      errorHandler: (error: Error) => {
        console.error('Projects query error:', error);
      }
    }
  });
}
