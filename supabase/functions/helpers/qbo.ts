
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

/**
 * Helper function to upsert a QBO connection in the database
 */
export async function upsertQboConnection(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  realmId: string,
  tokenData: {
    access_token: string;
    refresh_token: string;
    scope?: string;
    expires_in: number;
  }
): Promise<Error | null> {
  try {
    // Calculate the expires_at timestamp based on expires_in seconds
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (tokenData.expires_in * 1000));
    
    // Upsert the connection in the database
    const { error } = await supabase
      .from('qbo_connections')
      .upsert({
        user_id: userId,
        company_id: realmId,
        // We'll set company_name in a separate step with company info
        company_name: 'QuickBooks Company', // Default name
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error("Error upserting QBO connection:", error);
      return error;
    }
    
    return null;
  } catch (err) {
    console.error("Exception in upsertQboConnection:", err);
    return err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Helper function to log QBO actions in the database
 */
export async function logQboAction(
  supabase: ReturnType<typeof createClient>,
  actionData: {
    user_id: string;
    function_name: string;
    error?: string;
    payload?: Record<string, any>;
  }
): Promise<void> {
  try {
    const action = actionData.function_name;
    const status = actionData.error ? 'error' : 'success';
    
    const payload = {
      ...(actionData.payload || {}),
      ...(actionData.error ? { error: actionData.error } : {})
    };
    
    await supabase.from('qbo_sync_logs').insert({
      user_id: actionData.user_id,
      action,
      status,
      payload,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    // Just log the error without throwing
    console.error("Failed to log QBO action:", e);
  }
}
