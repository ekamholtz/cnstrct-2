
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QBOSettings } from "@/components/settings/QBOSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { StandardLayout } from "@/components/layout/StandardLayout";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight, User, Bell, Shield } from "lucide-react";

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
    <StandardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Shield className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Settings Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded-md" 
                        defaultValue={user?.user_metadata?.full_name || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full p-2 border rounded-md bg-gray-50" 
                        defaultValue={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <input 
                        type="tel" 
                        className="w-full p-2 border rounded-md" 
                        defaultValue={user?.user_metadata?.phone || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Title</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded-md" 
                        defaultValue={user?.user_metadata?.job_title || ''}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Profile Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>Manage your CNSTRCT subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integrations Tab */}
          <TabsContent value="integrations">
            {/* Payment Processing Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>Set up and manage Stripe Connect to receive payments from your customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Connect your Stripe account to receive payments directly from your customers through CNSTRCT.
                  </p>
                  <div className="flex items-center space-x-4">
                    <CreditCard className="h-8 w-8 text-cnstrct-navy" />
                    <div>
                      <h3 className="text-lg font-medium">Stripe Connect</h3>
                      <p className="text-sm text-gray-500">
                        Accept payments, track transactions, and manage your payment settings
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link to="/settings/payments">
                      Manage Payment Settings
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
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
            
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link to="/integrations">
                  View All Integrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
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
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
}
