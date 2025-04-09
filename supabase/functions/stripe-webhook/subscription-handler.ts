
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export interface GCAccountInfo {
  gcAccountId: string;
  userId: string | null;
  error: string | null;
}

/**
 * Finds the GC account ID from a checkout session
 * @param session The Stripe checkout session
 * @param supabase The Supabase client
 * @returns Object containing gcAccountId, userId and any error
 */
export async function findGCAccountId(
  session: any, 
  supabase: ReturnType<typeof createClient>
): Promise<GCAccountInfo> {
  console.log('Starting findGCAccountId process');
  
  try {
    let gcAccountId: string | null = null;
    let userId: string | null = null;
    let error: string | null = null;
    
    // First check if gc_account_id is in the metadata
    if (session.metadata && session.metadata.gc_account_id) {
      console.log(`Found gc_account_id in metadata: ${session.metadata.gc_account_id}`);
      gcAccountId = session.metadata.gc_account_id;
      
      // Find the associated user if available
      if (session.metadata.user_id) {
        userId = session.metadata.user_id;
      } else if (session.client_reference_id) {
        userId = session.client_reference_id;
      }
      
      return { gcAccountId, userId, error: null };
    }
    
    // If client_reference_id is set, it might be the user ID
    if (session.client_reference_id) {
      console.log(`Using client_reference_id as user_id: ${session.client_reference_id}`);
      userId = session.client_reference_id;
      
      // Try to get the gc_account_id from the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error(`Error fetching profile for user ${userId}:`, profileError);
      } else if (profileData && profileData.gc_account_id) {
        console.log(`Found gc_account_id from profile: ${profileData.gc_account_id}`);
        gcAccountId = profileData.gc_account_id;
        return { gcAccountId, userId, error: null };
      } else {
        console.log(`No gc_account_id found in profile, checking gc_accounts table`);
        
        // Try to find a GC account owned by this user
        const { data: gcData, error: gcError } = await supabase
          .from('gc_accounts')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();
          
        if (gcError) {
          console.error(`Error finding gc_account for owner ${userId}:`, gcError);
        } else if (gcData) {
          console.log(`Found gc_account from owner_id: ${gcData.id}`);
          gcAccountId = gcData.id;
          return { gcAccountId, userId, error: null };
        }
      }
    }
    
    // If customer email is available, try to find user by email
    if (session.customer_details && session.customer_details.email) {
      const customerEmail = session.customer_details.email;
      console.log(`Looking up user by email: ${customerEmail}`);
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, gc_account_id')
        .eq('email', customerEmail)
        .maybeSingle();
        
      if (userError) {
        console.error(`Error finding user by email ${customerEmail}:`, userError);
      } else if (userData) {
        console.log(`Found user by email: ${userData.id}`);
        userId = userData.id;
        
        if (userData.gc_account_id) {
          console.log(`Found gc_account_id from email lookup: ${userData.gc_account_id}`);
          gcAccountId = userData.gc_account_id;
          return { gcAccountId, userId, error: null };
        } else {
          // Try to find a GC account owned by this user
          const { data: gcData, error: gcError } = await supabase
            .from('gc_accounts')
            .select('id')
            .eq('owner_id', userId)
            .maybeSingle();
            
          if (gcError) {
            console.error(`Error finding gc_account for owner ${userId}:`, gcError);
          } else if (gcData) {
            console.log(`Found gc_account from owner_id: ${gcData.id}`);
            gcAccountId = gcData.id;
            return { gcAccountId, userId, error: null };
          }
        }
      }
    }
    
    // If we still haven't found the gcAccountId but we have a userId,
    // check if there's any checkout_sessions record that might help
    if (userId && !gcAccountId) {
      console.log(`Checking checkout_sessions table for user ${userId}`);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('checkout_sessions')
        .select('gc_account_id')
        .eq('user_id', userId)
        .eq('stripe_session_id', session.id)
        .maybeSingle();
        
      if (sessionError) {
        console.error(`Error finding checkout session for user ${userId}:`, sessionError);
      } else if (sessionData && sessionData.gc_account_id) {
        console.log(`Found gc_account_id from checkout_sessions: ${sessionData.gc_account_id}`);
        gcAccountId = sessionData.gc_account_id;
        return { gcAccountId, userId, error: null };
      }
    }
    
    // If we have a customer ID, check previous payment records
    if (session.customer && !gcAccountId) {
      console.log(`Checking payment_records table for customer ${session.customer}`);
      
      // Look for previous payment records with this customer
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_records')
        .select('gc_account_id')
        .eq('customer_id', session.customer)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (paymentError) {
        console.error(`Error finding payment record for customer ${session.customer}:`, paymentError);
      } else if (paymentData && paymentData.gc_account_id) {
        console.log(`Found gc_account_id from payment_records: ${paymentData.gc_account_id}`);
        gcAccountId = paymentData.gc_account_id;
        return { gcAccountId, userId, error: null };
      }
    }
    
    if (!gcAccountId) {
      error = "Could not determine GC account ID from checkout session";
      console.error(error);
    }
    
    return { gcAccountId, userId, error };
  } catch (error) {
    console.error('Error in findGCAccountId:', error);
    return { 
      gcAccountId: null, 
      userId: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Updates a GC Account's subscription details
 * @param supabase The Supabase client
 * @param gcAccountId The GC account ID to update
 * @param subscriptionData The subscription data to set
 */
export async function updateGCAccountSubscription(
  supabase: ReturnType<typeof createClient>,
  gcAccountId: string,
  subscriptionData: {
    subscription_id: string;
    customer_id: string;
    status: string;
    tier_id: string;
    price_id: string;
    cancel_at_period_end: boolean;
    current_period_start: string;
    current_period_end: string;
    ended_at: string | null;
    cancel_at: string | null;
    canceled_at: string | null;
    trial_start: string | null;
    trial_end: string | null;
  }
): Promise<void> {
  try {
    console.log(`Updating subscription for GC account ${gcAccountId}`);
    
    // First update the GC account subscription_tier_id and status
    const { error: gcUpdateError } = await supabase
      .from('gc_accounts')
      .update({
        subscription_tier_id: subscriptionData.tier_id,
        subscription_status: subscriptionData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', gcAccountId);
    
    if (gcUpdateError) {
      console.error(`Error updating GC account subscription: ${gcUpdateError.message}`);
      throw gcUpdateError;
    }
    
    // Then update or insert the account_subscriptions record
    const { error: subscriptionError } = await supabase
      .from('account_subscriptions')
      .upsert({
        gc_account_id: gcAccountId,
        stripe_subscription_id: subscriptionData.subscription_id,
        stripe_customer_id: subscriptionData.customer_id,
        tier_id: subscriptionData.tier_id,
        status: subscriptionData.status,
        start_date: subscriptionData.current_period_start,
        end_date: subscriptionData.current_period_end,
        current_period_end: subscriptionData.current_period_end,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'gc_account_id'
      });
    
    if (subscriptionError) {
      console.error(`Error updating account_subscriptions: ${subscriptionError.message}`);
      throw subscriptionError;
    }
    
    console.log(`Successfully updated subscription for GC account ${gcAccountId}`);
  } catch (error) {
    console.error(`Error in updateGCAccountSubscription: ${error}`);
    throw error;
  }
}

/**
 * Maps a Stripe price ID to a subscription tier ID
 * @param supabase The Supabase client
 * @param priceId The Stripe price ID
 * @returns The subscription tier ID or null if not found
 */
export async function mapStripePriceToTierId(
  supabase: ReturnType<typeof createClient>,
  priceId: string
): Promise<string | null> {
  try {
    console.log(`Mapping Stripe price ID ${priceId} to subscription tier`);
    
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('stripe_price_id', priceId)
      .maybeSingle();
    
    if (error) {
      console.error(`Error finding tier for price ID ${priceId}: ${error.message}`);
      return null;
    }
    
    if (!data) {
      console.warn(`No tier found for price ID ${priceId}`);
      return null;
    }
    
    console.log(`Found tier ${data.id} for price ID ${priceId}`);
    return data.id;
  } catch (error) {
    console.error(`Error in mapStripePriceToTierId: ${error}`);
    return null;
  }
}
