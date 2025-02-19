
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteUserForm } from "@/components/profile/InviteUserForm";
import { TeamMembers } from "@/components/profile/TeamMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <h1 className="text-3xl font-bold">Company Profile</h1>

        <Tabs defaultValue="team" className="space-y-6">
          <TabsList>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="settings">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteUserForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamMembers />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add profile settings form here */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
