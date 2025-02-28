
// Edge function to create a new GC user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestBody = {
  name: string;
  email: string;
  phone: string;
  role: 'gc_admin' | 'project_manager';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ensure request has authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set up Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Initialize the service role client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user making the request (to check permissions)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !requestingUser) {
      console.error('Error getting user from token:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the requesting user's profile to check their role
    const { data: requestingUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, gc_account_id')
      .eq('id', requestingUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching requesting user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to create users (must be gc_admin or platform_admin)
    if (requestingUserProfile.role !== 'gc_admin' && requestingUserProfile.role !== 'platform_admin') {
      console.error('User does not have permission to create users. Role:', requestingUserProfile.role);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    console.log('Request data:', requestData);

    // Basic validation
    if (!requestData.name || !requestData.email || !requestData.role) {
      console.error('Missing required fields:', requestData);
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the new user
    console.log('Creating user with email:', requestData.email);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email.toLowerCase(),
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: requestData.name,
        role: requestData.role,
      },
      password: crypto.randomUUID().substring(0, 8), // Generate a random initial password
    });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', newUser.user.id);

    // Update the user's profile with additional information
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        gc_account_id: requestingUserProfile.gc_account_id, // Link to the same GC account
        phone_number: requestData.phone,
        has_completed_profile: false, // New user needs to complete profile
      })
      .eq('id', newUser.user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      // We don't return an error here, as the user was created, but log it
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        userId: newUser.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
