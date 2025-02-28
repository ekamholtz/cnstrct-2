
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
      console.log("Current user profile:", data);
      return data;
    }
  });

  // Get all users associated with the GC account
  const { data: gcUsers, isLoading: isLoadingUsers, refetch } = useQuery({
    queryKey: ['gc-users', currentUserProfile?.gc_account_id],
    queryFn: async () => {
      if (!currentUserProfile?.gc_account_id) {
        console.log('No GC account ID found, not fetching users');
        return [];
      }

      console.log('Fetching users for GC account:', currentUserProfile.gc_account_id);
      
      // First get all profiles with this GC account ID
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gc_account_id', currentUserProfile.gc_account_id);

      if (error) {
        console.error('Error fetching GC users:', error);
        throw error;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found for GC account ID:', currentUserProfile.gc_account_id);
        return [];
      }

      console.log('Found profiles:', profiles.length);

      // Now get the emails for these users from auth.users
      // We can't query auth.users directly, so we'll use the admin function
      const { data: usersWithEmails, error: adminError } = await supabase
        .functions.invoke('get-user-emails', {
          body: {
            userIds: profiles.map(profile => profile.id)
          }
        });

      if (adminError) {
        console.error('Error fetching user emails:', adminError);
        // Continue with profiles only, without emails
        return profiles.map(profile => ({
          ...profile,
          email: 'Email not available' // Placeholder
        }));
      }

      // Merge profile data with emails
      const usersWithProfiles = profiles.map(profile => {
        const userEmail = usersWithEmails?.find(u => u.id === profile.id)?.email || 'Email not available';
        return {
          ...profile,
          email: userEmail
        };
      });

      console.log('Returning users with profiles:', usersWithProfiles.length, usersWithProfiles);
      return usersWithProfiles as GCUserProfile[];
    },
    enabled: !!currentUserProfile?.gc_account_id && 
      (currentUserProfile.role === 'gc_admin' || currentUserProfile.role === 'platform_admin'),
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: false,
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormValues) => {
      setIsCreatingUser(true);
      try {
        // Ensure we have a GC account ID
        if (!userData.gc_account_id && !currentUserProfile?.gc_account_id) {
          throw new Error("Missing GC account ID. Cannot create user without it.");
        }
        
        const gc_account_id = userData.gc_account_id || currentUserProfile?.gc_account_id;
        
        console.log('Creating user with data:', {
          ...userData,
          gc_account_id
        });
        
        // Use the Supabase client's functions.invoke method
        const { data, error } = await supabase.functions.invoke('create-gc-user-v2', {
          body: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            gc_account_id
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
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "User has been created and invited to the platform. They will receive an email with instructions to set their password.",
      });
      
      // Explicitly invalidate the queries to force a refetch
      queryClient.invalidateQueries({
        queryKey: ['gc-users'],
      });
      
      // Force a refetch immediately
      refetch();
      
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
