import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const getRoleBadgeProps = (role: string) => {
    switch (role) {
      case 'gc_admin':
        return {
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Admin'
        };
      case 'project_manager':
        return {
          className: 'bg-green-50 text-green-700 border-green-200',
          label: 'Project Manager'
        };
      case 'platform_admin':
        return {
          className: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Platform Admin'
        };
      case 'contractor':
        return {
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Contractor'
        };
      default:
        return {
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          label: role?.replace(/_/g, ' ') || 'Unknown'
        };
    }
  };

  const { className, label } = getRoleBadgeProps(role);

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};
