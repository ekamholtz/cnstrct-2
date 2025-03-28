import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/adminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication - extract token from the request
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify the token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Process based on the HTTP method
  switch (req.method) {
    case 'GET':
      return await getCheckoutSessions(req, res, user.id);
    case 'POST':
      return await createCheckoutSession(req, res, user.id);
    case 'PATCH':
      return await updateCheckoutSession(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get checkout sessions
 */
async function getCheckoutSessions(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { gc_account_id, limit = 10, offset = 0, status } = req.query;

  let query = supabase
    .from('checkout_sessions')
    .select('*, payment_records(*)');

  // Apply filters
  if (gc_account_id) {
    query = query.eq('gc_account_id', gc_account_id);
  } else {
    // If no account specified, only return records for the authenticated user
    query = query.eq('user_id', userId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  // Apply pagination
  query = query
    .order('created_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching checkout sessions:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

/**
 * Create a new checkout session record
 */
async function createCheckoutSession(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const {
    user_id = userId,
    gc_account_id,
    stripe_session_id,
    stripe_account_id,
    amount,
    currency,
    status,
    description,
    metadata
  } = req.body;

  // Validate required fields
  if (!gc_account_id || !stripe_session_id || !stripe_account_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create checkout session record
  const { data, error } = await supabase
    .from('checkout_sessions')
    .insert({
      user_id,
      gc_account_id,
      stripe_session_id,
      stripe_account_id,
      amount,
      currency,
      status,
      description,
      metadata
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ data });
}

/**
 * Update an existing checkout session record
 */
async function updateCheckoutSession(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { id, stripe_session_id, status, metadata } = req.body;

  if (!id && !stripe_session_id) {
    return res.status(400).json({ error: 'Missing id or stripe_session_id' });
  }

  // Build update object
  const updateData: any = {};
  if (status) updateData.status = status;
  if (metadata) updateData.metadata = metadata;
  updateData.updated_at = new Date().toISOString();

  // Update checkout session
  let query = supabase.from('checkout_sessions');
  
  if (id) {
    query = query.eq('id', id);
  } else if (stripe_session_id) {
    query = query.eq('stripe_session_id', stripe_session_id);
  }

  const { data, error } = await query.update(updateData).select().single();

  if (error) {
    console.error('Error updating checkout session:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
