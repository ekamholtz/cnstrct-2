
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
      
      // Verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user found or error:', userError);
        throw new Error('No user found');
      }

      console.log('Fetching projects for user:', user.id);

      // Use a single query that leverages our fixed RLS policies
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
        console.error('Error fetching projects:', projectsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        });
        throw projectsError;
      }

      console.log('Projects found:', projects?.length || 0);
      return projects as Project[];
    },
    retry: 1, // Limit retries to avoid spamming if there's a persistent error
    meta: {
      onError: (error: Error) => {
        console.error('Query error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was a problem loading your projects. Please refresh the page."
        });
      }
    }
  });
}
