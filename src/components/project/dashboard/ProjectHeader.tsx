import { MapPin, CalendarIcon } from "lucide-react";
import { ClientProject } from "@/types/project-types";
import { ProjectManagerSelect } from "./ProjectManagerSelect";
import { useCurrentUserProfile } from "@/components/gc-profile/hooks/useCurrentUserProfile";
import { format } from "date-fns";

interface ProjectHeaderProps {
  project: ClientProject;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { isGCAdmin, isPlatformAdmin } = useCurrentUserProfile();
  const canAssignPM = isGCAdmin || isPlatformAdmin;
  
  // Format the created date
  const formattedDate = project.created_at 
    ? format(new Date(project.created_at), 'MMM d, yyyy')
    : 'Unknown date';

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#172b70] mb-2">{project.name}</h1>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{project.address}</span>
          </div>
          <div className="flex items-center text-gray-600 mb-4">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className="text-sm">Created on {formattedDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-sm font-medium" 
               style={{
                 backgroundColor: getStatusColor(project.status).bg,
                 color: getStatusColor(project.status).text
               }}>
            {formatStatus(project.status)}
          </div>
        </div>
      </div>
      
      {/* Project Manager Selection */}
      <div className="mt-4 border-t pt-4">
        <ProjectManagerSelect project={project} isGCAdmin={canAssignPM} />
      </div>
    </div>
  );
}

// Helper function to format the status text
function formatStatus(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Helper function to get status colors
function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'draft':
      return { bg: '#f3f4f6', text: '#4b5563' }; // Gray
    case 'active':
      return { bg: '#dcfce7', text: '#166534' }; // Green
    case 'completed':
      return { bg: '#dbeafe', text: '#1e40af' }; // Blue
    case 'cancelled':
      return { bg: '#fee2e2', text: '#b91c1c' }; // Red
    default:
      return { bg: '#f3f4f6', text: '#4b5563' }; // Default gray
  }
}
