/**
 * Stripe Invoice Service
 * Provides functionality for syncing invoices with Stripe and generating payment links
 */

import { supabase } from '@/integrations/supabase/client';
import { StripeInvoice, StripePaymentLink } from '@/types/stripe';
import { calculatePlatformFee } from './stripeConnectConfig';

/**
 * Creates or updates a Stripe customer for a client
 * 
 * @param clientId - The client ID in our system
 * @param companyId - The company ID in our system
 * @param stripeAccountId - The Stripe Connect account ID
 * @param clientEmail - The client's email address
 * @param clientName - The client's name
 * @returns The Stripe customer ID
 */
export async function createOrUpdateCustomer(
  clientId: string,
  companyId: string,
  stripeAccountId: string,
  clientEmail: string,
  clientName: string
): Promise<string> {
  // Check if we already have a customer for this client
  const { data: existingCustomer } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('client_id', clientId)
    .eq('company_id', companyId)
    .single();

  if (existingCustomer?.stripe_customer_id) {
    // Customer exists, update it
    await fetch('/api/proxy/stripe/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: `customers/${existingCustomer.stripe_customer_id}`,
        method: 'post',
        accountId: stripeAccountId,
        data: {
          email: clientEmail,
          name: clientName,
          metadata: {
            client_id: clientId,
            company_id: companyId
          }
        }
      })
    });

    return existingCustomer.stripe_customer_id;
  }

  // Create a new customer
  const response = await fetch('/api/proxy/stripe/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: 'customers',
      method: 'post',
      accountId: stripeAccountId,
      data: {
        email: clientEmail,
        name: clientName,
        metadata: {
          client_id: clientId,
          company_id: companyId
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create customer');
  }

  const customer = await response.json();

  // Save the customer ID in our database
  await supabase
    .from('stripe_customers')
    .insert({
      client_id: clientId,
      company_id: companyId,
      stripe_customer_id: customer.id,
      email: clientEmail,
      name: clientName
    });

  return customer.id;
}

/**
 * Syncs an invoice with Stripe
 * 
 * @param invoiceId - The invoice ID in our system
 * @param companyId - The company ID
 * @param clientId - The client ID
 * @param stripeAccountId - The Stripe Connect account ID
 * @param stripeCustomerId - The Stripe customer ID
 * @param amount - The invoice amount in cents
 * @param description - The invoice description
 * @param dueDate - The invoice due date
 * @param invoiceNumber - The invoice number
 * @returns The synced Stripe invoice
 */
export async function syncInvoiceWithStripe(
  invoiceId: string,
  companyId: string,
  clientId: string,
  stripeAccountId: string,
  stripeCustomerId: string,
  amount: number,
  description: string,
  dueDate: Date,
  invoiceNumber: string
): Promise<StripeInvoice> {
  try {
    // Create an invoice in Stripe
    const response = await fetch('/api/proxy/stripe/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'invoices',
        method: 'post',
        accountId: stripeAccountId,
        data: {
          customer: stripeCustomerId,
          collection_method: 'send_invoice',
          due_date: Math.floor(dueDate.getTime() / 1000), // Convert to Unix timestamp
          auto_advance: true,
          description: description,
          metadata: {
            invoice_id: invoiceId,
            company_id: companyId,
            client_id: clientId,
            invoice_number: invoiceNumber
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invoice');
    }

    const stripeInvoiceData = await response.json();

    // Calculate platform fee
    const platformFee = calculatePlatformFee(amount);

    // Create an invoice item with the full amount
    await fetch('/api/proxy/stripe/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'invoiceitems',
        method: 'post',
        accountId: stripeAccountId,
        data: {
          customer: stripeCustomerId,
          invoice: stripeInvoiceData.id,
          amount: amount,
          currency: 'usd',
          description: description
        }
      })
    });

    // Finalize the invoice
    const finalizeResponse = await fetch('/api/proxy/stripe/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: `invoices/${stripeInvoiceData.id}/finalize`,
        method: 'post',
        accountId: stripeAccountId,
        data: {}
      })
    });

    if (!finalizeResponse.ok) {
      const finalizeError = await finalizeResponse.json();
      throw new Error(finalizeError.error || 'Failed to finalize invoice');
    }

    const finalizedInvoice = await finalizeResponse.json();

    // Save the invoice in our database
    const { data, error } = await supabase
      .from('stripe_invoices')
      .insert({
        stripe_invoice_id: finalizedInvoice.id,
        company_id: companyId,
        customer_id: stripeCustomerId,
        amount: amount,
        currency: finalizedInvoice.currency,
        status: finalizedInvoice.status,
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save invoice data: ${error.message}`);
    }

    // Associate the Stripe invoice with our system invoice
    await supabase
      .from('invoices')
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        payment_status: 'pending',
        stripe_invoice_url: finalizedInvoice.hosted_invoice_url
      })
      .eq('id', invoiceId);

    return data as StripeInvoice;
  } catch (error) {
    console.error('Error syncing invoice with Stripe:', error);
    throw error;
  }
}

/**
 * Creates a payment link for an invoice
 * 
 * @param invoiceId - The invoice ID in our system
 * @param companyId - The company ID
 * @param stripeAccountId - The Stripe Connect account ID
 * @param stripeInvoiceId - The Stripe invoice ID
 * @returns The payment link
 */
export async function createPaymentLink(
  invoiceId: string,
  companyId: string,
  stripeAccountId: string,
  stripeInvoiceId: string
): Promise<StripePaymentLink> {
  try {
    // Create a checkout session
    const response = await fetch('/api/proxy/stripe/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'checkout/sessions',
        method: 'post',
        accountId: stripeAccountId,
        data: {
          mode: 'payment',
          payment_method_types: ['card'],
          invoice: stripeInvoiceId,
          success_url: `${window.location.origin}/dashboard/invoices/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/dashboard/invoices/${invoiceId}?canceled=true`,
          metadata: {
            invoice_id: invoiceId,
            company_id: companyId
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment link');
    }

    const session = await response.json();

    // Save the payment link in our database
    const { data, error } = await supabase
      .from('stripe_payment_links')
      .insert({
        invoice_id: invoiceId,
        company_id: companyId,
        checkout_session_id: session.id,
        url: session.url,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days expiry
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save payment link: ${error.message}`);
    }

    return data as StripePaymentLink;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Gets the payment status for an invoice
 * 
 * @param invoiceId - The invoice ID
 * @returns The payment status and link
 */
export async function getInvoicePaymentStatus(
  invoiceId: string
): Promise<{ status: string; paymentLink: StripePaymentLink | null }> {
  // Get the payment link for this invoice
  const { data: paymentLink, error: paymentLinkError } = await supabase
    .from('stripe_payment_links')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (paymentLinkError && paymentLinkError.code !== 'PGRST116') {
    throw new Error(`Failed to get payment link: ${paymentLinkError.message}`);
  }

  // Get the invoice payment status
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('payment_status')
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    throw new Error(`Failed to get invoice: ${invoiceError.message}`);
  }

  return {
    status: invoice.payment_status,
    paymentLink: paymentLink as StripePaymentLink || null
  };
}
