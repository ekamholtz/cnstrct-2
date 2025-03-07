
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
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white border-0 h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
            <Badge className={`${getStatusColor(project.status)}`}>
              {formatStatus(project.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
              <p className="text-sm">{project.address}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium">{completionPercentage}% Complete</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
