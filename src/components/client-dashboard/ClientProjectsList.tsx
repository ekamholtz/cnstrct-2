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

      console.log('Starting project fetch for user:', user.id);

      // First try to get projects through the clients table using user_id
      const { data: clientProjects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            id,
            name,
            amount,
            status
          ),
          client:client_id (
            id,
            user_id
          )
        `)
        .eq('client.user_id', user.id);

      if (projectsError) {
        console.error('Error fetching projects by user_id:', projectsError);
        throw projectsError;
      }

      if (clientProjects && clientProjects.length > 0) {
        console.log('Found projects through user_id:', clientProjects);
        return clientProjects as ClientProject[];
      }

      // If no projects found, try looking up by email
      console.log('No projects found by user_id, trying email lookup:', user.email);
      const { data: clientByEmail, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email?.toLowerCase())
        .maybeSingle();

      if (clientError) {
        console.error('Error fetching client by email:', clientError);
        throw clientError;
      }

      if (!clientByEmail) {
        console.log('No client found by email');
        return [];
      }

      console.log('Found client by email:', clientByEmail);

      // Get projects for this client
      const { data: emailProjects, error: emailProjectsError } = await supabase
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
        .eq('client_id', clientByEmail.id);

      if (emailProjectsError) {
        console.error('Error fetching projects by client email:', emailProjectsError);
        throw emailProjectsError;
      }

      console.log('Found projects by email:', emailProjects);
      return emailProjects as ClientProject[] || [];
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