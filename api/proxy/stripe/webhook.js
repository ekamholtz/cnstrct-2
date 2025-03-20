/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events and updates the application state accordingly
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Note: This requires a service key with more permissions
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  // Get the signature from headers
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    console.error('Missing Stripe signature');
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    // Verify the webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    console.log(`Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      // Add more event types as needed
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Handle payment_intent.succeeded event
 * @param {Object} paymentIntent The payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  try {
    // Extract invoice ID from metadata
    const invoiceId = paymentIntent.metadata?.invoice_id;
    
    if (!invoiceId) {
      console.warn('No invoice ID found in payment intent metadata');
      return;
    }
    
    console.log(`Updating payment status for invoice: ${invoiceId}`);
    
    // Update payment link status in database
    const { error: linkError } = await supabase
      .from('payment_links')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('payment_intent_id', paymentIntent.id);
      
    if (linkError) {
      console.error('Error updating payment link status:', linkError);
    }
    
    // Update invoice status in your app's database
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({ 
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);
      
    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
    }
    
    // Create a record of this payment
    const paymentRecord = {
      invoice_id: invoiceId,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types[0],
      created_at: new Date().toISOString()
    };
    
    const { error: recordError } = await supabase
      .from('payment_records')
      .insert(paymentRecord);
      
    if (recordError) {
      console.error('Error creating payment record:', recordError);
    }
    
    console.log('Successfully processed payment_intent.succeeded');
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

/**
 * Handle payment_intent.payment_failed event
 * @param {Object} paymentIntent The payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  try {
    // Extract invoice ID from metadata
    const invoiceId = paymentIntent.metadata?.invoice_id;
    
    if (!invoiceId) {
      console.warn('No invoice ID found in payment intent metadata');
      return;
    }
    
    // Update payment link status in database
    const { error: linkError } = await supabase
      .from('payment_links')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('payment_intent_id', paymentIntent.id);
      
    if (linkError) {
      console.error('Error updating payment link status:', linkError);
    }
    
    // Create a record of this failed payment
    const paymentRecord = {
      invoice_id: invoiceId,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      status: 'failed',
      payment_method: paymentIntent.payment_method_types[0],
      error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
      created_at: new Date().toISOString()
    };
    
    const { error: recordError } = await supabase
      .from('payment_records')
      .insert(paymentRecord);
      
    if (recordError) {
      console.error('Error creating payment record:', recordError);
    }
    
    console.log('Successfully processed payment_intent.payment_failed');
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

/**
 * Handle checkout.session.completed event
 * @param {Object} session The checkout session object
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout completed:', session.id);
  
  try {
    // Extract invoice ID from metadata
    const invoiceId = session.metadata?.invoice_id;
    
    if (!invoiceId) {
      console.warn('No invoice ID found in checkout session metadata');
      return;
    }
    
    // If the session has a payment intent, update its status
    if (session.payment_intent) {
      const { error: linkError } = await supabase
        .from('payment_links')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('payment_intent_id', session.payment_intent);
        
      if (linkError) {
        console.error('Error updating payment link status:', linkError);
      }
    }
    
    // Update invoice status in your app's database
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({ 
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);
      
    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
    }
    
    console.log('Successfully processed checkout.session.completed');
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}
