import axios from 'axios';

// CORS proxy URL
const proxyUrl = 'http://localhost:3030/proxy/stripe';

/**
 * Creates a payment intent for a connected account
 * @param amount The amount in cents
 * @param currency The currency code
 * @param connectedAccountId The connected account ID
 * @param accessToken The Stripe access token
 * @param applicationFeeAmount The application fee amount in cents
 * @param metadata Additional metadata for the payment intent
 * @returns The created payment intent
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string,
  connectedAccountId: string,
  accessToken: string,
  applicationFeeAmount: number,
  metadata: Record<string, string> = {}
) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: 'payment_intents',
      method: 'post',
      data: {
        amount,
        currency,
        application_fee_amount: applicationFeeAmount,
        metadata,
        transfer_data: {
          destination: connectedAccountId,
        },
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating payment intent:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create payment intent');
  }
};

/**
 * Creates a payment link for a connected account
 * @param amount The amount in cents
 * @param currency The currency code
 * @param connectedAccountId The connected account ID
 * @param accessToken The Stripe access token
 * @param applicationFeeAmount The application fee amount in cents
 * @param metadata Additional metadata for the payment link
 * @returns The created payment link
 */
export const createPaymentLink = async (
  amount: number,
  currency: string,
  connectedAccountId: string,
  accessToken: string,
  applicationFeeAmount: number,
  metadata: Record<string, string> = {}
) => {
  try {
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
                name: metadata.description || 'Payment to CNSTRCT contractor',
                description: `Payment for ${metadata.description || 'services'}`,
                metadata
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: connectedAccountId,
        },
        metadata
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating payment link:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create payment link');
  }
};

/**
 * Gets a payment intent
 * @param paymentIntentId The payment intent ID
 * @param accessToken The Stripe access token
 * @returns The payment intent
 */
export const getPaymentIntent = async (paymentIntentId: string, accessToken: string) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: `payment_intents/${paymentIntentId}`,
      method: 'get',
      data: {}
    });

    return response.data;
  } catch (error: any) {
    console.error('Error getting payment intent:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to get payment intent');
  }
};

/**
 * Gets a payment link
 * @param paymentLinkId The payment link ID
 * @param accessToken The Stripe access token
 * @returns The payment link
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
    console.error('Error getting payment link:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to get payment link');
  }
};

/**
 * Captures a payment intent
 * @param paymentIntentId The payment intent ID
 * @param accessToken The Stripe access token
 * @returns The captured payment intent
 */
export const capturePaymentIntent = async (paymentIntentId: string, accessToken: string) => {
  try {
    const response = await axios.post(proxyUrl, {
      accessToken,
      endpoint: `payment_intents/${paymentIntentId}/capture`,
      method: 'post',
      data: {}
    });

    return response.data;
  } catch (error: any) {
    console.error('Error capturing payment intent:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to capture payment intent');
  }
};
