
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Testimonials } from "@/components/landing/Testimonials";
import { ChatConversation } from "@/components/landing/ChatConversation";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        // Use RPC call instead of direct query to avoid recursion
        const { data, error } = await supabase
          .rpc('get_user_profile', { user_id: session.user.id });
        
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        setUserRole(data?.role || null);
      } else {
        setIsAuthenticated(false);
      }
    };
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // If authenticated, redirect based on role
  if (isAuthenticated && userRole) {
    console.log("Redirecting authenticated user with role:", userRole);
    if (userRole === 'homeowner') {
      return <Navigate to="/client-dashboard" replace />;
    } else if (userRole === 'gc_admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
  }

  // Show landing page only if not authenticated
  if (isAuthenticated === false) {
    useEffect(() => {
      // Load Stripe Pricing Table script
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }, []);

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Hero />
          <Features />
          <ChatConversation />
          <Testimonials />
          <Pricing />
        </main>
        <Footer />
      </div>
    );
  }

  // Show loading state while checking auth
  return <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
  </div>;
}
