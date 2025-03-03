
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useHomeownerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const [refetchUsers, setRefetchUsers] = useState<(() => void) | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['homeowner-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      console.log("Fetched user profile:", data);
      
      // Add email from auth user to profile data
      return {
        ...data,
        email: user.email
      };
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkSession();
  }, [navigate]);

  const handleProfileSave = () => {
    setIsEditing(false);
    // Invalidate and refetch profile and current-user-profile
    queryClient.invalidateQueries({ queryKey: ['homeowner-profile'] });
    queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
    
    // Force a longer delay before refetching to ensure the database has updated
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['homeowner-profile'] });
      queryClient.refetchQueries({ queryKey: ['current-user-profile'] });
      
      // After refetching the profile, refetch the users list as well
      setTimeout(() => {
        refetchUsers && refetchUsers();
      }, 500);
    }, 1000);
  };

  // Only GC roles need to manage users and require a GC account ID
  // platform_admin users have universal access without needing a GC account ID
  const isGCRole = profile && (profile.role === 'gc_admin' || profile.role === 'project_manager');
  const isPlatformAdmin = profile && profile.role === 'platform_admin';
  
  // GC roles need a GC account ID, platform_admin users don't
  const hasGcAccountId = isGCRole && profile?.gc_account_id;
  const showUserManagement = (isGCRole && hasGcAccountId) || isPlatformAdmin;

  return {
    profile,
    isLoading,
    isEditing,
    setIsEditing,
    isInvitingUser,
    setIsInvitingUser,
    handleProfileSave,
    isGCRole,
    isPlatformAdmin,
    hasGcAccountId,
    showUserManagement,
    refetchUsers,
    setRefetchUsers
  };
};

export type UseHomeownerProfileReturn = ReturnType<typeof useHomeownerProfile>;
