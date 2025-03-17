import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Platform fee percentage from environment variable or default to 2.5%
const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE) || 0.025;

// Check if Stripe secret key is configured
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.warn('WARNING: STRIPE_SECRET_KEY is not set in .env file. Stripe operations will require client-provided tokens.');
}

/**
 * Handles Stripe API requests through the CORS proxy
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const handleStripeRequest = async (req, res) => {
  try {
    const { accessToken, endpoint, method, data } = req.body;

    // Use provided access token or fall back to the platform's secret key
    const token = accessToken || STRIPE_SECRET_KEY;

    if (!token) {
      return res.status(400).json({ 
        error: 'Missing Stripe API key', 
        details: 'No access token provided and STRIPE_SECRET_KEY is not set in the environment. Please add STRIPE_SECRET_KEY to your .env file.' 
      });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    console.log(`Stripe API request: ${method.toUpperCase()} ${endpoint}`);

    try {
      // Initialize Stripe with the provided access token
      const stripeClient = new Stripe(token, {
        apiVersion: '2023-10-16', // Use a specific API version
        maxNetworkRetries: 2, // Automatically retry requests that fail due to network problems
        timeout: 30000 // 30 seconds
      });

      // Parse the endpoint to determine the Stripe API resource and action
      const endpointParts = endpoint.split('/');
      const resource = endpointParts[0];

      let result;

      // Handle different Stripe API resources
      switch (resource) {
        case 'accounts':
          result = await handleAccountsRequest(stripeClient, endpointParts, method, data);
          break;
        
        case 'account_links':
          result = await handleAccountLinksRequest(stripeClient, endpointParts, method, data);
          break;
        
        case 'payment_intents':
          result = await handlePaymentIntentsRequest(stripeClient, endpointParts, method, data);
          break;
        
        case 'payment_links':
          result = await handlePaymentLinksRequest(stripeClient, endpointParts, method, data);
          break;
        
        case 'checkout':
          result = await handleCheckoutRequest(stripeClient, endpointParts, method, data);
          break;
        
        default:
          return res.status(400).json({ error: `Unsupported Stripe resource: ${resource}` });
      }

      return res.json(result);
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      
      // Return a more descriptive error response based on the error type
      if (stripeError.type === 'StripeAuthenticationError') {
        return res.status(401).json({
          error: 'Invalid API key provided',
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
          configHelp: 'Please add your STRIPE_SECRET_KEY to the .env file at the root of your project.'
        });
      } else if (stripeError.type === 'StripeConnectionError') {
        return res.status(503).json({
          error: 'Could not connect to Stripe API',
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message
        });
      } else {
        return res.status(500).json({ 
          error: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param
        });
      }
    }
  } catch (error) {
    console.error('Stripe proxy handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Handles Stripe Accounts API requests
 * @param {Object} stripeClient - The Stripe client
 * @param {Array} endpointParts - The endpoint parts
 * @param {string} method - The HTTP method
 * @param {Object} data - The request data
 * @returns {Object} The Stripe API response
 */
const handleAccountsRequest = async (stripeClient, endpointParts, method, data) => {
  const accountId = endpointParts.length > 1 ? endpointParts[1] : null;
  const subResource = endpointParts.length > 2 ? endpointParts[2] : null;

  if (accountId && subResource === 'login_links' && method === 'post') {
    // Create a login link for a connected account
    return await stripeClient.accounts.createLoginLink(accountId);
  } else if (accountId && method === 'get') {
    // Retrieve a connected account
    return await stripeClient.accounts.retrieve(accountId);
  } else if (!accountId && method === 'get') {
    // List all connected accounts
    return await stripeClient.accounts.list(data);
  } else if (method === 'post') {
    // Create a connected account
    return await stripeClient.accounts.create(data);
  } else if (accountId && method === 'post') {
    // Update a connected account
    return await stripeClient.accounts.update(accountId, data);
  } else {
    throw new Error(`Unsupported Accounts API request: ${method} ${endpointParts.join('/')}`);
  }
};

/**
 * Handles Stripe Account Links API requests
 * @param {Object} stripeClient - The Stripe client
 * @param {Array} endpointParts - The endpoint parts
 * @param {string} method - The HTTP method
 * @param {Object} data - The request data
 * @returns {Object} The Stripe API response
 */
