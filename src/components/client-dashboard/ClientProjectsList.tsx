
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { linkClientToUser } from "@/utils/client-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import axios from "axios";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  user_id?: string;
}

export function ClientProjectsList({ limit }: { limit?: number } = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [dataState, setDataState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setDataState('loading');
        
        // Get current user first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          setDataState('error');
          setError('No authenticated user found. Please sign in again.');
          setLoading(false);
          return;
        }
        
        console.log('Current user:', user.email);
        
        // Try to find or create client record
        try {
          const clientData = await linkClientToUser(user.id, user.email || '');
          setClient(clientData as Client);
          console.log('Client data:', clientData);
        } catch (clientError) {
          console.error('Error linking client to user:', clientError);
        }
        
        // Fetch projects using mocked API for now
        try {
          const response = await axios.get('/api/client/projects');
          const projectsData = response.data;
          
          console.log('Projects data from API:', projectsData);
          
          if (!projectsData || projectsData.length === 0) {
            console.log('No projects found');
            setProjects([]);
            setDataState('empty');
            setLoading(false);
            return;
          }
          
          // Set the projects
          const typedProjects = projectsData.map((project: any) => ({
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status,
            created_at: project.created_at
          }));
          setProjects(typedProjects);
          setDataState('success');
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // Fallback to direct DB query in case API fails
          if (client?.id) {
            const { data: projectsData } = await supabase
              .from('projects')
              .select('*')
              .eq('client_id', client.id);
              
            if (projectsData && projectsData.length > 0) {
              const typedProjects = projectsData.map(project => ({
                id: project.id,
                name: project.name,
                description: project.description || '',
                status: project.status,
                created_at: project.created_at
              }));
              setProjects(typedProjects);
              setDataState('success');
            } else {
              setDataState('empty');
            }
          } else {
            setDataState('empty');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in ClientProjectsList:', err);
        setError(err instanceof Error ? err.message : String(err));
        setDataState('error');
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again later.",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, [navigate, toast, limit]);

  const handleProjectClick = (projectId: string) => {
    // Navigate to the project details page with the correct route
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <Card className="mb-8">
          <CardHeader>
            <div className="h-7 bg-slate-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (dataState === 'empty') {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">You don't have any projects yet.</p>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Projects Found</AlertTitle>
            <AlertDescription>
              We couldn't find any projects associated with your account.
              {client && <span> Your client ID is: {client.id}</span>}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Filter projects if there's a limit
  const displayProjects = limit ? projects.slice(0, limit) : projects;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Your Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayProjects.map((project) => (
            <div 
              key={project.id}
              className="p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
            >
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {project.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        {projects.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/client-projects')}>
              View All Projects
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
