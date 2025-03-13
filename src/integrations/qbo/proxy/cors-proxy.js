// CORS Proxy for QuickBooks Online Token Exchange
// This simple proxy helps bypass CORS restrictions during local development

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const PORT = 3030;

// Default credentials as fallback
const DEFAULT_CLIENT_ID = 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j';
const DEFAULT_CLIENT_SECRET = '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau';

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Proxy endpoint for token exchange
app.post('/proxy/token', async (req, res) => {
  try {
    console.log('Received token exchange request');
    
    const { code, redirectUri, clientId, clientSecret } = req.body;
    
    if (!code || !redirectUri || !clientId || !clientSecret) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['code', 'redirectUri', 'clientId', 'clientSecret']
      });
    }
    
    // Prepare the request to QuickBooks
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    });
    
    // Create the authorization header
    const authString = `${clientId}:${clientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    console.log('Making request to QuickBooks API');
    console.log('Redirect URI:', redirectUri);
    
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
        timeout: 10000
      }
    );
    
    console.log('Token exchange successful');
    
    // Return the token response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in token exchange proxy:', error);
    
    // Provide detailed error information
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      
      return res.status(error.response.status).json({
        error: 'QuickBooks API error',
        details: error.response.data
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Proxy endpoint for token refresh
app.post('/proxy/refresh', async (req, res) => {
  try {
    console.log('Received token refresh request');
    
    const { refreshToken, clientId, clientSecret } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing required parameter: refreshToken',
        requiredParams: ['refreshToken']
      });
    }
    
    // Use provided credentials or fall back to defaults/environment variables
    const finalClientId = clientId || process.env.QBO_CLIENT_ID || DEFAULT_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.QBO_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;
    
    console.log('Refreshing token with client ID:', finalClientId);
    
    // Prepare the request to QuickBooks
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    // Create the authorization header
    const authString = `${finalClientId}:${finalClientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    // Make the token request to QuickBooks with SSL verification disabled for development
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
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Only for development!
        })
      }
    );
    
    console.log('Token refresh successful');
    
    // Return the token response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in token refresh proxy:', error);
    
    // Provide detailed error information
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      
      return res.status(error.response.status).json({
        error: 'QuickBooks API error',
        details: error.response.data
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Proxy endpoint for getting company info
app.post('/proxy/company-info', async (req, res) => {
  try {
    console.log('Received company info request');
    
    const { accessToken, realmId, endpoint, params } = req.body;
    
    if (!accessToken || !realmId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId']
      });
    }
    
    // Build the URL with the endpoint if provided
    const url = endpoint 
      ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/${endpoint}`
      : `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`;
    
    console.log('Making request to QBO API:', url);
    
    // Make the request to QuickBooks with SSL verification disabled for development
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      params: params || {},
      timeout: 10000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only for development!
      })
    });
    
    console.log('Company info request successful');
    
    // Return the company info response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in company info proxy:', error);
    
    // Provide detailed error information
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'QuickBooks API error',
        details: error.response.data
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Proxy endpoint for testing connection
app.post('/proxy/test-connection', async (req, res) => {
  console.log('Received test connection request');
  
  try {
    const { accessToken, refreshToken, realmId } = req.body;
    
    if (!accessToken || !refreshToken || !realmId) {
      console.error('Missing required parameters for test connection');
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        details: { 
          accessTokenProvided: !!accessToken, 
          refreshTokenProvided: !!refreshToken, 
          realmIdProvided: !!realmId 
        } 
      });
    }
    
    console.log(`Testing connection for realm ID: ${realmId}`);
    
    // First, try to get company info to test the connection
    try {
      const response = await axios.get(`https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Only for development
        }),
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Connection test successful');
      
      // If we get here, the connection is working
      return res.json({
        success: true,
        message: 'Connection successful',
        companyName: response.data?.CompanyInfo?.CompanyName || 'Unknown Company'
      });
    } catch (error) {
      console.log('Initial connection test failed, checking if token needs refresh');
      
      // Check if the error is due to an expired token (401 Unauthorized)
      if (error.response && error.response.status === 401) {
        console.log('Token expired, attempting to refresh token');
        
        try {
          // Try to refresh the token
          const refreshResponse = await axios.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', 
            new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: process.env.QBO_CLIENT_ID || 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j',
              client_secret: process.env.QBO_CLIENT_SECRET || '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau'
            }), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: false // Only for development
            }),
            timeout: 10000 // 10 second timeout
          });
          
          console.log('Token refresh successful');
          
          // Now try the connection again with the new token
          const newAccessToken = refreshResponse.data.access_token;
          const newRefreshToken = refreshResponse.data.refresh_token;
          
          const retryResponse = await axios.get(`https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`, {
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Accept': 'application/json'
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: false // Only for development
            }),
            timeout: 10000 // 10 second timeout
          });
          
          console.log('Connection test with refreshed token successful');
          
          // If we get here, the connection is working with the new token
          return res.json({
            success: true,
            message: 'Connection successful after token refresh',
            companyName: retryResponse.data?.CompanyInfo?.CompanyName || 'Unknown Company',
            newTokens: {
              access_token: newAccessToken,
              refresh_token: newRefreshToken
            }
          });
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError.message);
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Could not refresh the token',
            details: refreshError.message
          });
        }
      } else {
        // Some other error occurred
        console.error('Error in test connection:', error.message);
        return res.status(500).json({
          error: 'Connection test failed',
          message: error.message,
          details: error.response?.data || 'No additional details available'
        });
      }
    }
  } catch (error) {
    console.error('Error in test connection proxy:', error);
    return res.status(500).json({
      error: 'Proxy server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Proxy endpoint for data operations (POST, PUT, DELETE)
app.post('/proxy/data-operation', async (req, res) => {
  try {
    console.log('Received data operation request');
    
    const { accessToken, realmId, endpoint, method, data } = req.body;
    
    if (!accessToken || !realmId || !endpoint || !method) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId', 'endpoint', 'method']
      });
    }
    
    // Build the URL for the operation
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/${endpoint}`;
    
    console.log(`Making ${method.toUpperCase()} request to QBO API:`, url);
    
    // Make the request to QuickBooks with SSL verification disabled for development
    const response = await axios({
      method: method.toLowerCase(),
      url: url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: data || {},
      timeout: 15000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only for development!
      })
    });
    
    console.log('Data operation request successful');
    
    // Return the response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in data operation proxy:', error);
    
    // Provide detailed error information
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      
      return res.status(error.response.status).json({
        error: 'QuickBooks API error',
        details: error.response.data
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`CORS Proxy running at http://localhost:${PORT}`);
  console.log(`Token exchange endpoint: http://localhost:${PORT}/proxy/token`);
  console.log(`Token refresh endpoint: http://localhost:${PORT}/proxy/refresh`);
  console.log(`Company info endpoint: http://localhost:${PORT}/proxy/company-info`);
  console.log(`Test connection endpoint: http://localhost:${PORT}/proxy/test-connection`);
  console.log(`Data operation endpoint: http://localhost:${PORT}/proxy/data-operation`);
});
