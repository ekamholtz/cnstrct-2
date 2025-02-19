
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";

export function useContractorProjects() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['contractor-projects'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          throw userError;
        }

        if (!user) {
          console.error('No user found in session');
          throw new Error('No user found');
        }

        console.log('Fetching projects for contractor:', user.id);
        
        // First, try fetching just the projects without the clients join
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('contractor_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          throw projectsError;
        }

        if (!projects || projects.length === 0) {
          console.log('No projects found for contractor:', user.id);
          return [];
        }

        // If we successfully got projects, now fetch the associated clients
        const { data: projectsWithClients, error: joinError } = await supabase
          .from('projects')
          .select(`
            *,
            clients (
              id,
              name,
              email
            )
          `)
          .eq('contractor_id', user.id)
          .order('created_at', { ascending: false });

        if (joinError) {
          console.error('Error fetching client data:', joinError);
          // If we fail to get client data, return just the projects
          return projects;
        }

        console.log('Successfully fetched projects with clients:', projectsWithClients);
        return projectsWithClients || [];

      } catch (error) {
        console.error('Error in useContractorProjects:', error);
        toast({
          variant: "destructive",
          title: "Error loading projects",
          description: "There was a problem loading your projects. Please try again.",
        });
        throw error;
      }
    }
  });
}
