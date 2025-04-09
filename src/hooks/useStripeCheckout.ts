
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loadStripeScript, initializeStripe } from '@/utils/stripe-utils';

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { toast } = useToast();

  const redirectToCheckout = async () => {
    try {
      setIsLoading(true);
      setCheckoutError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to continue');
      }
      
      // Create a checkout session via the Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'standard', // Default plan
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Error redirecting to checkout:', error);
      setCheckoutError(error.message || 'Failed to redirect to payment page');
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: error.message || 'Failed to redirect to payment page',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    checkoutError,
    redirectToCheckout,
  };
};
