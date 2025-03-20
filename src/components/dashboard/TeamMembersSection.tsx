import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, Phone, Building, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteUserForm } from "@/components/gc-profile/InviteUserForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTeamDisplayRole, isRoleAdmin } from "@/utils/role-utils";

export function TeamMembersSection() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);
  const [isGCAdmin, setIsGCAdmin] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  // Query to get the current user's GC account ID
  const { data: userData } = useQuery({
    queryKey: ["current-user-for-team"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, gc_account_id")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setGcAccountId(profile.gc_account_id);
      setIsGCAdmin(isRoleAdmin(profile.role));
      setIsPlatformAdmin(profile.role === "platform_admin");
      
      return { user, profile };
    },
  });

  // Query to get team members
  const { data: teamMembers = [], isLoading: isLoadingTeam, error: teamMembersError, refetch } = useQuery({
    queryKey: ["team-members", gcAccountId],
    queryFn: async () => {
      if (!gcAccountId) throw new Error("No GC account ID found");

      console.log("Fetching team members for GC account:", gcAccountId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("gc_account_id", gcAccountId);

      if (error) throw error;
      
      console.log("Team members fetched:", data?.length || 0);
      return data.map(profile => ({
        id: profile.id,
        gc_account_id: profile.gc_account_id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        company_name: profile.company_name,
        phone_number: profile.phone_number,
        address: profile.address,
        license_number: profile.license_number,
        website: profile.website,
        bio: profile.bio,
        has_completed_profile: profile.has_completed_profile,
        account_status: profile.account_status,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }));
    },
    enabled: !!gcAccountId,
  });

  // Check if user can manage team members
  const canManageTeam = isGCAdmin || isPlatformAdmin;

  // Filter team members based on the active tab
  const filteredTeamMembers = teamMembers.filter(member => {
    if (activeTab === "employees") {
      // Show all team members in the Team Members tab
      return true;
    }
    if (activeTab === "project_managers") {
      return member.role === "project_manager";
    }
    if (activeTab === "admins") {
      return isRoleAdmin(member.role);
    }
    return false;
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle successful invitation
  const handleInviteSuccess = () => {
    setIsInviteDialogOpen(false);
    refetch();
  };

  // Show a message if no GC account ID
  if (!gcAccountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your company team members</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-800 font-medium">Company Setup Needed</AlertTitle>
            <AlertDescription className="text-amber-700">
              Please set up your company profile before adding team members.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoadingTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Loading team members...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cnstrct-navy"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (teamMembersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load team members. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your company's team members</CardDescription>
        </div>
        {canManageTeam && (
          <Button 
            variant="default" 
            className="flex items-center gap-1"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Invite User
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="employees">Team Members</TabsTrigger>
            <TabsTrigger value="project_managers">Project Managers</TabsTrigger>
            <TabsTrigger value="admins">Administrators</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="pt-2">
            {filteredTeamMembers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No team members found in this category.</p>
                {canManageTeam && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTeamMembers.map((member) => (
                  <div key={member.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-2 md:mb-0">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.full_name || 'User')}`} />
                        <AvatarFallback>{member.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{member.full_name || 'Unnamed User'}</h3>
                          <Badge variant="outline" className="ml-2">
                            {getTeamDisplayRole(member.role)}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          {member.email && (
                            <div className="flex items-center mr-4">
                              <Mail className="h-3 w-3 mr-1" />
                              <span>{member.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                      {member.phone_number && (
                        <Badge variant="outline" className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.phone_number}
                        </Badge>
                      )}
                      {member.company_name && (
                        <Badge variant="outline" className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {member.company_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <InviteUserForm 
            onSubmit={handleInviteSuccess} 
            onCancel={() => setIsInviteDialogOpen(false)} 
            isLoading={false}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
