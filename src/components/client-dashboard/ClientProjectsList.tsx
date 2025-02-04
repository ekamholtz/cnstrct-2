import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export function ClientProjectsList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['client-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
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

      if (error) throw error;
      console.log('Fetched client projects:', data);
      return data;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects?.map((project) => (
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
      {(!projects || projects.length === 0) && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No projects found.
        </div>
      )}
    </div>
  );
}