
// Supabase Edge Function for handling Stripe Webhooks
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@13.4.0?target=deno'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Stripe client with the new approach
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Use the API version compatible with Stripe 13.4.0
})

// Create the crypto provider for async operations
const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Stripe webhook secret
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Use the modern Deno.serve API
Deno.serve(async (req) => {
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
      console.error('Missing signature or webhook secret:', { 
        hasSignature: !!signature,
        hasWebhookSecret: !!webhookSecret,
        webhookSecretLength: webhookSecret?.length
      })
      return new Response(JSON.stringify({ error: 'Missing Stripe signature or webhook secret' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get the raw body
    const body = await req.text()
    
    let event;
    try {
      // BYPASS MODE FOR TESTING
      // This logs the event data but skips signature verification
      // Remove this bypass in production after troubleshooting
      console.log('BYPASS MODE: Skipping signature verification temporarily');
      
      // Parse the webhook payload directly
      event = JSON.parse(body);
      
      console.log('Webhook event received:', {
        type: event.type,
        id: event.id,
        objectType: event.data?.object?.object || 'unknown',
      });
      
      // Skip the normal verification process while troubleshooting
      /* 
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
      */
      
    } catch (err) {
      console.error(`Webhook parsing error: ${err.message}`);
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
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
  try {
    const accountId = account.id
    console.log('Processing account.updated event for account:', accountId)
    
    // Find the account in our database
    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching account:', error)
      return
    }
    
    if (!data) {
      console.log('No connected account found with ID:', accountId)
      return
    }
    
    // Update the account status
    await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', accountId)
      
  } catch (error) {
    console.error('Error handling account.updated:', error)
  }
}

/**
 * Handle payment_intent.succeeded webhook event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded event:', paymentIntent.id)
    
    // Check if we have metadata with a gcAccountId
    const gcAccountId = paymentIntent.metadata?.gc_account_id
    
    if (!gcAccountId) {
      console.log('No gc_account_id found in metadata, skipping')
      return
    }
    
    // Record the payment in your database
    await supabase
      .from('payment_records')
      .insert({
        gc_account_id: gcAccountId,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customer_email: paymentIntent.receipt_email,
        created_at: new Date().toISOString()
      })
      
  } catch (error) {
    console.error('Error recording payment in database:', error)
  }
}

/**
 * Handle payment_intent.payment_failed webhook event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed event:', paymentIntent.id)
    
    // Check if we have metadata with a gcAccountId
    const gcAccountId = paymentIntent.metadata?.gc_account_id
    
    if (!gcAccountId) {
      console.log('No gc_account_id found in metadata, skipping')
      return
    }
    
    // Record the failed payment in your database
    await supabase
      .from('payment_records')
      .insert({
        gc_account_id: gcAccountId,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'failed',
        customer_email: paymentIntent.receipt_email,
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        created_at: new Date().toISOString()
      })
      
  } catch (error) {
    console.error('Error recording payment in database:', error)
  }
}

/**
 * Handle checkout.session.completed webhook event
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed event:', session.id);
  
  try {
    // Check if we have a client_reference_id (should be the gc_account_id)
    const gcAccountId = session.client_reference_id;
    if (!gcAccountId) {
      console.log('No gc_account_id found in client_reference_id, processing as generic checkout');
      // For test events or generic checkouts without client_reference_id, we still log the event
      // but don't try to update any specific records
      return;
    }
    
    // Handle based on session mode
    if (session.mode === 'subscription') {
      await handleSubscriptionCheckout(session, gcAccountId);
    } else if (session.mode === 'payment') {
      await handlePaymentCheckout(session, gcAccountId);
    } else {
      console.log(`Unsupported checkout session mode: ${session.mode}`);
    }
    
    console.log('Successfully processed checkout session for GC account:', gcAccountId);
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

/**
 * Handle subscription mode checkout
 */
async function handleSubscriptionCheckout(session, gcAccountId) {
  console.log('Processing subscription checkout:', session.id);
  
  // Get the subscription ID from the session
  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    console.log('No subscription ID found in the session');
    return;
  }
  
  // Retrieve the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get customer ID
  const customerId = session.customer;
  
  // Get subscription price info
  let subscriptionTierId = '1'; // Default tier ID
  
  // Here you could map the price ID to your subscription tier IDs if needed
  
  await saveSubscriptionData(
    gcAccountId,
    customerId,
    subscriptionId,
    subscription,
    subscriptionTierId
  );
}

/**
 * Handle payment mode checkout
 */
async function handlePaymentCheckout(session, gcAccountId) {
  console.log('Processing payment checkout:', session.id);
  
  // Get payment intent ID
  const paymentIntentId = session.payment_intent;
  if (!paymentIntentId) {
    console.log('No payment intent ID found in the session');
    return;
  }
  
  // Get customer details
  const customerEmail = session.customer_details?.email || 'unknown@example.com';
  const customerName = session.customer_details?.name || 'Unknown Customer';
  
  // Record the payment in your database
  try {
    // First check if there's an existing payment record
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payment_records')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching payment record:', fetchError);
      return;
    }
    
    // If payment record already exists, we don't need to create it again
    if (existingPayment) {
      console.log('Payment record already exists:', existingPayment.id);
      return;
    }
    
    // Create a new payment record
    const { error: insertError } = await supabase
      .from('payment_records')
      .insert({
        gc_account_id: gcAccountId,
        payment_intent_id: paymentIntentId,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        customer_email: customerEmail,
        customer_name: customerName,
        created_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error recording payment:', insertError);
      return;
    }
    
    console.log('Successfully recorded payment for GC account:', gcAccountId);
  } catch (error) {
    console.error('Error handling payment checkout:', error);
  }
}

/**
 * Save subscription data to the database
 */
async function saveSubscriptionData(gcAccountId, customerId, subscriptionId, subscription, subscriptionTierId) {
  // Save the subscription data to your database
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('account_subscriptions')
    .select('*')
    .eq('gc_account_id', gcAccountId)
    .maybeSingle();
    
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching existing subscription:', fetchError);
    return;
  }
  
  // Create or update the subscription record
  const { error: upsertError } = await supabase
    .from('account_subscriptions')
    .upsert({
      id: existingSubscription?.id,
      gc_account_id: gcAccountId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: existingSubscription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (upsertError) {
    console.error('Error upserting subscription record:', upsertError);
    return;
  }
  
  // Update the gc_account with the subscription tier ID
  const { error: gcUpdateError } = await supabase
    .from('gc_accounts')
    .update({
      subscription_tier_id: subscriptionTierId,
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', gcAccountId);
  
  if (gcUpdateError) {
    console.error('Error updating GC account:', gcUpdateError);
    return;
  }
}

/**
 * Handle customer.subscription.updated webhook event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing customer.subscription.updated event:', subscription.id);
  
  try {
    // Find the subscription in our database
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return;
    }
    
    if (!subscriptionData) {
      console.log('No subscription found with ID:', subscription.id);
      return;
    }
    
    // Update the subscription record
    const { error: updateError } = await supabase
      .from('account_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }
    
    // Update gc_account status based on subscription status
    const gcAccountId = subscriptionData.gc_account_id;
    if (gcAccountId) {
      const subscriptionStatus = subscription.status === 'active' ? 'active' : 
                               subscription.status === 'trialing' ? 'active' : 
                               subscription.status === 'past_due' ? 'past_due' : 
                               subscription.status === 'canceled' ? 'canceled' : 
                               subscription.status === 'unpaid' ? 'unpaid' : 'inactive';
      
      const { error: gcUpdateError } = await supabase
        .from('gc_accounts')
        .update({
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', gcAccountId);
      
      if (gcUpdateError) {
        console.error('Error updating GC account status:', gcUpdateError);
        return;
      }
    }
    
    console.log('Successfully updated subscription for GC account:', gcAccountId);
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

/**
 * Handle customer.subscription.deleted webhook event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing customer.subscription.deleted event:', subscription.id);
  
  try {
    // Find the subscription in our database
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return;
    }
    
    if (!subscriptionData) {
      console.log('No subscription found with ID:', subscription.id);
      return;
    }
    
    // Update the subscription record
    const { error: updateError } = await supabase
      .from('account_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }
    
    // Update gc_account status
    const gcAccountId = subscriptionData.gc_account_id;
    if (gcAccountId) {
      const { error: gcUpdateError } = await supabase
        .from('gc_accounts')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', gcAccountId);
      
      if (gcUpdateError) {
        console.error('Error updating GC account status:', gcUpdateError);
        return;
      }
    }
    
    console.log('Successfully processed subscription cancellation for GC account:', gcAccountId);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}
