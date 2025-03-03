
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gc_admin':
        return 'bg-blue-100 text-blue-800';
      case 'project_manager':
        return 'bg-green-100 text-green-800';
      case 'platform_admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={getRoleBadgeColor(role)}>
      {role?.replace(/_/g, ' ') || 'Unknown'}
    </Badge>
  );
};
