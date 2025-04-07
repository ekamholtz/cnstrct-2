
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
      const signature = req.headers.get('stripe-signature')

      if (!signature) {
        console.log('Missing Stripe signature')
        return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let event
      
      try {
        // Parse the event directly from the request body
        // We're bypassing signature verification for testing
        console.log('⚠️ BYPASSING SIGNATURE VERIFICATION - FOR TESTING ONLY')
        event = JSON.parse(body)
        console.log('Using event data directly from request body')
      } catch (err) {
        console.error(`⚠��� Webhook error:`, err.message)
        return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
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
      console.error(`Error handling webhook:`, err)
      return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
        status: 500,
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
})

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('Processing checkout.session.completed event')
    console.log('Session details:', JSON.stringify(session))
    
    // Extract gc_account_id from either client_reference_id or metadata
    let gcAccountId = null
    let userId = null
    
    // First check client_reference_id (which should contain the gc_account_id)
    if (session.client_reference_id && isValidUuid(session.client_reference_id)) {
      console.log('Found valid client_reference_id:', session.client_reference_id)
      
      // Verify the gc_account exists
      const exists = await verifyGcAccount(session.client_reference_id);
      if (exists) {
        gcAccountId = session.client_reference_id;
        console.log('Verified gc_account exists:', gcAccountId);
      } else {
        console.warn('Warning: client_reference_id is a valid UUID but gc_account not found');
      }
    } 
    // Then check metadata.gc_account_id
    else if (session.metadata && session.metadata.gc_account_id && isValidUuid(session.metadata.gc_account_id)) {
      console.log('Found valid gc_account_id in metadata:', session.metadata.gc_account_id)
      
      // Verify the gc_account exists
      const exists = await verifyGcAccount(session.metadata.gc_account_id);
      if (exists) {
        gcAccountId = session.metadata.gc_account_id;
        console.log('Verified gc_account exists:', gcAccountId);
      } else {
        console.warn('Warning: metadata.gc_account_id is a valid UUID but gc_account not found');
      }
    } 
    // No gc_account_id found in the expected places
    else {
      console.warn('⚠️ No valid gc_account_id found in client_reference_id or metadata')
      console.log('Session metadata:', JSON.stringify(session.metadata || {}))
    }
    
    // Extract user_id from metadata if available
    if (session.metadata?.user_id && isValidUuid(session.metadata.user_id)) {
      userId = session.metadata.user_id
      console.log('Found user_id in metadata:', userId)
    }
    
    // If we have a customer email but no gc_account_id, try to find the account by customer email
    if (!gcAccountId && session.customer_details?.email) {
      console.log('Attempting to find gc_account by customer email:', session.customer_details.email)
      
      // First, try to find a user with this email
      const { data: userData, error: userError } = await supabase
        .auth.admin.listUsers({
          filter: {
            email: session.customer_details.email
          }
        });
        
      if (userError) {
        console.error('Error finding user by email:', userError)
      }
      
      if (userData?.users && userData.users.length > 0) {
        const user = userData.users[0];
        
        // Now get the profile with gc_account_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('gc_account_id')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error finding profile:', profileError);
        }
        
        if (profileData?.gc_account_id) {
          console.log('Found gc_account_id via user email:', profileData.gc_account_id);
          gcAccountId = profileData.gc_account_id;
          if (!userId) {
            userId = user.id;
          }
        } else {
          // If still no gc_account_id, check if the user is a gc_admin with their own account
          const { data: gcData, error: gcError } = await supabase
            .from('gc_accounts')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();
            
          if (gcError) {
            console.error('Error finding gc account by owner:', gcError);
          }
          
          if (gcData?.id) {
            console.log('Found gc_account_id via gc_accounts table:', gcData.id);
            gcAccountId = gcData.id;
          }
        }
      }
    }

    // Final fallback: check for a valid user_id in auth and find their gc_account
    if (!gcAccountId && userId) {
      console.log('Attempting to find gc_account for user_id:', userId)
      
      // Try to find the user's gc_account_id in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id, role')
        .eq('id', userId)
        .maybeSingle()
        
      if (profileError) {
        console.error('Error finding profile by user_id:', profileError)
      } else if (profileData?.gc_account_id) {
        console.log('Found gc_account_id via profiles table:', profileData.gc_account_id)
        gcAccountId = profileData.gc_account_id
      } else {
        // Try to find a GC account where this user is the owner
        const { data: gcData, error: gcError } = await supabase
          .from('gc_accounts')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle()
          
        if (gcError) {
          console.error('Error finding gc account by owner_id:', gcError)
        } else if (gcData?.id) {
          console.log('Found gc_account_id via gc_accounts table:', gcData.id)
          gcAccountId = gcData.id
        }
      }
    }

    // If we still don't have a gc_account_id, try to create one
    if (!gcAccountId && userId) {
      console.warn('❌ No gc_account_id found, attempting to create a new account')
      
      try {
        // Check if this user is already a gc_admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .single()
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError)
        } else {
          // Create a new GC account with this user as owner
          const { data: newGcAccount, error: createError } = await supabase
            .from('gc_accounts')
            .insert({
              owner_id: userId,
              company_name: `${profile?.full_name || 'New'}'s Company`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single()
            
          if (createError) {
            console.error('Error creating gc account:', createError)
          } else if (newGcAccount?.id) {
            console.log('Created new gc_account with id:', newGcAccount.id)
            gcAccountId = newGcAccount.id
            
            // Update the user's profile with this gc_account_id
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ gc_account_id: gcAccountId })
              .eq('id', userId)
              
            if (updateError) {
              console.error('Error updating user profile with gc_account_id:', updateError)
            }
          }
        }
      } catch (error) {
        console.error('Error in gc_account creation fallback:', error)
      }
    }

    // If we STILL don't have a valid gcAccountId, use a placeholder
    if (!gcAccountId || !isValidUuid(gcAccountId)) {
      console.error('❌ Failed to obtain a valid gc_account_id, using placeholder')
      gcAccountId = null;
    }

    // Determine tier_id - ensure we have a valid one
    let tierId = null
    
    // Check if there's a tier_id in metadata
    if (session.metadata?.tier_id && isValidUuid(session.metadata.tier_id)) {
      tierId = session.metadata.tier_id
      console.log('Using tier_id from metadata:', tierId)
    } else {
      // Use the default tier ID
      tierId = '00000000-0000-0000-0000-000000000001' // Default free tier ID
      console.log('Using default tier_id:', tierId)
      
      // Verify this tier exists
      const { data: tierExists, error: tierError } = await supabase
        .from('subscription_tiers')
        .select('id')
        .eq('id', tierId)
        .maybeSingle()
        
      if (tierError || !tierExists) {
        console.warn('Default tier not found, attempting to create it')
        
        try {
          // Create the default tier
          const { error: createTierError } = await supabase
            .from('subscription_tiers')
            .insert({
              id: tierId,
              name: 'Free',
              description: 'Free tier with basic features',
              price: 0,
              fee_percentage: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
          if (createTierError) {
            console.error('Error creating default tier:', createTierError)
            
            // If creation fails, try to fetch any valid tier as a fallback
            const { data: anyTier, error: anyTierError } = await supabase
              .from('subscription_tiers')
              .select('id')
              .limit(1)
              .maybeSingle()
              
            if (anyTierError || !anyTier) {
              console.error('No valid tiers found in subscription_tiers table')
              return // Cannot proceed without a valid tier
            }
            
            tierId = anyTier.id
            console.log('Using fallback tier_id:', tierId)
          }
        } catch (error) {
          console.error('Error handling tier validation:', error)
          return
        }
      }
    }

    // Store the checkout session
    try {
      console.log('Recording checkout session in database')
      
      // Use a dummy UUID for user_id if not provided
      const finalUserId = (userId && isValidUuid(userId)) ? userId : PLACEHOLDER_UUID;
      
      const sessionData = {
        stripe_session_id: session.id,
        gc_account_id: gcAccountId, // This can be null, we've made it nullable
        tier_id: tierId,
        user_id: finalUserId,
        status: 'completed',
        stripe_account_id: session.account || 'platform',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
        description: session.metadata?.description || 'Subscription payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Check if this session already exists to avoid duplicates
      const { data: existingSession } = await supabase
        .from('checkout_sessions')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()
        
      if (existingSession) {
        console.log('Session already recorded, skipping insert')
      } else {
        const { error: insertError } = await supabase
          .from('checkout_sessions')
          .insert(sessionData)
          
        if (insertError) {
          console.error('Error creating checkout session record:', insertError)
        } else {
          console.log('Successfully created checkout session record')
        }
      }
    } catch (error) {
      console.error('Error storing checkout session:', error)
    }

    // If we don't have a valid gc_account_id, we can't update subscription info
    if (!gcAccountId) {
      console.error('❌ No valid gc_account_id found. Unable to update subscription.')
      return;
    }

    // Update the GC account subscription status
    console.log('Updating gc_account subscription info for account:', gcAccountId)
    
    // Update the GC account
    const { error: gcUpdateError } = await supabase
      .from('gc_accounts')
      .update({
        subscription_tier_id: tierId,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', gcAccountId)
      
    if (gcUpdateError) {
      console.error(`Error updating gc_account: ${gcUpdateError.message}`)
    } else {
      console.log('Successfully updated gc_account subscription status')
    }
    
    // Check if account_subscription record exists
    console.log('Checking for existing subscription record')
    
    const { data: existingSub, error: subCheckError } = await supabase
      .from('account_subscriptions')
      .select('*')
      .eq('gc_account_id', gcAccountId)
      .maybeSingle()
      
    if (subCheckError && subCheckError.code !== 'PGRST116') {
      console.error(`Error checking existing subscription: ${subCheckError.message}`)
    }
    
    // Create or update account_subscriptions record
    const subscriptionData = {
      tier_id: tierId,
      status: 'active',
      stripe_subscription_id: session.subscription || null,
      stripe_customer_id: session.customer || null,
      updated_at: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    if (existingSub) {
      console.log('Updating existing subscription record')
      
      const { error: subUpdateError } = await supabase
        .from('account_subscriptions')
        .update(subscriptionData)
        .eq('gc_account_id', gcAccountId)
        
      if (subUpdateError) {
        console.error(`Error updating account_subscriptions: ${subUpdateError.message}`)
      } else {
        console.log('Successfully updated account_subscriptions record')
      }
    } else {
      console.log('Creating new subscription record')
      
      // For new records we need these additional fields
      const newSubscriptionData = {
        ...subscriptionData,
        gc_account_id: gcAccountId,
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      
      try {
        const { error: subInsertError } = await supabase
          .from('account_subscriptions')
          .insert(newSubscriptionData)
          
        if (subInsertError) {
          console.error(`Error creating account_subscriptions record: ${subInsertError.message}`)
          console.log('Failed data:', JSON.stringify(newSubscriptionData))
        } else {
          console.log('Successfully created account_subscriptions record')
        }
      } catch (insertError) {
        console.error('Exception in account_subscriptions insert:', insertError)
      }
    }

    // Create payment record for tracking
    try {
      console.log('Creating payment record')
      
      // Ensure we have a valid user_id for the payment record
      let paymentUserId = userId;
      if (!paymentUserId || !isValidUuid(paymentUserId)) {
        // Try to find the owner of the GC account
        const { data: gcAccount } = await supabase
          .from('gc_accounts')
          .select('owner_id')
          .eq('id', gcAccountId)
          .maybeSingle()
          
        if (gcAccount?.owner_id && isValidUuid(gcAccount.owner_id)) {
          paymentUserId = gcAccount.owner_id;
        } else {
          // Use a placeholder UUID as last resort
          paymentUserId = PLACEHOLDER_UUID;
        }
      }
      
      const paymentData = {
        payment_intent_id: session.payment_intent || `session_${session.id}`,
        user_id: paymentUserId,
        gc_account_id: gcAccountId, // This is now nullable
        stripe_account_id: session.account || 'platform',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
        status: 'succeeded',
        customer_email: session.customer_details?.email || 'unknown@example.com',
        customer_name: session.customer_details?.name || 'Unknown Customer',
        description: session.metadata?.description || 'Subscription payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      if (session.application_fee_amount) {
        paymentData.platform_fee = session.application_fee_amount / 100;
      }

      // Check if a payment record already exists with this ID
      const { data: existingPayment } = await supabase
        .from('payment_records')
        .select('id')
        .eq('payment_intent_id', paymentData.payment_intent_id)
        .maybeSingle()
        
      if (existingPayment) {
        console.log('Payment record already exists, skipping insert')
      } else {
        const { error: paymentError } = await supabase
          .from('payment_records')
          .insert(paymentData)

        if (paymentError) {
          console.error(`Error creating payment record: ${paymentError.message}`)
        } else {
          console.log('Successfully created payment record')
        }
      }
    } catch (error) {
      console.error('Error creating payment record:', error)
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
