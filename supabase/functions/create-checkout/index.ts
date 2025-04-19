
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestData = await req.json();
    const { priceId, customerId, gcAccountId, successUrl, cancelUrl } = requestData;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authentication token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Default to Basic plan if no price ID specified
    const DEFAULT_PRICE_ID = 'price_1R98Y3Apu80f9E3HAHh8jUW3';
    const checkoutPriceId = priceId || DEFAULT_PRICE_ID;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: checkoutPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/subscription-success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/subscription-selection`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        gc_account_id: gcAccountId
      }
    });

    // Create a record in our database
    if (session.id) {
      const { error: checkoutError } = await supabase
        .from('checkout_sessions')
        .insert({
          stripe_session_id: session.id,
          user_id: user.id,
          gc_account_id: gcAccountId,
          stripe_account_id: 'platform',
          status: 'created',
          amount: 0, // Will be updated after completion
          currency: 'usd',
          description: 'Subscription checkout',
        });

      if (checkoutError) {
        console.error('Error creating checkout record:', checkoutError);
      }
    }

    // Return the session ID
    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
