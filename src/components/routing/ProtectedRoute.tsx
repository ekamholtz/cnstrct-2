
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session);
        setSession(session);

        if (session) {
          // First check metadata for admin role
          const isAdminInMetadata = session.user.user_metadata.role === 'admin';
          if (isAdminInMetadata) {
            console.log("Admin role found in metadata");
            setUserRole('admin');
            setHasCompletedProfile(true); // Admins don't need profile completion
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .rpc('get_user_profile', { user_id: session.user.id })
            .single();

          console.log("Profile data:", data, "Error:", error);

          if (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
            return;
          }

          if (!data) {
            console.log("No profile found, creating one...");
            const roleFromMetadata = session.user.user_metadata.role;
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata.full_name || '',
                role: roleFromMetadata,
                has_completed_profile: false,
                address: '',
              });

            if (insertError) {
              console.error("Error creating profile:", insertError);
            }
            setHasCompletedProfile(false);
            setUserRole(roleFromMetadata);
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

  // Check for admin status from either metadata or profile
  const metadataRole = session?.user?.user_metadata?.role;
  const isAdmin = userRole === 'admin' || metadataRole === 'admin';
  console.log("Is admin user:", isAdmin, "User role:", userRole, "Metadata role:", metadataRole);

  // Admin users skip profile completion
  if (!isAdmin && hasCompletedProfile === false && window.location.pathname !== '/profile-completion') {
    console.log("Redirecting to profile completion");
    return <Navigate to="/profile-completion" replace />;
  }

  // Immediate routing for admin users
  if (isAdmin && window.location.pathname !== '/admin') {
    console.log("Admin user detected - routing to admin dashboard");
    return <Navigate to="/admin" replace />;
  }

  // Route to appropriate dashboard when on root path
  if (hasCompletedProfile && window.location.pathname === '/') {
    console.log("Routing to dashboard for role:", userRole);
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'homeowner') {
      return <Navigate to="/client-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Protect admin routes
  if (!isAdmin && window.location.pathname.startsWith('/admin')) {
    console.log("Non-admin attempting to access admin route");
    return <Navigate to={userRole === 'homeowner' ? '/client-dashboard' : '/dashboard'} replace />;
  }

  // Protect role-specific dashboards
  if (userRole === 'homeowner' && window.location.pathname === '/dashboard') {
    return <Navigate to="/client-dashboard" replace />;
  }

  if (userRole === 'gc_admin' && window.location.pathname === '/client-dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  // Select appropriate navigation component
  const Navigation = isAdmin ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
