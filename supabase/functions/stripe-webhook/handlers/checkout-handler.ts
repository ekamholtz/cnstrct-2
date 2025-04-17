
import { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { findGCAccountId, updateGCAccountSubscription, mapStripePriceToTierId, createGCAccountWithSubscription } from "../subscription-handler";
import { logStep } from "../utils";

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  try {
    logStep('Processing checkout.session.completed event');
    logStep('Session details:', JSON.stringify(session).substring(0, 500) + '...');

    const { gcAccountId, userId, error: findError } = await findGCAccountId(session, supabase);

    if (findError) {
      console.error('Error finding GC Account ID:', findError);
    }

    logStep(`Found identifiers - GC Account ID: ${gcAccountId}, User ID: ${userId}`);

    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    logStep(`Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);

    if (!subscriptionId || !customerId) {
      console.error('Missing subscription or customer ID in checkout session');
      return;
    }

    // Create checkout session record
    if (userId) {
      await createCheckoutSessionRecord(supabase, session, userId, gcAccountId);
    }

    // Update subscription information
    await updateSubscriptionInformation(supabase, subscriptionId, customerId, gcAccountId, userId);

    logStep('✅ Successfully completed checkout.session.completed processing');
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

async function createCheckoutSessionRecord(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  userId: string,
  gcAccountId: string | null
) {
  try {
    const { error: sessionInsertError } = await supabase
      .from('checkout_sessions')
      .insert({
        stripe_session_id: session.id,
        user_id: userId,
        gc_account_id: gcAccountId,
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

async function updateSubscriptionInformation(
  supabase: SupabaseClient,
  subscriptionId: string,
  customerId: string,
  gcAccountId: string | null,
  userId: string | null
) {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16'
  });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });

  if (!subscription || !subscription.items || subscription.items.data.length === 0) {
    console.error('Subscription not found or has no items');
    return;
  }

  const item = subscription.items.data[0];
  const price = item.price;
  const product = price.product as Stripe.Product;
  
  let tierId = null;
  
  if (product?.metadata?.supabase_tier_id) {
    tierId = product.metadata.supabase_tier_id;
    logStep(`Found tier_id from product metadata: ${tierId}`);
  } else {
    tierId = await mapStripePriceToTierId(supabase, price.id);
    logStep(`Mapped price ID ${price.id} to tier_id: ${tierId}`);
  }
  
  if (!tierId) {
    tierId = '00000000-0000-0000-0000-000000000001'; // Default trial tier
    logStep(`Using default trial tier ID: ${tierId}`);
  }

  // Update subscription information
  if (gcAccountId) {
    await updateGCAccountSubscription(supabase, gcAccountId, {
      subscription_id: subscription.id,
      customer_id: customerId,
      status: subscription.status,
      tier_id: tierId,
      price_id: price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });
  }
}
