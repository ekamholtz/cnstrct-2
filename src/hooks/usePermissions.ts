
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PermissionQueryResult = {
  feature_key: string;
  roles: {
    roles: {
      name: string;
    };
  }[];
}

type UserRoleQueryResult = {
  roles: {
    name: string;
  };
}

export function usePermissions() {
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select(`
          feature_key,
          roles!role_permissions (
            roles!inner (
              name
            )
          )
        `)
        .order('feature_key')
        .returns<PermissionQueryResult[]>();

      if (error) {
        console.error('Error fetching permissions:', error);
        throw error;
      }

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .returns<UserRoleQueryResult[]>();

      if (!userRoles) return [];

      const userRoleNames = userRoles.map(ur => ur.roles.name);
      
      // Filter permissions to only those the user has access to based on their roles
      return permissions.filter(permission => 
        permission.roles.some(role => userRoleNames.includes(role.roles.name))
      ).map(p => p.feature_key);
    },
  });

  const hasPermission = (featureKey: string) => {
    if (!userPermissions) return false;
    return userPermissions.includes(featureKey);
  };

  return {
    hasPermission,
    isLoading: !userPermissions,
  };
}
