import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserRoleState {
  isGC: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isHomeowner: boolean;
  isLoading: boolean;
}

/**
 * Hook to check the current user's role
 * Used to determine permissions for various actions
 */
export const useUserRole = (): UserRoleState => {
  const [roles, setRoles] = useState<UserRoleState>({
    isGC: false,
    isAdmin: false,
    isClient: false,
    isHomeowner: false,
    isLoading: true
  });

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles({
            isGC: false,
            isAdmin: false,
            isClient: false,
            isHomeowner: false,
            isLoading: false
          });
          return;
        }

        // Get the user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, account_type')
          .eq('id', user.id)
          .single();

        if (profile) {
          setRoles({
            isGC: profile.role === 'gc' || profile.account_type === 'gc',
            isAdmin: profile.role === 'admin' || profile.account_type === 'admin',
            isClient: profile.role === 'client' || profile.account_type === 'client',
            isHomeowner: profile.role === 'homeowner' || profile.account_type === 'homeowner',
            isLoading: false
          });
        } else {
          setRoles({
            isGC: false,
            isAdmin: false,
            isClient: false,
            isHomeowner: false,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setRoles({
          isGC: false,
          isAdmin: false,
          isClient: false,
          isHomeowner: false,
          isLoading: false
        });
      }
    };

    checkUserRole();
  }, []);

  return roles;
};
