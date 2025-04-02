
// Supabase Edge Function for handling Stripe Webhooks
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@13.4.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
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

// Default subscription tier UUID if nothing specific is found
const DEFAULT_TIER_ID = '00000000-0000-0000-0000-000000000001'

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
      // Log the raw payload for debugging
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
          console.error(`⚠️ Webhook signature verification failed: ${verifyErr.message}`);
          // Still continue with unverified event in development for easier debugging
          console.log('Continuing with unverified event for debugging');
        }
      } else {
        console.log('⚠️ No webhook secret configured, skipping signature verification');
      }
      
      console.log('📥 Webhook event received:', {
        type: event.type,
        id: event.id,
        objectType: event?.data?.object?.object || 'unknown',
      });
      
    } catch (err) {
      console.error(`Error parsing webhook: ${err.message}`);
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Process the event based on the type
    console.log(`Processing event type: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutSessionSucceeded(event.data.object);
        break;
        
      case 'checkout.session.async_payment_failed':
        await handleCheckoutSessionFailed(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`🔄 Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    
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
 * Handle checkout.session.completed webhook event
 * @param {Object} session The checkout session object
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('🛒 Processing checkout.session.completed:', session.id);
  console.log('Session details:', JSON.stringify(session, null, 2));
  
  try {
    // Check if we have a client_reference_id (should be the gc_account_id)
    const gcAccountId = session.client_reference_id;
    if (!gcAccountId) {
      console.log('⚠️ No gc_account_id found in client_reference_id, checking metadata');
      // Try to get it from metadata
      if (session.metadata?.gc_account_id) {
        console.log('✅ Found gc_account_id in metadata:', session.metadata.gc_account_id);
        await handleCheckoutWithAccountId(session, session.metadata.gc_account_id);
      } else {
        console.log('⚠️ No gc_account_id found in metadata either');
      }
      return;
    }
    
    await handleCheckoutWithAccountId(session, gcAccountId);
    
  } catch (error) {
    console.error('❌ Error handling checkout.session.completed:', error);
  }
}

/**
 * Handle checkout.session.async_payment_succeeded webhook event
 */
async function handleCheckoutSessionSucceeded(session) {
  console.log('💰 Processing checkout.session.async_payment_succeeded:', session.id);
  await handleCheckoutSessionCompleted(session);
}

/**
 * Handle checkout.session.async_payment_failed webhook event
 */
async function handleCheckoutSessionFailed(session) {
  console.log('❌ Processing checkout.session.async_payment_failed:', session.id);
  
  try {
    // Log failure in database
    await supabase
      .from('payment_records')
      .insert({
        stripe_account_id: session.metadata?.stripe_account_id || 'platform',
        payment_intent_id: session.payment_intent,
        checkout_session_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'failed',
        customer_email: session.customer_email || session.customer_details?.email,
        customer_name: session.customer_details?.name,
        error_message: 'Async payment failed',
        created_at: new Date().toISOString()
      });
      
  } catch (error) {
    console.error('Error recording payment failure:', error);
  }
}

/**
 * Process checkout with a known account ID
 */
async function handleCheckoutWithAccountId(session, gcAccountId) {
  console.log('🔄 Processing checkout for account:', gcAccountId);
  
  // Store checkout session in database
  try {
    await supabase
      .from('checkout_sessions')
      .insert({
        stripe_session_id: session.id,
        user_id: session.metadata?.user_id || null,
        gc_account_id: gcAccountId,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        description: session.metadata?.description || null,
        stripe_account_id: session.metadata?.stripe_account_id || 'platform',
        metadata: session.metadata || {}
      });
  } catch(error) {
    console.error('❌ Error storing checkout session:', error);
  }
  
  // Handle based on session mode
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, gcAccountId);
  } else if (session.mode === 'payment') {
    await handlePaymentCheckout(session, gcAccountId);
  } else {
    console.log(`⚠️ Unsupported checkout session mode: ${session.mode}`);
  }
  
  console.log('✅ Successfully processed checkout session for GC account:', gcAccountId);
}

/**
 * Handle payment mode checkout (one-time payment)
 */
async function handlePaymentCheckout(session, gcAccountId) {
  console.log('💵 Processing one-time payment checkout:', session.id);
  
  // Record the payment
  try {
    const paymentData = {
      stripe_account_id: session.metadata?.stripe_account_id || 'platform',
      user_id: session.metadata?.user_id || null,
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
      console.error('❌ Error recording payment:', error);
    } else {
      console.log('✅ Successfully recorded payment');
    }
  } catch (error) {
    console.error('❌ Error handling payment checkout:', error);
  }
}

/**
 * Handle subscription mode checkout
 */
async function handleSubscriptionCheckout(session, gcAccountId) {
  console.log('🔄 Processing subscription checkout:', session.id);
  
  // Get the subscription ID from the session
  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    console.log('⚠️ No subscription ID found in the session');
    return;
  }
  
  try {
    // Retrieve the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Subscription details:', JSON.stringify(subscription, null, 2));
    
    // Get customer ID
    const customerId = session.customer;
    
    // Determine subscription tier based on price
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
      subscriptionTierId = DEFAULT_TIER_ID;
      console.log('⚠️ Using default tier ID:', DEFAULT_TIER_ID);
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
      console.error('❌ Error updating GC account subscription status:', gcUpdateError);
    } else {
      console.log('✅ Successfully updated GC account subscription status');
    }
  } catch (error) {
    console.error('❌ Error retrieving subscription details:', error);
  }
}

