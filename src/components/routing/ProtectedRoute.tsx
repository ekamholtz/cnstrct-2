
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, isLoading } = useUserProfile();
  const currentPath = location.pathname;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // If no profile, redirect to auth
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Define a single redirect based on conditions
  let redirectTo: string | null = null;

  // Special handling for /profile-completion route
  if (currentPath === '/profile-completion') {
    // If on profile completion page and profile is completed, redirect to appropriate dashboard
    if (profile.has_completed_profile) {
      redirectTo = profile.role === 'admin' ? '/admin' : 
                  profile.role === 'homeowner' ? '/client-dashboard' : 
                  '/dashboard';
    }
    // If on profile completion and profile not completed, allow access
  } else {
    // For all other routes
    if (!profile.has_completed_profile) {
      // Redirect to profile completion if profile not completed
      redirectTo = '/profile-completion';
    } else if (currentPath.startsWith('/admin') && profile.role !== 'admin') {
      redirectTo = '/dashboard';
    } else if (currentPath === '/client-dashboard' && profile.role !== 'homeowner') {
      redirectTo = '/dashboard';
    } else if (currentPath === '/dashboard' && profile.role === 'homeowner') {
      redirectTo = '/client-dashboard';
    } else if (currentPath === '/') {
      redirectTo = profile.role === 'admin' ? '/admin' :
                  profile.role === 'homeowner' ? '/client-dashboard' :
                  '/dashboard';
    }
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  const Navigation = profile.role === 'admin' ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
