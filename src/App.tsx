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

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Current session:", session);
      setSession(session);
      if (session) {
        // Check profile completion status
        supabase
          .from('profiles')
          .select('has_completed_profile')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            console.log("Profile data:", data, "Error:", error);
            
            if (error) {
              console.error("Error fetching profile:", error);
              setLoading(false);
              return;
            }

            // If no profile exists, create one
            if (!data) {
              console.log("No profile found, creating one...");
              supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    full_name: session.user.user_metadata.full_name,
                    role: session.user.user_metadata.role,
                    has_completed_profile: false
                  }
                ])
                .then(({ error: insertError }) => {
                  if (insertError) {
                    console.error("Error creating profile:", insertError);
                  }
                  setHasCompletedProfile(false);
                  setLoading(false);
                });
            } else {
              setHasCompletedProfile(data.has_completed_profile);
              setLoading(false);
            }
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If profile is not completed and user is not already on profile completion page
  if (!hasCompletedProfile && window.location.pathname !== '/profile-completion') {
    return <Navigate to="/profile-completion" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;