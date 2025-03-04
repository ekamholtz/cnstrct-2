
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "./useCurrentUserProfile";
import { GCUserProfile } from "../types";

export const useTeamManagement = () => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUserProfile, isGCAdmin, isOwner } = useCurrentUserProfile();

  // Get GC account information
  const { data: gcAccount, isLoading: isLoadingGCAccount } = useQuery({
    queryKey: ['gc-account', currentUserProfile?.gc_account_id],
    queryFn: async () => {
      if (!currentUserProfile?.gc_account_id) return null;

      const { data, error } = await supabase
        .from('gc_accounts')
        .select('*')
        .eq('id', currentUserProfile.gc_account_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUserProfile?.gc_account_id,
  });

  // Check if user is the owner of the GC account
  const { data: isGCOwner } = useQuery({
    queryKey: ['is-gc-owner', currentUserProfile?.id, currentUserProfile?.gc_account_id],
    queryFn: async () => {
      if (!currentUserProfile?.id || !currentUserProfile?.gc_account_id) return false;

      // Check if the user is the owner in gc_accounts
      const { data: account, error } = await supabase
        .from('gc_accounts')
        .select('owner_id')
        .eq('id', currentUserProfile.gc_account_id)
        .single();

      if (error) return false;
      return account.owner_id === currentUserProfile.id;
    },
    enabled: !!currentUserProfile?.id && !!currentUserProfile?.gc_account_id,
  });

  // Make user a GC admin of the current company
  const { mutate: makeGCAdmin, isPending: isMakingGCAdmin } = useMutation({
    mutationFn: async ({ email, name, phone }: { email: string; name: string; phone: string }) => {
      if (!currentUserProfile?.gc_account_id) {
        throw new Error('No GC account found');
      }

      // Create user with gc_admin role
      const { data, error } = await supabase.functions.invoke('create-gc-user-v2', {
        body: {
          email,
          name,
          phone,
          role: 'gc_admin',
          gc_account_id: currentUserProfile.gc_account_id,
          is_owner: false
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "GC Admin added to your team",
      });
      queryClient.invalidateQueries({ queryKey: ['gc-users'] });
      setIsInviteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error making user GC Admin:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add GC Admin. Please try again.",
      });
    }
  });

  // Transfer ownership to another GC admin
  const { mutate: transferOwnership, isPending: isTransferringOwnership } = useMutation({
    mutationFn: async (newOwnerId: string) => {
      if (!currentUserProfile?.gc_account_id || !isGCOwner) {
        throw new Error('You do not have permission to transfer ownership');
      }

      // First, verify the target user is a GC admin in this company
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', newOwnerId)
        .eq('gc_account_id', currentUserProfile.gc_account_id)
        .eq('role', 'gc_admin')
        .single();

      if (userError || !targetUser) {
        throw new Error('Target user is not a GC admin in this company');
      }

      // Call the updated function to transfer ownership
      const { data, error } = await supabase.rpc('transfer_gc_ownership', {
        current_owner_id: currentUserProfile.id,
        new_owner_id: newOwnerId,
        gc_account_id: currentUserProfile.gc_account_id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Ownership Transferred",
        description: "You have successfully transferred company ownership",
      });
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['gc-users'] });
      queryClient.invalidateQueries({ queryKey: ['is-gc-owner'] });
    },
    onError: (error) => {
      console.error('Error transferring ownership:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to transfer ownership. Please try again.",
      });
    }
  });

  // Remove user from GC account
  const { mutate: removeTeamMember, isPending: isRemovingMember } = useMutation({
    mutationFn: async (userId: string) => {
      if (!currentUserProfile?.gc_account_id || !isGCOwner) {
        throw new Error('You do not have permission to remove team members');
      }

      // Update profile to remove gc_account_id
      const { data, error } = await supabase
        .from('profiles')
        .update({ gc_account_id: null })
        .eq('id', userId)
        .eq('gc_account_id', currentUserProfile.gc_account_id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Team Member Removed",
        description: "The user has been removed from your company",
      });
      queryClient.invalidateQueries({ queryKey: ['gc-users'] });
    },
    onError: (error) => {
      console.error('Error removing team member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove team member. Please try again.",
      });
    }
  });

  return {
    gcAccount,
    isLoadingGCAccount,
    isInviteDialogOpen,
    setIsInviteDialogOpen,
    makeGCAdmin,
    isMakingGCAdmin,
    transferOwnership,
    isTransferringOwnership,
    removeTeamMember,
    isRemovingMember,
    isOwner: isGCOwner, // Use new direct ownership check
    isGCAdmin
  };
};
