const stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Platform fee percentage from environment variable or default to 2.5%
const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE) || 0.025;

/**
 * Handles Stripe API requests through the CORS proxy
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const handleStripeRequest = async (req, res) => {
  try {
    const { accessToken, endpoint, method, data } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing accessToken' });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    console.log(`Stripe API request: ${method.toUpperCase()} ${endpoint}`);

    // Initialize Stripe with the provided access token
    const stripeClient = stripe(accessToken);

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
  } catch (error) {
    console.error('Stripe API error:', error);
    return res.status(500).json({ 
      error: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
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
    return await stripeClient.paymentIntents.capture(paymentIntentId);
  } else if (paymentIntentId && method === 'get') {
    // Retrieve a payment intent
    return await stripeClient.paymentIntents.retrieve(paymentIntentId);
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

  if (subResource === 'sessions' && method === 'post') {
    // Create a checkout session
    return await stripeClient.checkout.sessions.create(data);
  } else if (subResource === 'sessions' && sessionId && method === 'get') {
    // Retrieve a checkout session
    return await stripeClient.checkout.sessions.retrieve(sessionId);
  } else {
    throw new Error(`Unsupported Checkout API request: ${method} ${endpointParts.join('/')}`);
  }
};

module.exports = {
  handleStripeRequest
};
