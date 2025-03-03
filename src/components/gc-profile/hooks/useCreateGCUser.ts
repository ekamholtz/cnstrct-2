
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateUserFormValues } from "../types";

export const useCreateGCUser = (gcAccountId?: string) => {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormValues) => {
      setIsCreatingUser(true);
      try {
        // Ensure we have a GC account ID
        if (!gcAccountId) {
          throw new Error("Missing GC account ID. Cannot create user without it.");
        }
        
        // Always use the provided gc_account_id
        const userDataWithGCAccount = {
          ...userData,
          gc_account_id: gcAccountId
        };
        
        console.log('Creating user with data:', userDataWithGCAccount);
        
        // Use the Supabase client's functions.invoke method
        const { data, error } = await supabase.functions.invoke('create-gc-user-v2', {
          body: {
            name: userDataWithGCAccount.name,
            email: userDataWithGCAccount.email,
            phone: userDataWithGCAccount.phone,
            role: userDataWithGCAccount.role,
            gc_account_id: userDataWithGCAccount.gc_account_id
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
      
      // Explicitly invalidate the queries to force a refetch
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
    isCreatingUser,
    createUser: createUserMutation.mutate,
  };
};
