
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    // Get the request body
    const requestData = await req.json()
    const { name, email, phone, role, gc_account_id } = requestData

    if (!name || !email || !role) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'Name, email, and role are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate role to be either gc_admin or project_manager
    const validRoles = ['gc_admin', 'project_manager']
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid role',
          details: 'Role must be either gc_admin or project_manager',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // For project_manager role, gc_account_id is required
    if (role === 'project_manager' && !gc_account_id) {
      return new Response(JSON.stringify({ error: 'Missing GC account ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the requesting user has permission to create users (is admin or gc_admin)
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '')

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if the user has the required role (platform_admin or gc_admin)
    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !requesterProfile) {
      console.error('Profile error:', profileError)
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: 'Could not verify user permissions',
        profileError
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allowedRoles = ['platform_admin', 'gc_admin']
    if (!allowedRoles.includes(requesterProfile.role)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden', 
        details: 'Only administrators can create users' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the user via supabase admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone_number: phone,
        role,
      },
      password: Math.random().toString(36).slice(2, 10),  // Generate a random password
    })

    if (createError) {
      console.error('Create user error:', createError)
      return new Response(
        JSON.stringify({
          error: 'Failed to create user',
          details: createError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update the profile with the GC account ID if provided
    if (newUser && gc_account_id) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gc_account_id,
          phone_number: phone,
        })
        .eq('id', newUser.user.id)

      if (updateError) {
        console.error('Update profile error:', updateError)
        return new Response(
          JSON.stringify({
            error: 'Failed to update user profile',
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Send a success response
    return new Response(
      JSON.stringify({
        success: true,
        user: newUser.user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
