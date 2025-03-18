// QBO Token Exchange API Proxy for Vercel
// This serverless function handles the token exchange in production

import axios from 'axios';

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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received QBO token exchange request in Vercel function');
    
    const { code, redirectUri, clientId } = req.body;
    
    if (!code || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['code', 'redirectUri']
      });
    }
    
    // Use provided client ID or fall back to default
    // Always use server-side secret for security
    const finalClientId = clientId || DEFAULT_CLIENT_ID;
    const finalClientSecret = DEFAULT_CLIENT_SECRET;
    
    console.log('Using client ID:', finalClientId);
    console.log('Environment:', isProduction ? 'Production' : 'Sandbox');
    
    // Prepare the request to QuickBooks
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    });
    
    // Create the authorization header
    const authString = `${finalClientId}:${finalClientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    console.log('Making request to QuickBooks API');
    console.log('Redirect URI:', redirectUri);
    
    // Make the token request to QuickBooks
    try {
      const response = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Auth}`
          }
        }
      );
      
      console.log('Received response from QuickBooks API');
      
      // Return the token response to the client
      return res.status(200).json(response.data);
    } catch (apiError) {
      console.error('Error from QuickBooks API:', apiError.response?.data || apiError.message);
      
      return res.status(apiError.response?.status || 500).json({
        error: 'Failed to exchange token',
        details: apiError.response?.data || apiError.message
      });
    }
  } catch (error) {
    console.error('Error in token exchange:', error.message);
    
    return res.status(500).json({
      error: 'Internal server error during token exchange',
      details: error.message
    });
  }
}
