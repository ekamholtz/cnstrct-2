
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

  // Get the QBO code and redirect URI from the request
  try {
    const { code, redirectUri } = await req.json();
    
    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          requiredParams: ['code', 'redirectUri']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the token exchange request parameters
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    // Create the authorization header
    const authString = `${clientId}:${clientSecret}`;
    const base64Auth = btoa(authString);

    console.log('Making token exchange request to QBO API');
    
    // Make the token exchange request to QBO
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
    console.error('Error in token exchange:', error.message);
    
    return new Response(
      JSON.stringify({
        error: 'Error processing request',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
