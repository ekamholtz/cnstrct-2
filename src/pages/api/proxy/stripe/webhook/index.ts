import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { handleWebhookEvent } from '@/integrations/stripe/services/StripeWebhookService';
import { getStripeAccessToken } from '@/integrations/stripe/services/StripeConnectService';

// Disable body parsing, we need the raw body to verify the webhook signature
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw body as a buffer
    const rawBody = await buffer(req);
    const strBody = rawBody.toString();
    
    // Get Stripe webhook secret from environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Get Stripe access token
    const accessToken = await getStripeAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Unable to retrieve Stripe access token' });
    }
    
    // Parse the webhook event body
    let event;
    try {
      event = JSON.parse(strBody);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Verify the webhook signature if a webhook secret is configured
    if (webhookSecret) {
      const signature = req.headers['stripe-signature'] as string;
      
      try {
        // Import Stripe directly for signature verification
        const stripe = require('stripe')(accessToken);
        event = stripe.webhooks.constructEvent(strBody, signature, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }
    }
    
    // Handle the event
    const result = await handleWebhookEvent(event, accessToken);
    
    return res.status(200).json({ received: true, result });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: `Webhook handler failed: ${error.message}` });
  }
}
