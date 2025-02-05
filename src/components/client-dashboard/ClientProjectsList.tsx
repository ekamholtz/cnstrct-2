import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientProjectCard } from "./ClientProjectCard";
import { ClientProject } from "@/types/project-types";

export function ClientProjectsList() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['client-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Fetching projects for user:', user.id, 'with email:', user.email);

      // First, try to get all projects directly through the client_id -> user_id relationship
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id,
            name,
            amount,
            status
          )
        `)
        .eq('client_id', user.id);

      if (projectsError) {
        console.error('Error fetching projects by user_id:', projectsError);
      } else if (projectsData && projectsData.length > 0) {
        console.log('Found projects by user_id:', projectsData);
        return projectsData as ClientProject[];
      }

      // If no projects found, try to get the client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('Error fetching client by user_id:', clientError);
      }

      // If no client found by user_id, try by email
      if (!clientData) {
        console.log('No client found by user_id, trying email lookup:', user.email);
        const { data: emailClient, error: emailError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();

        if (emailError) {
          console.error('Error fetching client by email:', emailError);
          throw emailError;
        }

        if (emailClient) {
          console.log('Found client by email:', emailClient);
          
          // Get projects for this client
          const { data: clientProjects, error: clientProjectsError } = await supabase
            .from('projects')
            .select(`
              *,
              milestones (
                id,
                name,
                amount,
                status
              )
            `)
            .eq('client_id', emailClient.id);

          if (clientProjectsError) {
            console.error('Error fetching client projects:', clientProjectsError);
            throw clientProjectsError;
          }

          console.log('Found projects for client:', clientProjects);
          return clientProjects as ClientProject[] || [];
        }
      }

      console.log('No client record or projects found for user');
      return [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load projects. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No projects found. When contractors create projects for you, they will appear here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ClientProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}