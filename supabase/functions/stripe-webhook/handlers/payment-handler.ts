
import { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { isValidUuid } from "../utils";

export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
) {
  try {
    console.log('Processing payment_intent.succeeded event');
    
    const metadata = paymentIntent.metadata || {};
    const { invoiceId, userId, gcAccountId } = metadata;

    // Update payment link status
    await updatePaymentLinkStatus(supabase, paymentIntent.id, 'paid');

    // Update invoice status if present
    if (invoiceId && isValidUuid(invoiceId)) {
      await updateInvoiceStatus(supabase, invoiceId, paymentIntent.id);
    }

    // Create payment record
    await createPaymentRecord(supabase, paymentIntent, userId, gcAccountId);
    
    console.log('✅ Successfully completed payment_intent.succeeded processing');
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error);
  }
}

export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
) {
  try {
    console.log('Processing payment_intent.payment_failed event');
    
    const metadata = paymentIntent.metadata || {};
    const { userId, gcAccountId } = metadata;

    // Update payment link status
    await updatePaymentLinkStatus(supabase, paymentIntent.id, 'failed');

    // Create payment record for failed payment
    await createPaymentRecord(supabase, paymentIntent, userId, gcAccountId, 'failed');
    
    console.log('✅ Successfully completed payment_intent.payment_failed processing');
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error);
  }
}

async function updatePaymentLinkStatus(
  supabase: SupabaseClient,
  paymentIntentId: string,
  status: string
) {
  try {
    const { error } = await supabase
      .from('payment_links')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      console.error(`Error updating payment link: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating payment link:', error);
  }
}

async function updateInvoiceStatus(
  supabase: SupabaseClient,
  invoiceId: string,
  paymentIntentId: string
) {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: 'cc',
        payment_date: new Date().toISOString(),
        payment_gateway: 'stripe',
        payment_reference: paymentIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (error) {
      console.error(`Error updating invoice: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
  }
}

async function createPaymentRecord(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
  userId?: string,
  gcAccountId?: string,
  status: string = 'succeeded'
) {
  try {
    // Check for existing record
    const { data: existingRecord } = await supabase
      .from('payment_records')
      .select('id')
      .eq('payment_intent_id', paymentIntent.id)
      .maybeSingle();

    if (!existingRecord) {
      // Validate userId
      const validUserId = (userId && isValidUuid(userId)) ? 
        userId : '00000000-0000-0000-0000-000000000000';
      
      // Prepare payment data
      const paymentData: any = {
        payment_intent_id: paymentIntent.id,
        user_id: validUserId,
        stripe_account_id: paymentIntent.account || 'platform',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status,
        customer_email: paymentIntent.receipt_email || null,
        description: paymentIntent.description || 'Payment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add gcAccountId if valid
      if (gcAccountId && isValidUuid(gcAccountId)) {
        paymentData.gc_account_id = gcAccountId;
      }
      
      // Only add platform_fee if exists
      if (paymentIntent.application_fee_amount) {
        paymentData.platform_fee = paymentIntent.application_fee_amount / 100;
      }

      const { error } = await supabase
        .from('payment_records')
        .insert(paymentData);

      if (error) {
        console.error(`Error creating payment record: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error handling payment record:', error);
  }
}
