
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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

          console.log("Profile data:", data, "Error:", error);

          if (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
            return;
          }

          if (!data) {
            console.log("No profile found, creating one...");
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata.full_name || '',
                role: session.user.user_metadata.role,
                has_completed_profile: false,
                address: '', // Required field, will be completed during profile completion
              });

            if (insertError) {
              console.error("Error creating profile:", insertError);
            }
            setHasCompletedProfile(false);
            setUserRole(session.user.user_metadata.role);
          } else {
            setHasCompletedProfile(data.has_completed_profile);
            setUserRole(data.role);
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
  }, []);

  if (loading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If profile is not completed, always redirect to profile completion
  if (hasCompletedProfile === false && location.pathname !== '/profile-completion') {
    console.log("Redirecting to profile completion");
    return <Navigate to="/profile-completion" replace />;
  }

  // Get current role from user metadata if available, fallback to profile role
  const currentRole = session?.user?.user_metadata?.role || userRole;
  
  console.log("Current path:", location.pathname);
  console.log("Current role:", currentRole);
  console.log("Has completed profile:", hasCompletedProfile);

  // If we're on the root path and the profile is completed, redirect to appropriate dashboard
  if (hasCompletedProfile && location.pathname === '/') {
    console.log("On root path, redirecting to appropriate dashboard");
    
    // Don't redirect if we're trying to go somewhere else (check state)
    if (!location.state?.navigating) {
      if (currentRole === 'admin') {
        return <Navigate to="/admin" replace />;
      } else if (currentRole === 'homeowner') {
        return <Navigate to="/client-dashboard" replace />;
      } else if (currentRole === 'general_contractor' || currentRole === 'gc_admin') {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Prevent homeowners from accessing GC-specific routes
  if (currentRole === 'homeowner') {
    const restrictedRoutes = ['/dashboard', '/invoices', '/invoice'];
    if (restrictedRoutes.includes(location.pathname)) {
      console.log("Homeowner attempting to access GC routes, redirecting to client dashboard");
      return <Navigate to="/client-dashboard" replace />;
    }
  }

  // Prevent GCs from accessing client-specific routes
  if ((currentRole === 'general_contractor' || currentRole === 'gc_admin') && 
      location.pathname.startsWith('/client-')) {
    console.log("GC attempting to access client pages, redirecting to GC dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // Wrap children with the appropriate navigation based on user role
  const Navigation = currentRole === 'admin' ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
