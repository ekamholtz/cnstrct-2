
// Supabase Edge Function for Stripe Webhook Handler

import { serve, createClient, Stripe } from './deps.ts'
import { findGCAccountId, updateGCAccountSubscription } from './subscription-handler.ts'

// --- TEMPORARILY COMMENTED OUT FOR DEBUGGING ---
/*
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Get the webhook secret from environment variables
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
*/
// --- END TEMPORARY COMMENT ---

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
  // --- TEMPORARILY COMMENTED OUT FOR DEBUGGING ---
  /*
  try {
    console.log('Webhook received:', new Date().toISOString());
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request')
      return new Response(null, { headers: corsHeaders })
    }

    // Only allow POST requests for webhooks
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method)
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      const body = await req.text()
      console.log('Webhook body received:', body.substring(0, 100) + '...')
      
      // COMPLETELY BYPASS SIGNATURE VERIFICATION
      console.log('⚠️ COMPLETELY BYPASSING SIGNATURE VERIFICATION - FOR TESTING ONLY')
      
      // Safely parse the JSON
      try {
        let event: Stripe.Event = JSON.parse(body)
        console.log('Successfully parsed event JSON from request body')
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        return new Response(JSON.stringify({ error: `JSON parse error: ${jsonError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Validate that we have a proper event object
      if (!event || !event.type || !event.data || !event.data.object) {
        console.error('Invalid event structure:', JSON.stringify(event).substring(0, 200))
        return new Response(JSON.stringify({ error: 'Invalid event structure' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`✅ Success: Received event ${event.type} with ID ${event.id}`)
      console.log('Event data:', JSON.stringify(event.data.object).substring(0, 200) + '...')

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

        default:
          console.log(`Unhandled event type ${event.type}`)
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error(`⚠��� Webhook error:`, err.message)
      return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (outerErr) {
    console.error('Outer try/catch error:', outerErr)
    return new Response(JSON.stringify({ error: `Server error: ${outerErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
*/
// --- END TEMPORARY COMMENT ---

