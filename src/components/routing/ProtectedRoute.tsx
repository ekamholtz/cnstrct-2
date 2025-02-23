
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['user_role'];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (currentSession) {
          setSession(currentSession);

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('has_completed_profile, role')
            .eq('id', currentSession.user.id)
            .single();

          if (!mounted) return;

          if (profileError) {
            console.error("Error fetching profile:", profileError);
          } else if (profileData) {
            setHasCompletedProfile(profileData.has_completed_profile);
            setUserRole(profileData.role);
            
            // Check admin permission
            const { data: permissions } = await supabase
              .rpc('get_user_permissions', { 
                user_id: currentSession.user.id 
              });
            
            if (mounted && permissions) {
              setIsAdmin(permissions.some(p => p.feature_key === 'admin.access'));
            }
          }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      
      if (newSession !== session) {
        setSession(newSession);
        setLoading(true);
        await checkSession();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
  } else if (currentPath === '/client-dashboard' && userRole !== 'homeowner') {
    // Protect client-dashboard route
    redirectTo = '/dashboard';
  } else if (currentPath === '/') {
    if (isAdmin) {
      redirectTo = '/admin';
    } else if (userRole === 'homeowner') {
      redirectTo = '/client-dashboard';
    } else if (userRole === 'gc_admin' || userRole === 'project_manager') {
      redirectTo = '/dashboard';
    }
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
