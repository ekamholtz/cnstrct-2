
// Supabase Edge Function for handling Stripe Webhooks

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

// Stripe webhook secret
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature || !webhookSecret) {
      throw new Error('Missing Stripe signature or webhook secret')
    }
    
    // Get the raw body
    const body = await req.text()
    
    // Verify the webhook
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Process the event based on the type
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
        
      // Add more event types as needed
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    
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
 * Handle account.updated webhook event
 */
async function handleAccountUpdated(account) {
  console.log('Account updated:', account.id)
  
  // Update the connected account details in the database
  const { error } = await supabase
    .from('stripe_connect_accounts')
    .update({
      details: account,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', account.id)
    
  if (error) {
    console.error('Error updating account in database:', error)
  }
}

/**
 * Handle payment_intent.succeeded webhook event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  
  // Record the successful payment in the database
  const { error } = await supabase
    .from('payment_records')
    .insert({
      payment_intent_id: paymentIntent.id,
      account_id: paymentIntent.on_behalf_of || paymentIntent.account,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      metadata: paymentIntent.metadata,
      fee_amount: paymentIntent.application_fee_amount,
      payment_method: paymentIntent.payment_method_types[0],
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    })
    
  if (error) {
    console.error('Error recording payment in database:', error)
  }
}

/**
 * Handle payment_intent.payment_failed webhook event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id)
  
  // Record the failed payment in the database
  const { error } = await supabase
    .from('payment_records')
    .insert({
      payment_intent_id: paymentIntent.id,
      account_id: paymentIntent.on_behalf_of || paymentIntent.account,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      metadata: paymentIntent.metadata,
      error_message: paymentIntent.last_payment_error?.message,
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    })
    
  if (error) {
    console.error('Error recording payment in database:', error)
  }
}
