
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const QBO_CLIENT_ID = Deno.env.get('QBO_CLIENT_ID') ?? '';
const QBO_CLIENT_SECRET = Deno.env.get('QBO_CLIENT_SECRET') ?? '';
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? 'http://localhost:5173';

// Create a Supabase client with service role key for admin access to database
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // OAuth callback handling
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      console.log("QBO OAuth callback received:", url.search);
      
      // Extract parameters from the OAuth callback
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const realmId = url.searchParams.get('realmId');
      const error = url.searchParams.get('error');
      
      // Handle errors from Intuit
      if (error) {
        console.error("Error from Intuit OAuth:", error);
        return redirectWithError(`Intuit OAuth error: ${error}`);
      }
      
      // Validate required parameters
      if (!code || !state || !realmId) {
        console.error("Missing required parameters:", { code: !!code, state: !!state, realmId: !!realmId });
        return redirectWithError("Missing required parameters from OAuth callback");
      }
      
      // Validate QBO credentials
      if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
        console.error("Missing QBO client credentials in environment");
        return redirectWithError("Server configuration error: Missing QBO credentials");
      }
      
      // Retrieve the auth state from the database
      const { data: authState, error: stateError } = await supabase
        .from('qbo_auth_states')
        .select('user_id')
        .eq('state', state)
        .single();
      
      if (stateError || !authState) {
        console.error("Invalid or expired state parameter:", stateError);
        return redirectWithError("Invalid or expired authorization state");
      }

      const userId = authState.user_id;
      
      // const userId = state;
      // console.log("Validated state for user:", userId);

      // Exchange code for tokens
      const redirectUri = 'https://wkspjzbybjhvscqdmpwi.supabase.co/functions/v1/qbo-oauth-callback'

      const tokenResponse = await exchangeCodeForTokens(code, redirectUri);
      

      // Log success
      await logQboAction(userId, 'oauth-callback', 'success', {
        company_id: realmId,
        company_name: "xxxxxxxxxxxx"
      });
      

      if (!tokenResponse.success) {
        await logQboAction(userId, 'oauth-callback', 'error', { 
          message: tokenResponse.error 
        });
        return redirectWithError(`Failed to exchange code for tokens: ${tokenResponse.error}`);
      }
      
      // Get company info
      const companyResponse = await fetchCompanyInfo(
        tokenResponse.access_token,
        realmId,
        tokenResponse.is_production
      );
      
      let companyName = "QuickBooks Company";
      if (companyResponse.success) {
        companyName = companyResponse.data.CompanyInfo.CompanyName;
      } else {
        console.warn("Could not fetch company info:", companyResponse.error);
      }
      
      // Store the connection in the database
      const { error: connectionError } = await supabase
        .from('qbo_connections')
        .upsert({
          user_id: userId,
          company_id: realmId,
          company_name: companyName,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          // onConflict: 'user_id',
          // ignoreDuplicates: false
        });
      
      if (connectionError) {
        console.log("connectionError", connectionError)
        console.error("Failed to store connection:", connectionError);
        await logQboAction(userId, 'oauth-callback', 'error', { 
          message: "Database error while storing connection" 
        });
        return redirectWithError(connectionError.message);
      }
      
      // Log success
      await logQboAction(userId, 'oauth-callback', 'success', {
        company_id: realmId,
        company_name: companyName
      });
      
      // Cleanup the auth state
      await supabase
        .from('qbo_auth_states')
        .delete()
        .eq('state', state);
      
      // Redirect back to the frontend with success
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${FRONTEND_URL}/qbo/callback?success=true&companyName=${encodeURIComponent(companyName)}&companyId=${realmId}`
        }
      });
    } catch (e) {
      console.error("Unexpected error in OAuth callback:", e);
      return redirectWithError("e: " + e.message);
    }
  }
  
  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
  
  // Helper function to redirect with error
  function redirectWithError(message: string): Response {
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${FRONTEND_URL}/qbo/callback?error=true&message=${encodeURIComponent(message)}`
      }
    });
  }
  
  // Helper function to exchange authorization code for tokens
  async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    is_production?: boolean;
    error?: string;
  }> {
    try {
      // Detect environment
      const isProduction = !redirectUri.includes('localhost') && 
                          !redirectUri.includes('127.0.0.1') &&
                          !redirectUri.includes('vercel.app') &&
                          !redirectUri.includes('.lovableproject.com');
      
      const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
      
      // Create the authorization header
      const authString = `${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`;
      const base64Auth = btoa(authString);
      
      console.log("Exchanging code for tokens with redirect URI:", redirectUri);
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        }).toString()
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Token exchange error:", response.status, errorData);
        return { 
          success: false, 
          error: `Token exchange failed with status ${response.status}: ${errorData}` 
        };
      }
      
      const tokenData = await response.json();
      console.log("Token exchange successful with expires_in:", tokenData.expires_in);
      
      return {
        success: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        is_production: isProduction
      };
    } catch (error) {
      console.error("Exception during token exchange:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Helper function to fetch company info
  async function fetchCompanyInfo(accessToken: string, realmId: string, isProduction: boolean): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const apiBaseUrl = isProduction
        ? 'https://quickbooks.api.intuit.com/v3'
        : 'https://sandbox-quickbooks.api.intuit.com/v3';
      
      const response = await fetch(`${apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `Company info request failed with status ${response.status}: ${errorText}` 
        };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
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
});
