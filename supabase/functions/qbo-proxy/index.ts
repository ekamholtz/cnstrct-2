// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

interface QBOConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
  apiBaseUrl: string;
  scopes: string[];
  isProduction: boolean;
}

/**
 * Get QBO configuration from environment variables
 */
function getQBOConfig(req: Request): QBOConfig {
  // Get environment variables
  const clientId = Deno.env.get("QBO_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("QBO_CLIENT_SECRET") || "";
  
  // Determine if we're in production based on the request URL
  const url = new URL(req.url);
  const hostname = url.hostname;
  const isProduction = !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
  
  // Determine the redirect URI based on the hostname
  let redirectUri = "";
  if (hostname === 'cnstrctnetwork.vercel.app') {
    redirectUri = "https://cnstrctnetwork.vercel.app/qbo/callback";
  } else if (hostname.includes('cnstrctnetwork-') && hostname.includes('vercel.app')) {
    // For Vercel preview deployments, still use the production redirect URI
    redirectUri = "https://cnstrctnetwork.vercel.app/qbo/callback";
  } else if (hostname === 'cnstrct-2.lovable.app') {
    redirectUri = "https://cnstrct-2.lovable.app/qbo/callback";
  } else if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    // For local development
    redirectUri = "http://localhost:8081/qbo/callback";
  } else {
    // Fallback to the production URI for any other hostname
    redirectUri = "https://cnstrctnetwork.vercel.app/qbo/callback";
  }
  
  // Use the correct API base URL based on environment
  const apiBaseUrl = isProduction 
    ? 'https://quickbooks.api.intuit.com/v3'
    : 'https://sandbox-quickbooks.api.intuit.com/v3';
  
  return {
    clientId,
    clientSecret,
    redirectUri,
    authEndpoint: 'https://appcenter.intuit.com/connect/oauth2',
    tokenEndpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    apiBaseUrl,
    scopes: ['com.intuit.quickbooks.accounting'],
    isProduction
  };
}

/**
 * Create a Supabase client with the correct credentials
 */
function createSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Verify JWT token from request
 */
