
import { QBOConfig } from "./integrations/qbo/config/qboConfig";
import axios from "axios";

/**
 * This script tests the QuickBooks Online token exchange process
 * to help debug connection issues.
 */
async function testQBOTokenExchange() {
  try {
    console.log("Starting QBO token exchange test...");
    
    // Use getInstance() instead of new QBOConfig()
    const config = QBOConfig.getInstance();
    console.log("QBO Config:", {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      tokenEndpoint: config.tokenEndpoint
    });
    
    // Test a direct token request with minimal parameters
    // Note: This is just for testing the endpoint, not for actual authentication
    const testCode = "test_code";
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: testCode,
      redirect_uri: config.redirectUri
    });
    
    // Prepare auth header
    const authString = `${config.clientId}:${config.clientSecret}`;
    const base64Auth = btoa(authString);
    
    console.log("Making test token request with params:", params.toString());
    
    try {
      // Make a test request with timeout and error handling
      const response = await axios({
        method: 'post',
        url: config.tokenEndpoint,
        data: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000,
        validateStatus: (status) => true // Accept any status code for debugging
      });
      
      console.log("Test response status:", response.status);
      console.log("Test response headers:", response.headers);
      console.log("Test response data:", response.data);
    } catch (error: any) {
      console.error("Test request failed:");
      
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
        console.error("Response error headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", error.message);
      }
    }
    
    // Test network connectivity to the Intuit API
    console.log("Testing general connectivity to Intuit API...");
    try {
      const connectivityTest = await axios.get('https://oauth.platform.intuit.com/op/v1/.well-known/openid-configuration', {
        timeout: 5000
      });
      console.log("Connectivity test successful:", connectivityTest.status);
    } catch (error) {
      console.error("Connectivity test failed:", error);
    }
    
  } catch (error) {
    console.error("QBO token exchange test failed:", error);
  }
}

// Run the test
testQBOTokenExchange();

export {};
