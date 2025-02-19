
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";

export function useContractorProjects() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['projects'],
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

        console.log('Current user:', user);
        console.log('User metadata:', user.user_metadata);
        
        // Simple direct query for projects
        const { data: projects, error: projectsError } = await supabase
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

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          throw projectsError;
        }

        console.log('Fetched projects:', projects);
        return projects || [];

      } catch (error) {
        console.error('Error in useContractorProjects:', error);
        throw error;
      }
    },
    meta: {
      errorHandler: (error: Error) => {
        console.error('Projects query error:', error);
        toast({
          variant: "destructive",
          title: "Error loading projects",
          description: "There was a problem loading your projects. Please try again.",
        });
      }
    }
  });
}