async function verifyToken(req: Request) {
  try {
    const supabase = createSupabaseClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Generate authorization URL for QBO OAuth flow
 */
async function handleAuthRequest(req: Request) {
  try {
    const user = await verifyToken(req);
    const config = getQBOConfig(req);
    
    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store the state in the database for later verification
    const supabase = createSupabaseClient(req);
    await supabase
      .from('qbo_auth_states')
      .insert({
        state,
        user_id: user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
      });
    
    // Build the authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      scope: config.scopes.join(' '),
      redirect_uri: config.redirectUri,
      state
    });
    
    const authUrl = `${config.authEndpoint}?${params.toString()}`;
    
    return new Response(
      JSON.stringify({ url: authUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      }
    );
  }
}

/**
 * Exchange authorization code for tokens
 */
async function handleTokenExchange(req: Request) {
  try {
    const user = await verifyToken(req);
    const config = getQBOConfig(req);
    
    // Get the request body
    const { code, state } = await req.json();
    
    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }
    
    // Verify the state parameter
    const supabase = createSupabaseClient(req);
    const { data: stateData, error: stateError } = await supabase
      .from('qbo_auth_states')
      .select('*')
      .eq('state', state)
      .eq('user_id', user.id)
      .single();
    
    if (stateError || !stateData) {
      throw new Error('Invalid state parameter');
    }
    
    // Delete the state from the database
    await supabase
      .from('qbo_auth_states')
      .delete()
      .eq('state', state);
    
    // Exchange the code for tokens
    const tokenResponse = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      }).toString()
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Extract the realmId from the request
    const { realmId } = await req.json();
    
    if (!realmId) {
      throw new Error('Missing realmId parameter');
    }
    
    // Get company info
    const companyResponse = await fetch(`${config.apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!companyResponse.ok) {
      throw new Error('Failed to get company info');
    }
    
    const companyData = await companyResponse.json();
    const companyName = companyData.CompanyInfo?.CompanyName || 'Unknown Company';
    
    // Calculate expiration times
    const expiresIn = tokenData.expires_in || 3600;
    const refreshTokenExpiresIn = tokenData.x_refresh_token_expires_in || 8726400;
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
    const refreshTokenExpiresAt = new Date(Date.now() + (refreshTokenExpiresIn * 1000)).toISOString();
    
    // Store the connection in the database
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .upsert({
        user_id: user.id,
        company_id: realmId,
        company_name: companyName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (connectionError) {
      throw new Error(`Failed to store connection: ${connectionError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        companyId: realmId,
        companyName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}

/**
 * Refresh an access token
 */
async function handleTokenRefresh(req: Request) {
  try {
    const user = await verifyToken(req);
    const config = getQBOConfig(req);
    
    // Get the connection from the database
    const supabase = createSupabaseClient(req);
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (connectionError || !connection) {
      throw new Error('No QBO connection found');
    }
    
    // Check if the token is already expired
    const now = new Date();
    const expiresAt = new Date(connection.expires_at);
    
    // If the token is not expired, return it
    if (expiresAt > now) {
      return new Response(
        JSON.stringify({ access_token: connection.access_token }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Check if the refresh token is expired
    const refreshTokenExpiresAt = new Date(connection.refresh_token_expires_at);
    if (refreshTokenExpiresAt <= now) {
      throw new Error('Refresh token expired, user needs to re-authenticate');
    }
    
    // Refresh the token
    const refreshResponse = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
        client_id: config.clientId,
        client_secret: config.clientSecret
      }).toString()
    });
    
    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
    }
    
    const refreshData = await refreshResponse.json();
    
    // Calculate new expiration times
    const expiresIn = refreshData.expires_in || 3600;
    const refreshTokenExpiresIn = refreshData.x_refresh_token_expires_in || 8726400;
    const newExpiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
    const newRefreshTokenExpiresAt = new Date(Date.now() + (refreshTokenExpiresIn * 1000)).toISOString();
    
    // Update the connection in the database
    const { error: updateError } = await supabase
      .from('qbo_connections')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_at: newExpiresAt,
        refresh_token_expires_at: newRefreshTokenExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);
    
    if (updateError) {
      throw new Error(`Failed to update connection: ${updateError.message}`);
    }
    
    return new Response(
      JSON.stringify({ access_token: refreshData.access_token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error refreshing token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}

/**
 * Test connection to QBO
 */
async function handleTestConnection(req: Request) {
  try {
    const user = await verifyToken(req);
    const config = getQBOConfig(req);
    
    // Get the connection from the database
    const supabase = createSupabaseClient(req);
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (connectionError || !connection) {
      throw new Error('No QBO connection found');
    }
    
    // Check if the token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(connection.expires_at);
    let accessToken = connection.access_token;
    
    if (expiresAt <= now) {
      // Token is expired, refresh it
      const refreshTokenExpiresAt = new Date(connection.refresh_token_expires_at);
      if (refreshTokenExpiresAt <= now) {
        throw new Error('Refresh token expired, user needs to re-authenticate');
      }
      
      // Refresh the token
      const refreshResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: config.clientId,
          client_secret: config.clientSecret
        }).toString()
      });
      
      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
      }
      
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Update the connection in the database
      const expiresIn = refreshData.expires_in || 3600;
      const refreshTokenExpiresIn = refreshData.x_refresh_token_expires_in || 8726400;
      const newExpiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
      const newRefreshTokenExpiresAt = new Date(Date.now() + (refreshTokenExpiresIn * 1000)).toISOString();
      
      await supabase
        .from('qbo_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: newExpiresAt,
          refresh_token_expires_at: newRefreshTokenExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);
    }
    
    // Test the connection by getting company info
    const companyResponse = await fetch(`${config.apiBaseUrl}/company/${connection.company_id}/companyinfo/${connection.company_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!companyResponse.ok) {
      throw new Error('Failed to get company info');
    }
    
    const companyData = await companyResponse.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        companyName: companyData.CompanyInfo?.CompanyName || 'Unknown Company',
        companyId: connection.company_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error testing connection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}

/**
 * Proxy a request to QBO API
 */
async function handleProxyRequest(req: Request) {
  try {
    const user = await verifyToken(req);
    const config = getQBOConfig(req);
    
    // Get the request body
    const { endpoint, method = 'GET', body = null } = await req.json();
    
    if (!endpoint) {
      throw new Error('Missing endpoint parameter');
    }
    
    // Get the connection from the database
    const supabase = createSupabaseClient(req);
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (connectionError || !connection) {
      throw new Error('No QBO connection found');
    }
    
    // Check if the token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(connection.expires_at);
    let accessToken = connection.access_token;
    
    if (expiresAt <= now) {
      // Token is expired, refresh it
      const refreshTokenExpiresAt = new Date(connection.refresh_token_expires_at);
      if (refreshTokenExpiresAt <= now) {
        throw new Error('Refresh token expired, user needs to re-authenticate');
      }
      
      // Refresh the token
      const refreshResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: config.clientId,
          client_secret: config.clientSecret
        }).toString()
      });
      
      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
      }
      
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Update the connection in the database
      const expiresIn = refreshData.expires_in || 3600;
      const refreshTokenExpiresIn = refreshData.x_refresh_token_expires_in || 8726400;
      const newExpiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
      const newRefreshTokenExpiresAt = new Date(Date.now() + (refreshTokenExpiresIn * 1000)).toISOString();
      
      await supabase
        .from('qbo_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: newExpiresAt,
          refresh_token_expires_at: newRefreshTokenExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);
    }
    
    // Build the full URL
    let url = endpoint;
    if (!url.startsWith('http')) {
      // If the endpoint doesn't start with http, assume it's a relative path
      url = `${config.apiBaseUrl}/company/${connection.company_id}/${endpoint}`;
    }
    
    // Make the request to QBO
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, requestOptions);
    const responseData = await response.json();
    
    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      }
    );
  } catch (error) {
    console.error('Error proxying request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}

/**
 * Disconnect from QBO
 */
async function handleDisconnect(req: Request) {
  try {
    const user = await verifyToken(req);
    
    // Delete the connection from the database
    const supabase = createSupabaseClient(req);
    const { error } = await supabase
      .from('qbo_connections')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error disconnecting:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}

/**
 * Handle ping request for testing
 */
async function handlePing() {
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      message: 'QBO proxy is running',
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

/**
 * Main handler for all requests
 */
serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  // Get the action from the URL
  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();
  
  try {
    // Route the request based on the action
    switch (action) {
      case 'ping':
        return handlePing();
      case 'auth':
        return handleAuthRequest(req);
      case 'token':
        return handleTokenExchange(req);
      case 'refresh':
        return handleTokenRefresh(req);
      case 'test-connection':
        return handleTestConnection(req);
      case 'proxy':
        return handleProxyRequest(req);
      case 'disconnect':
        return handleDisconnect(req);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
