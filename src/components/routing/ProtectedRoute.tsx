
import { Navigate, useLocation } from "react-router-dom";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainNav } from "@/components/navigation/MainNav";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, isLoading, isAuthenticated } = useUserProfile();

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

  // Special handling for GC users
  if (profile.role === 'gc_admin' && location.pathname !== '/gc-projects') {
    return <Navigate to="/gc-projects" replace />;
  }

  // Handle non-GC user routing
  if (profile.role !== 'gc_admin') {
    if (!profile.has_completed_profile && location.pathname !== '/profile-completion') {
      return <Navigate to="/profile-completion" replace />;
    }

    if (profile.has_completed_profile && location.pathname === '/profile-completion') {
      const redirectPath = 
        profile.role === 'admin' ? '/admin' :
        profile.role === 'homeowner' ? '/client-dashboard' :
        '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }

    if (location.pathname === '/') {
      const homePath = 
        profile.role === 'admin' ? '/admin' :
        profile.role === 'homeowner' ? '/client-dashboard' :
        '/dashboard';
      return <Navigate to={homePath} replace />;
    }
  }

  const Navigation = profile.role === 'admin' ? AdminNav : MainNav;
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