// Simple response for testing deployment
console.log('Received request, returning simple OK.');
return new Response('OK', { 
  headers: {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST',
    'Content-Type': 'text/plain'
  }
});

});

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('Processing checkout.session.completed event')
    console.log('Session details:', JSON.stringify(session))

    // Use the centralized function to find the gc_account_id
    const { gcAccountId, userId, error: findError } = await findGCAccountId(session, supabase);

    if (findError) {
      console.error('Error finding GC Account ID:', findError);
      // Depending on the severity, you might want to return early or log and continue
      // For now, we'll log and attempt to proceed if possible
    }

    console.log(`Found identifiers - GC Account ID: ${gcAccountId}, User ID: ${userId}`);

    // Extract subscription and customer IDs
    const subscriptionId = session.subscription
    const customerId = session.customer

    console.log(`Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);

    if (!subscriptionId || !customerId) {
      console.error('Missing subscription or customer ID in checkout session')
      return new Response(JSON.stringify({ error: 'Missing subscription or customer ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Retrieve the subscription details from Stripe to get the current item and price
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });
    console.log('Retrieved subscription details:', JSON.stringify(subscription).substring(0, 300) + '...');

    if (!subscription || !subscription.items || subscription.items.data.length === 0) {
      console.error('Subscription not found or has no items');
      return new Response(JSON.stringify({ error: 'Subscription not found or has no items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const item = subscription.items.data[0];
    const price = item.price;
    const product = price.product; // This can be a string ID or a Product object
    
    let tierId = 'MISSING_TIER_ID';
    let productId = 'MISSING_PRODUCT_ID';
    
    // Type guard to ensure product is an object before accessing properties
    if (typeof product === 'object' && product !== null && !product.deleted) {
      tierId = product.metadata?.supabase_tier_id || 'MISSING_TIER_ID'; // Get Supabase tier ID from product metadata
      productId = product.id;
    } else if (typeof product === 'string') {
      productId = product; // It's just the ID
      console.warn(`Product object not expanded for subscription ${subscription.id}. Cannot retrieve tier_id from metadata.`);
      // Potentially fetch the product details here if needed, or rely on a default
    }
    
    console.log(`Product ID: ${productId}, Price ID: ${price.id}, Supabase Tier ID: ${tierId}`);

    if (tierId === 'MISSING_TIER_ID') {
      console.error(`Supabase tier ID is missing or product not expanded! Product ID: ${productId}`);
      // Decide how to handle this - maybe assign a default tier or log an error
    }

    if (!gcAccountId) {
        console.error('CRITICAL: Could not determine gc_account_id after all checks.');
        // Optionally, log the session details for manual investigation
        // logSessionForManualReview(session);
        return new Response(JSON.stringify({ error: 'Could not link subscription to a GC account.' }), {
            status: 400, // Or 500 if it indicates a server-side logic issue
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Use the final determined gcAccountId to update the account
    console.log(`Updating GC Account ${gcAccountId} with subscription details`);
    await updateGCAccountSubscription(supabase, gcAccountId, {
      subscription_id: subscription.id,
      customer_id: customerId,
      status: subscription.status,
      tier_id: tierId, // Use the tier_id from product metadata
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

    // Optionally: Update user profile if needed (e.g., link customer ID)
    if (userId && customerId) {
      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, stripe_customer_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
          console.error('Error fetching user profile:', profileError);
      } else if (profile && profile.stripe_customer_id !== customerId) {
          console.log(`Updating profile for user ${userId} with Stripe customer ID ${customerId}`);
          const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', userId);

          if (updateProfileError) {
              console.error('Error updating user profile with Stripe customer ID:', updateProfileError);
          }
      } else if (!profile) {
          console.warn(`User profile not found for user ID: ${userId}. Cannot update Stripe customer ID.`);
      }
    }

    console.log('✅ Successfully completed checkout.session.completed processing')
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment_intent.succeeded event')
    
    // Extract metadata
    const { invoice_id: invoiceId, user_id: userId, gc_account_id: gcAccountId } = paymentIntent.metadata || {}

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
    if (invoiceId && isValidUuid(invoiceId)) {
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
      // Validate userId and gcAccountId
      let validUserId = (userId && isValidUuid(userId)) ? 
        userId : '00000000-0000-0000-0000-000000000000';
      
      const paymentData = {
        payment_intent_id: paymentIntent.id,
        user_id: validUserId,
        stripe_account_id: paymentIntent.account || 'platform',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'succeeded',
        customer_email: paymentIntent.receipt_email || 'unknown@example.com',
        description: paymentIntent.description || 'Payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Only add gcAccountId if it's valid
      if (gcAccountId && isValidUuid(gcAccountId)) {
        paymentData.gc_account_id = gcAccountId
      }
      
      // Only add platform_fee if it exists
      if (paymentIntent.application_fee_amount) {
        paymentData.platform_fee = paymentIntent.application_fee_amount / 100
      }

      const { error } = await supabase
        .from('payment_records')
        .insert(paymentData)

      if (error) {
        console.error(`Error creating payment record: ${error.message}`)
      }
    }
    
    console.log('✅ Successfully completed payment_intent.succeeded processing')
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error)
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing payment_intent.payment_failed event')
    
    // Extract metadata
    const { invoice_id: invoiceId, user_id: userId, gc_account_id: gcAccountId } = paymentIntent.metadata || {}

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

    // Validate userId
    let validUserId = (userId && isValidUuid(userId)) ? 
      userId : '00000000-0000-0000-0000-000000000000';
    
    // Create payment record
    const paymentData = {
      payment_intent_id: paymentIntent.id,
      user_id: validUserId,
      stripe_account_id: paymentIntent.account || 'platform',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      customer_email: paymentIntent.receipt_email || 'unknown@example.com',
      description: paymentIntent.description || 'Failed payment',
      error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Only add gcAccountId if it's valid
    if (gcAccountId && isValidUuid(gcAccountId)) {
      paymentData.gc_account_id = gcAccountId
    }
    
    // Only add platform_fee if it exists
    if (paymentIntent.application_fee_amount) {
      paymentData.platform_fee = paymentIntent.application_fee_amount / 100
    }

    const { error } = await supabase
      .from('payment_records')
      .insert(paymentData)

    if (error) {
      console.error(`Error creating payment record: ${error.message}`)
    }
    
    console.log('✅ Successfully completed payment_intent.payment_failed processing')
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error)
  }
}

/**
 * Handle account.updated event
 */
async function handleAccountUpdated(account) {
  try {
    console.log('Processing account.updated event')
    
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
    
    console.log('✅ Successfully completed account.updated processing')
  } catch (error) {
    console.error('Error in handleAccountUpdated:', error)
  }
}

/**
 * Handle account.application.authorized event
 */
async function handleAccountAuthorized(account) {
  try {
    console.log('Processing account.application.authorized event')
    console.log(`Account ${account.id} has authorized our application`)
    
    // You can add more custom handling here
    console.log('✅ Successfully completed account.application.authorized processing')
  } catch (error) {
    console.error('Error in handleAccountAuthorized:', error)
  }
}

/**
 * Handle account.application.deauthorized event
 */
async function handleAccountDeauthorized(account) {
  try {
    console.log('Processing account.application.deauthorized event')
    
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
    
    console.log('✅ Successfully completed account.application.deauthorized processing')
  } catch (error) {
    console.error('Error in handleAccountDeauthorized:', error)
  }
}
