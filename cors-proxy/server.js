// CORS Proxy for QuickBooks Online and Stripe API
// This proxy helps bypass CORS restrictions during local development

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import bodyParser from 'body-parser';
import https from 'https';
import { handleStripeRequest } from './stripe-proxy-handler.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.CORS_PROXY_PORT || 3030;

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

// QBO credentials based on environment
const QBO_SANDBOX_CLIENT_ID = process.env.QBO_SANDBOX_CLIENT_ID || 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j';
const QBO_SANDBOX_CLIENT_SECRET = process.env.QBO_SANDBOX_CLIENT_SECRET || '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau';
const QBO_PROD_CLIENT_ID = process.env.QBO_PROD_CLIENT_ID || '';
const QBO_PROD_CLIENT_SECRET = process.env.QBO_PROD_CLIENT_SECRET || '';

// Default QBO credentials based on environment
const DEFAULT_CLIENT_ID = isProduction ? QBO_PROD_CLIENT_ID : QBO_SANDBOX_CLIENT_ID;
const DEFAULT_CLIENT_SECRET = isProduction ? QBO_PROD_CLIENT_SECRET : QBO_SANDBOX_CLIENT_SECRET;

// Stripe secret key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Create a custom HTTPS agent that doesn't verify SSL certificates in development
// This is needed to avoid SSL certificate issues during local development
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // IMPORTANT: Only use this in development!
});

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root endpoint to check if the proxy is running
app.get('/', (req, res) => {
  res.json({ 
    status: 'CORS Proxy Server is running',
    environment: isProduction ? 'Production' : 'Sandbox',
    qbo_configured: !!DEFAULT_CLIENT_ID && !!DEFAULT_CLIENT_SECRET,
    stripe_configured: !!STRIPE_SECRET_KEY
  });
});

// ===== QUICKBOOKS ONLINE PROXY ENDPOINTS =====

// Proxy endpoint for QBO token exchange
app.post('/proxy/token', async (req, res) => {
  try {
    console.log('Received QBO token exchange request');
    
    const { code, redirectUri, clientId, clientSecret } = req.body;
    
    if (!code || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['code', 'redirectUri']
      });
    }
    
    // Use provided credentials or fall back to defaults
    const finalClientId = clientId || DEFAULT_CLIENT_ID;
    const finalClientSecret = clientSecret || DEFAULT_CLIENT_SECRET;
    
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
          },
          httpsAgent
        }
      );
      
      console.log('Received response from QuickBooks API');
      
      // Return the token response to the client
      return res.json(response.data);
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
});

// Proxy endpoint for QBO token refresh
app.post('/proxy/refresh', async (req, res) => {
  try {
    console.log('Received QBO token refresh request');
    
    const { refreshToken, clientId, clientSecret } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['refreshToken']
      });
    }
    
    // Use provided credentials or fall back to defaults
    const finalClientId = clientId || DEFAULT_CLIENT_ID;
    const finalClientSecret = clientSecret || DEFAULT_CLIENT_SECRET;
    
    // Prepare the request to QuickBooks
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    // Create the authorization header
    const authString = `${finalClientId}:${finalClientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    console.log('Making refresh request to QuickBooks API');
    
    // Make the refresh token request to QuickBooks
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`
        },
        httpsAgent
      }
    );
    
    console.log('Received refresh response from QuickBooks API');
    
    // Return the token response to the client
    return res.json(response.data);
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      error: 'Failed to refresh token',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for QBO test connection
app.post('/proxy/test-connection', async (req, res) => {
  console.log('Received QBO test connection request');
  
  try {
    const { accessToken, refreshToken, realmId } = req.body;
    
    if (!accessToken || !realmId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId']
      });
    }
    
    console.log('Making test connection request to QuickBooks API');
    console.log('Realm ID:', realmId);
    
    // Make a simple request to the QuickBooks API to test the connection
    const response = await axios.get(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        httpsAgent
      }
    );
    
    console.log('Received test connection response from QuickBooks API');
    
    // Return the company info to the client
    return res.json({
      success: true,
      companyInfo: response.data
    });
  } catch (error) {
    console.error('Error testing connection:', error.response?.data || error.message);
    
    // Check if the error is due to an expired token
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        needsRefresh: true,
        details: error.response?.data || error.message
      });
    }
    
    return res.status(error.response?.status || 500).json({
      error: 'Failed to test connection',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for QBO data operations
app.post('/proxy/data-operation', async (req, res) => {
  try {
    console.log('Received QBO data operation request');
    
    const { accessToken, realmId, endpoint, method, data } = req.body;
    
    if (!accessToken || !realmId || !endpoint || !method) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId', 'endpoint', 'method']
      });
    }
    
    console.log(`Making ${method.toUpperCase()} request to QuickBooks API: ${endpoint}`);
    
    // Build the QuickBooks API URL
    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/${endpoint}`;
    
    // Make the request to the QuickBooks API
    const response = await axios({
      method: method.toLowerCase(),
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: data || undefined,
      httpsAgent
    });
    
    console.log('Received data operation response from QuickBooks API');
    
    // Return the response to the client
    return res.json(response.data);
  } catch (error) {
    console.error('Error performing data operation:', error.response?.data || error.message);
    
    // Check if the error is due to an expired token
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        needsRefresh: true,
        details: error.response?.data || error.message
      });
    }
    
    return res.status(error.response?.status || 500).json({
      error: 'Failed to perform data operation',
      details: error.response?.data || error.message
    });
  }
});

// ===== STRIPE PROXY ENDPOINT =====

// Proxy endpoint for Stripe API
app.post('/proxy/stripe', (req, res) => {
  // If no access token is provided, use the platform's secret key
  if (!req.body.accessToken) {
    req.body.accessToken = STRIPE_SECRET_KEY;
  }
  
  handleStripeRequest(req, res);
});

// ===== SUPABASE PROXY ENDPOINT =====

// Import the Supabase proxy handler
import handleSupabaseRequest from './supabase-proxy-handler.js';

// Proxy endpoint for Supabase API
app.post('/proxy/supabase', (req, res) => {
  handleSupabaseRequest(req, res);
});

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy Server running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`- QBO Token Exchange: http://localhost:${PORT}/proxy/token`);
  console.log(`- QBO Token Refresh: http://localhost:${PORT}/proxy/refresh`);
  console.log(`- QBO Test Connection: http://localhost:${PORT}/proxy/test-connection`);
  console.log(`- QBO Data Operations: http://localhost:${PORT}/proxy/data-operation`);
  console.log(`- Stripe API Operations: http://localhost:${PORT}/proxy/stripe`);
  console.log(`- Supabase API Operations: http://localhost:${PORT}/proxy/supabase`);
  
  if (!STRIPE_SECRET_KEY) {
    console.warn('WARNING: Stripe secret key is not configured. Stripe API operations will fail.');
    console.warn('Please set the STRIPE_SECRET_KEY environment variable.');
  }
});
