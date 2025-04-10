
// Utility functions for handling Stripe subscription events

import { SupabaseClient } from "@supabase/supabase-js";
import { Session } from "https://esm.sh/stripe@14.10.0";

/**
 * Finds the GC Account ID from various sources
 * @param session The Stripe checkout session
 * @param supabase The Supabase client
 * @returns Object containing the gc_account_id and user_id if found
 */
export const findGCAccountId = async (
  session: any,
  supabase: SupabaseClient
): Promise<{ gcAccountId: string | null; userId: string | null; error: string | null }> => {
  const metadataGcAccountId = session.metadata?.gc_account_id;
  const customerId = session.customer as string;
  const clientReferenceId = session.client_reference_id;

  let gcAccountId: string | null = null;
  let userId: string | null = null;
  let error: string | null = null;

  console.log('Finding GC Account ID with:', {
    metadataGcAccountId,
    customerId,
    clientReferenceId
  });

  // Try to get gc_account_id from session metadata first
  if (metadataGcAccountId) {
    gcAccountId = metadataGcAccountId;
    console.log(`Using gc_account_id from metadata: ${gcAccountId}`);
    
    // Try to get user_id from client_reference_id (this is the user who initiated the checkout)
    if (clientReferenceId) {
      userId = clientReferenceId;
      console.log(`Using user_id from client_reference_id: ${userId}`);
    }
    
    return { gcAccountId, userId, error: null };
  }

  // Try to find a profile with this customer ID
  if (customerId) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, gc_account_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (profileError) {
        console.error('Error finding profile by customer ID:', profileError);
        error = `Error finding profile: ${profileError.message}`;
      } else if (profileData?.gc_account_id) {
        gcAccountId = profileData.gc_account_id;
        userId = profileData.id;
        console.log(`Found gc_account_id from profile: ${gcAccountId}`);
      } else {
        console.log('No profile found with this customer ID or no gc_account_id assigned to profile');
      }
    } catch (e) {
      console.error('Exception finding profile by customer ID:', e);
      error = `Exception finding profile: ${e.message}`;
    }
  }

  // If still not found and we have a client_reference_id, try to get the user's gc_account_id
  if (!gcAccountId && clientReferenceId) {
    try {
      userId = clientReferenceId; // The client_reference_id is the user's ID
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('id', clientReferenceId)
        .maybeSingle();

      if (profileError) {
        console.error('Error finding profile by client_reference_id:', profileError);
        error = `Error finding profile by user ID: ${profileError.message}`;
      } else if (profileData?.gc_account_id) {
        gcAccountId = profileData.gc_account_id;
        console.log(`Found gc_account_id from user profile: ${gcAccountId}`);
      } else {
        console.log('User profile does not have a gc_account_id');
      }
    } catch (e) {
      console.error('Exception finding profile by client_reference_id:', e);
      error = `Exception finding profile by user ID: ${e.message}`;
    }
  }

  // Last resort: Try to find a GC account owned by this user
  if (!gcAccountId && userId) {
    try {
      const { data: gcAccountData, error: gcError } = await supabase
        .from('gc_accounts')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (gcError) {
        console.error('Error finding GC account by owner_id:', gcError);
        error = `Error finding GC account: ${gcError.message}`;
      } else if (gcAccountData?.id) {
        gcAccountId = gcAccountData.id;
        console.log(`Found gc_account_id from gc_accounts where user is owner: ${gcAccountId}`);
      } else {
        console.log('No GC account found where this user is the owner');
      }
    } catch (e) {
      console.error('Exception finding GC account by owner_id:', e);
      error = `Exception finding GC account: ${e.message}`;
    }
  }

  return { gcAccountId, userId, error };
};

/**
 * Maps a Stripe price ID to a tier ID
 * @param supabase The Supabase client
 * @param priceId The Stripe price ID
 * @returns The tier ID if found, null otherwise
 */
export const mapStripePriceToTierId = async (
  supabase: SupabaseClient,
  priceId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('stripe_price_id', priceId)
      .maybeSingle();

    if (error) {
      console.error('Error mapping price to tier:', error);
      return null;
    }

    if (data) {
      return data.id;
    }

    console.warn(`No tier found for price ID: ${priceId}, using default trial tier`);
    return '00000000-0000-0000-0000-000000000001'; // Default trial tier
  } catch (error) {
    console.error('Exception mapping price to tier:', error);
    return null;
  }
};

