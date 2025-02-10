import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileCompletion from "./pages/ProfileCompletion";
import Dashboard from "./pages/Dashboard";
import GCProjects from "./pages/GCProjects";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProjectsPage from "./pages/ClientProjectsPage";
import ProjectDashboard from "./pages/ProjectDashboard";
import InvoiceDashboard from "./pages/InvoiceDashboard";
import InvoiceDetails from "./pages/InvoiceDetails";
import HomeownerProfile from "./pages/HomeownerProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminTransactions from "./pages/AdminTransactions";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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

  if (hasCompletedProfile && window.location.pathname === '/') {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return userRole === 'homeowner' ? 
      <Navigate to="/client-dashboard" replace /> : 
      <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
            return;
          }

          setIsAdmin(data?.role === 'admin');
        }
        setLoading(false);
      } catch (error) {
        console.error("Error in checkAdminSession:", error);
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  if (loading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/gc-projects"
            element={
              <ProtectedRoute>
                <GCProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-projects"
            element={
              <ProtectedRoute>
                <ClientProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <InvoiceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:invoiceId"
            element={
              <ProtectedRoute>
                <InvoiceDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <HomeownerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-completion"
            element={
              <ProtectedRoute>
                <ProfileCompletion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route path="/landing" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
