
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

      // Map profiles to GCUserProfile type, but don't try to access email property
      return profiles.map(profile => {
        const userProfile: GCUserProfile = {
          ...profile,
          // Don't include email since it doesn't exist in the profiles table
        };
        return userProfile;
      }) || [];
    },
    enabled: !!currentUserProfile?.gc_account_id && 
      (currentUserProfile.role === 'gc_admin' || currentUserProfile.role === 'platform_admin'),
  });

  // Create new user mutation - updated to use create-gc-user-v2 function
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormValues) => {
      setIsCreatingUser(true);
      try {
        console.log('Creating user with data:', userData);
        
        // Use the Supabase client's functions.invoke method instead of raw fetch
        const { data, error } = await supabase.functions.invoke('create-gc-user-v2', {
          body: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
          }
        });

        if (error) {
          console.error('Error from Edge Function:', error);
          throw new Error(error.message || 'Failed to create user');
        }

        console.log('User creation successful:', data);
        return data;
      } catch (error: any) {
        console.error('Error in createUserMutation:', error);
        throw error;
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
