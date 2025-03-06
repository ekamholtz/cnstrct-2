
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

    console.log(`Received ${userIds.length} user IDs to lookup emails for: ${JSON.stringify(userIds)}`)

    // Create a Supabase admin client for accessing auth data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user emails by fetching each user individually
    const usersWithEmails = []
    
    // Process users in batches to avoid potential issues with too many concurrent requests
    const batchSize = 10
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      const batchPromises = batch.map(async (userId) => {
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
          
          if (userError) {
            console.error(`Error fetching user ${userId}:`, userError)
            return null
          }
          
          if (!userData || !userData.user) {
            console.log(`No user found for ID ${userId}`)
            return null
          }
          
          return {
            id: userData.user.id,
            email: userData.user.email
          }
        } catch (err) {
          console.error(`Error processing user ${userId}:`, err)
          return null
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      usersWithEmails.push(...batchResults.filter(Boolean))
    }

    console.log(`Found ${usersWithEmails.length} users with emails`)
    
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
