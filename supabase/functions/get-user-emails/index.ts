
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user IDs from the request body
    const { userIds } = await req.json()

    // Input validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid user IDs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Received ${userIds.length} user IDs to lookup emails for`)

    // Create a Supabase admin client for accessing auth data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user emails using the admin client
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Filter and map users to get emails for the specified userIds
    const usersWithEmails = users.users
      .filter(user => userIds.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email
      }))

    console.log(`Found ${usersWithEmails.length} matching users`)

    // Return the emails
    return new Response(
      JSON.stringify(usersWithEmails),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
