
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

      // First get the current user's role directly from session
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          clients (
            name,
            email,
            phone_number
          ),
          milestones (
            id,
            name,
            amount,
            status
          )
        `)
        .or(`contractor_id.eq.${user.id},pm_user_id.eq.${user.id}`);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        });
        throw projectsError;
      }

      console.log('Projects found:', projects);
      return projects as Project[];
    },
    meta: {
      onSettled: (data, error) => {
        if (error) {
          console.error('Query error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load projects. Please try again.",
          });
        }
      }
    }
  });
}
