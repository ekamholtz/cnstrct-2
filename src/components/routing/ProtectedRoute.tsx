
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/database.types";
import { isRoleAdmin } from "@/utils/role-utils";
import { Loader2 } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        if (!user) {
          console.log("No authenticated user in ProtectedRoute");
          
          // Check if we have an auth session that hasn't been loaded into context yet
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (!sessionData?.session?.user) {
            console.log("No session found in ProtectedRoute");
            setLoading(false);
            return;
          }
          
          console.log("Session found in ProtectedRoute but no user context:", 
            sessionData.session.user.email);
            
          // Continue with the session user
          const sessionUser = sessionData.session.user;
          
          const { data, error } = await supabase
            .from("profiles")
            .select("has_completed_profile, role, gc_account_id")
            .eq("id", sessionUser.id)
            .maybeSingle();
            
          if (error) {
            console.error("Error fetching profile:", error);
          } else if (data) {
            setHasCompletedProfile(data.has_completed_profile);
            setUserRole(data.role);
            
            // Check for subscription if this is a gc_admin
            if (data.role === 'gc_admin' && data.gc_account_id) {
              const { data: gcAccount } = await supabase
                .from("gc_accounts")
                .select("subscription_tier_id")
                .eq("id", data.gc_account_id)
                .maybeSingle();
                
              setHasSubscription(!!gcAccount?.subscription_tier_id);
            } else {
              setHasSubscription(true); // Non-gc_admin users don't need a subscription
            }
          }
          
          setLoading(false);
          return;
        }

        console.log("Current user:", user.email);

        const { data, error } = await supabase
          .from("profiles")
          .select("has_completed_profile, role, gc_account_id")
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
          setHasSubscription(false); // New profile doesn't have subscription
        } else {
          setHasCompletedProfile(data.has_completed_profile);
          setUserRole(data.role);
          
          // Check for subscription in gc_accounts if this is a gc_admin with a gc_account_id
          if (data.role === 'gc_admin' && data.gc_account_id) {
            const { data: gcAccount, error: gcError } = await supabase
              .from("gc_accounts")
              .select("subscription_tier_id")
              .eq("id", data.gc_account_id)
              .maybeSingle();
              
            if (gcError) {
              console.error("Error fetching GC account:", gcError);
              setHasSubscription(false);
            } else {
              setHasSubscription(!!gcAccount?.subscription_tier_id);
            }
          } else {
            // For non-gc_admin users or gc_admin without account, no subscription required
            setHasSubscription(true);
          }
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
      user: user?.email,
      loading,
      authLoading,
      hasCompletedProfile,
      hasSubscription,
      userRole,
      path: location.pathname
    });
  }, [user, loading, authLoading, hasCompletedProfile, hasSubscription, userRole, location.pathname]);

  if (authLoading || loading) {
    console.log("Loading authentication and profile state...");
    return <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cnstrct-navy"></div>
    </div>;
  }

  // Special handling for subscription pages which should be accessible even when not fully authenticated
  const isSubscriptionPage = [
    '/subscription-checkout',
    '/subscription-success',
    '/subscription-selection',
    '/auth/company-details'
  ].includes(location.pathname);
  
  if (isSubscriptionPage && location.state) {
    console.log("Allowing access to subscription page with state:", location.state);
    return <>{children}</>;
  }

  if (!user) {
    console.log("No user, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  const currentRole = user?.user_metadata?.role || userRole;
  
  // Check if user needs to complete profile
  if (hasCompletedProfile === false && location.pathname !== "/profile-completion") {
    console.log("Profile not completed, redirecting to profile completion");
    return <Navigate to="/profile-completion" replace />;
  }

  // Check if user needs to select a subscription (for gc_admin users)
  if (currentRole === 'gc_admin' && hasSubscription === false && 
      !isSubscriptionPage) {
    console.log("GC admin without subscription, redirecting to subscription selection");
    return <Navigate 
      to="/subscription-selection" 
      state={{ userId: user.id, isNewUser: false }} 
      replace 
    />;
  }

  // For admin users, use AdminNav
  if (isRoleAdmin(currentRole)) {
    return (
      <div className="flex h-screen">
        <AdminNav />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // For regular users, use MainNav
  return (
    <div className="flex flex-col h-screen">
      <MainNav />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
