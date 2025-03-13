import axios from "axios";

/**
 * This script directly tests the QuickBooks Online token exchange process
 * without any of the application code to isolate the issue.
 * 
 * Run this script after you've completed the OAuth flow and have a code.
 */

// Replace these with your actual values
const CODE = "AB11741814144qyQciCKPrQJRDRUx0fjWbcrOar9BTZPVmgf9D"; // The authorization code from the callback URL
const REDIRECT_URI = "http://localhost:8080/qbo/callback"; // Must match exactly what's in your Intuit Developer Portal
const CLIENT_ID = "AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j";
const CLIENT_SECRET = "4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau";

async function testDirectTokenExchange() {
  try {
    console.log("Starting direct token exchange test...");
    
    // Prepare the request body
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: CODE,
      redirect_uri: REDIRECT_URI
    });
    
    // Prepare the authorization header
    const authString = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const base64Auth = btoa(authString);
    
    console.log("Request details:");
    console.log("- Endpoint: https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer");
    console.log("- Redirect URI:", REDIRECT_URI);
    console.log("- Code length:", CODE.length);
    
    try {
      // Make the token request with detailed error handling
      const response = await axios({
        method: 'post',
        url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        data: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => true // Accept any status code for debugging
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      
      if (response.status >= 200 && response.status < 300) {
        console.log("✅ Token exchange successful!");
      } else {
        console.log("❌ Token exchange failed with status:", response.status);
      }
    } catch (error: any) {
      console.error("❌ Request failed:");
      
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
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testDirectTokenExchange();

export {};
