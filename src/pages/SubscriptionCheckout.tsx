
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const SubscriptionCheckout = () => {
  const [loading, setLoading] = useState(true);
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Load Stripe script
  useEffect(() => {
    const loadStripeScript = () => {
      console.log("Loading Stripe script...");
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    };
    
    loadStripeScript();
  }, []);

  // Get user and account information
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!user) {
          console.log("No authenticated user found");
          setLoading(false);
          return;
        }
        
        console.log("Authenticated user found:", user.id);
        
        // Get user profile and gc_account_id
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('gc_account_id, role, email')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          setLoading(false);
          return;
        }
          
        if (profile?.gc_account_id) {
          console.log("Found gc_account_id:", profile.gc_account_id);
          setGcAccountId(profile.gc_account_id);
        } else if (profile?.role === 'gc_admin') {
          // Try to find GC account owned by this user
          const { data: gcAccount, error: gcError } = await supabase
            .from('gc_accounts')
            .select('id')
            .eq('owner_id', user.id)
            .single();
            
          if (gcError) {
            console.error("Error fetching gc account:", gcError);
          } else if (gcAccount?.id) {
            console.log("Found gc_account_id from accounts table:", gcAccount.id);
            setGcAccountId(gcAccount.id);
          } else {
            // GC admin without account - might need to create one
            toast({
              variant: 'destructive',
              title: 'Account setup required',
              description: 'Please complete your profile before subscribing',
            });
            navigate('/profile-completion');
            return;
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load account information',
        });
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [navigate, toast, user]);

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Configure stripe pricing table with success URL, client_reference_id, and full metadata
  // Ensure both gcAccountId and user.id are passed to Stripe
  const successUrl = `${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}${gcAccountId ? `&gc_account_id=${gcAccountId}` : ''}`;
  const cancelUrl = `${window.location.origin}/settings?checkout_canceled=true`;

  console.log("Success URL:", successUrl);
  console.log("Cancel URL:", cancelUrl);
  console.log("GC Account ID to be used:", gcAccountId);
  console.log("User ID to be used:", user?.id);

  // Ensure we're passing the tier ID for the backend to use
  const defaultTierId = '00000000-0000-0000-0000-000000000001';

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

      <main className="flex-grow container mx-auto px-4 py-12 z-10 relative">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-cnstrct-navy mb-3 text-center">
            Select Your Subscription Plan
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            Choose the plan that best fits your business needs
          </p>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin rounded-full border-b-2 border-cnstrct-navy" />
            </div>
          ) : (
            <>
              {/* Stripe Pricing Table with enhanced reference passing */}
              <stripe-pricing-table 
                pricing-table-id="prctbl_1R9UC0Apu80f9E3HqRPNRBtK"
                publishable-key="pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL"
                client-reference-id={gcAccountId || undefined}
                customer-email=""
                success-url={successUrl}
                cancel-url={cancelUrl}
                metadata-gc_account_id={gcAccountId || undefined}
                metadata-user_id={user?.id || undefined}
                metadata-tier_id={defaultTierId}>
              </stripe-pricing-table>
              
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="px-8"
                >
                  Cancel
                </Button>
              </div>
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

export default SubscriptionCheckout;
