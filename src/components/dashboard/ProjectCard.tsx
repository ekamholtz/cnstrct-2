import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Fetch milestones for the project
  const { data: milestones } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', project.id);
      
      if (error) {
        console.error('Error fetching milestones:', error);
        throw error;
      }
      console.log('Fetched milestones:', data);
      return data;
    }
  });

  const calculateCompletion = () => {
    if (!milestones || milestones.length === 0) {
      console.log('No milestones found for project:', project.id);
      return 0;
    }

    const totalAmount = milestones.reduce((sum, milestone) => 
      sum + (milestone.amount || 0), 0);
    
    const completedAmount = milestones
      .filter(milestone => milestone.status === 'completed')
      .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

    console.log('Project completion calculation:', {
      projectId: project.id,
      totalAmount,
      completedAmount,
      percentage: totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0
    });

    return totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const completionPercentage = calculateCompletion();

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg text-cnstrct-navy">{project.name}</h3>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(project.status)}`}>
                {formatStatus(project.status)}
              </Badge>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
              <p className="text-sm">{project.address}</p>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}