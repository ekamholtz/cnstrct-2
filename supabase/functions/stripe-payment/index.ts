// Supabase Edge Function for Stripe Payments

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.4.0?dts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Platform fee percentage
const platformFeePercentage = Number(Deno.env.get('STRIPE_PLATFORM_FEE_PERCENTAGE') || 0.025)

interface RequestParams {
  action: string
  accountId?: string
  amount?: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
  returnUrl?: string
  successUrl?: string
  cancelUrl?: string
  priceId?: string
  clientReferenceId?: string
  mode?: 'payment' | 'subscription'
  [key: string]: any
}

// Default subscription plans if none are defined in the database
const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price_id: 'price_basic',
    description: 'Essential features for small contractors',
    features: ['Up to 5 projects', 'Basic reporting', 'Email support'],
    price: 2999, // $29.99 per month
  },
  {
    id: 'professional',
    name: 'Professional',
    price_id: 'price_professional',
    description: 'Advanced features for growing businesses',
    features: ['Unlimited projects', 'Advanced reporting', 'Priority support', 'Team collaboration'],
    price: 7999, // $79.99 per month
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_id: 'price_enterprise',
    description: 'Complete solution for large contractors',
    features: ['Unlimited projects', 'Custom reporting', 'Dedicated support', 'Advanced analytics', 'API access'],
    price: 14999, // $149.99 per month
  },
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify Stripe secret key exists
    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Stripe secret key' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if the request is authorized
    // This would be a good place to add JWT validation
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    let requestData: RequestParams
    try {
      requestData = await req.json()
      console.log('Request data:', JSON.stringify(requestData))
    } catch (error) {
      console.error('Error parsing request body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { action } = requestData

    let result
    
    // Route to appropriate handler based on action
    switch (action) {
      case 'create-payment-link':
        result = await createPaymentLink(requestData)
        break
      case 'create-checkout-session':
        result = await createCheckoutSession(requestData)
        break
      case 'list-payment-links':
        result = await listPaymentLinks(requestData)
        break
      case 'get-payment-link':
        result = await getPaymentLink(requestData)
        break
      case 'create_subscription_session':
        result = await createSubscriptionSession(requestData)
        break
      case 'verify_subscription_session':
        result = await verifySubscriptionSession(requestData)
        break
      case 'ping':
        // Simple ping response for testing
        result = { message: 'Pong! Edge Function is working' }
        break
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * Creates a payment link for a connected account
 */
async function createPaymentLink(params: RequestParams) {
  const { accountId, amount, currency = 'usd', description, metadata = {} } = params

  if (!accountId) {
    throw new Error('accountId is required')
  }

  if (!amount || amount <= 0) {
    throw new Error('amount is required and must be greater than 0')
  }

  // Calculate platform fee (amount is in cents)
  const platformFeeAmount = Math.round(amount * platformFeePercentage)

  // Get the connected account from the database to ensure it exists
  const { data: accountData, error: accountError } = await supabase
    .from('stripe_connect_accounts')
    .select('account_id')
    .eq('account_id', accountId)
    .single()

  if (accountError || !accountData) {
    throw new Error(`Connected account not found: ${accountError?.message || 'Account not registered'}`)
  }

  // Create a product
  const product = await stripe.products.create({
    name: description || 'Payment',
    metadata,
  }, {
    stripeAccount: accountId,
  })

  // Create a price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency,
  }, {
    stripeAccount: accountId,
  })

  // Create a payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    application_fee_amount: platformFeeAmount,
    metadata: {
      ...metadata,
      platform_fee_amount: platformFeeAmount.toString(),
    },
  }, {
    stripeAccount: accountId,
  })

  // Save the payment link to the database
  const { data: savedLink, error: saveError } = await supabase
    .from('payment_links')
    .insert({
      account_id: accountId,
      payment_link_id: paymentLink.id,
      url: paymentLink.url,
      amount,
      currency,
      description,
      metadata,
      platform_fee_amount: platformFeeAmount,
      created_at: new Date().toISOString(),
    })

  if (saveError) {
    console.error('Failed to save payment link to database:', saveError)
    // We don't throw here as the payment link was created successfully in Stripe
  }

  return {
    paymentLink: paymentLink.url,
    paymentLinkId: paymentLink.id,
  }
}

