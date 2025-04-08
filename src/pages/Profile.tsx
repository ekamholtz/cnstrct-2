import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { StandardLayout } from "@/components/layout/StandardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Profile() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Add debug logging
  React.useEffect(() => {
    console.log("Profile component - Auth state:", { user, loading });
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
    console.log("Profile - No user found, redirecting to auth");
    toast({
      title: "Authentication required",
      description: "Please log in to access your profile",
      variant: "destructive"
    });
    navigate("/auth");
    return null;
  }

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <StandardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4 border-2 border-cnstrct-navy">
                <AvatarImage src="" alt={user.user_metadata?.full_name || 'User'} />
                <AvatarFallback className="bg-cnstrct-navy text-white text-xl">
                  {getInitials(user.user_metadata?.full_name || 'User')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mb-1">{user.user_metadata?.full_name || 'User'}</h2>
              <p className="text-gray-500 mb-4">{user.email}</p>
              <Button variant="outline" className="w-full mb-2">Change Avatar</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/settings')}>
                Account Settings
              </Button>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    defaultValue={user.user_metadata?.full_name?.split(' ')[0] || ''} 
                    placeholder="First Name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    defaultValue={user.user_metadata?.full_name?.split(' ')[1] || ''} 
                    placeholder="Last Name" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user.email || ''} 
                  placeholder="Email Address" 
                  disabled 
                />
                <p className="text-sm text-gray-500">Contact support to change your email address</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  defaultValue={user.user_metadata?.phone || ''} 
                  placeholder="Phone Number" 
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  defaultValue={user.user_metadata?.job_title || ''} 
                  placeholder="Job Title" 
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardLayout>
  );
}
