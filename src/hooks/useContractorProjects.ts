
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";

export function useContractorProjects() {
  return useQuery({
    queryKey: ['contractor-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      console.log('Fetching projects for contractor:', user.id);
      
      // First fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, address, created_at, client_id')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      // Then fetch associated client data
      const projectsWithClients = await Promise.all(
        (projects || []).map(async (project) => {
          if (!project.client_id) {
            return { ...project, clients: null };
          }

          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, name, email')
            .eq('id', project.client_id)
            .single();

          if (clientError) {
            console.error('Error fetching client for project:', project.id, clientError);
            return { ...project, clients: null };
          }

          return { ...project, clients: clientData };
        })
      );

      console.log('Successfully fetched projects with clients:', projectsWithClients);
      return projectsWithClients as Project[];
    },
  });
}
