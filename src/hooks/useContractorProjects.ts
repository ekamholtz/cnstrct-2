import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";

export function useContractorProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('Current user role:', profile?.role);

      if (profile?.role === 'homeowner') {
        console.log('Fetching projects as client for user:', user.id);
        
        const { data: clientProjects, error: clientProjectsError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            status,
            address,
            created_at,
            client_id,
            clients (
              id,
              name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (clientProjectsError) {
          console.error('Error fetching client projects:', clientProjectsError);
          throw clientProjectsError;
        }

        console.log('Successfully fetched client projects:', clientProjects);
        return (clientProjects || []) as Project[];
      }

      console.log('Fetching projects as contractor for user:', user.id);
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          address,
          created_at,
          client_id,
          clients (
            id,
            name,
            email
          )
        `)
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching contractor projects:', projectsError);
        throw projectsError;
      }

      console.log('Successfully fetched contractor projects:', projects);
      return (projects || []) as Project[];
    },
  });
}
