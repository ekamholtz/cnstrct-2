
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNavWithSettings";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
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
          .select("role")
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
          setUserRole(user.user_metadata.role || 'contractor');
        } else {
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

  if (loading) {
    console.log("Loading...");
    return null;
  }

  if (!user) {
    console.log("No user, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  const currentRole = user?.user_metadata?.role || userRole;
  
  console.log("Navigation check:", {
    path: location.pathname,
    role: currentRole,
    isInvoicePath: ['/invoice', '/invoices'].includes(location.pathname)
  });

  // Remove profile completion check - profile completion page is no longer part of the workflow
  // This ensures users don't get stuck on the profile-completion page

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

  // Special handling for profile-completion page - redirect to dashboard
  if (location.pathname === '/profile-completion') {
    console.log("Redirecting from profile-completion to appropriate dashboard");
    if (currentRole === 'homeowner') {
      return <Navigate to="/client-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Handle client route access
  if ((currentRole === 'general_contractor' || currentRole === 'gc_admin') && 
      location.pathname.startsWith('/client-')) {
    console.log("GC attempting to access client pages");
    return <Navigate to="/dashboard" replace />;
  }

  const Navigation = currentRole === 'admin' ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
