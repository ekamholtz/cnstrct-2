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

      // First try to get the client record by user_id
      let { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('Error fetching client by user_id:', clientError);
        throw clientError;
      }

      // If no client found by user_id, try by email
      if (!clientData) {
        console.log('No client found by user_id, trying email lookup:', user.email?.toLowerCase());
        const { data: emailClient, error: emailError } = await supabase
          .from('clients')
          .select('id, email')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();

        if (emailError) {
          console.error('Error fetching client by email:', emailError);
          throw emailError;
        }

        if (emailClient) {
          console.log('Found client by email:', emailClient);
          clientData = emailClient;

          // Update the client record with the user_id
          const { error: updateError } = await supabase
            .from('clients')
            .update({ user_id: user.id })
            .eq('id', emailClient.id);

          if (updateError) {
            console.error('Error updating client user_id:', updateError);
          }
        } else {
          console.log('No client record found for user');
          return [];
        }
      }

      console.log('Found client:', clientData);

      // Get all projects for this client
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
        .eq('client_id', clientData.id);

      if (projectsError) {
        console.error('Error fetching client projects:', projectsError);
        throw projectsError;
      }

      console.log('Fetched projects:', projectsData);
      return projectsData as ClientProject[] || [];
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