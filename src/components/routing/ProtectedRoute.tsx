
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { Header } from "@/components/landing/Header";

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
          const { data, error } = await supabase
            .from('profiles')
            .select('has_completed_profile, role')
            .eq('id', session.user.id)
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

  if (!hasCompletedProfile && window.location.pathname !== '/profile-completion') {
    return <Navigate to="/profile-completion" replace />;
  }

  // Check user role from user metadata if available, fallback to profile role
  const currentRole = session?.user?.user_metadata?.role || userRole;
  
  // Check if user is on the root path or dashboard and redirect based on role
  if (hasCompletedProfile && (window.location.pathname === '/' || window.location.pathname === '/dashboard')) {
    console.log("Checking role-based redirect. Current role:", currentRole);
    
    if (currentRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (currentRole === 'homeowner') {
      console.log("Redirecting homeowner to client dashboard");
      return <Navigate to="/client-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Wrap children with the appropriate navigation based on user role
  const wrappedChildren = (
    <>
      {currentRole === 'admin' ? <AdminNav /> : <Header />}
      {children}
    </>
  );

  return wrappedChildren;
};
