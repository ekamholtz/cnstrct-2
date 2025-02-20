
import { MilestoneStatus as MilestoneStatusType } from "@/components/projects/types";

interface MilestoneStatusBadgeProps {
  status: MilestoneStatusType;
}

export function MilestoneStatusBadge({ status }: MilestoneStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
