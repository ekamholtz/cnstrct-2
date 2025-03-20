/**
 * Stripe Connect OAuth Token Exchange Endpoint
 * Serverless function to exchange authorization code for access token
 */

import Stripe from 'stripe';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { code, grant_type } = req.body;
    
    console.log('Stripe token exchange started');
    console.log('Grant type:', grant_type);
    
    // Validate required parameters
    if (!code) {
      return res.status(400).json({ error: 'Missing required parameter: code' });
    }
    
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({ error: 'Invalid grant_type' });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    
    // Exchange authorization code for tokens
    console.log('Exchanging code for tokens...');
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    
    console.log('Token exchange successful');
    
    // Return the token response
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    
    // Format the error response
    const errorMessage = error.message || 'Unknown error';
    const errorResponse = {
      error: errorMessage,
      error_description: error.type || 'server_error',
    };
    
    return res.status(error.statusCode || 500).json(errorResponse);
  }
}
