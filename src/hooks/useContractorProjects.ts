
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";

export function useContractorProjects() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      // Get current user and their metadata
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found in session');
        throw new Error('No user found');
      }
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      const userRole = user.user_metadata.role;
      console.log('User role from metadata:', userRole);
      console.log('User ID:', user.id);

      if (userRole === 'homeowner') {
        console.log('Fetching projects as homeowner for user:', user.id);
        
        // Get user's client record first
        const { data: clientRecord, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (clientError) {
          console.error('Error finding client record:', clientError);
          throw clientError;
        }

        if (!clientRecord) {
          console.log('No client record found for user:', user.id);
          return [];
        }

        console.log('Found client record:', clientRecord);

        // For homeowners, get projects where they are the client
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
          .eq('client_id', clientRecord.id)
          .order('created_at', { ascending: false });

        if (clientProjectsError) {
          console.error('Error fetching client projects:', clientProjectsError);
          throw clientProjectsError;
        }

        console.log('Successfully fetched client projects:', clientProjects);
        return (clientProjects || []) as Project[];
      }

      console.log('Fetching projects as contractor for user:', user.id);
      
      // For contractors, use RLS to handle access control
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
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching contractor projects:', projectsError);
        throw projectsError;
      }

      console.log('Successfully fetched contractor projects:', projects);
      return (projects || []) as Project[];
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
