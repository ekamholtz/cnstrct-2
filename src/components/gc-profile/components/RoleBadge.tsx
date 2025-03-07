
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gc_admin':
        return 'bg-blue-50 text-blue-700';
      case 'project_manager':
        return 'bg-emerald-50 text-emerald-700';
      case 'platform_admin':
        return 'bg-violet-50 text-violet-700';
      default:
        return 'bg-slate-50 text-slate-700';
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
    <Badge className={`${getRoleBadgeColor(role)} font-medium rounded-md px-2.5 py-1 transition-all duration-200 hover:shadow-sm`}>
      {getRoleDisplayName(role)}
    </Badge>
  );
};
