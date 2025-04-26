
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
const QBO_CLIENT_ID = Deno.env.get('QBO_CLIENT_ID') ?? '';
const QBO_CLIENT_SECRET = Deno.env.get('QBO_CLIENT_SECRET') ?? '';

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
    const { connectionId, userId } = await req.json();
    
    // Validate required parameters
    if (!connectionId && !userId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          message: 'Either connectionId or userId is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the connection from the database
    let connectionQuery = supabase
      .from('qbo_connections')
      .select('*');
    
    if (connectionId) {
      connectionQuery = connectionQuery.eq('id', connectionId);
    } else {
      connectionQuery = connectionQuery.eq('user_id', userId);
    }
    
    const { data: connection, error: connectionError } = await connectionQuery.single();
    
    if (connectionError || !connection) {
      console.error("Failed to fetch connection:", connectionError);
      return new Response(
        JSON.stringify({
          error: 'Connection not found',
          details: connectionError?.message || 'No connection exists for the provided parameters'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if token is still valid with 5 minute buffer
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // If token is still valid, return the current token
    if (expiresAt > fiveMinutesFromNow) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Token still valid',
          accessToken: connection.access_token,
          expiresAt: connection.expires_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate QBO credentials
    if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
      console.error("Missing QBO client credentials in environment");
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          message: 'Missing QBO client credentials'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Refresh the token
    const refreshResult = await refreshQboToken(connection.refresh_token);
    
    if (!refreshResult.success) {
      // Log the error
      await logQboAction(
        connection.user_id, 
        'token-refresh', 
        'error', 
        { message: refreshResult.error }
      );
      
      return new Response(
        JSON.stringify({
          error: 'Token refresh failed',
          message: refreshResult.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update the token in the database
    const newExpiresAt = new Date(now.getTime() + (refreshResult.expires_in * 1000));
    
    const { error: updateError } = await supabase
      .from('qbo_connections')
      .update({
        access_token: refreshResult.access_token,
        refresh_token: refreshResult.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', connection.id);
    
    if (updateError) {
      console.error("Failed to update connection with new tokens:", updateError);
      
      await logQboAction(
        connection.user_id, 
        'token-refresh', 
        'error', 
        { message: 'Database error while updating tokens', details: updateError.message }
      );
      
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to update connection with new tokens'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log success
    await logQboAction(
      connection.user_id, 
      'token-refresh', 
      'success', 
      { company_id: connection.company_id }
    );
    
    // Return the new token
    return new Response(
      JSON.stringify({
        success: true,
        accessToken: refreshResult.access_token,
        expiresAt: newExpiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Unexpected error in token refresh:", error);
    
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Helper function to refresh QBO token
  async function refreshQboToken(refreshToken: string): Promise<{
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  }> {
    try {
      const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
      
      // Create the authorization header
      const authString = `${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`;
      const base64Auth = btoa(authString);
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Token refresh error:", response.status, errorData);
        return { 
          success: false, 
          error: `Token refresh failed with status ${response.status}: ${errorData}` 
        };
      }
      
      const tokenData = await response.json();
      console.log("Token refresh successful with expires_in:", tokenData.expires_in);
      
      return {
        success: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in
      };
    } catch (error) {
      console.error("Exception during token refresh:", error);
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
