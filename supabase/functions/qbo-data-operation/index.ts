
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, realmId, endpoint, method = 'get', data } = await req.json();
    
    if (!accessToken || !realmId || !endpoint) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          requiredParams: ['accessToken', 'realmId', 'endpoint']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine API base URL based on environment (using sandbox for now)
    const apiBaseUrl = "https://sandbox-quickbooks.api.intuit.com/v3";
    
    // Construct the full URL for the QBO API request
    let url = '';
    if (endpoint === 'query') {
      // Handle query endpoint differently
      url = `${apiBaseUrl}/company/${realmId}/query`;
    } else {
      // For other endpoints, use the provided endpoint name
      url = `${apiBaseUrl}/company/${realmId}/${endpoint}`;
    }
    
    console.log(`Making ${method.toUpperCase()} request to QBO API:`, url);
    
    // Prepare request options
    const options: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    // Add query parameters or request body based on method
    if (method.toLowerCase() === 'get') {
      if (endpoint === 'query' && data?.query) {
        // For query endpoint, add query parameter
        url += `?query=${encodeURIComponent(data.query)}`;
      } else if (data) {
        // For other GET requests with data, add query parameters
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        url += `?${params.toString()}`;
      }
    } else {
      // For non-GET requests, add request body
      options.body = JSON.stringify(data);
    }
    
    // Make the request to QBO API
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    // Return the QBO API response
    return new Response(
      JSON.stringify(responseData),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in QBO data operation:', error.message);
    
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
