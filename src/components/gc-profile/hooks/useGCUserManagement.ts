
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GCUserProfile, CreateUserFormValues } from "../types";

export const useGCUserManagement = () => {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user profile to determine GC account ID
  const { data: currentUserProfile, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Get all users associated with the GC account
  const { data: gcUsers, isLoading: isLoadingUsers, refetch } = useQuery({
    queryKey: ['gc-users', currentUserProfile?.gc_account_id],
    queryFn: async () => {
      if (!currentUserProfile?.gc_account_id) {
        return [];
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gc_account_id', currentUserProfile.gc_account_id);

      if (error) {
        console.error('Error fetching GC users:', error);
        throw error;
      }

      // In a real app, we'd want to get emails from auth.users
      // This is a limitation we'll note for now
      return profiles.map(profile => ({
        ...profile,
        email: profile.email || 'Email not available',
      } as GCUserProfile)) || [];
    },
    enabled: !!currentUserProfile?.gc_account_id && 
      (currentUserProfile.role === 'gc_admin' || currentUserProfile.role === 'platform_admin'),
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormValues) => {
      setIsCreatingUser(true);
      try {
        // Get the current user's auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session found');

        // Call the Edge Function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-gc-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        return await response.json();
      } finally {
        setIsCreatingUser(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been created and invited to the platform. They will receive an email with instructions to set their password.",
      });
      queryClient.invalidateQueries({
        queryKey: ['gc-users'],
      });
      setIsCreatingUser(false);
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
      });
      setIsCreatingUser(false);
    },
  });

  return {
    gcUsers,
    currentUserProfile,
    isLoadingUsers: isLoadingUsers || isLoadingCurrentUser,
    isCreatingUser,
    createUser: createUserMutation.mutate,
    refetchUsers: refetch,
    canManageUsers: currentUserProfile?.role === 'gc_admin' || currentUserProfile?.role === 'platform_admin',
    isGCAdmin: currentUserProfile?.role === 'gc_admin',
  };
};
