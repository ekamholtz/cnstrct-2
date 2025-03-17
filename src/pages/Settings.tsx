
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QBOSettings } from "@/components/settings/QBOSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Settings() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Add debug logging
  useEffect(() => {
    console.log("Settings component - Auth state:", { user, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cnstrct-navy"></div>
      </div>
    );
  }

  if (!user) {
    // This shouldn't happen because of ProtectedRoute, but just in case
    console.log("Settings - No user found, redirecting to auth");
    toast({
      title: "Authentication required",
      description: "Please log in to access settings",
      variant: "destructive"
    });
    navigate("/auth");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-8">
          {/* Subscription Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionSettings />
            </CardContent>
          </Card>
          
          {/* Integrations Section */}
          <Tabs defaultValue="qbo" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="qbo">QuickBooks Online</TabsTrigger>
              <TabsTrigger value="other">Other Integrations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="qbo">
              <Card>
                <CardHeader>
                  <CardTitle>QuickBooks Online</CardTitle>
                  <CardDescription>
                    Connect your QuickBooks Online account to sync financial data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QBOSettings />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="other">
              <Card>
                <CardHeader>
                  <CardTitle>Other Integrations</CardTitle>
                  <CardDescription>
                    Connect other services to enhance your CNSTRCT experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Additional integrations will be available soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Profile settings will be available soon.</p>
            </CardContent>
          </Card>
          
          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings will be available soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
