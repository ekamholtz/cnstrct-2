import { ClientProject } from "@/types/project-types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { calculateProjectCompletion } from "@/utils/project-calculations";

interface ClientProjectCardProps {
  project: ClientProject;
}

export function ClientProjectCard({ project }: ClientProjectCardProps) {
  const completionPercentage = calculateProjectCompletion(project.milestones);

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

  return (
    <Link to={`/project/${project.id}`}>
      <Card 
        variant="glass" 
        className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-white/20"
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">{project.name}</h3>
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
            <div className="flex items-start gap-2">
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