/**
 * Creates a checkout session for a subscription or one-time payment
 */
async function createCheckoutSession(params: RequestParams) {
  console.log('CreateCheckoutSession called with params:', JSON.stringify({
    ...params,
    // Don't log sensitive info
    clientReferenceId: params.clientReferenceId ? '[PRESENT]' : '[MISSING]',
    successUrl: params.successUrl ? '[PRESENT]' : '[MISSING]',
    priceId: params.priceId ? '[PRESENT]' : '[MISSING]'
  }));

  // Log Stripe configuration
  console.log('Stripe configuration:', {
    hasSecretKey: !!stripeSecretKey,
    secretKeyLength: stripeSecretKey.length,
    apiVersion: '2023-10-16'
  });

  const { 
    accountId, 
    amount, 
    currency = 'usd', 
    description, 
    metadata = {}, 
    returnUrl,
    successUrl,
    cancelUrl,
    priceId,
    clientReferenceId,
    mode = 'payment'
  } = params

  // For direct subscription checkout (no connected account)
  if (priceId && (successUrl || returnUrl) && mode === 'subscription') {
    console.log('Creating subscription checkout session with:', { 
      priceId, 
      clientReferenceId,
      successUrl: successUrl || returnUrl
    });

    try {
      // Create a checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: successUrl || returnUrl,
        cancel_url: cancelUrl || returnUrl,
        client_reference_id: clientReferenceId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
      });

      console.log('Created subscription checkout session:', session.id);

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error creating subscription checkout session:', error);
      throw error;
    }
  }

  // Original connected account checkout logic
  if (!accountId) {
    throw new Error('accountId is required for connected account checkout')
  }

  if (!amount || amount <= 0) {
    throw new Error('amount is required and must be greater than 0')
  }

  if (!returnUrl) {
    throw new Error('returnUrl is required')
  }

  // Calculate platform fee (amount is in cents)
  const platformFeeAmount = Math.round(amount * platformFeePercentage)

  // Create a product
  const product = await stripe.products.create({
    name: description || 'Payment',
    metadata,
  }, {
    stripeAccount: accountId,
  })

  // Create a price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency,
  }, {
    stripeAccount: accountId,
  })

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: returnUrl,
    cancel_url: returnUrl,
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeAmount,
      metadata: {
        ...metadata,
        platform_fee_amount: platformFeeAmount.toString(),
      },
    },
  }, {
    stripeAccount: accountId,
  })

  // Save the checkout session to the database
  const { data: savedSession, error: saveError } = await supabase
    .from('checkout_sessions')
    .insert({
      account_id: accountId,
      session_id: session.id,
      url: session.url,
      amount,
      currency,
      description,
      metadata,
      platform_fee_amount: platformFeeAmount,
      created_at: new Date().toISOString(),
    })

  if (saveError) {
    console.error('Failed to save checkout session to database:', saveError)
    // We don't throw here as the checkout session was created successfully in Stripe
  }

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  }
}

/**
 * Lists payment links for a connected account
 */
