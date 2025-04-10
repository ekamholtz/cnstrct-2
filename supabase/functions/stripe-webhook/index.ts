
// Supabase Edge Function for Stripe Webhook Handler

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import Stripe from "https://esm.sh/stripe@14.10.0";
import { findGCAccountId, updateGCAccountSubscription, mapStripePriceToTierId } from "./subscription-handler.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Get the webhook secret from environment variables
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Placeholder UUID to use when we don't have a valid UUID
const PLACEHOLDER_UUID = '00000000-0000-0000-0000-000000000000';

// Improved UUID validation with proper regex pattern
function isValidUuid(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Function to verify a GC account exists
async function verifyGcAccount(gcAccountId: string): Promise<boolean> {
  if (!isValidUuid(gcAccountId)) return false;
  
  try {
    const { data, error } = await supabase
      .from('gc_accounts')
      .select('id')
      .eq('id', gcAccountId)
      .maybeSingle();
      
    if (error) {
      console.error('Error verifying gc_account:', error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error('Exception verifying gc_account:', err);
    return false;
  }
}

serve(async (req) => {
  try {
    console.log('Webhook received:', new Date().toISOString());
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests for webhooks
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await req.text();
      console.log('Webhook body received:', body.substring(0, 100) + '...');
      
      // Get the signature from headers
      const signature = req.headers.get('stripe-signature');
      
      if (!signature && webhookSecret) {
        console.error('Missing Stripe signature');
        return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let event: Stripe.Event;
      
      // Verify the signature if webhook secret is available
      if (webhookSecret && signature) {
        try {
          // Using the async version to avoid the SubtleCryptoProvider synchronous context error
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
          );
          console.log('Signature verification successful');
        } catch (verifyError: any) {
          console.error('Signature verification failed:', verifyError.message);
          return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${verifyError.message}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // For development, allow without signature verification
        console.log('⚠️ No webhook secret or signature - skipping verification (for development only)');
        try {
          event = JSON.parse(body);
        } catch (jsonError: any) {
          console.error('JSON parse error:', jsonError.message);
          return new Response(JSON.stringify({ error: `JSON parse error: ${jsonError.message}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Validate that we have a proper event object
      if (!event || !event.type || !event.data || !event.data.object) {
        console.error('Invalid event structure:', JSON.stringify(event || {}).substring(0, 200));
        return new Response(JSON.stringify({ error: 'Invalid event structure' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`✅ Success: Received event ${event.type} with ID ${event.id}`);
      console.log('Event data:', JSON.stringify(event.data.object).substring(0, 200) + '...');

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'account.updated':
          await handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error(`⚠️ Webhook error:`, err.message);
      return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (outerErr: any) {
    console.error('Outer try/catch error:', outerErr.message);
    return new Response(JSON.stringify({ error: `Server error: ${outerErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout.session.completed event');
    console.log('Session details:', JSON.stringify(session));

    // Use the centralized function to find the gc_account_id
    const { gcAccountId, userId, error: findError } = await findGCAccountId(session, supabase);

    if (findError) {
      console.error('Error finding GC Account ID:', findError);
      // Log the error but continue processing
    }

    console.log(`Found identifiers - GC Account ID: ${gcAccountId}, User ID: ${userId}`);

    // Extract subscription and customer IDs
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    console.log(`Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);

    if (!subscriptionId || !customerId) {
      console.error('Missing subscription or customer ID in checkout session');
      return;
    }

    // Create a checkout_sessions record for our database
    if (userId) {
      try {
        const { error: sessionInsertError } = await supabase
          .from('checkout_sessions')
          .insert({
            stripe_session_id: session.id,
            user_id: userId,
            gc_account_id: gcAccountId || null,
            stripe_account_id: 'platform',
            status: 'completed',
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            description: 'Subscription checkout',
            metadata: session.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (sessionInsertError) {
          console.error('Error creating checkout session record:', sessionInsertError);
        }
      } catch (error) {
        console.error('Error creating checkout session record:', error);
      }
    }

    // Retrieve the subscription details from Stripe to get the current item and price
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });
    console.log('Retrieved subscription details:', JSON.stringify(subscription).substring(0, 300) + '...');

    if (!subscription || !subscription.items || subscription.items.data.length === 0) {
      console.error('Subscription not found or has no items');
      return;
    }

    const item = subscription.items.data[0];
    const price = item.price;
    const product = price.product as Stripe.Product; 
    
    let tierId = null;
    
    // First try to get the tier_id from the product metadata
    if (product && product.metadata && product.metadata.supabase_tier_id) {
      tierId = product.metadata.supabase_tier_id;
      console.log(`Found tier_id from product metadata: ${tierId}`);
    }
    
    // If no tier_id in metadata, try to map from price ID
    if (!tierId) {
      tierId = await mapStripePriceToTierId(supabase, price.id);
      console.log(`Mapped price ID ${price.id} to tier_id: ${tierId}`);
    }
    
    // If still no tier_id, use a default trial tier
    if (!tierId) {
      tierId = '00000000-0000-0000-0000-000000000001'; // Default trial tier
      console.log(`Using default trial tier ID: ${tierId}`);
    }

    // If we couldn't determine the gc_account_id, we can't proceed
    if (!gcAccountId) {
      console.error('CRITICAL: Could not determine gc_account_id after all checks.');
      return;
    }

    // Verify the GC account exists
    const accountExists = await verifyGcAccount(gcAccountId);
    if (!accountExists) {
      console.error(`GC Account ${gcAccountId} does not exist`);
      return;
    }

    // Use the determined gcAccountId to update the account
    console.log(`Updating GC Account ${gcAccountId} with subscription details`);
    await updateGCAccountSubscription(supabase, gcAccountId, {
      subscription_id: subscription.id,
      customer_id: customerId,
      status: subscription.status,
      tier_id: tierId,
      price_id: price.id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });

    // Update user profile if needed (e.g., link customer ID)
    if (userId && customerId) {
      try {
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else if (profile) {
          // Check if we need to update the customer ID
          if (!profile.stripe_customer_id || profile.stripe_customer_id !== customerId) {
            console.log(`Updating profile for user ${userId} with Stripe customer ID ${customerId}`);
            const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({ 
                stripe_customer_id: customerId,
                updated_at: new Date().toISOString() 
              })
              .eq('id', userId);

            if (updateProfileError) {
              console.error('Error updating user profile with Stripe customer ID:', updateProfileError);
            }
          }
        } else {
          console.warn(`User profile not found for user ID: ${userId}`);
        }
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }

    console.log('✅ Successfully completed checkout.session.completed processing');
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded event');
    
    // Extract metadata
    const metadata = paymentIntent.metadata || {};
    const invoiceId = metadata.invoice_id;
    const userId = metadata.user_id;
    const gcAccountId = metadata.gc_account_id;

    // Update payment link status if associated with this payment intent
    if (paymentIntent.id) {
      try {
        const { error } = await supabase
          .from('payment_links')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error(`Error updating payment link: ${error.message}`);
        }
      } catch (error) {
        console.error('Error updating payment link:', error);
      }
    }

    // Update invoice status if invoice_id is present and valid
    if (invoiceId && isValidUuid(invoiceId)) {
      try {
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
          .eq('id', invoiceId);

        if (error) {
          console.error(`Error updating invoice: ${error.message}`);
        }
      } catch (error) {
        console.error('Error updating invoice:', error);
      }
    }

    // Create payment record if not already created by checkout.session.completed
    try {
      const { data: existingRecord } = await supabase
        .from('payment_records')
        .select('id')
        .eq('payment_intent_id', paymentIntent.id)
        .maybeSingle();

      if (!existingRecord) {
        // Validate userId
        let validUserId = (userId && isValidUuid(userId)) ? 
          userId : PLACEHOLDER_UUID;
        
        // Prepare payment data
        const paymentData: any = {
          payment_intent_id: paymentIntent.id,
          user_id: validUserId,
          stripe_account_id: paymentIntent.account || 'platform',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'succeeded',
          customer_email: paymentIntent.receipt_email || null,
          description: paymentIntent.description || 'Payment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Only add gcAccountId if it's valid
        if (gcAccountId && isValidUuid(gcAccountId)) {
          paymentData.gc_account_id = gcAccountId;
        }
        
        // Only add platform_fee if it exists
        if (paymentIntent.application_fee_amount) {
          paymentData.platform_fee = paymentIntent.application_fee_amount / 100;
        }

        const { error } = await supabase
          .from('payment_records')
          .insert(paymentData);

        if (error) {
          console.error(`Error creating payment record: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error handling payment record:', error);
    }
    
    console.log('✅ Successfully completed payment_intent.succeeded processing');
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error);
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed event');
    
    // Extract metadata
    const metadata = paymentIntent.metadata || {};
    const invoiceId = metadata.invoice_id;
    const userId = metadata.user_id;
    const gcAccountId = metadata.gc_account_id;

    // Update payment link status if associated with this payment intent
    if (paymentIntent.id) {
      try {
        const { error } = await supabase
          .from('payment_links')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error(`Error updating payment link: ${error.message}`);
        }
      } catch (error) {
        console.error('Error updating payment link:', error);
      }
    }

    // Create payment record for the failed payment
    try {
      // Validate userId
      let validUserId = (userId && isValidUuid(userId)) ? 
        userId : PLACEHOLDER_UUID;
      
      // Prepare payment data
      const paymentData: any = {
        payment_intent_id: paymentIntent.id,
        user_id: validUserId,
        stripe_account_id: paymentIntent.account || 'platform',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'failed',
        customer_email: paymentIntent.receipt_email || null,
        description: paymentIntent.description || 'Failed payment',
        error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add gcAccountId if it's valid
      if (gcAccountId && isValidUuid(gcAccountId)) {
        paymentData.gc_account_id = gcAccountId;
      }
      
      // Only add platform_fee if it exists
      if (paymentIntent.application_fee_amount) {
        paymentData.platform_fee = paymentIntent.application_fee_amount / 100;
      }

      const { error } = await supabase
        .from('payment_records')
        .insert(paymentData);

      if (error) {
        console.error(`Error creating payment record: ${error.message}`);
      }
    } catch (error) {
      console.error('Error handling failed payment record:', error);
    }
    
    console.log('✅ Successfully completed payment_intent.payment_failed processing');
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error);
  }
}

/**
 * Handle account.updated event
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log('Processing account.updated event');
    
    // Update the account status in our database
    try {
      const { error } = await supabase
        .from('stripe_connect_accounts')
        .update({
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', account.id);

      if (error) {
        console.error(`Error updating account status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating account status:', error);
    }
    
    console.log('✅ Successfully completed account.updated processing');
  } catch (error) {
    console.error('Error in handleAccountUpdated:', error);
  }
}

/**
 * Handle subscription change events (created/updated)
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    console.log(`Processing subscription ${subscription.status} event`);
    
    // Find the GC account associated with this customer
    const customerId = subscription.customer as string;
    
    // First, check if we have account_subscriptions records with this subscription ID
    const { data: existingSubscription, error: existingSubError } = await supabase
      .from('account_subscriptions')
      .select('gc_account_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
      
    if (existingSubError) {
      console.error('Error checking existing subscriptions:', existingSubError);
    }
    
    let gcAccountId = existingSubscription?.gc_account_id;
    
    // If not found, try to find by customer ID
    if (!gcAccountId) {
      const { data: customerSubData, error: customerSubError } = await supabase
        .from('account_subscriptions')
        .select('gc_account_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
        
      if (customerSubError) {
        console.error('Error finding subscription by customer ID:', customerSubError);
      } else if (customerSubData) {
        gcAccountId = customerSubData.gc_account_id;
      }
    }
    
    // If still not found, try to find by user profile with this customer ID
    if (!gcAccountId) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error finding profile by customer ID:', profileError);
      } else if (profileData?.gc_account_id) {
        gcAccountId = profileData.gc_account_id;
      }
    }
    
    if (!gcAccountId) {
      console.error('Could not find GC account for subscription:', subscription.id);
      return;
    }
    
    // Find the subscription item to get the price
    if (!subscription.items || subscription.items.data.length === 0) {
      console.error('No items found in subscription');
      return;
    }
    
    const item = subscription.items.data[0];
    const priceId = item.price.id;
    
    // Get the tier ID from the price
    const tierId = await mapStripePriceToTierId(supabase, priceId);
    
    if (!tierId) {
      console.error('Could not map price ID to tier:', priceId);
      return;
    }
    
    // Update the subscription in our database
    await updateGCAccountSubscription(supabase, gcAccountId, {
      subscription_id: subscription.id,
      customer_id: customerId,
      status: subscription.status,
      tier_id: tierId,
      price_id: priceId,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });
    
    console.log(`✅ Successfully processed subscription change for ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription cancelled event');
    
    // Find the GC account associated with this subscription
    const { data: existingSubscription, error: existingSubError } = await supabase
      .from('account_subscriptions')
      .select('gc_account_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
      
    if (existingSubError) {
      console.error('Error checking existing subscriptions:', existingSubError);
      return;
    }
    
    if (!existingSubscription || !existingSubscription.gc_account_id) {
      console.error('No GC account found for subscription:', subscription.id);
      return;
    }
    
    const gcAccountId = existingSubscription.gc_account_id;
    
    // Update the account_subscriptions record
    const { error: updateSubError } = await supabase
      .from('account_subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
      
    if (updateSubError) {
      console.error('Error updating account subscription:', updateSubError);
    }
    
    // Set the GC account subscription to trial tier
    const { error: updateGcError } = await supabase
      .from('gc_accounts')
      .update({
        subscription_tier_id: '00000000-0000-0000-0000-000000000001', // Default trial tier
        subscription_status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', gcAccountId);
      
    if (updateGcError) {
      console.error('Error updating GC account subscription status:', updateGcError);
    }
    
    console.log(`✅ Successfully processed subscription cancellation for ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}
