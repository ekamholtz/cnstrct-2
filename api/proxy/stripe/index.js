// Serverless function for proxying Stripe API requests
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { accessToken, endpoint, method, data } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing Stripe access token' });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing API endpoint' });
    }

    // Prepare request configuration
    const baseURL = 'https://api.stripe.com/v1';
    const url = `${baseURL}/${endpoint}`;
    
    console.log(`Proxying ${method.toUpperCase()} request to Stripe API: ${endpoint}`);

    // Make the request to Stripe API
    const response = await axios({
      method: method || 'get',
      url,
      data: method !== 'get' ? data : null,
      params: method === 'get' ? data : null,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Return the response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Stripe API Proxy Error:', error.response?.data || error.message);
    
    // Handle Stripe API errors
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Handle network errors
    return res.status(500).json({ 
      error: 'Error connecting to Stripe API', 
      message: error.message 
    });
  }
};
