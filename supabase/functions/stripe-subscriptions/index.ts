
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@14.7.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main function to handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route based on the path
    switch (path) {
      case 'create-checkout-session':
        return handleCreateCheckoutSession(req, user.id);
      
      case 'create-portal-session':
        return handleCreatePortalSession(req, user.id);
      
      case 'get-subscription':
        return handleGetSubscription(req, user.id);
      
      case 'cancel-subscription':
        return handleCancelSubscription(req);
      
      case 'resume-subscription':
        return handleResumeSubscription(req);
      
      case 'get-plans':
        return handleGetPlans(req);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Route not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler functions
async function handleCreateCheckoutSession(req: Request, userId: string) {
  const { plan, returnUrl } = await req.json();

  // Get the user's profile to find their GC account
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('gc_account_id, email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Profile error:', profileError);
    return new Response(
      JSON.stringify({ error: 'User profile not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Find the price ID from Stripe
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });
    
    // Find the price that matches the requested plan
    const price = prices.data.find(price => {
      const product = price.product as Stripe.Product;
      return product.metadata.plan_id === plan;
    });
    
    if (!price) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: price.id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      customer_email: profile.email,
      client_reference_id: profile.gc_account_id,
      metadata: {
        userId: userId,
        gcAccountId: profile.gc_account_id,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCreatePortalSession(req: Request, userId: string) {
  const { returnUrl } = await req.json();

  try {
    // Get the user's Stripe customer ID
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('gc_account_id')
      .eq('id', userId)
      .single();

    if (customerError || !customer) {
      console.error('Customer error:', customerError);
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the Stripe customer ID from the subscriptions table
    const { data: subscription, error: subscriptionError } = await supabase
      .from('account_subscriptions')
      .select('stripe_customer_id')
      .eq('gc_account_id', customer.gc_account_id)
      .single();

    if (subscriptionError || !subscription?.stripe_customer_id) {
      console.error('Subscription error:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetSubscription(req: Request, userId: string) {
  try {
    // Get the user's profile to find their GC account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gc_account_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('account_subscriptions')
      .select('id, status, stripe_subscription_id, tier_id, created_at, end_date, cancel_at_period_end')
      .eq('gc_account_id', profile.gc_account_id)
      .single();

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription plan details if available
    let plan_name = 'Free';
    if (subscription?.tier_id) {
      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select('name')
        .eq('id', subscription.tier_id)
        .single();
      
      if (tier) {
        plan_name = tier.name;
      }
    }

    // Prepare subscription response
    const subscriptionResponse = subscription 
      ? {
          ...subscription,
          plan_name
        }
      : null;

    return new Response(
      JSON.stringify({ subscription: subscriptionResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCancelSubscription(req: Request) {
  const { subscriptionId } = await req.json();

  try {
    // Get the Stripe subscription ID
    const { data: subscription, error: subError } = await supabase
      .from('account_subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      console.error('Subscription error:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancel the subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update the local subscription record
    await supabase
      .from('account_subscriptions')
      .update({ 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleResumeSubscription(req: Request) {
  const { subscriptionId } = await req.json();

  try {
    // Get the Stripe subscription ID
    const { data: subscription, error: subError } = await supabase
      .from('account_subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      console.error('Subscription error:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resume the subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false }
    );

    // Update the local subscription record
    await supabase
      .from('account_subscriptions')
      .update({ 
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// New handler function to get plans from Stripe
async function handleGetPlans(req: Request) {
  try {
    // Fetch prices with their products
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });
    
    // Format the plans for the frontend
    const plans = prices.data
      .filter(price => {
        const product = price.product as Stripe.Product;
        return product.active && product.metadata.plan_id;
      })
      .map(price => {
        const product = price.product as Stripe.Product;
        return {
          id: product.metadata.plan_id,
          name: product.name,
          description: product.description || '',
          price: price.unit_amount ? price.unit_amount / 100 : 0, // Convert from cents to dollars
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
          popular: product.metadata.popular === 'true',
        };
      })
      .sort((a, b) => a.price - b.price); // Sort by price ascending
    
    return new Response(
      JSON.stringify({ plans }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
