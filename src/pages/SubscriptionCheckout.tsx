
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { loadStripeScript, redirectToStripeCheckout, initializeStripe } from '@/utils/stripe-utils';
import { useAuth } from '@/hooks/useAuth';

export default function SubscriptionCheckout() {
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [gcAccountId, setGcAccountId] = useState<string | null>(null);
  
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
          // We have a GC admin user without a GC account, need to create one
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
        }
        
        // Load Stripe pricing info
        await loadStripeInfo();
        
      } catch (error) {
        console.error("Error in fetchUserDetails:", error);
        setCheckoutError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
      }
    };
    
    const loadStripeInfo = async () => {
      try {
        console.log("Loading Stripe script...");
        await loadStripeScript();
        
        // For simplicity, hardcoding the price ID for now
        // In a real app, you would fetch this from your backend or Supabase
        setPriceId('price_1On8j5Dm0xEFnVcUm2PZpayG');
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading Stripe:", error);
        setCheckoutError("Failed to load payment processing. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [user, navigate]);
  
  useEffect(() => {
    if (!isLoading && priceId && user) {
      // Prepare and redirect to Stripe checkout
      redirectToCheckout();
    }
  }, [isLoading, priceId, user]);
  
  const redirectToCheckout = async () => {
    try {
      const clientReferenceId = user?.id;
      console.log("Using client reference ID:", clientReferenceId);
      
      console.log("User ID:", user?.id);
      
      // Success and cancel URLs
      const successUrl = `${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}${user ? `&user_id=${user.id}` : ''}`;
      const cancelUrl = `${window.location.origin}/settings?checkout_canceled=true`;
      
      console.log("Success URL:", successUrl);
      console.log("Cancel URL:", cancelUrl);
      console.log("GC Account ID to be used:", gcAccountId);
      console.log("User ID to be used:", user?.id);
      
      // Create Stripe checkout session
      const { data: { sessionId } = {}, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId,
            successUrl,
            cancelUrl,
            clientReferenceId,
            userId: user?.id,
            gcAccountId,
            metadata: {
              user_id: user?.id,
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
  
  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">Subscription Setup</CardTitle>
          <CardDescription className="text-center">
            {isLoading ? "Setting up your subscription..." : "Redirecting to payment..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cnstrct-navy" />
              <p className="text-sm text-gray-500">Preparing your subscription details...</p>
            </div>
          ) : checkoutError ? (
            <div className="text-center text-red-500">
              <p className="font-semibold">There was an error</p>
              <p className="text-sm mt-2">{checkoutError}</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-4 py-2 bg-cnstrct-navy text-white rounded-md hover:bg-cnstrct-navy/90 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cnstrct-navy" />
              <p className="text-sm text-gray-500">Redirecting to secure payment page...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
