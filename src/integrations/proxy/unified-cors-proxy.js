/**
 * Unified CORS Proxy for External API Integrations
 * Handles API requests for QuickBooks Online and Stripe
 * Provides consistent error handling and request processing
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import bodyParser from 'body-parser';
import https from 'https';

const app = express();
const PORT = 3030;

// Proxy version and configuration
const PROXY_VERSION = '1.0.0';
const PROXY_NAME = 'CNSTRCT Unified CORS Proxy';

// Default credentials as fallback
const DEFAULT_QBO_CLIENT_ID = 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j';
const DEFAULT_QBO_CLIENT_SECRET = '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau';

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
  console.error(`Error in ${serviceName} proxy:`, error);
  
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
    rejectUnauthorized: false // Only for development!
  });
};

// ---------------------------
// QBO API PROXY ROUTES
// ---------------------------

// Proxy endpoint for QBO token exchange
app.post('/proxy/qbo/token', async (req, res) => {
  try {
    console.log('Received QBO token exchange request');
    
    const { code, redirectUri, clientId, clientSecret } = req.body;
    
    if (!code || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['code', 'redirectUri']
      });
    }
    
    // Use provided credentials or fall back to defaults/environment variables
    const finalClientId = clientId || process.env.QBO_CLIENT_ID || DEFAULT_QBO_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.QBO_CLIENT_SECRET || DEFAULT_QBO_CLIENT_SECRET;
    
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
    
    // Make the token request to QuickBooks
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000,
        httpsAgent: getDevelopmentHttpsAgent()
      }
    );
    
    console.log('QBO token exchange successful');
    
    // Return the token response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'QuickBooks');
  }
});

// Proxy endpoint for QBO token refresh
app.post('/proxy/qbo/refresh', async (req, res) => {
  try {
    console.log('Received QBO token refresh request');
    
    const { refreshToken, clientId, clientSecret } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing required parameter: refreshToken',
        requiredParams: ['refreshToken']
      });
    }
    
    // Use provided credentials or fall back to defaults/environment variables
    const finalClientId = clientId || process.env.QBO_CLIENT_ID || DEFAULT_QBO_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.QBO_CLIENT_SECRET || DEFAULT_QBO_CLIENT_SECRET;
    
    // Prepare the request to QuickBooks
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    // Create the authorization header
    const authString = `${finalClientId}:${finalClientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    // Make the token request to QuickBooks
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000,
        httpsAgent: getDevelopmentHttpsAgent()
      }
    );
    
    console.log('QBO token refresh successful');
    
    // Return the token response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'QuickBooks');
  }
});

// Proxy endpoint for QBO data operations
app.post('/proxy/qbo/data-operation', async (req, res) => {
  try {
    console.log('Received QBO data operation request');
    
    const { accessToken, realmId, endpoint, method = 'get', data } = req.body;
    
    if (!accessToken || !realmId || !endpoint) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId', 'endpoint']
      });
    }
    
    // Build the URL
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/${endpoint}`;
    
    console.log(`Making ${method.toUpperCase()} request to QBO API:`, url);
    
    // Common request config
    const config = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      httpsAgent: getDevelopmentHttpsAgent()
    };
    
    let response;
    
    // Make the request based on the method
    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(url, {
          ...config,
          params: data
        });
        break;
      case 'post':
        response = await axios.post(url, data, config);
        break;
      case 'put':
        response = await axios.put(url, data, config);
        break;
      case 'delete':
        response = await axios.delete(url, {
          ...config,
          data
        });
        break;
      default:
        return res.status(400).json({
          error: 'Invalid method',
          message: `Method '${method}' is not supported`
        });
    }
    
    console.log('QBO data operation successful');
    
    // Return the response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'QuickBooks');
  }
});

// ---------------------------
// STRIPE API PROXY ROUTES
// ---------------------------

// Proxy endpoint for Stripe API requests
app.post('/proxy/stripe', async (req, res) => {
  try {
    console.log('Received Stripe API request');
    
    const { accessToken, endpoint, method = 'get', data, accountId } = req.body;
    
    if (!accessToken || !endpoint) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'endpoint']
      });
    }
    
    // Build the URL
    const baseUrl = 'https://api.stripe.com/v1';
    const url = `${baseUrl}/${endpoint}`;
    
    console.log(`Making ${method.toUpperCase()} request to Stripe API:`, endpoint);
    
    // Setup headers with authentication
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2023-10-16'
    };
    
    // Add Stripe-Account header for Connect requests if accountId is provided
    if (accountId) {
      headers['Stripe-Account'] = accountId;
      console.log(`Using Connect account: ${accountId}`);
    }
    
    let response;
    
    // Make the request based on the method
    switch (method.toLowerCase()) {
      case 'get':
        // For GET requests, convert data to query parameters
        response = await axios.get(url, {
          headers,
          params: data,
          timeout: 15000,
          httpsAgent: getDevelopmentHttpsAgent()
        });
        break;
      case 'post':
        // For POST requests, convert data to form URL encoded format
        let formData = new URLSearchParams();
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              // Handle nested objects for Stripe (use array notation for nested properties)
              if (typeof value === 'object' && !Array.isArray(value)) {
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                  if (nestedValue !== null && nestedValue !== undefined) {
                    formData.append(`${key}[${nestedKey}]`, String(nestedValue));
                  }
                });
              } else if (Array.isArray(value)) {
                // Handle arrays
                value.forEach((item, index) => {
                  if (typeof item === 'object') {
                    Object.entries(item).forEach(([objKey, objValue]) => {
                      if (objValue !== null && objValue !== undefined) {
                        formData.append(`${key}[${index}][${objKey}]`, String(objValue));
                      }
                    });
                  } else {
                    formData.append(`${key}[]`, String(item));
                  }
                });
              } else {
                formData.append(key, String(value));
              }
            }
          });
        }
        
        response = await axios.post(url, formData.toString(), {
          headers,
          timeout: 15000,
          httpsAgent: getDevelopmentHttpsAgent()
        });
        break;
      case 'delete':
        response = await axios.delete(url, {
          headers,
          timeout: 15000,
          httpsAgent: getDevelopmentHttpsAgent()
        });
        break;
      default:
        return res.status(400).json({
          error: 'Invalid method',
          message: `Method '${method}' is not supported`
        });
    }
    
    console.log('Stripe API request successful');
    
    // Return the response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    return handleApiError(error, res, 'Stripe');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`${PROXY_NAME} is running on port ${PORT}`);
  console.log(`Version: ${PROXY_VERSION}`);
  console.log(`Services: QBO, Stripe`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Export for testing
export default app;
