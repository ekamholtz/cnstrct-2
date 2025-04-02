
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
    const { accessToken, realmId } = await req.json();
    
    if (!accessToken || !realmId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          requiredParams: ['accessToken', 'realmId']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing QBO connection for realm:', realmId);
    
    // Determine API base URL based on the environment
    // For simplicity, we'll use sandbox URL by default
    const apiBaseUrl = "https://sandbox-quickbooks.api.intuit.com/v3";
    
    // Test the connection by fetching company info
    const qboUrl = `${apiBaseUrl}/company/${realmId}/companyinfo/${realmId}`;
    
    const response = await fetch(qboUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Handle the response from QBO
    if (response.ok) {
      const data = await response.json();
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
    console.error('Error testing QBO connection:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error testing connection',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
