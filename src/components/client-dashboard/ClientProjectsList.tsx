import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ClientProjectsList() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['client-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Fetching projects for user:', user.id);

      // First get the client record for this user
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        throw clientError;
      }

      if (!clientData) {
        console.log('No client record found for user:', user.id);
        return [];
      }

      console.log('Found client:', clientData);

      // Then get the projects for this client
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
      
      console.log('Fetched client projects:', projectsData);
      return projectsData || [];
    },
  });

  const calculateCompletion = (milestones: any[]) => {
    if (!milestones || milestones.length === 0) return 0;
    
    const totalAmount = milestones.reduce((sum, milestone) => 
      sum + (milestone.amount || 0), 0);
    
    const completedAmount = milestones
      .filter(milestone => milestone.status === 'completed')
      .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

    return totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  };

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
        <Link key={project.id} to={`/project/${project.id}`}>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <Badge>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p className="text-sm">{project.address}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">
                      {calculateCompletion(project.milestones)}%
                    </span>
                  </div>
                  <Progress 
                    value={calculateCompletion(project.milestones)} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}