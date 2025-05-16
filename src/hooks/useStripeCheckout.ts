
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectToCheckout = async (priceId?: string) => {
    setIsLoading(true);
    setCheckoutError(null);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to subscribe');
      }

      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId, // Optional - if not provided, will use default price
          successUrl: `${window.location.origin}/subscription-success`,
          cancelUrl: `${window.location.origin}/subscription-selection`,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned from server');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'An error occurred during checkout');
      
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: error.message || 'Failed to start checkout process',
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
}
