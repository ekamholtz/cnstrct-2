import { supabase } from "./integrations/supabase/client";
import { QBOAuthService } from "./integrations/qbo/services/auth/AuthorizationService";
import { QBOConfig } from "./integrations/qbo/config/qboConfig";

// Initialize services
const authService = new QBOAuthService();
const config = new QBOConfig();

async function testQBOConnection() {
  try {
    console.log("=== QBO Connection Test ===\n");
    
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting current user:", userError?.message || "No user found");
      console.log("Please sign in before testing QBO connection");
      return;
    }
    
    console.log(`Current user: ${user.id}`);
    
    // 2. Check if user has QBO connection
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (connectionError) {
      console.error(`Error checking QBO connection: ${connectionError.message}`);
      return;
    }
    
    // 3. Display connection info or authorization URL
    if (!connection) {
      console.log("\nNo QBO connection found");
      console.log("\nQBO Configuration:");
      console.log(`- Client ID: ${config.clientId}`);
      console.log(`- Redirect URI: ${config.redirectUri}`);
      console.log(`- Scopes: ${config.scopes.join(' ')}`);
      console.log(`- Environment: ${config.isProduction ? 'Production' : 'Sandbox'}`);
      
      const authUrl = authService.getAuthorizationUrl(user.id);
      console.log("\nTo connect to QBO, use this URL:");
      console.log(authUrl);
      console.log("\nOr navigate to Settings > Integrations in the app and click 'Connect to QuickBooks Online'");
    } else {
      console.log("\nExisting QBO connection found:");
      console.log(`- Company: ${connection.company_name}`);
      console.log(`- Company ID: ${connection.company_id}`);
      console.log(`- Connected on: ${new Date(connection.created_at).toLocaleString()}`);
      console.log(`- Last updated: ${new Date(connection.updated_at).toLocaleString()}`);
      console.log("\nTo reconnect, first disconnect in Settings > Integrations");
    }
    
  } catch (error) {
    console.error("Error testing QBO connection:", error);
  }
}

// Run the test
testQBOConnection()
  .then(() => console.log("Test completed"))
  .catch(error => console.error("Test failed:", error))
  .finally(() => {
    // Close any open connections
    supabase.removeAllChannels();
  });
