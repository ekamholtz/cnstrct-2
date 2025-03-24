/**
 * StripeService
 * 
 * Provides methods for interacting with the Stripe API
 * Handles Stripe Connect accounts, payments, and financial operations
 * Uses the unified CORS proxy for API communication
 */

import { BaseApiService, ApiResponse } from './BaseApiService';

// Default Stripe API configuration
const DEFAULT_PROXY_URL = 'http://localhost:3030';
const DEFAULT_STRIPE_API_VERSION = '2023-10-16';

export interface StripeServiceConfig {
  proxyUrl?: string;
  apiVersion?: string;
  secretKey: string;
}

export interface StripeAccountInfo {
  id: string;
  object: string;
  business_type: string;
  capabilities: Record<string, string>;
  charges_enabled: boolean;
  country: string;
  email: string;
  payouts_enabled: boolean;
  settings: any;
  type: string;
}

export interface StripePaymentIntent {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_types: string[];
  client_secret: string;
  created: number;
  payment_method?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentLink {
  id: string;
  object: string;
  url: string;
  active: boolean;
  after_completion: any;
  application_fee_amount: number | null;
  application_fee_percent: number | null;
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  object: string;
  email: string;
  name: string;
  phone: string | null;
  created: number;
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  object: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  metadata?: Record<string, string>;
}

export class StripeService extends BaseApiService {
  private secretKey: string;
  private apiVersion: string;
  
  constructor(config: StripeServiceConfig) {
    super({
      proxyUrl: config.proxyUrl || DEFAULT_PROXY_URL,
      serviceName: 'stripe',
      defaultHeaders: {
        'Stripe-Version': config.apiVersion || DEFAULT_STRIPE_API_VERSION
      }
    });
    
    this.secretKey = config.secretKey;
    this.apiVersion = config.apiVersion || DEFAULT_STRIPE_API_VERSION;
  }
  
  /**
   * Create a Stripe Connect account
   * 
   * @param email Account holder's email
   * @param country Two-letter country code
   * @param businessType Type of business (individual or company)
   * @returns Promise with account details
   */
  async createConnectAccount(
    email: string,
    country: string = 'US',
    businessType: 'individual' | 'company' = 'individual'
  ): Promise<ApiResponse<StripeAccountInfo>> {
    this.validateRequiredParams({ email }, ['email']);
    
    return this.makeRequest<StripeAccountInfo>(
      'accounts',
      'post',
      {
        type: 'express',
        email,
        country,
        business_type: businessType,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      },
      { 'Authorization': `Bearer ${this.secretKey}` }
    );
  }
  
  /**
   * Retrieve a Stripe Connect account
   * 
   * @param accountId Stripe account ID
   * @returns Promise with account details
   */
  async getConnectAccount(accountId: string): Promise<ApiResponse<StripeAccountInfo>> {
    this.validateRequiredParams({ accountId }, ['accountId']);
    
    return this.makeRequest<StripeAccountInfo>(
      `accounts/${accountId}`,
      'get',
      null,
      { 'Authorization': `Bearer ${this.secretKey}` }
    );
  }
  
  /**
   * Create an account link for onboarding
   * 
   * @param accountId Stripe account ID
   * @param refreshUrl URL to redirect upon refresh
   * @param returnUrl URL to redirect upon completion
   * @returns Promise with account link URL
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<ApiResponse<{ url: string, expires_at: number }>> {
    this.validateRequiredParams({ accountId, refreshUrl, returnUrl }, 
      ['accountId', 'refreshUrl', 'returnUrl']);
    
    return this.makeRequest<{ url: string, expires_at: number }>(
      'account_links',
      'post',
      {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      },
      { 'Authorization': `Bearer ${this.secretKey}` }
    );
  }
  
  /**
   * Create a payment intent
   * 
   * @param amount Amount in cents
   * @param currency Currency code
   * @param connectAccountId Optional Stripe Connect account ID
   * @param metadata Optional metadata
   * @returns Promise with payment intent details
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    connectAccountId?: string,
    metadata?: Record<string, string>
  ): Promise<ApiResponse<StripePaymentIntent>> {
    this.validateRequiredParams({ amount }, ['amount']);
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`
    };
    
    if (connectAccountId) {
      headers['Stripe-Account'] = connectAccountId;
    }
    
    return this.makeRequest<StripePaymentIntent>(
      'payment_intents',
      'post',
      {
        amount,
        currency,
        metadata,
        payment_method_types: ['card'],
        application_fee_amount: connectAccountId ? Math.round(amount * 0.025) : undefined // 2.5% platform fee
      },
      headers
    );
  }
  
  /**
   * Create a payment link
   * 
   * @param amount Amount in cents
   * @param currency Currency code
   * @param productName Name of the product
   * @param connectAccountId Optional Stripe Connect account ID
   * @param metadata Optional metadata
   * @returns Promise with payment link details
   */
  async createPaymentLink(
    amount: number,
    currency: string = 'usd',
    productName: string,
    connectAccountId?: string,
    metadata?: Record<string, string>
  ): Promise<ApiResponse<StripePaymentLink>> {
    this.validateRequiredParams({ amount, productName }, ['amount', 'productName']);
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`
    };
    
    if (connectAccountId) {
      headers['Stripe-Account'] = connectAccountId;
    }
    
    // First create a product
    const productResponse = await this.makeRequest<any>(
      'products',
      'post',
      {
        name: productName,
        metadata
      },
      headers
    );
    
    if (!productResponse.success) {
      return {
        data: null as unknown as StripePaymentLink,
        success: false,
        error: productResponse.error
      };
    }
    
    // Then create a price for the product
    const priceResponse = await this.makeRequest<any>(
      'prices',
      'post',
      {
        unit_amount: amount,
        currency,
        product: productResponse.data.id
      },
      headers
    );
    
    if (!priceResponse.success) {
      return {
        data: null as unknown as StripePaymentLink,
        success: false,
        error: priceResponse.error
      };
    }
    
    // Finally create the payment link
    return this.makeRequest<StripePaymentLink>(
      'payment_links',
      'post',
      {
        line_items: [
          {
            price: priceResponse.data.id,
            quantity: 1
          }
        ],
        metadata,
        application_fee_percent: connectAccountId ? 2.5 : undefined // 2.5% platform fee
      },
      headers
    );
  }
  
  /**
   * Create a customer
   * 
   * @param email Customer email
   * @param name Customer name
   * @param phone Optional customer phone
   * @param metadata Optional metadata
   * @returns Promise with customer details
   */
  async createCustomer(
    email: string,
    name: string,
    phone?: string,
    metadata?: Record<string, string>
  ): Promise<ApiResponse<StripeCustomer>> {
    this.validateRequiredParams({ email, name }, ['email', 'name']);
    
    return this.makeRequest<StripeCustomer>(
      'customers',
      'post',
      {
        email,
        name,
        phone,
        metadata
      },
      { 'Authorization': `Bearer ${this.secretKey}` }
    );
  }
  
  /**
   * Create a payment method
   * 
   * @param paymentMethodId Payment method ID from the client
   * @param customerId Stripe customer ID
   * @returns Promise with payment method details
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<ApiResponse<StripePaymentMethod>> {
    this.validateRequiredParams({ paymentMethodId, customerId }, 
      ['paymentMethodId', 'customerId']);
    
    return this.makeRequest<StripePaymentMethod>(
      `payment_methods/${paymentMethodId}/attach`,
      'post',
      {
        customer: customerId
      },
      { 'Authorization': `Bearer ${this.secretKey}` }
    );
  }
}
