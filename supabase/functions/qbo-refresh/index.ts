
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the Auth context of the function
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get QBO API credentials from environment variables
const clientId = Deno.env.get('QBO_CLIENT_ID') || '';
const clientSecret = Deno.env.get('QBO_CLIENT_SECRET') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the refresh token from the request
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          requiredParams: ['refreshToken']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing QBO token refresh');

    // Prepare the token refresh request parameters
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    // Create the authorization header
    const authString = `${clientId}:${clientSecret}`;
    const base64Auth = btoa(authString);

    // Make the token refresh request to QBO
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${base64Auth}`,
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    // Forward the response from QBO
    const tokenData = await response.json();

    return new Response(
      JSON.stringify(tokenData),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error refreshing token:', error.message);
    
    return new Response(
      JSON.stringify({
        error: 'Error refreshing token',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
