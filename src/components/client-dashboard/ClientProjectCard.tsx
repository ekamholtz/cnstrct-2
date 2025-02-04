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

  return (
    <Link to={`/project/${project.id}`}>
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
                  {completionPercentage}%
                </span>
              </div>
              <Progress 
                value={completionPercentage} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}