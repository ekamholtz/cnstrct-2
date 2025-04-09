
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadStripeScript, redirectToStripeCheckout, initializeStripe } from '@/utils/stripe-utils';
import { useAuth } from '@/hooks/useAuth';

interface UseStripeCheckoutOptions {
  priceId?: string;
}

export const useStripeCheckout = (options?: UseStripeCheckoutOptions) => {
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(options?.priceId || null);
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!user) {
          console.log("No authenticated user found");
          setIsLoading(false);
          return;
        }
        
        console.log("Authenticated user found:", user.id);
        
        // Get the user's profile to determine if they have a GC account
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, gc_account_id, full_name')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          setCheckoutError(`Error fetching user profile: ${error.message}`);
          setIsLoading(false);
          return;
        }
        
        console.log("User profile:", profile);
        
        if (profile && profile.gc_account_id) {
          setGcAccountId(profile.gc_account_id);
        } else if (profile && profile.role === 'gc_admin') {
          await createGCAccount(profile, user);
        }
        
        // Load Stripe pricing info
        await loadStripeInfo();
        
      } catch (error) {
        console.error("Error in fetchUserDetails:", error);
        setCheckoutError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
      }
    };
    
    const createGCAccount = async (profile: any, user: any) => {
      const companyName = user.user_metadata?.company_name || `${profile.full_name}'s Company`;
      
      const { data: gcAccount, error: gcError } = await supabase
        .from('gc_accounts')
        .insert([
          { 
            company_name: companyName,
            owner_id: user.id
          }
        ])
        .select()
        .single();
        
      if (gcError) {
        console.error("Error creating GC account:", gcError);
        setCheckoutError(`Error creating GC account: ${gcError.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Created GC account:", gcAccount);
      
      // Update the user's profile with the new GC account ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ gc_account_id: gcAccount.id })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating profile with GC account ID:", updateError);
        setCheckoutError(`Error updating profile: ${updateError.message}`);
      } else {
        setGcAccountId(gcAccount.id);
      }
    };
    
    const loadStripeInfo = async () => {
      try {
        console.log("Loading Stripe script...");
        await loadStripeScript();
        
        // For simplicity, hardcoding the price ID for now
        // In a real app, you would fetch this from your backend or Supabase
        if (!priceId) {
          setPriceId('price_1On8j5Dm0xEFnVcUm2PZpayG');
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Stripe:", error);
        setCheckoutError("Failed to load payment processing. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [user, priceId]);
  
  const redirectToCheckout = async () => {
    try {
      if (!user || !priceId) {
        throw new Error("Missing required data for checkout");
      }
      
      const clientReferenceId = user.id;
      console.log("Using client reference ID:", clientReferenceId);
      
      // Success and cancel URLs
      const successUrl = `${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}${user ? `&user_id=${user.id}` : ''}`;
      const cancelUrl = `${window.location.origin}/settings?checkout_canceled=true`;
      
      console.log("Success URL:", successUrl);
      console.log("Cancel URL:", cancelUrl);
      console.log("GC Account ID to be used:", gcAccountId);
      console.log("User ID to be used:", user.id);
      
      // Create Stripe checkout session
      const { data: { sessionId } = {}, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId,
            successUrl,
            cancelUrl,
            clientReferenceId,
            userId: user.id,
            gcAccountId,
            metadata: {
              user_id: user.id,
              gc_account_id: gcAccountId
            }
          }
        }
      );
      
      if (error) {
        throw new Error(`Error creating checkout session: ${error.message}`);
      }
      
      if (!sessionId) {
        throw new Error('No session ID returned from checkout creation');
      }
      
      // Redirect to Stripe checkout
      const stripe = initializeStripe(process.env.VITE_STRIPE_PUBLIC_KEY || '');
      await redirectToStripeCheckout(stripe, sessionId);
      
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError(`Payment processing error: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    checkoutError,
    priceId,
    gcAccountId,
    redirectToCheckout
  };
};
