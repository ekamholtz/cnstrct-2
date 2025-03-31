import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Edge function URL for Stripe operations
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions`
  : 'http://localhost:54321/functions/v1/stripe-subscriptions';

interface LocationState {
  gcAccountId?: string;
  userId?: string;
  isNewUser?: boolean;
}

const SubscriptionCheckout = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as LocationState;

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        setLoading(true);
        
        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found');
        }
        
        // Get current user information
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const userId = state?.userId || user.id;
        const userEmail = user.email || '';
        
        console.log("Creating checkout session for user:", userId);

        // Get the user's profile to find their GC account
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('gc_account_id, full_name')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw new Error('Failed to load user profile');
        }

        // Make sure we have a GC account ID (either from state or profile)
        const gcAccountId = state?.gcAccountId || profileData.gc_account_id;
        if (!gcAccountId) {
          throw new Error('GC account not found');
        }
        
        // Get GC account details to obtain company name
        const { data: gcAccountData, error: gcAccountError } = await supabase
          .from('gc_accounts')
          .select('company_name')
          .eq('id', gcAccountId)
          .single();
          
        if (gcAccountError) {
          console.error("GC Account fetch error:", gcAccountError);
          throw new Error('Failed to load company information');
        }
        
        const userName = profileData.full_name || 'Customer';
        const companyName = gcAccountData.company_name || 'Company';

        // Call the Supabase Edge Function to create a Stripe Checkout session
        try {
          const successUrl = `${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}&gc_account_id=${gcAccountId}&is_new_user=${state?.isNewUser ? 'true' : 'false'}`;
          const cancelUrl = `${window.location.origin}/auth`;
          
          // This is for direct platform subscription, not Stripe Connect
          const requestData = {
            type: 'create_checkout',
            customer: {
              id: userId,
              email: userEmail,
              name: userName,
              metadata: {
                gc_account_id: gcAccountId,
                company_name: companyName
              }
            },
            success_url: successUrl,
            cancel_url: cancelUrl
          };
          
          console.log("Sending request to Stripe Subscriptions Edge Function with params:", requestData);
          
          const response = await axios.post(
            EDGE_FUNCTION_URL, 
            requestData,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              }
            }
          );
          
          console.log("Edge Function response:", response.data);
          
          // Redirect to the Stripe Checkout page
          if (response.data?.url) {
            window.location.href = response.data.url;
          } else {
            throw new Error('No checkout URL returned from Edge Function');
          }
        } catch (error: any) {
          console.error('Error from Edge Function:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            throw new Error(`API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
          } else if (error.request) {
            console.error('No response received:', error.request);
            throw new Error('No response received from server');
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('Error creating checkout session:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to create checkout session. Please try again.'
        });
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    createCheckoutSession();
  }, [navigate, state, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center p-8 max-w-md w-full">
        <img 
          src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png" 
          alt="CNSTRCT" 
          className="h-12 mx-auto mb-8"
        />
        {loading ? (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Loader2 className="h-12 w-12 animate-spin text-cnstrct-orange mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Preparing Your Subscription</h2>
            <p className="text-gray-600">
              We're setting up your subscription options. Please wait a moment.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
