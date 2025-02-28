
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.207.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  name: string
  phone: string
  role: 'gc_admin' | 'project_manager'
  gc_account_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Create a Supabase client with the service role key (admin)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify that the request is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authentication header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate the request
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authenticatedUser) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if authenticated user has admin privileges
    const { data: authenticatedProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authenticatedUser.id)
      .single()

    if (profileError) {
      console.error('Error fetching authenticated user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is allowed to create users
    if (authenticatedProfile.role !== 'gc_admin' && authenticatedProfile.role !== 'platform_admin') {
      console.error('Unauthorized attempt to create user by:', authenticatedUser.email)
      return new Response(
        JSON.stringify({ error: 'You do not have permission to create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const requestData: CreateUserRequest = await req.json()
    console.log('Request data:', requestData)

    // Validate the request body
    if (!requestData.email || !requestData.name || !requestData.role || !requestData.gc_account_id) {
      const missingFields = []
      if (!requestData.email) missingFields.push('email')
      if (!requestData.name) missingFields.push('name')
      if (!requestData.role) missingFields.push('role')
      if (!requestData.gc_account_id) missingFields.push('gc_account_id')

      console.error('Missing required fields:', missingFields)
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: `The following fields are required: ${missingFields.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating user with email:', requestData.email)

    // Create a random password for the new user
    const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)

    // Create the user in Supabase Auth
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: requestData.name,
        phone_verified: false,
        role: requestData.role,
      },
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's profile with the necessary information
    const { data: profileData, error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        full_name: requestData.name,
        role: requestData.role,
        gc_account_id: requestData.gc_account_id,
        phone_number: requestData.phone || null,
        has_completed_profile: false,
      })
      .eq('id', newUser.user.id)
      .select('*')
      .single()

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      // Try to roll back the user creation since profile update failed
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: updateProfileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send password reset email to let the user set their own password
    const { error: resetPasswordError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: requestData.email,
    })

    if (resetPasswordError) {
      console.error('Error sending password reset email:', resetPasswordError)
      // Continue despite the error, since the user has been created successfully
    }

    console.log('User created successfully:', newUser.user.id)

    // Return the success response
    return new Response(
      JSON.stringify({
        message: 'User created successfully',
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          role: requestData.role,
        },
        profile: profileData,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
