
import { supabase } from '@/integrations/supabase/client';

interface StripeServiceConfig {
  secretKey?: string;
}

interface StripeResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
}

export class StripeService {
  private config: StripeServiceConfig;
  
  constructor(config: StripeServiceConfig = {}) {
    this.config = config;
  }
  
  /**
   * Creates a payment link for an invoice
   */
  async createPaymentLink(
    userId: string,
    amount: number,
    description: string,
    metadata: Record<string, string> = {},
    customerEmail?: string,
    customerName?: string
  ): Promise<StripeResponse<{ id: string; url: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'create-payment-link',
          userId,
          amount,
          description,
          metadata,
          customerEmail,
          customerName,
          currency: 'usd'
        }
      });
      
      if (error) {
        return {
          success: false,
          error: {
            message: error.message || 'Failed to create payment link',
            code: error.code
          }
        };
      }
      
      if (!data.success) {
        return {
          success: false,
          error: {
            message: data.error || 'Unknown error creating payment link'
          }
        };
      }
      
      return {
        success: true,
        data: {
          id: data.paymentLink.id,
          url: data.paymentLink.url
        }
      };
    } catch (err: any) {
      console.error('Error creating payment link:', err);
      return {
        success: false,
        error: {
          message: err.message || 'Error creating payment link'
        }
      };
    }
  }
  
  /**
   * Gets account information
   */
  async getConnectAccount(accountId?: string): Promise<StripeResponse<{
    id: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  }>> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'get-account',
          accountId
        }
      });
      
      if (error) {
        return {
          success: false,
          error: {
            message: error.message || 'Failed to get account information',
            code: error.code
          }
        };
      }
      
      if (!data.success || !data.account) {
        return {
          success: false,
          error: {
            message: data.error || 'Account not found'
          }
        };
      }
      
      return {
        success: true,
        data: {
          id: data.account.accountId,
          chargesEnabled: data.account.chargesEnabled,
          payoutsEnabled: data.account.payoutsEnabled,
          detailsSubmitted: data.account.detailsSubmitted
        }
      };
    } catch (err: any) {
      console.error('Error getting connect account:', err);
      return {
        success: false,
        error: {
          message: err.message || 'Error getting account information'
        }
      };
    }
  }
  
  /**
   * Creates a connected account
   */
  async createConnectAccount(
    email: string,
    country: string,
    type: 'standard' | 'express' | 'custom' = 'express'
  ): Promise<StripeResponse<{ id: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'create-account',
          email,
          country,
          type
        }
      });
      
      if (error) {
        return {
          success: false,
          error: {
            message: error.message || 'Failed to create connected account',
            code: error.code
          }
        };
      }
      
      if (!data.success) {
        return {
          success: false,
          error: {
            message: data.error || 'Unknown error creating connected account'
          }
        };
      }
      
      return {
        success: true,
        data: {
          id: data.account.id
        }
      };
    } catch (err: any) {
      console.error('Error creating connected account:', err);
      return {
        success: false,
        error: {
          message: err.message || 'Error creating connected account'
        }
      };
    }
  }
  
  /**
   * Creates an account link for onboarding
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<StripeResponse<{ url: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: {
          action: 'create-account-link',
          accountId,
          refreshUrl,
          returnUrl
        }
      });
      
      if (error) {
        return {
          success: false,
          error: {
            message: error.message || 'Failed to create account link',
            code: error.code
          }
        };
      }
      
      if (!data.url) {
        return {
          success: false,
          error: {
            message: 'No URL returned for account link'
          }
        };
      }
      
      return {
        success: true,
        data: {
          url: data.url
        }
      };
    } catch (err: any) {
      console.error('Error creating account link:', err);
      return {
        success: false,
        error: {
          message: err.message || 'Error creating account link'
        }
      };
    }
  }
  
  /**
   * Creates a checkout session
   */
  async createCheckoutSession(
    userId: string,
    amount: number,
    description: string,
    metadata: Record<string, string> = {},
    customerEmail?: string
  ): Promise<StripeResponse<{ id: string; url: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'create-checkout-session',
          userId,
          amount,
          description,
          metadata,
          customerEmail,
          currency: 'usd'
        }
      });
      
      if (error) {
        return {
          success: false,
          error: {
            message: error.message || 'Failed to create checkout session',
            code: error.code
          }
        };
      }
      
      if (!data.success) {
        return {
          success: false,
          error: {
            message: data.error || 'Unknown error creating checkout session'
          }
        };
      }
      
      return {
        success: true,
        data: {
          id: data.checkoutSession.id,
          url: data.checkoutSession.url
        }
      };
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      return {
        success: false,
        error: {
          message: err.message || 'Error creating checkout session'
        }
      };
    }
  }
}
