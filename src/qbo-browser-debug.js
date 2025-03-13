/**
 * QuickBooks Online Token Exchange Debug Script
 * 
 * Copy and paste this entire script into your browser console
 * when you're on the callback page to debug the token exchange.
 */

(async function() {
  // The authorization code from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const realmId = urlParams.get('realmId');
  
  if (!code) {
    console.error("❌ No authorization code found in URL");
    return;
  }
  
  console.log("🔍 Starting QuickBooks token exchange debug");
  console.log("Authorization code:", code);
  console.log("Realm ID:", realmId);
  
  // QuickBooks API credentials
  const clientId = "AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j";
  const clientSecret = "4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau";
  const redirectUri = "http://localhost:8080/qbo/callback";
  
  // Prepare the request body
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  });
  
  // Prepare the authorization header
  const authString = `${clientId}:${clientSecret}`;
  const base64Auth = btoa(authString);
  
  console.log("Request details:");
  console.log("- Endpoint: https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer");
  console.log("- Redirect URI:", redirectUri);
  console.log("- Authorization header:", `Basic ${base64Auth.substring(0, 10)}...`);
  
  try {
    console.log("Making token exchange request...");
    
    // Make the token request
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${base64Auth}`,
        'Accept': 'application/json'
      },
      body: params.toString()
    });
    
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Token exchange successful!");
      console.log("Access token:", data.access_token.substring(0, 10) + "...");
      console.log("Refresh token:", data.refresh_token.substring(0, 10) + "...");
      console.log("Expires in:", data.expires_in, "seconds");
      
      // Store the tokens in localStorage for testing
      localStorage.setItem('qbo_debug_tokens', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        realmId: realmId
      }));
      
      console.log("Tokens stored in localStorage under 'qbo_debug_tokens'");
    } else {
      console.log("❌ Token exchange failed");
      const errorText = await response.text();
      console.error("Error response:", errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Error details:", errorJson);
      } catch (e) {
        // Text wasn't JSON
      }
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
})();
