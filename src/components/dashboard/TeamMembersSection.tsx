import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserList } from "@/components/gc-profile/UserList";
import { InviteUserForm } from "@/components/gc-profile/InviteUserForm";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useCreateGCUser } from "@/components/gc-profile/hooks/useCreateGCUser";
import { CreateUserFormValues } from "@/components/gc-profile/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const TeamMembersSection = () => {
  const [isInviting, setIsInviting] = useState(false);
  const [directDbProfiles, setDirectDbProfiles] = useState<any[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const {
    teamMembers,
    isLoadingTeam,
    refetchTeam,
    gcAccountId,
    isGCAdmin,
    isPlatformAdmin,
    error: teamMembersError
  } = useTeamMembers();

  const { createUser, isCreatingUser } = useCreateGCUser(gcAccountId);

  console.log("TeamMembersSection rendered with:", { 
    teamMembers: teamMembers?.length,
    teamMembersData: teamMembers,
    gcAccountId,
    isGCAdmin,
    isPlatformAdmin
  });

  // Add detailed debugging for each team member
  if (teamMembers && teamMembers.length > 0) {
    console.log("Team members details:");
    teamMembers.forEach((member, index) => {
      console.log(`Member ${index + 1}:`, {
        id: member.id,
        name: member.full_name,
        email: member.email,
        role: member.role,
        gc_account_id: member.gc_account_id
      });
    });
  } else {
    console.log("No team members found in the array");
  }
  
  // Direct database check
  useEffect(() => {
    const checkDatabaseDirectly = async () => {
      if (!gcAccountId) return;
      
      try {
        console.log("Directly checking database for team members with gc_account_id:", gcAccountId);
        
        // Helper function to normalize UUIDs for comparison
        const normalizeUUID = (uuid: string | null | undefined): string => {
          if (!uuid) return '';
          // Remove all non-alphanumeric characters and convert to lowercase
          return uuid.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        };
        
        const normalizedGcAccountId = normalizeUUID(gcAccountId);
        console.log("Normalized gc_account_id:", normalizedGcAccountId);
        
        // Get all profiles and filter manually with normalized UUIDs
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('*');
          
        if (allError) {
          console.error("Error fetching all profiles:", allError);
        } else {
          console.log(`Found ${allProfiles?.length || 0} total profiles in database`);
          
          // Manually filter profiles with matching gc_account_id using normalized comparison
          const matchingProfiles = allProfiles?.filter(p => {
            const normalizedProfileUUID = normalizeUUID(p.gc_account_id);
            const isMatch = normalizedProfileUUID === normalizedGcAccountId;
            
            if (isMatch) {
              console.log(`Found matching profile: ${p.full_name} (${p.id})`);
              console.log(`  Original UUID: ${p.gc_account_id}`);
              console.log(`  Normalized UUID: ${normalizedProfileUUID}`);
            }
            
            return isMatch;
          });
          
          console.log(`Manual filtering found ${matchingProfiles?.length || 0} matching profiles`);
          
          // Get emails for each profile - but without using admin API
          const profilesWithEmails = (matchingProfiles || []).map(profile => {
            // We can't get emails without admin access, so we'll use a placeholder
            // In a real app, you might store the email in the profiles table or use a different approach
            return { 
              ...profile, 
              email: `${profile.full_name?.toLowerCase().replace(/\s+/g, '.')}@example.com` // placeholder email based on name
            };
          });
          
          // Use this as our source of truth
          setDirectDbProfiles(profilesWithEmails || []);
          
          if (profilesWithEmails && profilesWithEmails.length > 0) {
            profilesWithEmails.forEach((profile, index) => {
              console.log(`Direct DB Profile ${index + 1}:`, {
                id: profile.id,
                name: profile.full_name,
                role: profile.role,
                email: profile.email,
                gc_account_id: profile.gc_account_id
              });
            });
          }
        }
      } catch (err) {
        console.error("Error in direct DB check:", err);
      }
    };
    
    checkDatabaseDirectly();
  }, [gcAccountId]);

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

  // Determine which profiles to display - use direct DB results if available
  const displayProfiles = directDbProfiles.length > 0 ? directDbProfiles : teamMembers || [];
  
  // Check if the user has permission to manage users
  const canManageUsers = isGCAdmin || isPlatformAdmin;

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-cnstrct-navy flex items-center">
          <span className="inline-block w-1 h-6 bg-cnstrct-orange mr-3 rounded-full"></span>
          Team Members
          <span className="ml-2 text-sm font-normal text-gray-500">({displayProfiles.length})</span>
        </h2>
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
          </button>
        )}
      </div>

      {/* Debug information */}
      {showDebugInfo && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-xs border border-gray-200">
          <h3 className="font-bold mb-2 text-gray-700">Debug Information</h3>
          <div className="space-y-2">
            <p><strong>GC Account ID:</strong> {gcAccountId || 'None'}</p>
            <p><strong>Normalized GC Account ID:</strong> {gcAccountId ? gcAccountId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'None'}</p>
            <p><strong>Hook Team Members:</strong> {teamMembers?.length || 0}</p>
            <p><strong>Direct DB Team Members:</strong> {directDbProfiles?.length || 0}</p>
            <p><strong>Is Loading:</strong> {isLoadingTeam ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {teamMembersError ? String(teamMembersError) : 'None'}</p>
            <p><strong>Displaying:</strong> {directDbProfiles.length > 0 ? 'Direct DB Results' : 'Hook Results'}</p>
          </div>
        </div>
      )}
      
      {!gcAccountId && (
        <Alert variant="destructive" className="mb-4 bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800 font-medium">Company Profile Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            You need to complete your company profile before you can manage team members.
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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-cnstrct-navy">All</TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-white data-[state=active]:text-cnstrct-navy">Admins</TabsTrigger>
            <TabsTrigger value="project-managers" className="data-[state=active]:bg-white data-[state=active]:text-cnstrct-navy">Project Managers</TabsTrigger>
            <TabsTrigger value="contractors" className="data-[state=active]:bg-white data-[state=active]:text-cnstrct-navy">Contractors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <UserList 
              users={displayProfiles}
              isLoading={isLoadingTeam && directDbProfiles.length === 0}
              canManageUsers={canManageUsers}
              onCreateUser={() => setIsInviting(true)}
              onRefresh={() => refetchTeam()}
            /> 
          </TabsContent>
          
          <TabsContent value="admins">
            <UserList 
              users={displayProfiles.filter(user => 
                user.role === 'gc_admin' || user.role === 'platform_admin'
              )}
              isLoading={isLoadingTeam && directDbProfiles.length === 0}
              canManageUsers={canManageUsers}
              onCreateUser={() => setIsInviting(true)}
              onRefresh={() => refetchTeam()}
            /> 
          </TabsContent>
          
          <TabsContent value="project-managers">
            <UserList 
              users={displayProfiles.filter(user => user.role === 'project_manager')}
              isLoading={isLoadingTeam && directDbProfiles.length === 0}
              canManageUsers={canManageUsers}
              onCreateUser={() => setIsInviting(true)}
              onRefresh={() => refetchTeam()}
            /> 
          </TabsContent>
          
          <TabsContent value="contractors">
            <UserList 
              users={displayProfiles.filter(user => user.role === 'contractor')}
              isLoading={isLoadingTeam && directDbProfiles.length === 0}
              canManageUsers={canManageUsers}
              onCreateUser={() => setIsInviting(true)}
              onRefresh={() => refetchTeam()}
            /> 
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
