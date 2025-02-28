
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HomeownerProfileHeader } from "@/components/homeowner-profile/HomeownerProfileHeader";
import { HomeownerProfileForm } from "@/components/homeowner-profile/HomeownerProfileForm";
import { UserList } from "@/components/gc-profile/UserList";
import { InviteUserForm } from "@/components/gc-profile/InviteUserForm";
import { useGCUserManagement } from "@/components/gc-profile/hooks/useGCUserManagement";
import { useQuery } from "@tanstack/react-query";
import type { CreateUserFormValues } from "@/components/gc-profile/types";

export default function HomeownerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isInvitingUser, setIsInvitingUser] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    gcUsers,
    isLoadingUsers,
    isCreatingUser,
    createUser,
    canManageUsers,
    currentUserProfile,
    refetchUsers
  } = useGCUserManagement();

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

  useEffect(() => {
    // Refresh the user list when component mounts or when isInvitingUser changes to false
    // (indicating a user might have been added)
    if (!isInvitingUser && !isLoading) {
      refetchUsers();
    }
  }, [isInvitingUser, isLoading, refetchUsers]);

  const handleInviteUser = async (formData: CreateUserFormValues) => {
    try {
      if (!currentUserProfile?.gc_account_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Missing GC account ID. Cannot create user without it.",
        });
        return;
      }
      
      await createUser({
        ...formData,
        gc_account_id: currentUserProfile.gc_account_id
      });
      
      setIsInvitingUser(false);
      
      // Force a refetch of users after successful creation
      setTimeout(() => {
        refetchUsers();
      }, 1000);
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  if (isLoading || !profile) return null;

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <HomeownerProfileHeader 
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
        />
        
        {isInvitingUser ? (
          <div className="mt-8">
            <InviteUserForm 
              onSubmit={handleInviteUser}
              onCancel={() => setIsInvitingUser(false)}
              isLoading={isCreatingUser}
            />
          </div>
        ) : (
          <>
            <HomeownerProfileForm 
              profile={profile}
              isEditing={isEditing}
              onCancel={() => setIsEditing(false)}
              onSave={() => setIsEditing(false)}
            />
            
            {/* Only show user management for GC admins */}
            {(profile.role === 'gc_admin' || profile.role === 'platform_admin') && (
              <div className="mt-12">
                <UserList 
                  users={gcUsers || []}
                  isLoading={isLoadingUsers}
                  canManageUsers={canManageUsers}
                  onCreateUser={() => setIsInvitingUser(true)}
                  onRefresh={refetchUsers}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
