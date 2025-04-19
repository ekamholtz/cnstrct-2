
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import Stripe from "https://esm.sh/stripe@14.10.0";

// Default trial tier ID
const DEFAULT_TIER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Find the GC account ID associated with a Stripe session
 */
export async function findGCAccountId(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
): Promise<{ gcAccountId: string | null; userId: string | null; error: string | null }> {
  try {
    const metadata = session.metadata || {};
    let gcAccountId = metadata.gc_account_id;
    let userId = metadata.user_id;
    
    console.log('Metadata from session:', JSON.stringify(metadata));

    // If GC account ID is in metadata, verify it exists
    if (gcAccountId) {
      console.log(`GC Account ID found in metadata: ${gcAccountId}`);
      // Verify the GC account exists
      const { data: gcAccountData, error: gcAccountError } = await supabase
        .from('gc_accounts')
        .select('id')
        .eq('id', gcAccountId)
        .maybeSingle();

      if (gcAccountError || !gcAccountData) {
        console.error('GC Account ID from metadata not found in database:', gcAccountError);
        gcAccountId = null;
      }
    }

    // If user ID is in metadata, verify it exists and get their GC account
    if (userId && !gcAccountId) {
      console.log(`User ID found in metadata: ${userId}`);
      // Get user's profile and GC account ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gc_account_id, role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile from user ID in metadata:', profileError);
      } else if (profileData?.gc_account_id) {
        console.log(`Found GC account ID from user profile: ${profileData.gc_account_id}`);
        gcAccountId = profileData.gc_account_id;
      }
    }

    // If still no GC account ID, try to find by customer ID
    if (!gcAccountId && session.customer) {
      const customerId = session.customer.toString();
      console.log(`Trying to find GC account by customer ID: ${customerId}`);
      
      // Check if this customer has any account subscriptions
      const { data: subData, error: subError } = await supabase
        .from('account_subscriptions')
        .select('gc_account_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (subError) {
        console.error('Error finding subscription by customer ID:', subError);
      } else if (subData?.gc_account_id) {
        console.log(`Found GC account ID from subscriptions: ${subData.gc_account_id}`);
        gcAccountId = subData.gc_account_id;
      } else {
        // Try to find by customer in profiles
        const { data: customerProfile, error: customerError } = await supabase
          .from('profiles')
          .select('id, gc_account_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (customerError) {
          console.error('Error finding profile by customer ID:', customerError);
        } else if (customerProfile) {
          userId = customerProfile.id;
          if (customerProfile.gc_account_id) {
            console.log(`Found GC account ID from profile with customer ID: ${customerProfile.gc_account_id}`);
            gcAccountId = customerProfile.gc_account_id;
          }
        }
      }
    }

    // If still no user ID, try to find by email
    if (!userId && session.customer_email) {
      console.log(`Trying to find user by email: ${session.customer_email}`);
      
      const { data: emailProfile, error: emailError } = await supabase
        .from('profiles')
        .select('id, gc_account_id')
        .eq('email', session.customer_email.toLowerCase())
        .maybeSingle();

      if (emailError) {
        console.error('Error finding profile by email:', emailError);
      } else if (emailProfile) {
        userId = emailProfile.id;
        console.log(`Found user ID from email: ${userId}`);
        
        if (emailProfile.gc_account_id && !gcAccountId) {
          console.log(`Found GC account ID from email profile: ${emailProfile.gc_account_id}`);
          gcAccountId = emailProfile.gc_account_id;
        }
      }
    }

    return { gcAccountId, userId, error: null };
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
 * Update a GC account's subscription details
 */
export async function updateGCAccountSubscription(
  supabase: SupabaseClient,
  gcAccountId: string,
  subscription: {
    subscription_id: string;
    customer_id: string;
    status: string;
    tier_id: string;
    price_id?: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    ended_at?: string | null;
    cancel_at?: string | null;
    canceled_at?: string | null;
    trial_start?: string | null;
    trial_end?: string | null;
  }
) {
  try {
    console.log(`Updating subscription for GC account ${gcAccountId}`);
    
    // Check if there's an existing account_subscriptions record
    const { data: existingSub, error: checkError } = await supabase
      .from('account_subscriptions')
      .select('id')
      .eq('gc_account_id', gcAccountId)
      .eq('stripe_subscription_id', subscription.subscription_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing subscription:', checkError);
    }

    // Map the subscription status - we now use text type so any Stripe status is allowed
    const subscriptionStatus = subscription.status;
    const gcAccountStatus = subscription.status === 'active' ? 'active' : 'inactive';
    
    console.log(`Subscription status: ${subscriptionStatus}, GC Account status: ${gcAccountStatus}`);

    // Prepare data for updating/creating the subscription
    const subscriptionData = {
      gc_account_id: gcAccountId,
      stripe_subscription_id: subscription.subscription_id,
      stripe_customer_id: subscription.customer_id,
      status: subscriptionStatus,
      tier_id: subscription.tier_id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString()
    };

    // If we found an existing subscription, update it
    if (existingSub) {
      console.log(`Updating existing subscription record: ${existingSub.id}`);
      const { error: updateError } = await supabase
        .from('account_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);

      if (updateError) {
        console.error('Error updating account subscription:', updateError);
        throw updateError;
      }
    } else {
      // Otherwise, create a new subscription record
      console.log('Creating new subscription record');
      const { error: createError } = await supabase
        .from('account_subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString()
        });

      if (createError) {
        console.error('Error creating account subscription:', createError);
        throw createError;
      }
    }

    // Update the GC account with the latest subscription details
    console.log(`Updating GC account subscription details - tier: ${subscription.tier_id}, status: ${gcAccountStatus}`);
    const { error: updateGcError } = await supabase
      .from('gc_accounts')
      .update({
        subscription_tier_id: subscription.tier_id,
        subscription_status: gcAccountStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', gcAccountId);

    if (updateGcError) {
      console.error('Error updating GC account:', updateGcError);
      throw updateGcError;
    }

    console.log('Successfully updated subscription information');
  } catch (error) {
    console.error('Error updating account subscription:', error);
    throw error;
  }
}

/**
 * Find the subscription tier ID associated with a Stripe price ID
 */
export async function mapStripePriceToTierId(
  supabase: SupabaseClient,
  priceId: string
): Promise<string | null> {
  try {
    console.log(`Looking up tier ID for Stripe price: ${priceId}`);
    
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('stripe_price_id', priceId)
      .maybeSingle();

    if (error) {
      console.error('Error mapping price ID to tier:', error);
      return null;
    }

    if (!data) {
      console.log('No tier found for price ID, returning default tier');
      return DEFAULT_TIER_ID;
    }

    console.log(`Found tier ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('Error in mapStripePriceToTierId:', error);
    return null;
  }
}

/**
 * Create a new GC account with subscription information
 */
export async function createGCAccountWithSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscription: {
    subscription_id: string;
    customer_id: string;
    status: string;
    tier_id: string;
  }
): Promise<string | null> {
  try {
    console.log(`Creating new GC account for user ${userId}`);
    
    // Get user profile info
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, company_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }

    // Determine company name
    const companyName = userProfile.company_name || 
                        `${userProfile.full_name}'s Company` || 
                        'New Company';

    // Create GC account
    const { data: gcAccount, error: gcError } = await supabase
      .from('gc_accounts')
      .insert({
        company_name: companyName,
        owner_id: userId,
        subscription_tier_id: subscription.tier_id,
        subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (gcError) {
      console.error('Error creating GC account:', gcError);
      throw gcError;
    }

    console.log(`Created GC account: ${gcAccount.id}`);

    // Update user profile with GC account ID
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ 
        gc_account_id: gcAccount.id,
        stripe_customer_id: subscription.customer_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateProfileError) {
      console.error('Error updating user profile with GC account ID:', updateProfileError);
      // We continue because we've already created the GC account
    }

    // Create account subscription
    const { error: subscriptionError } = await supabase
      .from('account_subscriptions')
      .insert({
        gc_account_id: gcAccount.id,
        stripe_subscription_id: subscription.subscription_id,
        stripe_customer_id: subscription.customer_id,
        status: subscription.status,
        tier_id: subscription.tier_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subscriptionError) {
      console.error('Error creating account subscription:', subscriptionError);
      // We continue because we've already created the GC account
    }

    return gcAccount.id;
  } catch (error) {
    console.error('Error in createGCAccountWithSubscription:', error);
    return null;
  }
}
