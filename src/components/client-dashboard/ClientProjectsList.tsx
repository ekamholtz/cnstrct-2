
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientProjectCard } from "./ClientProjectCard";
import { ClientProject, SimplifiedMilestone } from "@/types/project-types";
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
      try {
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

        console.log('Session found for user:', session.user.id);
      } catch (error) {
        console.error('Session check error:', error);
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['client-projects', limit],
    queryFn: async () => {
      try {
        // Get current user
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

        // First, get client records for this user using REST API
        const clientResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/clients?user_id=eq.${user.id}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!clientResponse.ok) {
          console.error('Error finding client records:', clientResponse.statusText);
          throw new Error('Error finding client records');
        }

        const clientsData = await clientResponse.json();
        console.log('Client data found:', clientsData);

        if (!clientsData || clientsData.length === 0) {
          console.log('No client record found for user:', user.id);
          return [];
        }

        // Get the first client record (there should typically only be one)
        const clientData = clientsData[0];

        // Now fetch projects using the client ID
        const projectsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/projects?client_id=eq.${clientData.id}${limit ? `&limit=${limit}` : ''}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );

        if (!projectsResponse.ok) {
          console.error('Error fetching projects:', projectsResponse.statusText);
          throw new Error('Error fetching projects');
        }

        const projectsData = await projectsResponse.json();
        console.log('Projects found:', projectsData);
        
        // For each project, fetch its milestones
        const clientProjects: ClientProject[] = await Promise.all(
          projectsData.map(async (project: any) => {
            const milestonesResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/milestones?project_id=eq.${project.id}`,
              {
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            let milestones: SimplifiedMilestone[] = [];
            if (milestonesResponse.ok) {
              milestones = await milestonesResponse.json();
            }
            
            return {
              ...project,
              milestones,
              address: project.address || '',
              status: project.status || 'draft'
            } as ClientProject;
          })
        );
        
        return clientProjects;
      } catch (error) {
        console.error('Projects fetch error:', error);
        throw error;
      }
    },
    meta: {
      onError: (error: Error) => {
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
      {projects?.map((project) => (
        <ClientProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
