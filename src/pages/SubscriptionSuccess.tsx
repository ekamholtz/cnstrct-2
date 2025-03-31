
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(true);
  
  // Get query parameters
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  const gcAccountId = searchParams.get('gc_account_id');
  const isNewUser = searchParams.get('is_new_user') === 'true';

  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      if (!sessionId || !gcAccountId) {
        console.log("Missing required parameters:", { sessionId, gcAccountId });
        toast({
          title: 'Warning',
          description: 'Missing subscription information. Your subscription may not be activated correctly.',
        });
        setUpdating(false);
        return;
      }

      try {
        console.log("Updating subscription status for GC account:", gcAccountId);
        
        // Check for an existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          console.log("No auth session found. Will attempt to update without authentication.");
          // You may want to redirect to login here or handle this case differently
        }
        
        // Update the subscription status in the database
        const { error } = await supabase
          .from('gc_accounts')
          .update({ 
            subscription_tier_id: '00000000-0000-0000-0000-000000000000', // Use a dummy ID or fetch a real one
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', gcAccountId);

        if (error) {
          console.error('Error updating subscription status:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update subscription status. Please contact support.',
          });
        } else {
          console.log("Subscription status updated successfully");
          toast({
            title: 'Success',
            description: 'Your subscription has been activated successfully!',
          });
        }
      } catch (error) {
        console.error('Error in subscription success:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred. Please contact support.',
        });
      } finally {
        setUpdating(false);
      }
    };

    updateSubscriptionStatus();
  }, [sessionId, gcAccountId, toast]);

  const handleContinue = () => {
    // Check if we have a session before navigating
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        console.log("No session found, redirecting to auth");
        navigate('/auth');
        return;
      }
      
      // Determine where to navigate based on isNewUser and potentially user role
      if (isNewUser) {
        // Get the user's role to determine where to navigate
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) {
            navigate('/auth');
            return;
          }
          
          // Check user role
          supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
            .then(({ data: profile, error }) => {
              if (error || !profile) {
                console.error("Error fetching profile:", error);
                navigate('/dashboard'); // Default fallback
                return;
              }
              
              if (profile.role === "homeowner") {
                navigate('/client-dashboard');
              } else if (profile.role === "gc_admin" || profile.role === "general_contractor") {
                navigate('/dashboard');
              } else if (profile.role === "admin") {
                navigate('/admin');
              } else {
                navigate('/dashboard');
              }
            });
        });
      } else {
        // For existing users updating subscription, always go to dashboard
        navigate('/dashboard');
      }
    });
  };

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
            className="h-10"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 z-10 relative flex items-center justify-center">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {updating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-cnstrct-navy animate-spin mb-4" />
              <p className="text-gray-600">Activating your subscription...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-cnstrct-navy mb-3">Subscription Activated!</h1>
              
              <p className="text-gray-600 mb-6">
                Thank you for subscribing to CNSTRCT. Your account has been successfully activated and you now have access to all features.
              </p>
              
              <Button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 hover:from-cnstrct-orange/90 hover:to-cnstrct-orange text-white"
              >
                Continue to Dashboard
              </Button>
            </>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} CNSTRCT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SubscriptionSuccess;
