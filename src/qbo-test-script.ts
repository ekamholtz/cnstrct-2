import { supabase } from "./integrations/supabase/client";
import { QBOAuthService } from "./integrations/qbo/qboAuthService";
import { QBOService } from "./integrations/qbo/qboService";
import { QBOMappingService } from "./integrations/qbo/mappingService";

// Configuration
const TEST_USER_EMAIL = "tgc1@email.com";

// Initialize services
const authService = new QBOAuthService();
const qboService = new QBOService();
const mappingService = new QBOMappingService();

async function testQBOConnection() {
  try {
    console.log(`Testing QBO connection for user: ${TEST_USER_EMAIL}`);
    
    // 1. Find the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', TEST_USER_EMAIL)
      .single();
      
    if (profileError || !profile) {
      throw new Error(`Test user ${TEST_USER_EMAIL} not found: ${profileError?.message || 'No profile found'}`);
    }
    
    console.log(`Found user profile: ${profile.id}`);
    
    // 2. Check if user has QBO connection
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
      
    if (connectionError) {
      throw new Error(`Error checking QBO connection: ${connectionError.message}`);
    }
    
    if (!connection) {
      console.log(`No QBO connection found for user ${TEST_USER_EMAIL}`);
      console.log(`To connect, use the authorization URL: ${authService.getAuthorizationUrl(profile.id)}`);
      return;
    }
    
    console.log(`Found QBO connection: ${connection.company_name} (${connection.company_id})`);
    
    // 3. Test fetching accounts
    const accounts = await qboService.getAccounts("Expense");
    console.log(`Retrieved ${accounts.length} expense accounts from QBO`);
    
    // 4. Find a test expense for the user
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', profile.id)
      .limit(1)
      .single();
      
    if (expenseError || !expense) {
      console.log(`No expense found for test user ${TEST_USER_EMAIL}: ${expenseError?.message || 'No expense found'}`);
      return;
    }
    
    console.log(`Found test expense: ${expense.id} - ${expense.amount}`);
    
    // 5. Check if the expense is already synced
    const existingRef = await qboService.getEntityReference(expense.id, 'expense');
    if (existingRef) {
      console.log(`This expense is already synced to QuickBooks Online as ${existingRef.qbo_entity_type} #${existingRef.qbo_entity_id}`);
      
      // 6. Check sync logs
      const { data: syncLogs, error: syncLogsError } = await supabase
        .from('qbo_sync_logs')
        .select('*')
        .eq('qbo_reference_id', existingRef.id)
        .order('created_at', { ascending: false });
        
      if (syncLogsError) {
        console.log(`Error fetching sync logs: ${syncLogsError.message}`);
      } else {
        console.log(`Found ${syncLogs.length} sync logs for this expense`);
        if (syncLogs.length > 0) {
          console.log(`Latest sync: ${syncLogs[0].action} - ${syncLogs[0].status} at ${syncLogs[0].created_at}`);
        }
      }
    } else {
      console.log(`This expense is not yet synced to QuickBooks Online`);
      console.log(`To sync, you would need to select an expense account and run the sync process`);
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