const handleAccountLinksRequest = async (stripeClient, endpointParts, method, data) => {
  if (method === 'post') {
    // Create an account link
    return await stripeClient.accountLinks.create(data);
  } else {
    throw new Error(`Unsupported Account Links API request: ${method} ${endpointParts.join('/')}`);
  }
};

/**
 * Handles Stripe Payment Intents API requests
 * @param {Object} stripeClient - The Stripe client
 * @param {Array} endpointParts - The endpoint parts
 * @param {string} method - The HTTP method
 * @param {Object} data - The request data
 * @returns {Object} The Stripe API response
 */
const handlePaymentIntentsRequest = async (stripeClient, endpointParts, method, data) => {
  const paymentIntentId = endpointParts.length > 1 ? endpointParts[1] : null;
  const subResource = endpointParts.length > 2 ? endpointParts[2] : null;

  if (paymentIntentId && subResource === 'capture' && method === 'post') {
    // Capture a payment intent
    return await stripeClient.paymentIntents.capture(paymentIntentId, data);
  } else if (paymentIntentId && subResource === 'cancel' && method === 'post') {
    // Cancel a payment intent
    return await stripeClient.paymentIntents.cancel(paymentIntentId, data);
  } else if (paymentIntentId && subResource === 'confirm' && method === 'post') {
    // Confirm a payment intent
    return await stripeClient.paymentIntents.confirm(paymentIntentId, data);
  } else if (paymentIntentId && method === 'get') {
    // Retrieve a payment intent
    return await stripeClient.paymentIntents.retrieve(paymentIntentId);
  } else if (!paymentIntentId && method === 'get') {
    // List payment intents
    return await stripeClient.paymentIntents.list(data);
  } else if (method === 'post') {
    // Create a payment intent
    return await stripeClient.paymentIntents.create(data);
  } else if (paymentIntentId && method === 'post') {
    // Update a payment intent
    return await stripeClient.paymentIntents.update(paymentIntentId, data);
  } else {
    throw new Error(`Unsupported Payment Intents API request: ${method} ${endpointParts.join('/')}`);
  }
};

/**
 * Handles Stripe Payment Links API requests
 * @param {Object} stripeClient - The Stripe client
 * @param {Array} endpointParts - The endpoint parts
 * @param {string} method - The HTTP method
 * @param {Object} data - The request data
 * @returns {Object} The Stripe API response
 */
const handlePaymentLinksRequest = async (stripeClient, endpointParts, method, data) => {
  const paymentLinkId = endpointParts.length > 1 ? endpointParts[1] : null;

  if (paymentLinkId && method === 'get') {
    // Retrieve a payment link
    return await stripeClient.paymentLinks.retrieve(paymentLinkId);
  } else if (!paymentLinkId && method === 'get') {
    // List payment links
    return await stripeClient.paymentLinks.list(data);
  } else if (method === 'post') {
    // Create a payment link
    return await stripeClient.paymentLinks.create(data);
  } else if (paymentLinkId && method === 'post') {
    // Update a payment link
    return await stripeClient.paymentLinks.update(paymentLinkId, data);
  } else {
    throw new Error(`Unsupported Payment Links API request: ${method} ${endpointParts.join('/')}`);
  }
};

/**
 * Handles Stripe Checkout API requests
 * @param {Object} stripeClient - The Stripe client
 * @param {Array} endpointParts - The endpoint parts
 * @param {string} method - The HTTP method
 * @param {Object} data - The request data
 * @returns {Object} The Stripe API response
 */
const handleCheckoutRequest = async (stripeClient, endpointParts, method, data) => {
  const subResource = endpointParts.length > 1 ? endpointParts[1] : null;
  const sessionId = endpointParts.length > 2 ? endpointParts[2] : null;

  if (subResource === 'sessions' && sessionId && method === 'get') {
    // Retrieve a checkout session
    return await stripeClient.checkout.sessions.retrieve(sessionId);
  } else if (subResource === 'sessions' && !sessionId && method === 'get') {
    // List checkout sessions
    return await stripeClient.checkout.sessions.list(data);
  } else if (subResource === 'sessions' && method === 'post') {
    // Create a checkout session
    return await stripeClient.checkout.sessions.create(data);
  } else {
    throw new Error(`Unsupported Checkout API request: ${method} ${endpointParts.join('/')}`);
  }
};

// Export the handler function
export { handleStripeRequest };
