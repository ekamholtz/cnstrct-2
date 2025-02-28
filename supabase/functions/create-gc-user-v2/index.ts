
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log("create-gc-user-v2 function loaded")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  let reqBody
  try {
    reqBody = await req.json()
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Extract required fields from request body
    const { name, email, phone, role, gc_account_id } = reqBody

    console.log(`Creating user with name: ${name}, email: ${email}, role: ${role}, gc_account_id: ${gc_account_id}`)

    if (!name || !email || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!gc_account_id) {
      return new Response(JSON.stringify({ error: 'Missing GC account ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate a random password for the new user
    const randomPassword = Math.random().toString(36).slice(-10)

    // Create the user in Supabase Auth
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role,
        phone_number: phone,
      },
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create user', 
        details: createUserError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User created successfully:', newUser.user.id)

    // Update the user's profile with additional data
    const { data: profile, error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        role,
        phone_number: phone,
        gc_account_id: gc_account_id,
        has_completed_profile: true,
      })
      .eq('id', newUser.user.id)
      .select()

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      return new Response(JSON.stringify({ 
        error: 'Failed to update profile', 
        details: updateProfileError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send a password reset email to the user
    const { error: resetPasswordError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (resetPasswordError) {
      console.error('Error sending password reset email:', resetPasswordError)
      // Continue even if there's an error sending the email
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User created successfully',
      userId: newUser.user.id,
      profile
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in create-gc-user-v2:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
