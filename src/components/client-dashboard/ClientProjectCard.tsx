
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, ClipboardList, MapPin } from "lucide-react";
import { ClientProject } from "@/types/project-types";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";

interface ClientProjectCardProps {
  project: ClientProject;
}

export function ClientProjectCard({ project }: ClientProjectCardProps) {
  // Calculate progress based on completed milestones
  const totalMilestones = project.milestones?.length || 0;
  const completedMilestones = project.milestones?.filter(m => m.status === 'completed')?.length || 0;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  
  // Format the address nicely
  const formattedAddress = project.address || 'No address provided';
  
  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link to={`/project/${project.id}`}>
      <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold text-[#172b70]">{project.name}</CardTitle>
            <Badge className={getStatusColor(project.status)}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-600">{formattedAddress}</span>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#172b70] h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <ClipboardList className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-600">
                {completedMilestones} of {totalMilestones} milestones completed
              </span>
            </div>
            
            {project.total_contract_value ? (
              <div className="flex items-start space-x-2">
                <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Contract value: {formatCurrency(project.total_contract_value)}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
