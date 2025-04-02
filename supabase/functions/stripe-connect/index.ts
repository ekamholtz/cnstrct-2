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
  userId?: string
  accountId?: string
  code?: string
  state?: string
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
      case 'create_oauth_link':
        result = await initiateOAuth(userId, requestData)
        break
      case 'handle-oauth-callback':
      case 'handle_oauth_callback':
        result = await handleOAuthCallback(userId, requestData)
        break
      case 'create-account-link':
        if (!requestData.account_id) {
          throw new Error('accountId is required for create-account-link action')
        }
        result = await createAccountLink(requestData.account_id)
        break
      case 'get-account':
      case 'get_account_status':
        result = await getAccount(userId, requestData)
        break
      case 'list-accounts':
        result = await listAccounts(userId)
        break
      case 'create_login_link':
        if (!requestData.account_id) {
          throw new Error('accountId is required for create_login_link action')
        }
        // Reuse the existing function but extract just the URL
        const loginLink = await createLoginLink(requestData.account_id)
        result = { url: loginLink.url }
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
async function initiateOAuth(userId: string, { returnUrl }: RequestParams) {
  if (!stripeClientId) {
    throw new Error('STRIPE_CLIENT_ID environment variable is not set')
  }

  // Generate state parameter to prevent CSRF
  const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

  // Generate OAuth URL for Stripe Connect
  const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'
  const redirectUri = `${baseUrl}/settings/payments/callback`
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: stripeClientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state: state,
  })

  // Store the state parameter in the database
  await supabase.from('stripe_auth_states').insert({
    state,
    user_id: userId,
    return_url: returnUrl,
    expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiration
  })

  return {
    url: `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
  }
}

/**
 * Handles the OAuth callback from Stripe, saves account details, 
 * and generates an onboarding link.
 */
async function handleOAuthCallback(userId: string, { code, state }: RequestParams) { 
  if (!code) {
    throw new Error('Authorization code is required')
  }

  if (!state) {
    throw new Error('State parameter is required')
  }

  // Verify the state parameter to prevent CSRF
  const { data: stateData, error: stateError } = await supabase
    .from('stripe_auth_states')
    .select('*')
    .eq('state', state)
    .single()
  
  if (stateError || !stateData || stateData.user_id !== userId) {
    throw new Error('Invalid state parameter')
  }

  // Exchange the authorization code for an access token
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  })

  // Store the connected account data in the database
  const { stripe_user_id, access_token, refresh_token, scope } = response

  // Save to Supabase
  const { data, error } = await supabase
    .from('stripe_connect_accounts')
    .upsert({
      user_id: userId,
      account_id: stripe_user_id,
      access_token,
      refresh_token,
      scope,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    throw new Error(`Failed to save connected account: ${error.message}`)
  }

  // Get account details
  const account = await stripe.accounts.retrieve(stripe_user_id)
  
  // Update account status fields
  await supabase
    .from('stripe_connect_accounts')
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', stripe_user_id)

  // Create an onboarding link for the newly connected account
  const accountLink = await createAccountLink(stripe_user_id)

  return {
    success: true,
    accountId: stripe_user_id,
    onboardingUrl: accountLink.url,
    returnUrl: stateData.return_url,
  }
}

/**
 * Creates an account link for onboarding or updating a connected account
 */
async function createAccountLink(accountId: string) {
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
 * Creates a login link for Express dashboard access
 */
async function createLoginLink(accountId: string) {
  if (!accountId) {
    throw new Error('accountId is required')
  }

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink;
}

/**
 * Gets a connected account details
 */
async function getAccount(userId: string, { accountId }: RequestParams) {
  // If accountId is not provided, get the account for the user
  if (!accountId) {
    const { data, error } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return { success: false, error: 'No account found for this user' }
    }

    accountId = data.account_id
  }

  // Get account from Stripe
  try {
    const account = await stripe.accounts.retrieve(accountId)
    
    // Update account details in our database
    await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', accountId)

    return {
      success: true,
      account: {
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        email: account.email,
        business_type: account.business_type,
        capabilities: account.capabilities,
      }
    }
  } catch (error) {
    console.error('Error retrieving account:', error)
    return { success: false, error: `Error retrieving account: ${error.message}` }
  }
}

/**
 * Lists connected accounts for a user
 */
async function listAccounts(userId: string) {
  const { data, error } = await supabase
    .from('stripe_connect_accounts')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to retrieve connected accounts: ${error.message}`)
  }

  return { success: true, accounts: data || [] }
}
