
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session);
        setSession(session);

        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('has_completed_profile, role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
            return;
          }

          setHasCompletedProfile(data.has_completed_profile);
          setUserRole(data.role);
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = hasPermission('admin.access');
  console.log("Route check:", { 
    isAdmin, 
    userRole, 
    path: location.pathname, 
    hasCompletedProfile 
  });

  // Profile completion check takes precedence
  if (hasCompletedProfile === false && location.pathname !== '/profile-completion') {
    return <Navigate to="/profile-completion" replace />;
  }

  // Admin route protection - prevent non-admins from accessing admin routes
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Root route handling
  if (location.pathname === '/') {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (userRole === 'homeowner') {
      return <Navigate to="/client-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Admin should only be able to access /admin and its subroutes
  if (isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
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
