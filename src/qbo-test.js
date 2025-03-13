// Simple script to test QBO connection
console.log("=== QBO Connection Test ===");

// Check if we're in the browser environment
if (typeof window !== 'undefined') {
  // Log the current hostname and origin
  console.log(`Current hostname: ${window.location.hostname}`);
  console.log(`Current origin: ${window.location.origin}`);
  
  // Check if we're in development/sandbox mode
  const isSandboxMode = window.location.hostname === 'localhost' || 
                       window.location.hostname.includes('127.0.0.1');
  console.log(`Environment: ${isSandboxMode ? 'Development/Sandbox' : 'Production'}`);
  
  // Log the redirect URI that would be used
  let redirectUri = "";
  const hostname = window.location.hostname;
  
  if (hostname === 'cnstrct-2.lovable.app') {
    redirectUri = "https://cnstrct-2.lovable.app/qbo/callback";
  } else if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    redirectUri = "http://localhost:8080/qbo/callback";
  } else {
    const origin = window.location.origin.replace('preview--', '');
    redirectUri = `${origin}/qbo/callback`;
  }
  
  console.log(`Redirect URI: ${redirectUri}`);
  console.log("To test the QBO connection, navigate to Settings > Integrations and click 'Connect to QuickBooks Online'");
}
