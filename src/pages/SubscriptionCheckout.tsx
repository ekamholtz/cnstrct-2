
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationState {
  userId?: string;
  gcAccountId?: string;
  isNewUser?: boolean;
}

const SubscriptionCheckout = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState;

  useEffect(() => {
    // Load the Stripe Pricing Table script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);
    
    const checkUser = async () => {
      try {
        // If no user is authenticated, attempt to get one from the supabase session
        if (!user) {
          console.log("No user in context, checking for session...");
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (!sessionData?.session?.user && (!state || !state.userId)) {
            console.log("No session found and no state provided, redirecting to login");
            navigate("/auth");
            return;
          } else if (sessionData?.session?.user) {
            console.log("Session found:", sessionData.session.user.email);
          }
        } else {
          console.log("User authenticated:", user.email);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in subscription checkout:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subscription options.",
        });
        setLoading(false);
      }
    };
    
    checkUser();
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user, navigate, toast, state]);
  
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSuccess = async (event: any) => {
    // This handles the message from the Stripe pricing table when a subscription is created
    if (event?.data?.type === 'checkout.success') {
      const { sessionId } = event.data;
      console.log("Subscription successful with session ID:", sessionId);
      
      // Get the current user and gc_account_id
      let userId = user?.id || state?.userId;
      let gcAccountId = state?.gcAccountId;
      
      if (!userId || !gcAccountId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData?.session?.user?.id;
        
        if (userId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('gc_account_id')
            .eq('id', userId)
            .single();
            
          gcAccountId = profileData?.gc_account_id;
        }
      }
      
      if (userId && gcAccountId) {
        navigate(`/subscription-success?session_id=${sessionId}&gc_account_id=${gcAccountId}&is_new_user=${state?.isNewUser ? 'true' : 'false'}`);
      } else {
        navigate('/dashboard');
      }
    }
  };
  
  // Add event listener for Stripe checkout messages
  useEffect(() => {
    window.addEventListener('message', handleSuccess);
    return () => {
      window.removeEventListener('message', handleSuccess);
    };
  }, [user, state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cnstrct-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cnstrct-navy/5 to-cnstrct-navy/10 z-0"></div>
      <AnimatedGridPattern 
        className="z-0" 
        lineColor="rgba(16, 24, 64, 0.07)" 
        dotColor="rgba(16, 24, 64, 0.15)"
        lineOpacity={0.3}
        dotOpacity={0.5}
        speed={0.2}
        size={35}
      />

      {/* Header */}
      <header className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto">
          <img
            src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
            alt="CNSTRCT Logo"
            className="h-10 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-cnstrct-navy mb-3">Select Your Subscription Plan</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the subscription tier that best fits your business needs. You can upgrade or downgrade your plan at any time.
            </p>
          </div>

          {/* Stripe Pricing Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-4 mb-8">
            <stripe-pricing-table 
              pricing-table-id="prctbl_1R2HRTApu80f9E3HqCXBahYx"
              publishable-key="pk_live_51QzjhnApu80f9E3HQcOCt84dyoMh2k9e4QlmNR7a11j9ddZcjrPOqIfi1S1J47tgRTKFaDD3cL3odKRaNya6PIny00BA5N7LnX"
              mode="subscription">
            </stripe-pricing-table>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to CNSTRCT's{" "}
            <a href="#" className="text-cnstrct-orange hover:underline font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-cnstrct-orange hover:underline font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SubscriptionCheckout;
