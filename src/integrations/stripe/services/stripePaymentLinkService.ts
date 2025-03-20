/**
 * StripePaymentLinkService
 * Service for creating and managing Stripe Payment Links for invoices
 */

import { createClient } from '@supabase/supabase-js';
import StripeServiceProxy from './stripeServiceProxy';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface InvoiceData {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  description: string;
  due_date?: string;
  line_items: InvoiceLineItem[];
  metadata?: Record<string, string>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_amount: number;
  metadata?: Record<string, string>;
}

export interface PaymentLinkResponse {
  id: string;
  url: string;
  payment_intent_id?: string;
  expires_at?: number;
}

export interface StoredPaymentLink {
  id?: string;
  invoice_id: string;
  payment_link_id: string;
  payment_link_url: string;
  payment_intent_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  created_at?: string;
  updated_at?: string;
}

class StripePaymentLinkService extends StripeServiceProxy {
  constructor() {
    super();
    console.log('StripePaymentLinkService initialized');
  }
  
  /**
   * Create a payment link for an invoice
   * @param userId User ID
   * @param invoiceData Invoice data
   */
  async createPaymentLink(userId: string, invoiceData: InvoiceData): Promise<PaymentLinkResponse> {
    console.log(`Creating payment link for invoice: ${invoiceData.id}`);
    
    try {
      // Get connection for this user
      const connection = await this.tokenManager.getConnectionByUserId(userId);
      
      if (!connection) {
        throw new Error('No Stripe Connect account found for this user');
      }
      
      // Check if there's already a payment link for this invoice
      const existingLink = await this.getPaymentLinkForInvoice(invoiceData.id);
      if (existingLink) {
        console.log(`Existing payment link found for invoice: ${invoiceData.id}`);
        return {
          id: existingLink.payment_link_id,
          url: existingLink.payment_link_url,
          payment_intent_id: existingLink.payment_intent_id
        };
      }
      
      // Prepare line items for Stripe
      const lineItems = invoiceData.line_items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.description,
            metadata: item.metadata || {}
          },
          unit_amount: Math.round(item.unit_amount * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));
      
      // Calculate application fee amount if using Stripe Connect
      const platformFeeAmount = Math.round(invoiceData.amount * 100 * this.config.platformFeePercentage);
      
      // Prepare metadata
      const metadata = {
        invoice_id: invoiceData.id,
        invoice_number: invoiceData.number,
        ...invoiceData.metadata || {}
      };
      
      // Create payment link via proxy
      const paymentLinkData = {
        line_items: lineItems,
        after_completion: { type: 'redirect', redirect: { url: `${window.location.origin}/payment-success?invoice_id=${invoiceData.id}` } },
        application_fee_amount: platformFeeAmount > 0 ? platformFeeAmount : undefined,
        metadata
      };
      
      // Make the request to create the payment link
      const response = await this.makeRequest(
        'payment_links',
        'post',
        connection.account_id,
        connection.access_token,
        paymentLinkData
      );
      
      // Store the payment link in our database
      const storedLink = await this.storePaymentLink({
        invoice_id: invoiceData.id,
        payment_link_id: response.id,
        payment_link_url: response.url,
        payment_intent_id: response.payment_intent,
        status: 'pending'
      });
      
      console.log(`Payment link created successfully: ${response.url}`);
      
      return {
        id: response.id,
        url: response.url,
        payment_intent_id: response.payment_intent,
        expires_at: response.expires_at
      };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }
  
  /**
   * Get payment link for an invoice
   * @param invoiceId Invoice ID
   */
  async getPaymentLinkForInvoice(invoiceId: string): Promise<StoredPaymentLink | null> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('invoice_id', invoiceId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No payment link found
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('Error getting payment link:', error);
      throw new Error(`Failed to get payment link: ${error.message}`);
    }
  }
  
  /**
   * Store payment link in the database
   * @param paymentLink Payment link data
   */
  private async storePaymentLink(paymentLink: StoredPaymentLink): Promise<StoredPaymentLink> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .insert(paymentLink)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('Error storing payment link:', error);
      throw new Error(`Failed to store payment link: ${error.message}`);
    }
  }
  
  /**
   * Update payment link status
   * @param paymentLinkId Payment link ID
   * @param status New status
   */
  async updatePaymentLinkStatus(paymentLinkId: string, status: 'pending' | 'paid' | 'failed' | 'expired'): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('payment_link_id', paymentLinkId);
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating payment link status:', error);
      throw new Error(`Failed to update payment link status: ${error.message}`);
    }
  }
}

export default StripePaymentLinkService;
