
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { usePermissions } from "@/hooks/usePermissions";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session);
        setSession(session);

        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('has_completed_profile')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
            return;
          }

          setHasCompletedProfile(data.has_completed_profile);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error in checkSession:", error);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (hasCompletedProfile === false && window.location.pathname !== '/profile-completion') {
    console.log("Redirecting to profile completion");
    return <Navigate to="/profile-completion" replace />;
  }

  // Check admin access using new permission system
  const isAdmin = hasPermission('admin.access');
  
  // Determine dashboard route based on permissions
  const getDashboardRoute = () => {
    if (isAdmin) return '/admin';
    if (hasPermission('projects.view')) {
      // If they're a homeowner (only has view permissions)
      if (!hasPermission('projects.manage')) return '/client-dashboard';
      // If they're a GC or PM (has manage permissions)
      return '/dashboard';
    }
    return '/auth'; // Fallback
  };

  // Get current path
  const currentPath = window.location.pathname;
  
  // Prevent non-admins from accessing admin routes
  if (!isAdmin && currentPath.startsWith('/admin')) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  // Prevent homeowners from accessing the GC dashboard
  if (!hasPermission('projects.manage') && currentPath === '/dashboard') {
    return <Navigate to="/client-dashboard" replace />;
  }

  // Prevent GCs from accessing the client dashboard
  if (hasPermission('projects.manage') && currentPath === '/client-dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  // Wrap children with the appropriate navigation based on user role
  const Navigation = isAdmin ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
