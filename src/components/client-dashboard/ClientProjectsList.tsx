import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { linkClientToUser } from "@/utils/client-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientProject, SimplifiedMilestone } from "@/types/project-types";

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

type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Helper function to fetch projects for a client
const fetchProjectsForClient = async (clientId: string) => {
  console.log('Fetching projects for client ID:', clientId);
  
  const { data: projects, error } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('client_id', clientId) as SupabaseResponse<Project[]>;
    
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  console.log('Projects found:', projects?.length || 0);
  return projects || [];
};

// Helper function to find a client by user ID or email
const findClientByUserIdOrEmail = async (userId: string, userEmail: string) => {
  console.log('Looking up client for user ID:', userId, 'and email:', userEmail);
  
  // Normalize email to lowercase
  const normalizedEmail = userEmail.toLowerCase();
  
  // First try to find client by user_id
  const { data: clientsByUserId, error: userIdError } = await (supabase as any)
    .from('clients')
    .select('*')
    .eq('user_id', userId) as SupabaseResponse<Client[]>;
    
  if (userIdError) {
    console.error('Error finding client by user ID:', userIdError);
  }
  
  // If found by user_id, return the first client
  if (clientsByUserId && clientsByUserId.length > 0) {
    console.log('Client found by user ID:', clientsByUserId[0].id);
    return clientsByUserId[0];
  }
  
  // If not found by user_id, try to find by email (case insensitive)
  console.log('No client found by user ID, trying email lookup with:', normalizedEmail);
  const { data: clientsByEmail, error: emailError } = await (supabase as any)
    .from('clients')
    .select('*')
    .ilike('email', normalizedEmail) as SupabaseResponse<Client[]>;
    
  if (emailError) {
    console.error('Error finding client by email:', emailError);
    throw emailError;
  }
  
  // If found by email, link the client to the user and return it
  if (clientsByEmail && clientsByEmail.length > 0) {
    console.log('Client found by email:', clientsByEmail[0].id);
    
    // Link the client to the user
    try {
      await linkClientToUser(userId, normalizedEmail, supabase);
      console.log('Successfully linked client to user');
    } catch (linkError) {
      console.error('Error linking client to user:', linkError);
    }
    
    return clientsByEmail[0];
  }
  
  console.log('No client found by user ID or email');
  return null;
};

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
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (!user) {
          console.error('No authenticated user found');
          navigate('/auth');
          return;
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
          setProjects([]);
          setLoading(false);
          return;
        }

        // Get the first client record (there should typically only be one)
        const clientData = clientsData[0];
        setClient(clientData);

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
        setProjects(projectsData || []);
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
