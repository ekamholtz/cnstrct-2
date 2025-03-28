
// Supabase Edge Function for Stripe Connect

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.4.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Stripe Connect configuration
const stripeClientId = Deno.env.get('STRIPE_CLIENT_ID') || ''
const platformFeePercentage = Number(Deno.env.get('STRIPE_PLATFORM_FEE_PERCENTAGE') || 0.025)

interface RequestParams {
  action: string
  gcAccountId?: string
  accountId?: string
  code?: string
  state?: string
  userId?: string
  [key: string]: any
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if the request is authorized
    // This would be a good place to add JWT validation
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const requestData: RequestParams = await req.json()
    const { action } = requestData

    // --- Get Authenticated User --- 
    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth Error:', userError)
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    userId = user.id;
    // --- End Get Authenticated User ---

    let result
    
    // Route to appropriate handler based on action
    switch (action) {
      case 'initiate-oauth':
        result = await initiateOAuth(requestData)
        break
      case 'handle-oauth-callback':
        // Pass userId to the handler
        result = await handleOAuthCallback({ ...requestData, userId })
        break
      case 'create-account-link':
        result = await createAccountLink(requestData)
        break
      case 'get-account':
        result = await getAccount(requestData)
        break
      case 'list-accounts':
        result = await listAccounts(requestData)
        break
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.toString() 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Initiates the OAuth flow by generating the authorization URL
 */
async function initiateOAuth({ gcAccountId }: RequestParams) {
  if (!gcAccountId) {
    throw new Error('gcAccountId is required')
  }

  if (!stripeClientId) {
    throw new Error('STRIPE_CLIENT_ID environment variable is not set')
  }

  // Generate OAuth URL for Stripe Connect
  const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'
  const redirectUri = `${baseUrl}/settings/payments/callback`
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: stripeClientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state: gcAccountId,
  })

  return {
    url: `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
  }
}

/**
 * Handles the OAuth callback from Stripe
 */
async function handleOAuthCallback({ code, state, userId }: RequestParams) { 
  if (!code) {
    throw new Error('Authorization code is required')
  }

  if (!state) {
    throw new Error('State parameter is required')
  }

  if (!userId) {
    // This should ideally not happen if auth check passed before calling this
    throw new Error('User ID is required but was not provided')
  }

  // Exchange the authorization code for an access token
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  })

  // Store the connected account data in the database
  const gcAccountId = state
  const { stripe_user_id, access_token, refresh_token, scope } = response

  // Save to Supabase
  const { data, error } = await supabase
    .from('stripe_connect_accounts')
    .upsert({
      gc_account_id: gcAccountId,
      account_id: stripe_user_id,
      user_id: userId, 
      access_token,
      refresh_token,
      scope,
      details: response,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'gc_account_id',
    })

  if (error) {
    throw new Error(`Failed to save connected account: ${error.message}`)
  }

  return {
    success: true,
    accountId: stripe_user_id,
  }
}

/**
 * Creates an account link for onboarding or updating a connected account
 */
async function createAccountLink({ accountId }: RequestParams) {
  if (!accountId) {
    throw new Error('accountId is required')
  }

  const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/settings/payments?refresh=true`,
    return_url: `${baseUrl}/settings/payments?success=true`,
    type: 'account_onboarding',
  })

  return accountLink
}

/**
 * Gets a connected account details
 */
async function getAccount({ accountId }: RequestParams) {
  if (!accountId) {
    throw new Error('accountId is required')
  }

  const account = await stripe.accounts.retrieve(accountId)
  
  return account
}

/**
 * Lists connected accounts for a GC account
 */
async function listAccounts({ gcAccountId }: RequestParams) {
  if (!gcAccountId) {
    throw new Error('gcAccountId is required')
  }

  // Get accounts from Supabase
  const { data, error } = await supabase
    .from('stripe_connect_accounts')
    .select('*')
    .eq('gc_account_id', gcAccountId)

  if (error) {
    throw new Error(`Failed to retrieve connected accounts: ${error.message}`)
  }

  return { accounts: data || [] }
}
