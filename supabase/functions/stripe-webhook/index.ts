
// Supabase Edge Function for Stripe Webhook Handler

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

// Get the webhook secret from environment variables
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests for webhooks
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message)
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`✅ Success: Received event ${event.type} with ID ${event.id}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object)
        break

      case 'account.application.authorized':
        await handleAccountAuthorized(event.data.object)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object)
        break

      // Add more event handlers as needed
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(`Error handling webhook:`, err)
    return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session) {
  // Extract metadata
  const { invoice_id: invoiceId, user_id: userId } = session.metadata || {}

  // Update checkout session status
  if (session.id) {
    const { error } = await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)

    if (error) {
      console.error(`Error updating checkout session: ${error.message}`)
    }
  }

  // Update invoice status if invoice_id is present
  if (invoiceId) {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: 'cc',
        payment_date: new Date().toISOString(),
        payment_gateway: 'stripe',
        payment_reference: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) {
      console.error(`Error updating invoice: ${error.message}`)
    }
  }

  // Create payment record
  const paymentData = {
    payment_intent_id: session.payment_intent,
    checkout_session_id: session.id,
    user_id: userId,
    stripe_account_id: session.account || 'platform',
    amount: session.amount_total,
    currency: session.currency,
    status: 'succeeded',
    customer_email: session.customer_email,
    customer_name: session.customer_details?.name,
    project_id: session.metadata?.project_id,
    description: session.metadata?.description,
    platform_fee: session.application_fee_amount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('payment_records')
    .insert(paymentData)

  if (error) {
    console.error(`Error creating payment record: ${error.message}`)
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  // Extract metadata
  const { invoice_id: invoiceId, user_id: userId } = paymentIntent.metadata || {}

  // Update payment link status if associated with this payment intent
  if (paymentIntent.id) {
    const { error } = await supabase
      .from('payment_links')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id)

    if (error) {
      console.error(`Error updating payment link: ${error.message}`)
    }
  }

  // Update invoice status if invoice_id is present
  if (invoiceId) {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: 'cc',
        payment_date: new Date().toISOString(),
        payment_gateway: 'stripe',
        payment_reference: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) {
      console.error(`Error updating invoice: ${error.message}`)
    }
  }

  // Create payment record if not already created by checkout.session.completed
  const { data: existingRecord } = await supabase
    .from('payment_records')
    .select('id')
    .eq('payment_intent_id', paymentIntent.id)
    .maybeSingle()

  if (!existingRecord) {
    const paymentData = {
      payment_intent_id: paymentIntent.id,
      user_id: userId,
      stripe_account_id: paymentIntent.account || 'platform',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      customer_email: paymentIntent.receipt_email,
      project_id: paymentIntent.metadata?.project_id,
      description: paymentIntent.description,
      platform_fee: paymentIntent.application_fee_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('payment_records')
      .insert(paymentData)

    if (error) {
      console.error(`Error creating payment record: ${error.message}`)
    }
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  // Extract metadata
  const { invoice_id: invoiceId, user_id: userId } = paymentIntent.metadata || {}

  // Update payment link status if associated with this payment intent
  if (paymentIntent.id) {
    const { error } = await supabase
      .from('payment_links')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id)

    if (error) {
      console.error(`Error updating payment link: ${error.message}`)
    }
  }

  // Create payment record
  const paymentData = {
    payment_intent_id: paymentIntent.id,
    user_id: userId,
    stripe_account_id: paymentIntent.account || 'platform',
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'failed',
    customer_email: paymentIntent.receipt_email,
    project_id: paymentIntent.metadata?.project_id,
    description: paymentIntent.description,
    platform_fee: paymentIntent.application_fee_amount,
    error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('payment_records')
    .insert(paymentData)

  if (error) {
    console.error(`Error creating payment record: ${error.message}`)
  }
}

/**
 * Handle account.updated event
 */
async function handleAccountUpdated(account) {
  // Update the account status in our database
  const { error } = await supabase
    .from('stripe_connect_accounts')
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      updated_at: new Date().toISOString()
    })
    .eq('account_id', account.id)

  if (error) {
    console.error(`Error updating account status: ${error.message}`)
  }
}

/**
 * Handle account.application.authorized event
 */
async function handleAccountAuthorized(account) {
  // For logging purposes
  console.log(`Account ${account.id} has authorized our application`)
  
  // You can add more custom handling here
}

/**
 * Handle account.application.deauthorized event
 */
async function handleAccountDeauthorized(account) {
  // Mark the account as disconnected in our database
  const { error } = await supabase
    .from('stripe_connect_accounts')
    .update({
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString()
    })
    .eq('account_id', account.id)

  if (error) {
    console.error(`Error updating deauthorized account: ${error.message}`)
  }
}
