
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

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
    const { priceId, successUrl, cancelUrl } = requestData;

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

    // Get the Pica secret key
    const picaSecretKey = Deno.env.get('PICA_API_KEY');
    if (!picaSecretKey) {
      return new Response(
        JSON.stringify({ error: 'PICA_API_KEY environment variable is not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeConnectionKey = Deno.env.get('PICA_STRIPE_CONNECTION_KEY');
    if (!stripeConnectionKey) {
      return new Response(
        JSON.stringify({ error: 'PICA_STRIPE_CONNECTION_KEY environment variable is not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile to check gc_account_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('gc_account_id, email, full_name')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve user profile', details: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating customer in Stripe via Pica');
    
    // Step 1: Create a customer in Stripe
    const createCustomerResponse = await fetch('https://api.picaos.com/v1/passthrough/v1/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-pica-secret': picaSecretKey,
        'x-pica-connection-key': stripeConnectionKey,
        'x-pica-action-id': 'conn_mod_def::GCmLQ1fV7N4::bfEjubt3Qb6KtvYeQc2E8Q',
      },
      body: new URLSearchParams({
        email: user.email,
        name: profileData.full_name || user.email,
      }),
    });

    if (!createCustomerResponse.ok) {
      const errorData = await createCustomerResponse.json();
      console.error('Error creating Stripe customer:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create customer in Stripe', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerData = await createCustomerResponse.json();
    console.log('Customer created:', customerData.id);

    // Default to Basic plan if no price ID specified
    const DEFAULT_PRICE_ID = 'price_1R98Y3Apu80f9E3HAHh8jUW3';
    const checkoutPriceId = priceId || DEFAULT_PRICE_ID;

    console.log('Creating checkout session for price:', checkoutPriceId);
    
    // Step 2: Create a checkout session
    const createSessionResponse = await fetch('https://api.picaos.com/v1/passthrough/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-pica-secret': picaSecretKey,
        'x-pica-connection-key': stripeConnectionKey,
        'x-pica-action-id': 'conn_mod_def::GCmLNSLWawg::Pj6pgAmnQhuqMPzB8fquRg',
      },
      body: new URLSearchParams({
        customer: customerData.id,
        mode: 'subscription',
        'line_items[0][price]': checkoutPriceId,
        'line_items[0][quantity]': '1',
        success_url: successUrl || `${req.headers.get('origin')}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/subscription-selection`,
        client_reference_id: user.id,
      }),
    });

    if (!createSessionResponse.ok) {
      const errorData = await createSessionResponse.json();
      console.error('Error creating checkout session:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await createSessionResponse.json();
    console.log('Session created with ID:', sessionData.id);
    
    // Create a record in our database
    if (sessionData.id) {
      const { error: checkoutError } = await supabase
        .from('checkout_sessions')
        .insert({
          stripe_session_id: sessionData.id,
          user_id: user.id,
          gc_account_id: profileData.gc_account_id,
          stripe_customer_id: customerData.id,
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

    // Return the session URL for redirect
    return new Response(
      JSON.stringify({ url: sessionData.url }),
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
