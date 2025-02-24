
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEffect, useState } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, isLoading } = useUserProfile();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const currentPath = location.pathname;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while we're checking authentication and loading profile
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // If authenticated but no profile, this means there's an error
  if (!profile && isAuthenticated) {
    console.error("Authenticated but no profile found");
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
