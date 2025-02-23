
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
          
          // If we're on the index page, redirect based on role
          if (location.pathname === '/') {
            if (data.role === 'homeowner') {
              window.location.href = '/client-dashboard';
              return;
            } else if (data.role === 'gc_admin') {
              window.location.href = '/dashboard';
              return;
            } else if (data.role === 'admin') {
              window.location.href = '/admin';
              return;
            }
          }

          // Check if user is trying to access incorrect dashboard
          const currentPath = location.pathname;
          const userRole = data.role;

          // Redirect based on role if on wrong dashboard
          if (userRole === 'homeowner' && currentPath === '/dashboard') {
            window.location.href = '/client-dashboard';
            return;
          } else if (userRole === 'gc_admin' && currentPath === '/client-dashboard') {
            window.location.href = '/dashboard';
            return;
          }
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
  }, [location]);

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

  if (hasCompletedProfile === false && location.pathname !== '/profile-completion') {
    console.log("Redirecting to profile completion");
    return <Navigate to="/profile-completion" replace />;
  }

  // Check admin access using permission system
  const isAdmin = hasPermission('admin.access');
  
  // Prevent non-admins from accessing admin routes
  if (!isAdmin && location.pathname.startsWith('/admin')) {
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
