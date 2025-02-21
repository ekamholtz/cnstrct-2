
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PermissionQueryResult = {
  feature_key: string;
  role_permissions: {
    role: {
      name: string;
    };
  }[];
}

type UserRoleQueryResult = {
  role: {
    name: string;
  };
}

export function usePermissions() {
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      console.log('Fetching user permissions...');

      // First get the user's roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select(`
          role:roles (
            name
          )
        `)
        .returns<UserRoleQueryResult[]>();

      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError);
        throw userRolesError;
      }

      if (!userRoles?.length) {
        console.log('No roles found for user');
        return [];
      }

      const userRoleNames = userRoles.map(ur => ur.role.name);
      console.log('User roles:', userRoleNames);

      // Then get all permissions and filter based on user's roles
      const { data: permissions, error: permissionsError } = await supabase
        .from('permissions')
        .select(`
          feature_key,
          role_permissions!inner (
            role:roles!inner (
              name
            )
          )
        `)
        .order('feature_key')
        .returns<PermissionQueryResult[]>();

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        throw permissionsError;
      }

      // Filter permissions to only those the user has access to based on their roles
      const userPermissions = permissions
        .filter(permission => 
          permission.role_permissions.some(rp => 
            userRoleNames.includes(rp.role.name)
          )
        )
        .map(p => p.feature_key);

      console.log('User permissions:', userPermissions);
      return userPermissions;
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
