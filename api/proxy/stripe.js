// API route for Stripe proxy in production environment
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accessToken, endpoint, method, data } = req.body;
    
    // Use the provided access token or fall back to the environment variable
    const stripeSecretKey = accessToken || process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('Stripe secret key is not configured');
      return res.status(500).json({ error: 'Stripe secret key is not configured' });
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16', // Use the latest API version or specify the one you need
    });

    // Dynamically call the appropriate Stripe API method
    let result;
    
    if (method.toLowerCase() === 'get') {
      result = await stripe[endpoint].retrieve(data.id);
    } else if (method.toLowerCase() === 'post') {
      result = await stripe[endpoint].create(data);
    } else if (method.toLowerCase() === 'delete') {
      result = await stripe[endpoint].del(data.id);
    } else if (method.toLowerCase() === 'list') {
      result = await stripe[endpoint].list(data);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }

    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in Stripe proxy:', error);
    return res.status(500).json({ 
      error: error.message,
      type: error.type,
      code: error.statusCode
    });
  }
}