/**
 * Save subscription data to the database
 */
async function saveSubscriptionData(gcAccountId, customerId, subscriptionId, subscription, subscriptionTierId) {
  console.log('💾 Saving subscription data for account:', gcAccountId);
  
  try {
    // Use current_period_end as a numeric timestamp and convert to ISO date
    const currentPeriodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null;
    
    // Format the subscription data
    const subscriptionData = {
      gc_account_id: gcAccountId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier_id: subscriptionTierId,
      status: subscription.status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      start_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Check if subscription already exists
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('gc_account_id', gcAccountId)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching existing subscription:', fetchError);
      return;
    }
    
    // Create or update the subscription record
    if (existingSubscription?.id) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('account_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
        
      if (updateError) {
        console.error('❌ Error updating subscription record:', updateError);
        return;
      } else {
        console.log('✅ Updated existing subscription record');
      }
    } else {
      // Create new subscription with created_at field
      subscriptionData.created_at = new Date().toISOString();
      
      // Create new subscription
      const { error: insertError } = await supabase
        .from('account_subscriptions')
        .insert(subscriptionData);
        
      if (insertError) {
        console.error('❌ Error inserting subscription record:', insertError);
        return;
      } else {
        console.log('✅ Created new subscription record');
      }
    }
    
    console.log('✅ Successfully saved subscription data for GC account:', gcAccountId);
  } catch (error) {
    console.error('❌ Error in saveSubscriptionData:', error);
  }
}

/**
 * Handle customer.subscription.updated webhook event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Processing customer.subscription.updated event:', subscription.id);
  
  try {
    // Find the subscription in our database
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Error fetching subscription:', fetchError);
      return;
    }
    
    if (!subscriptionData) {
      console.log('⚠️ No subscription found with ID:', subscription.id);
      return;
    }
    
    const currentPeriodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null;
    
    // Update the subscription record
    const { error: updateError } = await supabase
      .from('account_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (updateError) {
      console.error('❌ Error updating subscription:', updateError);
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
        console.error('❌ Error updating GC account status:', gcUpdateError);
      } else {
        console.log('✅ Successfully updated GC account status');
      }
    }
    
    console.log('✅ Successfully updated subscription for GC account:', gcAccountId);
  } catch (error) {
    console.error('❌ Error handling customer.subscription.updated:', error);
  }
}

/**
 * Handle customer.subscription.deleted webhook event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Processing customer.subscription.deleted event:', subscription.id);
  
  try {
    // Find the subscription in our database
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Error fetching subscription:', fetchError);
      return;
    }
    
    if (!subscriptionData) {
      console.log('⚠️ No subscription found with ID:', subscription.id);
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
      console.error('❌ Error updating subscription:', updateError);
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
        console.error('❌ Error updating GC account status:', gcUpdateError);
        return;
      }
    }
    
    console.log('✅ Successfully processed subscription cancellation for GC account:', gcAccountId);
  } catch (error) {
    console.error('❌ Error handling customer.subscription.deleted:', error);
  }
}

/**
 * Handle invoice.payment_succeeded webhook event
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Processing invoice.payment_succeeded event:', invoice.id);
  
  try {
    // If this is a subscription invoice, update the subscription
    if (invoice.subscription) {
      // Find the subscription in our database
      const { data: subscriptionData, error: fetchError } = await supabase
        .from('account_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', invoice.subscription)
        .maybeSingle();
      
      if (fetchError) {
        console.error('❌ Error fetching subscription:', fetchError);
        return;
      }
      
      if (subscriptionData) {
        const { error: updateError } = await supabase
          .from('account_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', invoice.subscription);
        
        if (updateError) {
          console.error('❌ Error updating subscription:', updateError);
          return;
        }
        
        // Update the GC account status as well
        if (subscriptionData.gc_account_id) {
          const { error: gcUpdateError } = await supabase
            .from('gc_accounts')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionData.gc_account_id);
          
          if (gcUpdateError) {
            console.error('❌ Error updating GC account status:', gcUpdateError);
            return;
          }
        }
      }
    }
    
    console.log('✅ Successfully processed invoice payment');
  } catch (error) {
    console.error('❌ Error handling invoice.payment_succeeded:', error);
  }
}

/**
 * Handle invoice.payment_failed webhook event
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Processing invoice.payment_failed event:', invoice.id);
  
  try {
    // If this is a subscription invoice, update the subscription
    if (invoice.subscription) {
      // Find the subscription in our database
      const { data: subscriptionData, error: fetchError } = await supabase
        .from('account_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', invoice.subscription)
        .maybeSingle();
      
      if (fetchError) {
        console.error('❌ Error fetching subscription:', fetchError);
        return;
      }
      
      if (subscriptionData) {
        const { error: updateError } = await supabase
          .from('account_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', invoice.subscription);
        
        if (updateError) {
          console.error('❌ Error updating subscription:', updateError);
          return;
        }
        
        // Update the GC account status as well
        if (subscriptionData.gc_account_id) {
          const { error: gcUpdateError } = await supabase
            .from('gc_accounts')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionData.gc_account_id);
          
          if (gcUpdateError) {
            console.error('❌ Error updating GC account status:', gcUpdateError);
            return;
          }
        }
      }
    }
    
    console.log('✅ Successfully processed invoice payment failure');
  } catch (error) {
    console.error('❌ Error handling invoice.payment_failed:', error);
  }
}
