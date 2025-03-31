
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
    console.log('Received webhook request')
    
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret')
      throw new Error('Missing Stripe signature or webhook secret')
    }
    
    // Get the raw body
    const body = await req.text()
    
    console.log('Verifying webhook signature')
    
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
    
    console.log(`Processing webhook event: ${event.type}`)
    
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

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
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
  console.log('Processing account.updated event:', account.id)
  
  try {
    // Update the connected account details in the database
    const { error } = await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id)
      
    if (error) {
      console.error('Error updating account in database:', error)
    } else {
      console.log('Successfully updated account:', account.id)
    }
  } catch (err) {
    console.error('Error handling account.updated webhook:', err)
  }
}

/**
 * Handle payment_intent.succeeded webhook event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Processing payment_intent.succeeded event:', paymentIntent.id)
  
  try {
    // Extract invoice ID from metadata
    const invoiceId = paymentIntent.metadata?.invoice_id
    
    if (invoiceId) {
      console.log(`Updating payment status for invoice: ${invoiceId}`)
      
      // Update payment link status in database if there's a matching record
      const { error: linkError } = await supabase
        .from('payment_links')
        .update({ 
          status: 'paid', 
          payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString() 
        })
        .eq('invoice_id', invoiceId)
        
      if (linkError) {
        console.error('Error updating payment link status:', linkError)
      } else {
        console.log('Successfully updated payment link status')
      }
      
      // Update invoice status in database
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          payment_method: 'card',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        
      if (invoiceError) {
        console.error('Error updating invoice status:', invoiceError)
      } else {
        console.log('Successfully updated invoice status')
      }
    } else {
      console.log('No invoice_id found in payment intent metadata')
    }
    
    // Record the successful payment in the database
    const { error } = await supabase
      .from('payment_records')
      .insert({
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        currency: paymentIntent.currency,
        status: 'succeeded',
        metadata: paymentIntent.metadata || {},
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      })
      
    if (error) {
      console.error('Error recording payment in database:', error)
    } else {
      console.log('Successfully recorded payment')
    }
  } catch (err) {
    console.error('Error handling payment_intent.succeeded webhook:', err)
  }
}

/**
 * Handle payment_intent.payment_failed webhook event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Processing payment_intent.payment_failed event:', paymentIntent.id)
  
  try {
    // Extract invoice ID from metadata
    const invoiceId = paymentIntent.metadata?.invoice_id
    
    if (invoiceId) {
      // Update payment link status in database
      const { error: linkError } = await supabase
        .from('payment_links')
        .update({ 
          status: 'failed', 
          payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString() 
        })
        .eq('invoice_id', invoiceId)
        
      if (linkError) {
        console.error('Error updating payment link status:', linkError)
      }
    }
    
    // Record the failed payment in the database
    const { error } = await supabase
      .from('payment_records')
      .insert({
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        currency: paymentIntent.currency,
        status: 'failed',
        metadata: paymentIntent.metadata || {},
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      })
      
    if (error) {
      console.error('Error recording payment in database:', error)
    }
  } catch (err) {
    console.error('Error handling payment_intent.payment_failed webhook:', err)
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed event:', session.id)
  
  try {
    // Get the Stripe customer from the session
    const customerId = session.customer
    const customerEmail = session.customer_details?.email
    
    if (!customerId && !customerEmail) {
      console.log('No customer information found in session')
      return
    }
    
    // Find the user associated with this customer
    let userId = null
    
    if (customerEmail) {
      // Try to find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail.toLowerCase())
        .maybeSingle()
        
      if (userError) {
        console.error('Error finding user by email:', userError)
      } else if (userData) {
        userId = userData.id
      }
    }
    
    if (!userId && session.metadata?.user_id) {
      // Use user ID from metadata if available
      userId = session.metadata.user_id
    }
    
    if (!userId && session.client_reference_id) {
      // Use client_reference_id as fallback
      userId = session.client_reference_id
    }
    
    if (!userId) {
      console.log('Could not determine user ID from session')
      return
    }
    
    // Get the subscription info
    let subscriptionId = null
    if (session.subscription) {
      subscriptionId = session.subscription
      console.log(`Found subscription: ${subscriptionId}`)
    }
    
    // Get the user's profile to determine their GC account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gc_account_id, role')
      .eq('id', userId)
      .maybeSingle()
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return
    }
    
    if (!profile || !profile.gc_account_id) {
      console.log('User has no GC account ID')
      return
    }
    
    // Only process for gc_admin users
    if (profile.role !== 'gc_admin') {
      console.log(`User role is ${profile.role}, not gc_admin, skipping subscription update`)
      return
    }
    
    // Get the first price from line items
    let priceId = null
    if (session.line_items) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      if (lineItems.data.length > 0) {
        const priceDetails = await stripe.prices.retrieve(lineItems.data[0].price.id)
        priceId = priceDetails.id
        console.log(`Found price ID: ${priceId}`)
      }
    }
    
    // Update the GC account with subscription info
    const { error: updateError } = await supabase
      .from('gc_accounts')
      .update({
        stripe_customer_id: customerId,
        subscription_id: subscriptionId,
        subscription_price_id: priceId,
        subscription_status: 'active',
        subscription_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.gc_account_id)
      
    if (updateError) {
      console.error('Error updating GC account:', updateError)
    } else {
      console.log(`Successfully updated subscription for GC account: ${profile.gc_account_id}`)
    }
    
    // Set a subscription tier ID based on the price ID
    // This is a simplified example - you would map price IDs to tier IDs in a real app
    let tierIdToSet = null
    
    // If free tier
    if (priceId === 'price_free') {
      tierIdToSet = '00000000-0000-0000-0000-000000000001' // Free tier ID
    } 
    // If standard tier
    else if (priceId === 'price_standard') {
      tierIdToSet = '00000000-0000-0000-0000-000000000002' // Standard tier ID
    } 
    // If premium tier
    else if (priceId === 'price_premium') {
      tierIdToSet = '00000000-0000-0000-0000-000000000003' // Premium tier ID
    }
    
    if (tierIdToSet) {
      const { error: tierError } = await supabase
        .from('gc_accounts')
        .update({
          subscription_tier_id: tierIdToSet
        })
        .eq('id', profile.gc_account_id)
        
      if (tierError) {
        console.error('Error updating subscription tier:', tierError)
      } else {
        console.log(`Successfully set subscription tier: ${tierIdToSet}`)
      }
    }
    
    console.log('Successfully processed checkout.session.completed')
  } catch (err) {
    console.error('Error handling checkout.session.completed webhook:', err)
  }
}
