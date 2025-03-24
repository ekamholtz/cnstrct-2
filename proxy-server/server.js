/**
 * CNSTRCT Unified CORS Proxy
 * A dedicated proxy server for handling API requests to Stripe and QuickBooks Online
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const https = require('https');
const path = require('path');
const fs = require('fs');

// Try to load .env file if exists
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('Loaded environment variables from .env file');
  }
} catch (error) {
  console.warn('Warning: Could not load .env file', error.message);
}

const app = express();
const PORT = process.env.PROXY_PORT || 3030;

// Proxy version and configuration
const PROXY_VERSION = '1.0.0';
const PROXY_NAME = 'CNSTRCT Unified CORS Proxy';

// Default credentials as fallback (only for development)
const DEFAULT_QBO_CLIENT_ID = process.env.QBO_CLIENT_ID || 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j';
const DEFAULT_QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET || '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau';

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Health check endpoint
 * Used to verify the proxy server is running
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    name: PROXY_NAME,
    version: PROXY_VERSION,
    timestamp: new Date().toISOString(),
    endpoints: {
      qbo: {
        token: '/proxy/qbo/token',
        refresh: '/proxy/qbo/refresh',
        dataOperation: '/proxy/qbo/data-operation'
      },
      stripe: {
        api: '/proxy/stripe'
      }
    }
  });
});

/**
 * Generic error handler for API responses
 */
const handleApiError = (error, res, serviceName) => {
  console.error(`Error in ${serviceName} proxy:`, error.message);
  
  if (error.response) {
    console.error('Response error data:', error.response.data);
    console.error('Response error status:', error.response.status);
    
    return res.status(error.response.status).json({
      error: `${serviceName} API error`,
      details: error.response.data
    });
  }
  
  return res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    service: serviceName
  });
};

/**
 * Create an https agent for development environment
 * This bypasses SSL verification in development only
 */
const getDevelopmentHttpsAgent = () => {
  return new https.Agent({
    rejectUnauthorized: false
  });
};

// ---------------------------
// QBO API PROXY ROUTES
// ---------------------------

/**
 * QBO OAuth token exchange endpoint
 * Exchanges authorization code for access token
 */
app.post('/proxy/qbo/token', async (req, res) => {
  try {
    console.log('Received QBO token exchange request');
    
    const { code, redirectUri, clientId, clientSecret } = req.body;
    
    // Validate required parameters
    if (!code || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'code and redirectUri are required'
      });
    }
    
    // Use provided credentials or fall back to defaults
    const qboClientId = clientId || process.env.QBO_CLIENT_ID || DEFAULT_QBO_CLIENT_ID;
    const qboClientSecret = clientSecret || process.env.QBO_CLIENT_SECRET || DEFAULT_QBO_CLIENT_SECRET;
    
    if (!qboClientId || !qboClientSecret) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'QBO client ID and client secret are required'
      });
    }
    
    // Prepare the request parameters
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    
    // Encode the client ID and client secret for Basic Authentication
    const base64Auth = Buffer.from(`${qboClientId}:${qboClientSecret}`).toString('base64');
    
    // Make the token exchange request to QuickBooks API
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        httpsAgent: getDevelopmentHttpsAgent()
      }
    );
    
    // Return the token response
    return res.json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'QBO');
  }
});

/**
 * QBO OAuth token refresh endpoint
 * Refreshes access token using refresh token
 */
app.post('/proxy/qbo/refresh', async (req, res) => {
  try {
    console.log('Received QBO token refresh request');
    
    const { refreshToken, clientId, clientSecret } = req.body;
    
    // Validate required parameters
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'refreshToken is required'
      });
    }
    
    // Use provided credentials or fall back to defaults
    const qboClientId = clientId || process.env.QBO_CLIENT_ID || DEFAULT_QBO_CLIENT_ID;
    const qboClientSecret = clientSecret || process.env.QBO_CLIENT_SECRET || DEFAULT_QBO_CLIENT_SECRET;
    
    // Prepare the request parameters
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    
    // Encode the client ID and client secret for Basic Authentication
    const base64Auth = Buffer.from(`${qboClientId}:${qboClientSecret}`).toString('base64');
    
    // Make the token refresh request to QuickBooks API
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        httpsAgent: getDevelopmentHttpsAgent()
      }
    );
    
    // Return the refreshed token response
    return res.json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'QBO');
  }
});

/**
 * QBO data operation endpoint
 * Handles all API requests to QuickBooks API
 */
app.post('/proxy/qbo/data-operation', async (req, res) => {
  try {
    console.log('Received QBO data operation request');
    
    const { accessToken, realmId, endpoint, method = 'get', data } = req.body;
    
    // Validate required parameters
    if (!accessToken || !realmId || !endpoint) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'accessToken, realmId, and endpoint are required'
      });
    }
    
    // Determine the full URL for the QuickBooks API request
    let url = '';
    if (endpoint === 'query') {
      // Handle query endpoint differently
      url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/query`;
    } else {
      // For other endpoints, use the provided endpoint name
      url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/${endpoint}`;
    }
    
    // Prepare the request configuration
    const requestConfig = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      httpsAgent: getDevelopmentHttpsAgent()
    };
    
    // Add query parameters or request body based on method
    if (method.toLowerCase() === 'get') {
      if (endpoint === 'query' && data?.query) {
        requestConfig.params = { query: data.query };
      } else if (data) {
        requestConfig.params = data;
      }
    } else {
      requestConfig.data = data;
    }
    
    // Make the request to the QuickBooks API
    const response = await axios(requestConfig);
    
    // Return the response data
    return res.json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'QBO');
  }
});

// ---------------------------
// STRIPE API PROXY ROUTES
// ---------------------------

/**
 * Stripe API proxy endpoint
 * Handles all API requests to Stripe API
 */
app.post('/proxy/stripe', async (req, res) => {
  try {
    console.log('Received Stripe API request');
    
    const { secretKey, endpoint, method = 'get', data, accountId } = req.body;
    
    // Validate required parameters
    if (!secretKey || !endpoint) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'secretKey and endpoint are required'
      });
    }
    
    // Determine the full URL for the Stripe API request
    const url = `https://api.stripe.com/v1/${endpoint}`;
    
    // Prepare the request configuration
    const requestConfig = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16'
      }
    };
    
    // Add Stripe-Account header for Connect API requests
    if (accountId) {
      requestConfig.headers['Stripe-Account'] = accountId;
    }
    
    // Convert data to params for GET requests or to form data for other methods
    if (method.toLowerCase() === 'get') {
      requestConfig.params = data;
    } else {
      // Convert data object to URL encoded form data
      if (data) {
        const formData = new URLSearchParams();
        
        const appendFormData = (obj, keyPrefix = '') => {
          for (const key in obj) {
            const prefixedKey = keyPrefix ? `${keyPrefix}[${key}]` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              // Handle nested objects for Stripe's API
              appendFormData(obj[key], prefixedKey);
            } else {
              formData.append(prefixedKey, obj[key]);
            }
          }
        };
        
        appendFormData(data);
        requestConfig.data = formData.toString();
      }
    }
    
    // Make the request to the Stripe API
    const response = await axios(requestConfig);
    
    // Return the response data
    return res.json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'Stripe');
  }
});

// Basic route for checking if the proxy is running
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: PROXY_NAME,
    message: 'CNSTRCT Unified CORS Proxy is running',
    services: ['qbo', 'stripe'],
    version: PROXY_VERSION
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`${PROXY_NAME} is running on port ${PORT}`);
  console.log(`Version: ${PROXY_VERSION}`);
  console.log(`Services: QBO, Stripe`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
