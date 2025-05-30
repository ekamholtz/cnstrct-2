
// QBO Token Exchange API Proxy for Vercel
// This serverless function handles the token exchange in production

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

// Supported registered URIs
const REGISTERED_URIS = [
  "https://cnstrctnetwork.vercel.app/qbo/callback",
  "https://www.cnstrctnetwork.com/qbo/callback"
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Add Content-Security-Policy header for QBO framing
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.intuit.com");

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received QBO token exchange request in Vercel function');
    console.log('Request body:', JSON.stringify(req.body));
    
    const { code, redirectUri, clientId } = req.body;
    
    if (!code || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['code', 'redirectUri']
      });
    }

    // Always use the server-side environment variables for credentials
    const finalClientId = DEFAULT_CLIENT_ID;
    const finalClientSecret = DEFAULT_CLIENT_SECRET;

    // Accept only registered URIs, replace with the valid one if necessary
    let usedRedirectUri = redirectUri;
    if (!REGISTERED_URIS.includes(redirectUri)) {
      // Try to fallback to production domain if custom domain is being used or the supplied value is off.
      // For safety just use the first valid URI (could enhance to smarter selection).
      console.warn(`⚠️ Redirect URI mismatch! Received: "${redirectUri}" which is not registered; forcing to an allowed one.`);
      usedRedirectUri = REGISTERED_URIS[0];
    }
    console.log(`Final redirectUri used for QBO token exchange: ${usedRedirectUri}`);
    
    if (!finalClientId || !finalClientSecret) {
      console.error('Missing client credentials in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing OAuth credentials'
      });
    }
    
    // Prepare the request to QuickBooks
    const requestData = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: usedRedirectUri // Always use the selected, allowed URI
    };
    
    // Create the authorization header
    const authString = `${finalClientId}:${finalClientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    console.log('Making request to QuickBooks API with data:', {
      grant_type: 'authorization_code',
      code: '[REDACTED]',
      redirect_uri: requestData.redirect_uri,
      client_id: finalClientId
    });
    
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
        redirectUri: requestData.redirect_uri,
        code: code ? '[REDACTED]' : 'missing'
      });
      
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
