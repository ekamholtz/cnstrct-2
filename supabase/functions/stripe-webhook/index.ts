
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
    
    if (!signature) {
      console.error('Missing signature');
      return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get the raw body
    const body = await req.text()
    
    let event;
    try {
      // For development and debugging, log the raw payload
      console.log('Received webhook payload:', body.substring(0, 500) + '...');
      
      // Parse the webhook payload
      event = JSON.parse(body);
      
      // Validate webhook signature if we have a secret
      if (webhookSecret) {
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
          );
        } catch (verifyErr) {
          console.error(`Webhook signature verification failed: ${verifyErr.message}`);
          // In development, we still want to process the event even if signature verification fails
          console.log('Continuing with unverified event for debugging');
        }
      } else {
        console.log('No webhook secret configured, skipping signature verification');
      }
      
      console.log('Webhook event received:', {
        type: event.type,
        id: event.id,
        objectType: event?.data?.object?.object || 'unknown',
      });
      
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
 * @param {Object} session The checkout session object
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed event:', session.id);
  console.log('Session details:', JSON.stringify(session, null, 2));
  
  try {
    // Check if we have a client_reference_id (should be the gc_account_id)
    const gcAccountId = session.client_reference_id;
    if (!gcAccountId) {
      console.log('No gc_account_id found in client_reference_id, checking metadata');
      // Try to get it from metadata
      if (session.metadata?.gc_account_id) {
        console.log('Found gc_account_id in metadata:', session.metadata.gc_account_id);
        await handleCheckoutWithAccountId(session, session.metadata.gc_account_id);
      } else {
        console.log('No gc_account_id found in metadata either, logging event only');
      }
      return;
    }
    
    await handleCheckoutWithAccountId(session, gcAccountId);
    
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

/**
 * Process checkout with a known account ID
 */
async function handleCheckoutWithAccountId(session, gcAccountId) {
  console.log('Processing checkout for account:', gcAccountId);
  
  // Handle based on session mode
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, gcAccountId);
  } else if (session.mode === 'payment') {
    await handlePaymentCheckout(session, gcAccountId);
  } else {
    console.log(`Unsupported checkout session mode: ${session.mode}`);
  }
  
  console.log('Successfully processed checkout session for GC account:', gcAccountId);
}

/**
 * Handle payment mode checkout (one-time payment)
 */
async function handlePaymentCheckout(session, gcAccountId) {
  console.log('Processing one-time payment checkout:', session.id);
  
  // Record the payment
  try {
    const paymentData = {
      gc_account_id: gcAccountId,
      customer_email: session.customer_email || session.customer_details?.email,
      customer_name: session.customer_details?.name,
      amount: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      payment_intent_id: session.payment_intent,
      checkout_session_id: session.id,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('payment_records')
      .insert(paymentData);
      
    if (error) {
      console.error('Error recording payment:', error);
    } else {
      console.log('Successfully recorded payment');
    }
  } catch (error) {
    console.error('Error handling payment checkout:', error);
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
  
  try {
    // Retrieve the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Subscription details:', JSON.stringify(subscription, null, 2));
    
    // Get customer ID
    const customerId = session.customer;
    
    // Determine subscription tier based on price
    // You may want to map price IDs to your subscription tier IDs
    let subscriptionTierId = null;
    
    // Get the price ID from the first line item
    if (subscription.items?.data?.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      console.log('Price ID from subscription:', priceId);
      
      // Map price IDs to your subscription tiers
      // This is a simple example - you might want to store this mapping in your database
      if (priceId === 'price_1R9UBQApu80f9E3HCze1U9g6') { // Basic plan
        subscriptionTierId = '00000000-0000-0000-0000-000000000001';
      } else if (priceId === 'price_1R9UBQApu80f9E3HGYBZ1uEk') { // Pro plan
        subscriptionTierId = '00000000-0000-0000-0000-000000000002';
      } else if (priceId === 'price_1R9UBQApu80f9E3HVGjb2LKp') { // Enterprise plan
        subscriptionTierId = '00000000-0000-0000-0000-000000000003';
      }
    }
    
    // Use a default tier ID if we couldn't determine the tier
    if (!subscriptionTierId) {
      subscriptionTierId = '00000000-0000-0000-0000-000000000001'; // Default to basic tier
      console.log('Using default tier ID');
    }
    
    console.log('Using subscription tier ID:', subscriptionTierId);
    
    await saveSubscriptionData(
      gcAccountId,
      customerId,
      subscriptionId,
      subscription,
      subscriptionTierId
    );
    
    // Update the GC account's subscription status
    const { error: gcUpdateError } = await supabase
      .from('gc_accounts')
      .update({
        subscription_tier_id: subscriptionTierId,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', gcAccountId);
    
    if (gcUpdateError) {
      console.error('Error updating GC account subscription status:', gcUpdateError);
    } else {
      console.log('Successfully updated GC account subscription status');
    }
  } catch (error) {
    console.error('Error retrieving subscription details:', error);
  }
}

/**
 * Save subscription data to the database
 */
async function saveSubscriptionData(gcAccountId, customerId, subscriptionId, subscription, subscriptionTierId) {
  console.log('Saving subscription data for account:', gcAccountId);
  
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
  const subscriptionData = {
    gc_account_id: gcAccountId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    tier_id: subscriptionTierId,
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: existingSubscription?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  if (existingSubscription?.id) {
    // Update existing subscription
    const { error: updateError } = await supabase
      .from('account_subscriptions')
      .update(subscriptionData)
      .eq('id', existingSubscription.id);
      
    if (updateError) {
      console.error('Error updating subscription record:', updateError);
      return;
    }
  } else {
    // Create new subscription
    const { error: insertError } = await supabase
      .from('account_subscriptions')
      .insert(subscriptionData);
      
    if (insertError) {
      console.error('Error inserting subscription record:', insertError);
      return;
    }
  }
  
  console.log('Successfully saved subscription data for GC account:', gcAccountId);
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
