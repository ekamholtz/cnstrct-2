
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import Stripe from 'https://esm.sh/stripe@14.7.0'

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
})

// Define product plans that match the frontend pricing
const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price: 4900, // $49 in cents
    description: 'Perfect for small contractors and individual projects',
  },
  professional: {
    name: 'Professional',
    price: 9900, // $99 in cents
    description: 'Ideal for growing construction businesses',
  },
  enterprise: {
    name: 'Enterprise',
    price: 24900, // $249 in cents
    description: 'For large construction companies with complex needs',
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    
    // Authenticate the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Route handling based on path
    if (path === 'create-checkout-session') {
      const { plan, returnUrl } = await req.json()
      
      if (!plan || !SUBSCRIPTION_PLANS[plan]) {
        return new Response(
          JSON.stringify({ error: 'Invalid plan selected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Get or create customer
      let customerId
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (profiles?.stripe_customer_id) {
        customerId = profiles.stripe_customer_id
      } else {
        // Create new customer in Stripe
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_id: user.id }
        })
        customerId = customer.id
        
        // Update user profile with Stripe customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: SUBSCRIPTION_PLANS[plan].name,
                description: SUBSCRIPTION_PLANS[plan].description,
              },
              unit_amount: SUBSCRIPTION_PLANS[plan].price,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?canceled=true`,
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      })
      
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    else if (path === 'get-subscription') {
      // Get customer subscriptions
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (!profiles?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ subscription: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const subscriptions = await stripe.subscriptions.list({
        customer: profiles.stripe_customer_id,
        status: 'active',
        expand: ['data.default_payment_method'],
      })
      
      if (subscriptions.data.length === 0) {
        return new Response(
          JSON.stringify({ subscription: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const subscription = subscriptions.data[0]
      const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string)
      
      return new Response(
        JSON.stringify({
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            plan_name: product.name,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    else if (path === 'cancel-subscription') {
      const { subscriptionId } = await req.json()
      
      if (!subscriptionId) {
        return new Response(
          JSON.stringify({ error: 'Subscription ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Verify the subscription belongs to this user
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (!profiles?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'No subscription found for this user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      if (subscription.customer !== profiles.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'This subscription does not belong to the authenticated user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Cancel the subscription at period end
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription will be canceled at the end of the billing period' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    else if (path === 'resume-subscription') {
      const { subscriptionId } = await req.json()
      
      if (!subscriptionId) {
        return new Response(
          JSON.stringify({ error: 'Subscription ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Verify the subscription belongs to this user
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (!profiles?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'No subscription found for this user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      if (subscription.customer !== profiles.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'This subscription does not belong to the authenticated user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Resume the subscription
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })
      
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription has been resumed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    else if (path === 'change-plan') {
      const { subscriptionId, newPlan } = await req.json()
      
      if (!subscriptionId || !newPlan || !SUBSCRIPTION_PLANS[newPlan]) {
        return new Response(
          JSON.stringify({ error: 'Valid subscription ID and plan are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Verify the subscription belongs to this user
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (!profiles?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'No subscription found for this user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      if (subscription.customer !== profiles.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'This subscription does not belong to the authenticated user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Find the price ID for the new plan
      // In a real implementation, you would store and retrieve the price IDs
      // Here we'd need to create a new price item
      
      return new Response(
        JSON.stringify({ 
          error: 'Plan changes require a customer portal session. Please use the portal URL endpoint instead.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    else if (path === 'create-portal-session') {
      const { returnUrl } = await req.json()
      
      // Get customer
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      
      if (!profiles?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: 'No customer found for this user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Create a billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: profiles.stripe_customer_id,
        return_url: returnUrl,
      })
      
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Default response for unhandled paths
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in stripe-subscriptions function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
