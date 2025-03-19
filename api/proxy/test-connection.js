// QBO Test Connection API Proxy for Vercel
// This serverless function tests QBO connections by making a simple query

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
    console.log('Testing QBO connection');
    
    const { accessToken, realmId } = req.body;
    
    if (!accessToken || !realmId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        requiredParams: ['accessToken', 'realmId']
      });
    }
    
    // Determine the correct API base URL based on environment
    const apiBaseUrl = isProduction
      ? "https://quickbooks.api.intuit.com/v3"
      : "https://sandbox-quickbooks.api.intuit.com/v3";
    
    // Test the connection by fetching the company info
    // This is a lightweight query that will verify if the connection works
    const qboUrl = `${apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`;
    
    console.log('Testing connection to QBO API:', qboUrl);
    
    const response = await axios({
      method: 'get',
      url: qboUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('QBO connection test successful:', response.status);
    
    // Return success with the company info
    return res.status(200).json({
      success: true,
      companyInfo: response.data.CompanyInfo || response.data,
      message: 'QBO connection is working properly'
    });
  } catch (error) {
    console.error('Error testing QBO connection:', error.message);
    
    // Enhanced error handling
    let statusCode = 500;
    let errorMessage = 'Failed to test QBO connection';
    let errorDetails = {};
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.Fault?.Error?.[0]?.Message || 
                    error.response.data?.error_description ||
                    error.response.data?.error ||
                    'API error';
      errorDetails = error.response.data;
      
      console.error('QBO API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
}
