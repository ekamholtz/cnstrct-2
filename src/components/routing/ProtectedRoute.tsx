
import { Navigate, useLocation } from "react-router-dom";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, isLoading, isAuthenticated } = useUserProfile();
  const currentPath = location.pathname;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile && isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  let redirectTo: string | null = null;

  // Direct GC to their dashboard after login, skipping profile completion
  if (profile.role === 'gc_admin') {
    if (currentPath === '/auth' || currentPath === '/') {
      redirectTo = '/gc-projects';
    }
  } else if (currentPath === '/profile-completion') {
    if (profile.has_completed_profile) {
      redirectTo = profile.role === 'admin' ? '/admin' : 
                  profile.role === 'homeowner' ? '/client-dashboard' : 
                  '/dashboard';
    }
  } else {
    if (!profile.has_completed_profile) {
      redirectTo = '/profile-completion';
    } else if (currentPath.startsWith('/admin') && profile.role !== 'admin') {
      redirectTo = '/dashboard';
    } else if (currentPath === '/client-dashboard' && profile.role !== 'homeowner') {
      redirectTo = '/dashboard';
    } else if (currentPath === '/dashboard' && profile.role === 'homeowner') {
      redirectTo = '/client-dashboard';
    } else if (currentPath === '/') {
      redirectTo = profile.role === 'admin' ? '/admin' :
                  profile.role === 'homeowner' ? '/client-dashboard' :
                  '/dashboard';
    }
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  const Navigation = profile.role === 'admin' ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
