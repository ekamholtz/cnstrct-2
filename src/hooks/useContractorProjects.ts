
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

        console.log('Attempting to fetch projects for contractor:', user.id);
        
        // Simplified query to first verify basic access
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, address, status, created_at, client_id')
          .eq('contractor_id', user.id);

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          toast({
            variant: "destructive",
            title: "Error loading projects",
            description: "There was a problem loading your projects. Please try again.",
          });
          throw projectsError;
        }

        console.log('Successfully fetched projects:', projects);
        return projects || [];

      } catch (error) {
        console.error('Error in useContractorProjects:', error);
        toast({
          variant: "destructive",
          title: "Error loading projects",
          description: "There was a problem loading your projects. Please try again.",
        });
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
}
