
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { linkClientToUser } from "@/utils/client-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

interface Project {
  id: string;
  name: string;
  description: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects using our mock API
        const response = await axios.get('/api/client/projects');
        const projectsData = response.data;
        
        console.log('Projects data from API:', projectsData);
        
        if (!projectsData || projectsData.length === 0) {
          console.log('No projects found');
          setProjects([]);
          setLoading(false);
          return;
        }
        
        // Set the projects
        setProjects(projectsData || []);
        
        // Try to get client info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          setClient(clientData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in ClientProjectsList:', err);
        setError(err instanceof Error ? err.message : String(err));
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
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">You don't have any projects yet.</p>
          {client && (
            <Button onClick={() => navigate('/client-projects')}>
              View All Projects
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Your Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
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
        {projects.length > 0 && client && (
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
