
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { loadStripeScript, initializeStripe } from '@/utils/stripe-utils';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51QzjhnApu80f9E3HjlgkmHwM1a4krzjoz0sJlsz41wIhMYIr1sst6sx2mCZ037PiY2UE6xfNA5zzkxCQwOAJ4yoD00gm7TIByL';

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(true);
  const [stripe, setStripe] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize Stripe
  useEffect(() => {
    const setupStripe = async () => {
      try {
        setIsLoading(true);
        
        // Load the Stripe.js script
        await loadStripeScript();
        
        // Initialize Stripe with our publishable key
        const stripeInstance = initializeStripe(STRIPE_PUBLISHABLE_KEY);
        setStripe(stripeInstance);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up Stripe:', error);
        setCheckoutError('Failed to load payment system. Please try again.');
        setIsLoading(false);
      }
    };
    
    setupStripe();
  }, []);

  // Function to redirect to Stripe Checkout
  const redirectToCheckout = useCallback(async (priceId?: string) => {
    try {
      setIsLoading(true);
      setCheckoutError(null);
      
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      
      if (!user) {
        throw new Error('You must be logged in to purchase a subscription');
      }
      
      // Get user's profile to get gc_account_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }
      
      const gcAccountId = profileData.gc_account_id;
      
      if (!gcAccountId) {
        throw new Error('You need to complete your company setup first');
      }
      
      // Call our endpoint to create a Checkout session
      const { data: sessionData, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: priceId,
          customerId: user.id,
          gcAccountId: gcAccountId,
          successUrl: `${window.location.origin}/subscription-success?gc_account_id=${gcAccountId}`,
          cancelUrl: `${window.location.origin}/subscription-selection`
        }
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error('Failed to create checkout session');
      }
      
      if (!sessionData || !sessionData.sessionId) {
        throw new Error('Invalid response from checkout session creation');
      }
      
      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: sessionData.sessionId
      });
      
      if (redirectError) {
        console.error('Error redirecting to checkout:', redirectError);
        throw new Error(redirectError.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'An error occurred during checkout');
      toast({
        variant: 'destructive',
        title: 'Checkout Failed',
        description: error.message || 'An error occurred during checkout'
      });
      setIsLoading(false);
    }
  }, [stripe, user, toast]);

  return {
    isLoading,
    checkoutError,
    redirectToCheckout
  };
}
