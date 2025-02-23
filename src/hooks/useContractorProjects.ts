
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

      // First get the user's profile to determine their role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      console.log('User profile:', profile);

      let projectsQuery = supabase
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
        `);

      // Apply filters based on user role
      if (profile?.role === 'gc_admin') {
        projectsQuery = projectsQuery.eq('contractor_id', user.id);
      } else if (profile?.role === 'project_manager') {
        projectsQuery = projectsQuery.eq('pm_user_id', user.id);
      } else if (profile?.role === 'admin') {
        // Admin can see all projects
      } else if (profile?.role === 'homeowner') {
        // For homeowners, check client association
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (clientData) {
          projectsQuery = projectsQuery.eq('client_id', clientData.id);
        } else {
          return []; // Return empty array if no client data found
        }
      }

      const { data: projects, error: projectsError } = await projectsQuery;

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
