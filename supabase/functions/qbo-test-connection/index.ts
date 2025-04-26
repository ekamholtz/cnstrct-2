
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Create a Supabase client with service role key for admin access to database
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          message: 'userId is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the valid connection with access token
    const connection = await getValidConnection(userId);
    
    if (!connection.success) {
      return new Response(
        JSON.stringify({
          error: connection.error,
          message: connection.message
        }),
        { status: connection.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine API base URL based on environment (sandbox vs production)
    const isProduction = !connection.isProduction;
    const apiBaseUrl = isProduction
      ? 'https://quickbooks.api.intuit.com/v3'
      : 'https://sandbox-quickbooks.api.intuit.com/v3';
    
    // Test the connection by getting company info
    const url = `${apiBaseUrl}/company/${connection.realmId}/companyinfo/${connection.realmId}`;
    
    console.log(`Testing QBO connection for realm:`, connection.realmId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Handle the response from QBO
    if (response.ok) {
      const data = await response.json();
      
      // Log success
      await logQboAction(userId, 'test-connection', 'success', {
        company_id: connection.realmId,
        company_name: data.CompanyInfo?.CompanyName || 'Unknown'
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          companyInfo: data.CompanyInfo || data,
          message: 'QBO connection is working properly'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorData = await response.json();
      
      // Log error
      await logQboAction(userId, 'test-connection', 'error', {
        status: response.status,
        error: errorData
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API error',
          details: errorData
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error testing QBO connection:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error',
        message: error instanceof Error ? error.message : 'Unknown error during connection test'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Helper function to get a valid connection with access token
  async function getValidConnection(userId: string): Promise<{
    success: boolean;
    accessToken?: string;
    realmId?: string;
    isProduction?: boolean;
    error?: string;
    message?: string;
    status?: number;
  }> {
    try {
      // Get the connection from the database
      const { data: connection, error } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error || !connection) {
        console.error("Failed to fetch QBO connection:", error);
        return {
          success: false,
          error: 'Connection not found',
          message: error?.message || 'No QBO connection exists for this user',
          status: 404
        };
      }
      
      // Check if the token needs to be refreshed
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      // If token is still valid, return it
      if (expiresAt > fiveMinutesFromNow) {
        return {
          success: true,
          accessToken: connection.access_token,
          realmId: connection.company_id,
          isProduction: isProductionDomain(connection.company_id)
        };
      }
      
      // Token needs to be refreshed, call the token refresh function
      const response = await fetch(`${new URL(req.url).origin}/qbo-token-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Token refresh failed:", errorData);
        return {
          success: false,
          error: 'Token refresh failed',
          message: errorData.message || 'Failed to refresh QBO token',
          status: 401
        };
      }
      
      const refreshData = await response.json();
      
      return {
        success: true,
        accessToken: refreshData.accessToken,
        realmId: connection.company_id,
        isProduction: isProductionDomain(connection.company_id)
      };
    } catch (error) {
      console.error("Error getting valid connection:", error);
      return {
        success: false,
        error: 'Connection error',
        message: error instanceof Error ? error.message : 'Unknown error getting valid connection',
        status: 500
      };
    }
  }
  
  // Helper function to log QBO actions
  async function logQboAction(
    userId: string, 
    action: string, 
    status: 'success' | 'error', 
    details: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('qbo_sync_logs').insert({
        user_id: userId,
        action,
        status,
        payload: details,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to log QBO action:", e);
    }
  }
  
  // Helper function to determine if a realm ID belongs to production
  function isProductionDomain(realmId: string): boolean {
    // This is a simplified check - in a real implementation you might
    // want to use a more robust method to determine production vs sandbox
    return !realmId.includes('sandbox') && !realmId.includes('test');
  }
});
