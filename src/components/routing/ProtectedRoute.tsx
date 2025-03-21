import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNavWithSettings";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/database.types";
import { isRoleAdmin } from "@/utils/role-utils";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        console.log("Current user:", user);

        const { data, error } = await supabase
          .from("profiles")
          .select("has_completed_profile, role")
          .eq("id", user.id)
          .maybeSingle();

        console.log("Profile data:", data, "Error:", error);

        if (error) {
          console.error("Error fetching profile:", error);
          setLoading(false);
          return;
        }

        if (!data) {
          console.log("No profile found, creating one...");
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: user.user_metadata.full_name || user.email || 'New User',
              role: user.user_metadata.role || 'contractor',
              has_completed_profile: true
            });

          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
          setHasCompletedProfile(true);
          setUserRole(user.user_metadata.role || 'contractor');
        } else {
          setHasCompletedProfile(data.has_completed_profile);
          setUserRole(data.role);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error in checkProfile:", error);
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  // Add debug logging
  useEffect(() => {
    console.log("ProtectedRoute state:", {
      user,
      loading,
      authLoading,
      hasCompletedProfile,
      userRole,
      path: location.pathname
    });
  }, [user, loading, authLoading, hasCompletedProfile, userRole, location.pathname]);

  if (authLoading || loading) {
    console.log("Loading authentication and profile state...");
    return <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cnstrct-navy"></div>
    </div>;
  }

  if (!user) {
    console.log("No user, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  const currentRole = user?.user_metadata?.role || userRole;
  
  console.log("Navigation check:", {
    path: location.pathname,
    role: currentRole,
    hasCompletedProfile,
    isInvoicePath: ['/invoice', '/invoices'].includes(location.pathname)
  });

  // Handle profile completion check
  if (hasCompletedProfile === false && location.pathname !== '/profile-completion') {
    console.log("Redirecting to profile completion");
    return <Navigate to="/profile-completion" replace />;
  }

  // Root path handling
  if (location.pathname === '/') {
    console.log("Handling root path navigation");
    if (currentRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (currentRole === 'homeowner') {
      return <Navigate to="/client-dashboard" replace />;
    } else if (currentRole === 'general_contractor' || currentRole === 'gc_admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Handle client route access
  if ((currentRole === 'general_contractor' || currentRole === 'gc_admin') && 
      location.pathname.startsWith('/client-')) {
    console.log("GC attempting to access client pages");
    return <Navigate to="/dashboard" replace />;
  }

  // Use MainNav for gc_admin users on the reporting page, otherwise use AdminNav for admin roles
  const Navigation = currentRole === 'gc_admin' && location.pathname === '/reporting' 
    ? MainNav 
    : isRoleAdmin(currentRole) 
      ? AdminNav 
      : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
