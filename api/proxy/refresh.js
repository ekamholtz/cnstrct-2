// QBO Token Refresh API Proxy for Vercel
// This serverless function handles the token refresh in production

import axios from 'axios';
import qs from 'querystring';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

// QBO credentials based on environment
const QBO_SANDBOX_CLIENT_ID = process.env.QBO_SANDBOX_CLIENT_ID || '';
const QBO_SANDBOX_CLIENT_SECRET = process.env.QBO_SANDBOX_CLIENT_SECRET || '';
const QBO_PROD_CLIENT_ID = process.env.QBO_PROD_CLIENT_ID || '';
const QBO_PROD_CLIENT_SECRET = process.env.QBO_PROD_CLIENT_SECRET || '';

// Default QBO credentials based on environment
const DEFAULT_CLIENT_ID = isProduction ? QBO_PROD_CLIENT_ID : QBO_SANDBOX_CLIENT_ID;
const DEFAULT_CLIENT_SECRET = isProduction ? QBO_PROD_CLIENT_SECRET : QBO_SANDBOX_CLIENT_SECRET;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received QBO token refresh request in Vercel function');
    
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['refreshToken']
      });
    }
    
    // Always use server-side credentials for security
    const finalClientId = DEFAULT_CLIENT_ID;
    const finalClientSecret = DEFAULT_CLIENT_SECRET;
    
    console.log('Environment:', isProduction ? 'Production' : 'Sandbox');
    console.log('Using client ID:', finalClientId);
    
    if (!finalClientId || !finalClientSecret) {
      console.error('Missing client credentials in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing OAuth credentials'
      });
    }
    
    // Prepare the request to QuickBooks
    const requestData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };
    
    // Create the authorization header
    const authString = `${finalClientId}:${finalClientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    console.log('Making refresh token request to QuickBooks API');
    
    // Make the token request to QuickBooks
    try {
      const response = await axios({
        method: 'post',
        url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        data: qs.stringify(requestData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Received successful response from QuickBooks API');
      
      // Return the token response to the client
      return res.status(200).json(response.data);
    } catch (apiError) {
      console.error('Error from QuickBooks API:', apiError.response?.data || apiError.message);
      console.error('Request details:', {
        clientId: finalClientId,
        refreshToken: refreshToken ? '[REDACTED]' : 'missing'
      });
      
      return res.status(apiError.response?.status || 500).json({
        error: 'Failed to refresh token',
        details: apiError.response?.data || apiError.message
      });
    }
  } catch (error) {
    console.error('Error in token refresh:', error.message);
    
    return res.status(500).json({
      error: 'Internal server error during token refresh',
      details: error.message
    });
  }
}
