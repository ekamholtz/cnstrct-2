import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
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
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-cnstrct-navy">{project.name}</h3>
          <Badge className={`${getStatusColor(project.status)}`}>
            {formatStatus(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
          <p className="text-sm">{project.address}</p>
        </div>
      </CardContent>
    </Card>
  );
}