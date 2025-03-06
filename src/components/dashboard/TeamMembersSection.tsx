
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserList } from "@/components/gc-profile/UserList";
import { InviteUserForm } from "@/components/gc-profile/InviteUserForm";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useCreateGCUser } from "@/components/gc-profile/hooks/useCreateGCUser";
import { CreateUserFormValues } from "@/components/gc-profile/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const TeamMembersSection = () => {
  const [isInviting, setIsInviting] = useState(false);
  const {
    teamMembers,
    isLoadingTeam,
    refetchTeam,
    gcAccountId,
    isGCAdmin,
    isPlatformAdmin
  } = useTeamMembers();

  const { createUser, isCreatingUser } = useCreateGCUser(gcAccountId);

  console.log("TeamMembersSection rendered with:", { 
    teamMembers: teamMembers?.length,
    teamMembersData: teamMembers,
    gcAccountId,
    isGCAdmin,
    isPlatformAdmin
  });

  const handleInviteUser = async (formData: CreateUserFormValues) => {
    try {
      await createUser({
        ...formData,
        gc_account_id: gcAccountId
      });
      
      setIsInviting(false);
      // Use a timeout to allow for database update to complete
      setTimeout(() => refetchTeam(), 1000);
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  const canManageUsers = isGCAdmin || isPlatformAdmin;
  
  // Don't render if user doesn't have a GC account
  if (!gcAccountId && !isPlatformAdmin) {
    console.log("Not rendering TeamMembersSection - no GC account ID and not platform admin");
    return null;
  }
  
  // If the user is platform admin but not viewing as part of a GC
  if (isPlatformAdmin && !gcAccountId) {
    console.log("Not rendering TeamMembersSection - platform admin without GC account context");
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        {!gcAccountId && !isPlatformAdmin && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Missing</AlertTitle>
            <AlertDescription>
              You need to set up your company profile before you can manage team members.
            </AlertDescription>
          </Alert>
        )}
        
        {isInviting ? (
          <InviteUserForm 
            onSubmit={handleInviteUser}
            onCancel={() => setIsInviting(false)}
            isLoading={isCreatingUser}
          />
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
              <TabsTrigger value="managers">Project Managers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <UserList 
                users={teamMembers || []}
                isLoading={isLoadingTeam}
                canManageUsers={canManageUsers}
                onCreateUser={() => setIsInviting(true)}
                onRefresh={() => refetchTeam()}
              />
            </TabsContent>
            
            <TabsContent value="admins">
              <UserList 
                users={(teamMembers || []).filter(user => user.role === 'gc_admin')}
                isLoading={isLoadingTeam}
                canManageUsers={canManageUsers}
                onCreateUser={() => setIsInviting(true)}
                onRefresh={() => refetchTeam()}
              />
            </TabsContent>
            
            <TabsContent value="managers">
              <UserList 
                users={(teamMembers || []).filter(user => user.role === 'project_manager')}
                isLoading={isLoadingTeam}
                canManageUsers={canManageUsers}
                onCreateUser={() => setIsInviting(true)}
                onRefresh={() => refetchTeam()}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
