
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('has_completed_profile, role')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (error) {
            console.error("Error fetching profile:", error);
          } else {
            setHasCompletedProfile(data.has_completed_profile);
            setUserRole(data.role);
          }
          setSession(session);
        }
      } catch (error) {
        console.error("Error in checkSession:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading || permissionsLoading) {
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
  const currentPath = location.pathname;

  // Debugging information
  console.log("Route check:", {
    isAdmin,
    userRole,
    path: currentPath,
    hasCompletedProfile
  });

  // Define a single redirect based on conditions
  let redirectTo: string | null = null;

  if (hasCompletedProfile === false && currentPath !== '/profile-completion') {
    redirectTo = '/profile-completion';
  } else if (currentPath.startsWith('/admin') && !isAdmin) {
    redirectTo = '/dashboard';
  } else if (currentPath === '/') {
    if (isAdmin) {
      redirectTo = '/admin';
    } else if (userRole === 'homeowner') {
      redirectTo = '/client-dashboard';
    } else {
      redirectTo = '/dashboard';
    }
  } else if (isAdmin && !currentPath.startsWith('/admin')) {
    redirectTo = '/admin';
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  const Navigation = isAdmin ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
