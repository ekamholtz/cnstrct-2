// QBO Debug Helper
// This script helps diagnose issues with the QuickBooks Online integration

const axios = require('axios');
const https = require('https');

// Create an axios instance that ignores SSL certificate errors (for development only)
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Function to test QBO connection with token refresh
async function testQBOConnection(accessToken, refreshToken, realmId) {
  console.log('Testing QBO connection...');
  console.log('Access Token:', accessToken.substring(0, 20) + '...');
  console.log('Refresh Token:', refreshToken ? (refreshToken.substring(0, 20) + '...') : 'Not provided');
  console.log('Realm ID:', realmId);
  
  try {
    // First try with the provided access token
    const response = await axiosInstance.get(
      `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('Connection test successful!');
    console.log('Company Name:', response.data.CompanyInfo.CompanyName);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error testing connection:', error.message);
    
    // If we get a 401 error and have a refresh token, try refreshing the token
    if (error.response && error.response.status === 401 && refreshToken) {
      console.log('Access token expired, attempting to refresh token...');
      
      try {
        // Get the client ID and secret
        const clientId = 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j';
        const clientSecret = '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau';
        
        // Refresh the token
        const tokenResponse = await axiosInstance.post(
          'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
          `grant_type=refresh_token&refresh_token=${refreshToken}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            }
          }
        );
        
        const newAccessToken = tokenResponse.data.access_token;
        console.log('Token refreshed successfully!');
        console.log('New Access Token:', newAccessToken.substring(0, 20) + '...');
        
        // Try the request again with the new token
        const retryResponse = await axiosInstance.get(
          `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
          {
            headers: {
              'Authorization': `Bearer ${newAccessToken}`,
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        );
        
        console.log('Connection test successful after token refresh!');
        console.log('Company Name:', retryResponse.data.CompanyInfo.CompanyName);
        
        return {
          success: true,
          data: retryResponse.data,
          newAccessToken,
          newRefreshToken: tokenResponse.data.refresh_token || refreshToken
        };
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError.message);
        return {
          success: false,
          error: 'Failed to refresh token',
          details: refreshError.message
        };
      }
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
}

// Export the test function
module.exports = {
  testQBOConnection
};

// If this script is run directly, provide usage instructions
if (require.main === module) {
  console.log('QBO Debug Helper');
  console.log('Usage: node qbo-debug-helper.js');
  console.log('This script is meant to be imported and used by other scripts.');
}
