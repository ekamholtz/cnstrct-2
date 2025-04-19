
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

  // Function to create a profile if it doesn't exist
  const createProfileIfNeeded = async (userId: string, userData: any) => {
    try {
      // Get user role from metadata or default to gc_admin
      const role = userData?.user_metadata?.role || 'gc_admin';
      const fullName = userData?.user_metadata?.full_name || 
        `${userData?.user_metadata?.first_name || ''} ${userData?.user_metadata?.last_name || ''}`.trim() || 
        userData?.email || 'New User';
      
      console.log("Creating missing profile for user:", userId);
      
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          email: userData?.email,
          role: role,
          account_status: 'active',
          has_completed_profile: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error creating profile:", error);
        return false;
      }
      
      console.log("Successfully created profile for user:", userId);
      return true;
    } catch (error) {
      console.error("Error in createProfileIfNeeded:", error);
      return false;
    }
  };

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
          } else {
            // Profile doesn't exist, create one
            await createProfileIfNeeded(sessionUser.id, sessionUser);
            setHasCompletedProfile(false);
            setUserRole(sessionUser.user_metadata?.role || 'gc_admin');
            setHasSubscription(false);
          }
          
          setLoading(false);
          return;
        }

        console.log("Current user:", user.email);

        const { data, error } = await supabase
          .from("profiles")
          .select("has_completed_profile, role, gc_account_id, email")
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
          // Create profile for the user
          const profileCreated = await createProfileIfNeeded(user.id, user);
          if (profileCreated) {
            setHasCompletedProfile(false);
            setUserRole(user.user_metadata?.role || 'gc_admin');
            setHasSubscription(false);
          }
        } else {
          // Update email if it's missing
          if (!data.email && user.email) {
            await supabase
              .from("profiles")
              .update({ email: user.email })
              .eq("id", user.id);
          }
          
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
    console.log("GC admin without subscription, redirecting to subscription checkout");
    return <Navigate 
      to="/subscription-checkout" 
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
