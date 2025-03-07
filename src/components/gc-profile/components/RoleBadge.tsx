
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gc_admin':
        return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'project_manager':
        return 'bg-green-50 text-green-700 border border-green-200 shadow-sm';
      case 'platform_admin':
        return 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'gc_admin':
        return 'GC Admin';
      case 'project_manager':
        return 'Project Manager';
      case 'platform_admin':
        return 'Platform Admin';
      default:
        return role?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  return (
    <Badge className={`${getRoleBadgeColor(role)} font-medium rounded-md px-2.5 py-1 transition-all duration-200 hover:shadow-md`}>
      {getRoleDisplayName(role)}
    </Badge>
  );
};