/**
 * Updates a GC account's subscription information
 * @param supabase The Supabase client
 * @param gcAccountId The GC account ID
 * @param subscriptionData The subscription data to update
 */
export const updateGCAccountSubscription = async (
  supabase: SupabaseClient,
  gcAccountId: string,
  subscriptionData: {
    subscription_id: string;
    customer_id: string;
    status: string;
    tier_id: string;
    price_id?: string;
    cancel_at_period_end?: boolean;
    current_period_start?: string;
    current_period_end?: string;
    ended_at?: string | null;
    cancel_at?: string | null;
    canceled_at?: string | null;
    trial_start?: string | null;
    trial_end?: string | null;
  }
) => {
  try {
    console.log(`Updating subscription for GC account ${gcAccountId}:`, subscriptionData);

    // Update the gc_account subscription status and tier
    const { error: gcAccountError } = await supabase
      .from('gc_accounts')
      .update({
        subscription_tier_id: subscriptionData.tier_id,
        subscription_status: subscriptionData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', gcAccountId);

    if (gcAccountError) {
      console.error('Error updating GC account subscription:', gcAccountError);
    } else {
      console.log(`Updated GC account ${gcAccountId} subscription tier and status`);
    }

    // Update or insert account_subscriptions record
    const { error: subscriptionError } = await supabase
      .from('account_subscriptions')
      .upsert({
        gc_account_id: gcAccountId,
        stripe_subscription_id: subscriptionData.subscription_id,
        stripe_customer_id: subscriptionData.customer_id,
        status: subscriptionData.status,
        tier_id: subscriptionData.tier_id,
        cancel_at_period_end: subscriptionData.cancel_at_period_end || false,
        current_period_end: subscriptionData.current_period_end,
        start_date: subscriptionData.current_period_start,
        end_date: subscriptionData.ended_at,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'gc_account_id'
      });

    if (subscriptionError) {
      console.error('Error updating account subscription:', subscriptionError);
    } else {
      console.log(`Updated account_subscriptions for GC account ${gcAccountId}`);
    }
  } catch (error) {
    console.error('Exception updating GC account subscription:', error);
  }
};

/**
 * Creates a new GC account with basic subscription information
 * @param supabase The Supabase client
 * @param userId The user ID who will own the account
 * @param subscriptionData The subscription data
 * @returns The newly created GC account ID
 */
export const createGCAccountWithSubscription = async (
  supabase: SupabaseClient,
  userId: string,
  subscriptionData: {
    subscription_id: string;
    customer_id: string;
    status: string;
    tier_id: string;
  }
): Promise<string | null> => {
  try {
    console.log(`Creating new GC account for user ${userId} with subscription:`, subscriptionData);
    
    // Get the user's profile for information
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, company_name')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    // Create a new GC account
    const companyName = profileData.company_name || `${profileData.full_name}'s Company`;
    
    const { data: gcAccount, error: gcAccountError } = await supabase
      .from('gc_accounts')
      .insert({
        owner_id: userId,
        company_name: companyName,
        subscription_tier_id: subscriptionData.tier_id,
        subscription_status: subscriptionData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (gcAccountError) {
      console.error('Error creating GC account:', gcAccountError);
      return null;
    }
    
    const gcAccountId = gcAccount.id;
    console.log(`Created new GC account with ID: ${gcAccountId}`);
    
    // Update user profile with the new GC account ID
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ 
        gc_account_id: gcAccountId,
        stripe_customer_id: subscriptionData.customer_id,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
      
    if (updateProfileError) {
      console.error('Error updating user profile with GC account ID:', updateProfileError);
    }
    
    // Create account_subscriptions record
    const { error: subscriptionError } = await supabase
      .from('account_subscriptions')
      .insert({
        gc_account_id: gcAccountId,
        stripe_subscription_id: subscriptionData.subscription_id,
        stripe_customer_id: subscriptionData.customer_id,
        status: subscriptionData.status,
        tier_id: subscriptionData.tier_id,
        start_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (subscriptionError) {
      console.error('Error creating account subscription:', subscriptionError);
    }
    
    return gcAccountId;
  } catch (error) {
    console.error('Exception creating GC account with subscription:', error);
    return null;
  }
};
