/**
 * Stripe Connect Account Information Endpoint
 * Serverless function to get account information for a Stripe Connect account
 */

import Stripe from 'stripe';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { accountId, accessToken } = req.body;
    
    console.log('Retrieving Stripe account information');
    
    // Validate required parameters
    if (!accountId) {
      return res.status(400).json({ error: 'Missing required parameter: accountId' });
    }
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Missing required parameter: accessToken' });
    }
    
    // Initialize Stripe with the access token
    const stripe = new Stripe(accessToken, {
      apiVersion: '2023-10-16',
    });
    
    // Get account information
    console.log(`Getting account info for accountId: ${accountId}`);
    const account = await stripe.accounts.retrieve(accountId);
    
    console.log('Account info retrieved successfully');
    
    // Return the account information
    return res.status(200).json(account);
  } catch (error) {
    console.error('Error getting account info:', error);
    
    // Format the error response
    const errorMessage = error.message || 'Unknown error';
    const errorResponse = {
      error: errorMessage,
      error_description: error.type || 'server_error',
    };
    
    return res.status(error.statusCode || 500).json(errorResponse);
  }
}