async function listPaymentLinks({ accountId }: RequestParams) {
  if (!accountId) {
    throw new Error('accountId is required')
  }

  // Get payment links from the database
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to retrieve payment links: ${error.message}`)
  }

  return { paymentLinks: data || [] }
}

/**
 * Gets a payment link details
 */
async function getPaymentLink({ paymentLinkId }: RequestParams) {
  if (!paymentLinkId) {
    throw new Error('paymentLinkId is required')
  }

  // Get the payment link from the database
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('payment_link_id', paymentLinkId)
    .single()

  if (error) {
    throw new Error(`Failed to retrieve payment link: ${error.message}`)
  }

  // If available, get the payment link details from Stripe
  try {
    const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId, {
      stripeAccount: data.account_id,
    })

    return {
      ...data,
      stripeDetails: paymentLink,
    }
  } catch (stripeError) {
    console.error('Error fetching payment link from Stripe:', stripeError)
    // Return the database record even if Stripe API call fails
    return data
  }
}

/**
 * Creates a subscription session for a connected account
 */
async function createSubscriptionSession(params: RequestParams) {
  console.log('Creating subscription session with params:', JSON.stringify(params))
  const { gcAccountId, customerId, customerEmail, customerName, successUrl, cancelUrl } = params

  if (!gcAccountId || !customerId || !successUrl || !cancelUrl) {
    throw new Error('Missing required parameters')
  }

  try {
    // Fetch subscription plans from the database
    let subscriptionPlans: SubscriptionPlan[] = DEFAULT_SUBSCRIPTION_PLANS
    const { data: plansData, error: plansError } = await supabase
      .from('subscription_tiers')
      .select('*')

    if (!plansError && plansData && plansData.length > 0) {
      // Map database plans to the format needed for Stripe
      subscriptionPlans = plansData.map(plan => ({
        id: plan.id,
        name: plan.name,
        price_id: plan.stripe_price_id,
        description: plan.description,
        features: Array.isArray(plan.features) ? plan.features : [],
        price: plan.price * 100, // Convert to cents
      }))
    } else {
      console.warn('Using default subscription plans')
    }

    // Check if customer already exists in Stripe
    let stripeCustomer
    try {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        stripeCustomer = existingCustomers.data[0]
        console.log('Found existing Stripe customer:', stripeCustomer.id)
      } else {
        // Create a new customer in Stripe
        stripeCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            gc_account_id: gcAccountId,
            user_id: customerId,
          },
        })
        console.log('Created new Stripe customer:', stripeCustomer.id)
      }
    } catch (error) {
      console.error('Error with Stripe customer:', error)
      throw new Error(`Failed to manage Stripe customer: ${error.message}`)
    }

    // Create a checkout session with subscription options
    try {
      const lineItems = subscriptionPlans.map(plan => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
            metadata: {
              id: plan.id,
            },
          },
          unit_amount: plan.price,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }))

      console.log('Creating checkout session with line items:', JSON.stringify(lineItems))

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        line_items: lineItems,
        metadata: {
          gc_account_id: gcAccountId,
          user_id: customerId,
        },
      })

      console.log('Created checkout session:', session.id)
      return { success: true, url: session.url }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw new Error(`Failed to create checkout session: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in createSubscriptionSession:', error)
    throw error
  }
}

/**
 * Verifies a subscription session
 */
async function verifySubscriptionSession(params: RequestParams) {
  console.log('Verifying subscription session with params:', JSON.stringify(params))
  const { sessionId, userId } = params

  if (!sessionId || !userId) {
    throw new Error('Missing required parameters')
  }

  try {
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('Retrieved session:', JSON.stringify(session))

    if (!session) {
      throw new Error('Session not found')
    }

    // Get the subscription ID from the session
    const subscriptionId = session.subscription as string
    if (!subscriptionId) {
      throw new Error('No subscription found in session')
    }

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    console.log('Retrieved subscription:', JSON.stringify(subscription))

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0].price.id

    // Find the subscription tier ID that matches this price ID
    let subscriptionTierId

    // Try to find the tier in the database
    const { data: tierData, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('stripe_price_id', priceId)
      .single()

    if (!tierError && tierData) {
      subscriptionTierId = tierData.id
      console.log('Found subscription tier in database:', subscriptionTierId)
    } else {
      // If not found in database, use a default mapping
      const defaultTierMap = {
        'price_basic': 'basic',
        'price_professional': 'professional',
        'price_enterprise': 'enterprise',
      }
      subscriptionTierId = defaultTierMap[priceId] || 'professional'
      console.log('Using default subscription tier mapping:', subscriptionTierId)
    }

    // Create a subscription record in the database
    const gcAccountId = session.metadata?.gc_account_id
    if (gcAccountId) {
      const now = new Date()
      const endDate = new Date()
      endDate.setFullYear(now.getFullYear() + 1)

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('account_subscriptions')
        .insert([
          {
            gc_account_id: gcAccountId,
            tier_id: subscriptionTierId,
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
          },
        ])
        .select()

      if (subscriptionError) {
        console.error('Error creating subscription record:', subscriptionError)
      } else {
        console.log('Created subscription record:', JSON.stringify(subscriptionData))
      }
    }

    return {
      success: true,
      subscriptionId,
      subscriptionTierId,
      customerId: session.customer
    }
  } catch (error) {
    console.error('Error in verifySubscriptionSession:', error)
    throw error
  }
}
