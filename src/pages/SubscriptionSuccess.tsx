import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';

// Edge function URL for Stripe operations
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions`
  : 'http://localhost:54321/functions/v1/stripe-subscriptions';

const SubscriptionSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const sessionId = searchParams.get('session_id');
  const gcAccountId = searchParams.get('gc_account_id');
  const isNewUser = searchParams.get('is_new_user') === 'true';

  useEffect(() => {
    const processSubscription = async () => {
      if (!sessionId || !gcAccountId) {
        setError('Missing session information. Please try again.');
        setLoading(false);
        return;
      }

      try {
        console.log("Processing subscription for session:", sessionId, "and GC account:", gcAccountId);
        
        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found');
        }

        // Call the Supabase Edge Function to verify and process the subscription
        const requestData = {
          type: 'verify_checkout',
          session_id: sessionId,
          metadata: {
            gc_account_id: gcAccountId
          }
        };

        console.log("Sending verification request to Stripe Subscriptions Edge Function:", requestData);
        
        const response = await axios.post(EDGE_FUNCTION_URL, requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        console.log("Verification response:", response.data);

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Failed to verify subscription');
        }

        const subscriptionTierId = response.data.subscription_tier_id || response.data.subscriptionTierId;
        console.log("Subscription tier ID:", subscriptionTierId);

        // Update the GC account with the subscription tier ID
        const { error: updateError } = await supabase
          .from('gc_accounts')
          .update({ 
            subscription_tier_id: subscriptionTierId,
            updated_at: new Date()
          })
          .eq('id', gcAccountId);

        if (updateError) {
          console.error("GC account update error:", updateError);
          throw new Error('Failed to update subscription information');
        }

        // If this is a new user, we need to get their user ID to update profile completion status
        if (isNewUser) {
          // Get the current user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Update the user's profile to mark it as completed
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                has_completed_profile: true,
                updated_at: new Date()
              })
              .eq('id', user.id);

            if (profileError) {
              console.error("Profile update error:", profileError);
              // Non-fatal error, can continue
            }
          }
        }

        // Show success message
        toast({
          title: 'Success',
          description: 'Your subscription has been activated successfully!'
        });

        // Wait a moment before redirecting
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error: any) {
        console.error('Error processing subscription:', error);
        setError(error.message || 'Failed to process subscription. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    processSubscription();
  }, [sessionId, gcAccountId, isNewUser, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Animated background */}
      <AnimatedGridPattern 
        className="absolute inset-0 z-0" 
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
      <main className="flex-grow flex items-center justify-center p-6 z-10 relative">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {loading ? (
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-cnstrct-orange mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Activating Your Subscription</h2>
              <p className="text-gray-600">
                We're finalizing your subscription details. This will only take a moment...
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Something Went Wrong</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate("/auth")} className="w-full bg-cnstrct-orange text-white">
                Return to Login
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Subscription Activated!</h2>
              <p className="text-gray-600 mb-8">
                Your subscription has been successfully activated. You now have full access to all platform features.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="w-full bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 text-white">
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubscriptionSuccess;
