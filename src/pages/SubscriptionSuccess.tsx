
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
  const tierId = searchParams.get('tier_id');
  const isNewUser = searchParams.get('is_new_user') === 'true';

  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      if (!sessionId) {
        console.log("Missing session_id parameter");
        toast({
          variant: 'destructive',
          title: 'Warning',
          description: 'Missing subscription information. Your subscription may not be activated correctly.',
        });
        setUpdating(false);
        return;
      }

      try {
        console.log("Processing subscription completion with session ID:", sessionId);
        
        // Check for an existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          console.log("No auth session found. Will attempt to update without authentication.");
          // Redirect to auth after brief delay
          setTimeout(() => {
            navigate('/auth');
          }, 5000);
          return;
        }
        
        // Determine which account to update
        let accountToUpdate = gcAccountId;
        
        // If no gc_account_id provided, try to get it from user profile
        if (!accountToUpdate) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('gc_account_id')
            .eq('id', sessionData.session.user.id)
            .single();
            
          if (profileData?.gc_account_id) {
            accountToUpdate = profileData.gc_account_id;
            console.log("Using gc_account_id from user profile:", accountToUpdate);
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not determine which account to update.',
            });
            setUpdating(false);
            return;
          }
        }
        
        // Get the subscription tier ID to use
        const subscriptionTierId = tierId || '00000000-0000-0000-0000-000000000000'; // Default tier if none provided

        // Update the gc_account with the subscription information
        const { error: gcUpdateError } = await supabase
          .from('gc_accounts')
          .update({ 
            subscription_tier_id: subscriptionTierId,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', accountToUpdate);

        if (gcUpdateError) {
          console.error('Error updating subscription status:', gcUpdateError);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update subscription status. Please contact support.',
          });
        } else {
          console.log("Subscription status updated successfully");
          
          // Create or update account_subscriptions record
          const { error: subscriptionError } = await supabase
            .from('account_subscriptions')
            .upsert({
              gc_account_id: accountToUpdate,
              tier_id: subscriptionTierId,
              status: 'active',
              start_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'gc_account_id'
            });
            
          if (subscriptionError) {
            console.error('Error updating account_subscriptions:', subscriptionError);
          }
          
          toast({
            title: 'Success',
            description: 'Your subscription has been activated successfully!',
          });
          
          // Auto-redirect to dashboard after a short delay
          setTimeout(() => {
            handleContinue();
          }, 3000);
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
  }, [sessionId, gcAccountId, tierId, toast, navigate]);

  const handleContinue = () => {
    // Check if we have a session before navigating
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        console.log("No session found, redirecting to auth");
        navigate('/auth');
        return;
      }
      
      if (isNewUser) {
        navigate('/profile-completion');
      } else {
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
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

      <header className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="container mx-auto">
          <img
            src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
            alt="CNSTRCT Logo"
            className="h-10"
          />
        </div>
      </header>

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
                Continue to {isNewUser ? 'Profile Setup' : 'Dashboard'}
              </Button>
            </>
          )}
        </div>
      </main>
      
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
