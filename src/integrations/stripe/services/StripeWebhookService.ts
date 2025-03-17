import axios from 'axios';

// CORS proxy URL - dynamically set based on environment
const proxyUrl = import.meta.env.MODE === 'production' 
  ? '/api/proxy/stripe'  // In production, use a relative path to the API route
  : import.meta.env.VITE_STRIPE_PROXY_URL || 'http://localhost:3030/proxy/stripe'; // In development, use localhost or VITE_STRIPE_PROXY_URL

/**
 * Handles Stripe webhook events
 * @param event The Stripe event object
 * @param accessToken The Stripe access token
 * @returns The result of the webhook handling
 */
export const handleWebhookEvent = async (event: any, accessToken: string) => {
  try {
    // Process different event types
    switch (event.type) {
      case 'account.updated':
        return await handleAccountUpdated(event.data.object, accessToken);
      
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event.data.object, accessToken);
      
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event.data.object, accessToken);
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { status: 'ignored', message: `Unhandled event type: ${event.type}` };
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
};

/**
 * Handles account.updated events
 * @param account The updated account object
 * @param accessToken The Stripe access token
 * @returns The result of handling the event
 */
const handleAccountUpdated = async (account: any, accessToken: string) => {
  try {
    // Update the account status in your database
    // This is where you would update the charges_enabled, payouts_enabled, and details_submitted fields
    
    // Example API call to your backend using CORS proxy
    const response = await axios.post(`${proxyUrl}/api/stripe-accounts/update`, {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      accessToken
    });
    
    return {
      status: 'success',
      message: 'Account updated successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Error handling account.updated event:', error);
    throw error;
  }
};

/**
 * Handles payment_intent.succeeded events
 * @param paymentIntent The succeeded payment intent object
 * @param accessToken The Stripe access token
 * @returns The result of handling the event
 */
const handlePaymentIntentSucceeded = async (paymentIntent: any, accessToken: string) => {
  try {
    // Update the payment status in your database
    // This is where you would mark the payment as successful
    
    // Example API call to your backend using CORS proxy
    const response = await axios.post(`${proxyUrl}/api/payments/update`, {
      paymentIntentId: paymentIntent.id,
      status: 'succeeded',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      connectedAccountId: paymentIntent.transfer_data?.destination,
      applicationFeeAmount: paymentIntent.application_fee_amount,
      metadata: paymentIntent.metadata,
      accessToken
    });
    
    return {
      status: 'success',
      message: 'Payment intent succeeded',
      data: response.data
    };
  } catch (error) {
    console.error('Error handling payment_intent.succeeded event:', error);
    throw error;
  }
};

/**
 * Handles payment_intent.payment_failed events
 * @param paymentIntent The failed payment intent object
 * @param accessToken The Stripe access token
 * @returns The result of handling the event
 */
const handlePaymentIntentFailed = async (paymentIntent: any, accessToken: string) => {
  try {
    // Update the payment status in your database
    // This is where you would mark the payment as failed
    
    // Example API call to your backend using CORS proxy
    const response = await axios.post(`${proxyUrl}/api/payments/update`, {
      paymentIntentId: paymentIntent.id,
      status: 'failed',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      connectedAccountId: paymentIntent.transfer_data?.destination,
      applicationFeeAmount: paymentIntent.application_fee_amount,
      metadata: paymentIntent.metadata,
      errorMessage: paymentIntent.last_payment_error?.message,
      accessToken
    });
    
    return {
      status: 'success',
      message: 'Payment intent failed',
      data: response.data
    };
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed event:', error);
    throw error;
  }
};
