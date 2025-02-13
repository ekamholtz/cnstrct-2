
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientProjectCard } from "./ClientProjectCard";
import { ClientProject } from "@/types/project-types";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ClientProjectsListProps {
  limit?: number;
}

export function ClientProjectsList({ limit }: ClientProjectsListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in again to continue.",
        });
        navigate('/auth');
        return;
      }

      if (!session) {
        console.log('No session found, redirecting to auth');
        navigate('/auth');
        return;
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['client-projects', limit],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        throw new Error('No user found');
      }

      console.log('Starting project fetch for user:', user.id);

      // First, verify the client record exists and log the result
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('Error finding client record:', clientError);
        throw clientError;
      }

      console.log('Client data found:', clientData);

      if (!clientData) {
        console.log('No client record found for user:', user.id);
        return [];
      }

      let query = supabase
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
        .eq('client_id', clientData.id)
        .not('client_id', 'is', null)
        .order('created_at', { ascending: false });

      // Apply limit if provided
      if (limit) {
        query = query.limit(limit);
      }

      const { data: projects, error: projectsError } = await query;

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      console.log('Projects found:', projects);
      return projects as ClientProject[];
    },
    meta: {
      errorHandler: (error: Error) => {
        console.error('Query error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try logging in again.",
        });
        navigate('/auth');
      }
    }
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
          {error instanceof Error ? ` Error: ${error.message}` : ''}
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
