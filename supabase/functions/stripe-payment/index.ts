
// Supabase Edge Function for Stripe Payments

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.4.0'

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
  [key: string]: any
}

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
    // Check if the request is authorized
    // This would be a good place to add JWT validation
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const requestData: RequestParams = await req.json()
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
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString() 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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
 * Creates a checkout session for a connected account
 */
async function createCheckoutSession(params: RequestParams) {
  const { accountId, amount, currency = 'usd', description, metadata = {}, returnUrl } = params

  if (!accountId) {
    throw new Error('accountId is required')
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
