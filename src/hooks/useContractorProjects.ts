
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";

export function useContractorProjects() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Starting project fetch...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user found or error:', userError);
        throw new Error('No user found');
      }

      console.log('Fetching projects for user:', user.id);

      // First, try a simplified query without joins to isolate the issue
      try {
        console.log('Attempting simplified query first...');
        const { data: projectsBasic, error: basicError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (basicError) {
          console.error('Error with simplified query:', basicError);
          throw basicError;
        }

        console.log('Basic query successful, found projects:', projectsBasic?.length || 0);
        
        // If basic query works, try to get the full data
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            clients (
              id,
              name,
              email,
              address,
              phone_number
            ),
            milestones (
              id,
              name,
              amount,
              status
            )
          `)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching full projects data:', projectsError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Fetched basic project data but could not load related information.",
          });
          
          // Return basic projects if full query fails
          return projectsBasic as Project[];
        }

        console.log('Full projects found:', projects);
        return projects as Project[];
      } catch (error) {
        console.error('Error in project fetch process:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        });
        throw error;
      }
    }
  });
}
