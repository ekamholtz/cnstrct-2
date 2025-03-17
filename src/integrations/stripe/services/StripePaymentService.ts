import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

// CORS proxy URL - dynamically set based on environment
const proxyUrl = import.meta.env.MODE === 'production' 
  ? '/api/proxy/stripe'  // In production, use a relative path to the API route
  : import.meta.env.VITE_STRIPE_PROXY_URL || 'http://localhost:3030/proxy/stripe'; // In development, use localhost or VITE_STRIPE_PROXY_URL

/**
 * Creates a payment link for a customer
 * @param amount The amount in cents
 * @param currency The currency code
 * @param accountId The Stripe Connect account ID
 * @param accessToken The Stripe access token
 * @param platformFee The platform fee amount in cents
 * @param metadata Additional metadata
 * @returns The created payment link data
 */
export const createPaymentLink = async (
  amount: number,
  currency: string,
  accountId: string,
  accessToken: string,
  platformFee: number = 0,
  metadata: any = {}
) => {
  try {
    // Create a payment link using the Stripe API
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: 'payment_links',
      method: 'post',
      data: {
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: metadata.description || 'Payment',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        after_completion: { type: 'redirect', redirect: { url: `${window.location.origin}/stripe/payment-complete` } },
        application_fee_amount: platformFee,
        metadata: {
          ...metadata,
          platform_fee: platformFee,
        },
        transfer_data: {
          destination: accountId,
        },
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating payment link:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create payment link');
  }
};

/**
 * Retrieves a payment link
 * @param paymentLinkId The payment link ID
 * @param accessToken The Stripe access token
 * @returns The retrieved payment link data
 */
export const getPaymentLink = async (paymentLinkId: string, accessToken: string) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: `payment_links/${paymentLinkId}`,
      method: 'get',
      data: {}
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error retrieving payment link:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to get payment link');
  }
};
