import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { linkClientToUser } from "@/utils/client-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        
        console.log('User authenticated:', user.id);
        console.log('User email:', user.email);
        
        if (!user.email) {
          throw new Error('User email not found');
        }
        
        // Find client by user ID or email
        const foundClient = await findClientByUserIdOrEmail(user.id, user.email);
        
        if (!foundClient) {
          console.log('No client found for this user');
          setError('No client profile found for your account.');
          setLoading(false);
          return;
        }
        
        setClient(foundClient);
        console.log('Client set:', foundClient.id, foundClient.name);
        
        // Fetch projects for the client
        const clientProjects = await fetchProjectsForClient(foundClient.id);
        setProjects(clientProjects);
        
      } catch (err) {
        console.error('Error in ClientProjectsList:', err);
        setError('Failed to load your projects. Please try again later.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your projects. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No projects found. When your contractor creates projects for you, they will appear here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {project.description || "No description provided"}
            </p>
            <div className="flex justify-between items-center">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  project.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : project.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {project.status === "in_progress"
                  ? "In Progress"
                  : project.status === "completed"
                  ? "Completed"
                  : project.status || "Unknown"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewProject(project.id)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
