import axios from 'axios';
import { getProxyUrl, getStripeAccessToken } from './StripeConnectService';

/**
 * Creates a Checkout Session for a connected account
 * @param amount The amount in cents
 * @param currency The currency code (e.g., 'usd')
 * @param connectedAccountId The ID of the connected Stripe account
 * @param description Description of the product/service
 * @param metadata Additional metadata to include with the checkout session
 * @param successUrl URL to redirect on successful payment
 * @param cancelUrl URL to redirect on canceled payment
 * @returns The created Checkout Session
 */
export const createCheckoutSession = async (
  amount: number,
  currency: string,
  connectedAccountId: string,
  description: string,
  metadata: Record<string, any> = {},
  successUrl?: string,
  cancelUrl?: string
): Promise<any> => {
  try {
    // Get the platform fee percentage from environment variable or use default
    const platformFeePercentage = process.env.NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PERCENTAGE 
      ? parseFloat(process.env.NEXT_PUBLIC_STRIPE_PLATFORM_FEE_PERCENTAGE) 
      : 0.025; // Default to 2.5%
    
    // Calculate platform fee
    const platformFee = Math.round(amount * platformFeePercentage);
    
    const accessToken = await getStripeAccessToken();
    
    // Set default success and cancel URLs if not provided
    const defaultSuccessUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${window.location.origin}/payment/cancel`;
    
    const response = await axios.post(getProxyUrl(), {
      accessToken,
      endpoint: 'checkout/sessions',
      method: 'post',
      data: {
        mode: 'payment',
        line_items: [{
          price_data: {
            currency,
            product_data: { name: description },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: platformFee,
          transfer_data: { destination: connectedAccountId },
        },
        on_behalf_of: connectedAccountId, // Set the connected account as the settlement merchant
        success_url: successUrl || defaultSuccessUrl,
        cancel_url: cancelUrl || defaultCancelUrl,
        metadata,
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Retrieves a Checkout Session by ID
 * @param sessionId The ID of the Checkout Session
 * @returns The Checkout Session details
 */
export const getCheckoutSession = async (sessionId: string): Promise<any> => {
  try {
    const accessToken = await getStripeAccessToken();
    
    const response = await axios.post(getProxyUrl(), {
      accessToken,
      endpoint: `checkout/sessions/${sessionId}`,
      method: 'get',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
};

/**
 * Stores a checkout session in the database
 * @param userId User ID
 * @param gcAccountId GC Account ID
 * @param sessionData Checkout session data from Stripe
 * @returns The created checkout session record
 */
export const storeCheckoutSession = async (
  userId: string,
  gcAccountId: string,
  sessionData: any
): Promise<any> => {
  try {
    const { id: stripe_session_id, amount_total, currency, metadata, payment_intent } = sessionData;
    
    // Extract connected account ID from payment_intent transfer_data
    const stripe_account_id = payment_intent?.transfer_data?.destination || metadata?.connected_account_id;
    
    if (!stripe_account_id) {
      throw new Error('Connected account ID not found in session data');
    }
    
    const { data, error } = await fetch('/api/db/checkout-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        gc_account_id: gcAccountId,
        stripe_session_id,
        stripe_account_id,
        amount: amount_total,
        currency: currency.toLowerCase(),
        status: sessionData.status,
        description: metadata?.description || 'Payment',
        metadata,
      }),
    }).then(res => res.json());
    
    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error('Error storing checkout session:', error);
    throw error;
  }
};

/**
 * Lists checkout sessions for a user or GC account
 * @param userId Optional user ID to filter by
 * @param gcAccountId Optional GC account ID to filter by
 * @param limit Maximum number of records to return
 * @returns List of checkout sessions
 */
export const listCheckoutSessions = async (
  userId?: string,
  gcAccountId?: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    let url = '/api/db/checkout-sessions?';
    
    if (userId) url += `user_id=${userId}&`;
    if (gcAccountId) url += `gc_account_id=${gcAccountId}&`;
    if (limit) url += `limit=${limit}`;
    
    const { data, error } = await fetch(url).then(res => res.json());
    
    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Error listing checkout sessions:', error);
    throw error;
  }
};
