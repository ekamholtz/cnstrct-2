import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/adminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    sessionId,
    paymentIntentId,
    status,
    amount,
    currency,
    customerEmail,
    customerName,
    metadata,
  } = req.body;

  if (!sessionId || !paymentIntentId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 1. Find the checkout session in the database
    const { data: sessionData, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('id, user_id, organization_id, stripe_account_id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error finding checkout session:', sessionError);
      return res.status(404).json({ error: 'Checkout session not found' });
    }

    // 2. Update the checkout session status
    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({
        status: status || 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionData.id);

    if (updateError) {
      console.error('Error updating checkout session:', updateError);
      return res.status(500).json({ error: 'Failed to update checkout session' });
    }

    // 3. Create a payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        user_id: sessionData.user_id,
        organization_id: sessionData.organization_id,
        checkout_session_id: sessionData.id,
        payment_intent_id: paymentIntentId,
        connected_account_id: sessionData.stripe_account_id,
        amount,
        currency: currency || 'usd',
        status: 'succeeded',
        customer_email: customerEmail,
        customer_name: customerName,
        metadata,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    return res.status(200).json({
      message: 'Checkout session completed successfully',
      data: {
        session: { id: sessionData.id, status: 'completed' },
        payment: paymentRecord,
      },
    });
  } catch (error: any) {
    console.error('Error processing checkout session completion:', error);
    return res.status(500).json({ error: `Failed to complete checkout session: ${error.message}` });
  }
}
