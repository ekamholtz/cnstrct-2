
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type UserPermissionsResult = {
  feature_key: string;
}[];

export function usePermissions() {
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      console.log('Fetching user permissions...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return [];
      }
      console.log('Current user:', user.id);

      const { data: permissions, error } = await supabase
        .rpc('get_user_permissions', {
          user_id: user.id
        })
        .returns<UserPermissionsResult>();

      if (error) {
        console.error('Error fetching permissions:', error);
        throw error;
      }

      const featureKeys = permissions?.map(p => p.feature_key) || [];
      console.log('User permissions:', featureKeys);
      return featureKeys;
    },
  });

  const hasPermission = (featureKey: string) => {
    console.log('Checking permission:', featureKey, 'Current permissions:', userPermissions);
    if (!userPermissions) return false;
    return userPermissions.includes(featureKey);
  };

  return {
    hasPermission,
    isLoading: !userPermissions,
  };
}
