// QBO Data Operation API Proxy for Vercel
// This serverless function handles all QBO API data operations in production

import axios from 'axios';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

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
    console.log('QBO data operation request received');
    
    const { accessToken, realmId, endpoint, method, data } = req.body;
    
    if (!accessToken || !realmId || !endpoint) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId', 'endpoint']
      });
    }
    
    // Determine the correct API base URL based on environment
    const apiBaseUrl = isProduction
      ? "https://quickbooks.api.intuit.com/v3"
      : "https://sandbox-quickbooks.api.intuit.com/v3";
    
    // Construct the full URL to the QBO API endpoint
    const qboUrl = `${apiBaseUrl}/company/${realmId}/${endpoint}`;
    
    console.log(`Making ${method.toUpperCase()} request to QBO API:`, qboUrl);
    
    // Make the request to QuickBooks API
    const response = await axios({
      method: method || 'get',
      url: qboUrl,
      data: data || undefined,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('QBO API response status:', response.status);
    
    // Return the response data
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error in QBO data operation:', error.message);
    
    // Enhanced error handling with response error details
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorDetails = {};
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.Fault?.Error?.[0]?.Message || 
                    error.response.data?.error_description ||
                    error.response.data?.error ||
                    error.message;
      errorDetails = error.response.data;
      
      console.error('QBO API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails
    });
  }
}
