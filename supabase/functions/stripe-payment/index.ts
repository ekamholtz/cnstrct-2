
// Supabase Edge Function for Stripe Payment Processing

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaymentLinkParams {
  action: string
  userId?: string
  invoiceId?: string
  amount?: number
  currency?: string
  description?: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData: PaymentLinkParams = await req.json()
    const { action } = requestData
    
    // Get authenticated user
    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth Error:', userError)
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    userId = user.id;

    let result

    switch (action) {
      case 'create-payment-link':
        result = await createPaymentLink(userId, requestData)
        break
      case 'get-payment-link':
        result = await getPaymentLink(userId, requestData)
        break
      case 'list-payment-links':
        result = await listPaymentLinks(userId)
        break
      case 'create-checkout-session':
        result = await createCheckoutSession(userId, requestData)
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
 * Creates a payment link for an invoice
 */
async function createPaymentLink(userId: string, {
  invoiceId,
  amount,
  currency = 'usd',
  description,
  customerEmail,
  customerName,
  metadata = {}
}: PaymentLinkParams) {
  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required')
  }

  if (!description) {
    throw new Error('Description is required')
  }

  // Get the user's Stripe connect account
  const { data: connectAccount, error: accountError } = await supabase
    .from('stripe_connect_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (accountError || !connectAccount) {
    throw new Error('No Stripe account found for this user')
  }

  const { account_id: accountId } = connectAccount
  
  // Calculate platform fee (as an integer in cents)
  const amountInCents = Math.round(amount * 100)
  const platformFeeAmount = Math.round(amountInCents * platformFeePercentage)

  // Create a Stripe payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: description,
            metadata: metadata || {},
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'}/payment-success`,
      },
    },
    application_fee_amount: platformFeeAmount,
    metadata: {
      user_id: userId,
      invoice_id: invoiceId,
      ...metadata,
    },
  }, {
    stripeAccount: accountId,
  })

  // Store the payment link in our database
  const { data: storedLink, error: linkError } = await supabase
    .from('payment_links')
    .insert({
      user_id: userId,
      stripe_account_id: accountId,
      payment_link_id: paymentLink.id,
      amount: amountInCents,
      currency,
      url: paymentLink.url,
      description,
      customer_email: customerEmail,
      customer_name: customerName,
      project_id: metadata.project_id,
      platform_fee: platformFeeAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (linkError) {
    console.error('Error storing payment link:', linkError)
    // Continue and return the link even if storing fails
  }

  return {
    success: true,
    paymentLink: {
      id: paymentLink.id,
      url: paymentLink.url,
      amount: amountInCents / 100,
      currency,
      expiresAt: paymentLink.expires_at,
    }
  }
}

/**
 * Gets a payment link for a user
 */
async function getPaymentLink(userId: string, { invoiceId }: PaymentLinkParams) {
  if (!invoiceId) {
    throw new Error('Invoice ID is required')
  }

  // Get the payment link from our database
  const { data: paymentLink, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('user_id', userId)
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return { success: false, error: 'No payment link found for this invoice' }
  }

  return {
    success: true,
    paymentLink
  }
}

/**
 * Lists all payment links for a user
 */
async function listPaymentLinks(userId: string) {
  // Get all payment links for the user
  const { data: paymentLinks, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: 'Error retrieving payment links' }
  }

  return {
    success: true,
    paymentLinks: paymentLinks || []
  }
}

/**
 * Creates a checkout session for an invoice
 */
async function createCheckoutSession(userId: string, {
  invoiceId,
  amount,
  currency = 'usd',
  description,
  customerEmail,
  customerName,
  metadata = {}
}: PaymentLinkParams) {
  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required')
  }

  if (!description) {
    throw new Error('Description is required')
  }

  // Get the user's Stripe connect account
  const { data: connectAccount, error: accountError } = await supabase
    .from('stripe_connect_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (accountError || !connectAccount) {
    throw new Error('No Stripe account found for this user')
  }

  const { account_id: accountId } = connectAccount
  
  // Calculate platform fee (as an integer in cents)
  const amountInCents = Math.round(amount * 100)
  const platformFeeAmount = Math.round(amountInCents * platformFeePercentage)

  // Create a Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: description,
            metadata: metadata || {},
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }
    ],
    mode: 'payment',
    success_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'}/payment-canceled`,
    customer_email: customerEmail,
    application_fee_amount: platformFeeAmount,
    metadata: {
      user_id: userId,
      invoice_id: invoiceId,
      ...metadata,
    },
  }, {
    stripeAccount: accountId,
  })

  // Store the checkout session in our database
  const { data: storedSession, error: sessionError } = await supabase
    .from('checkout_sessions')
    .insert({
      user_id: userId,
      stripe_account_id: accountId,
      stripe_session_id: session.id,
      amount: amountInCents,
      currency,
      description,
      metadata: {
        invoice_id: invoiceId,
        customer_email: customerEmail,
        customer_name: customerName,
        ...metadata
      },
      status: 'created',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (sessionError) {
    console.error('Error storing checkout session:', sessionError)
    // Continue and return the session even if storing fails
  }

  return {
    success: true,
    checkoutSession: {
      id: session.id,
      url: session.url,
      amount: amountInCents / 100,
      currency,
      expiresAt: session.expires_at,
    }
  }
}
