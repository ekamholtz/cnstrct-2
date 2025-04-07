
// Minimal Stripe webhook handler with NO signature verification
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('Webhook received at:', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Get the request body
    const body = await req.text()
    console.log('Webhook payload received (first 200 chars):', body.substring(0, 200) + '...');
    
    // Parse the event JSON
    let event
    try {
      event = JSON.parse(body)
    } catch (error) {
      console.error('Error parsing webhook JSON:', error)
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Log the event type
    console.log(`Processing event type: ${event.type}`);
    
    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('Processing checkout.session.completed event')
      console.log('Session ID:', session.id)
      console.log('Session object:', JSON.stringify(session).substring(0, 300) + '...')
      
      // Update subscription status in database
      try {
        // Get client reference ID (should be the gc_account_id)
        const clientReferenceId = session.client_reference_id
        console.log('Client reference ID:', clientReferenceId)
        
        if (clientReferenceId) {
          // Update the gc_account subscription status
          const { error } = await supabase
            .from('gc_accounts')
            .update({ 
              subscription_tier_id: 'premium',
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', clientReferenceId)
          
          if (error) {
            console.error('Error updating gc_account:', error)
          } else {
            console.log('Successfully updated gc_account subscription status')
          }
          
          // Create a record in account_subscriptions table
          const { error: subError } = await supabase
            .from('account_subscriptions')
            .insert({
              gc_account_id: clientReferenceId,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (subError) {
            console.error('Error creating subscription record:', subError)
          } else {
            console.log('Successfully created subscription record')
          }
        } else {
          console.error('No client_reference_id found in session')
          
          // Try to find GC account using metadata
          if (session.metadata && session.metadata.gc_account_id) {
            const metadataAccountId = session.metadata.gc_account_id
            console.log('Found gc_account_id in metadata:', metadataAccountId)
            
            // Update the gc_account subscription status
            const { error } = await supabase
              .from('gc_accounts')
              .update({ 
                subscription_tier_id: 'premium',
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', metadataAccountId)
            
            if (error) {
              console.error('Error updating gc_account from metadata:', error)
            } else {
              console.log('Successfully updated gc_account subscription status from metadata')
            }
            
            // Create a record in account_subscriptions table
            const { error: subError } = await supabase
              .from('account_subscriptions')
              .insert({
                gc_account_id: metadataAccountId,
                stripe_subscription_id: session.subscription,
                stripe_customer_id: session.customer,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (subError) {
              console.error('Error creating subscription record from metadata:', subError)
            } else {
              console.log('Successfully created subscription record from metadata')
            }
          } else {
            console.error('No gc_account_id found in client_reference_id or metadata')
          }
        }
      } catch (error) {
        console.error('Error processing checkout.session.completed:', error)
      }
    }
    
    // Return success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Error handling webhook:', error)
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
