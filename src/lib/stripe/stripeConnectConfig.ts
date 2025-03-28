
/**
 * Stripe Connect Configuration
 * Provides configuration settings and utilities for Stripe Connect integration
 */

import { env } from '@/lib/env';

export const STRIPE_API_VERSION = '2023-10-16';

// Stripe Connect account types
export type StripeConnectAccountType = 'standard' | 'express' | 'custom';

// Default Stripe Connect configuration
export const stripeConnectConfig = {
  // We're using Express accounts for a balance between simplicity and customization
  defaultAccountType: 'express' as StripeConnectAccountType,
  
  // Platform fee percentage taken on each payment (can be adjusted)
  platformFeePercentage: 0.025, // 2.5%
  
  // Stripe Connect onboarding configuration
  onboarding: {
    // Capabilities that will be requested during onboarding
    capabilities: ['card_payments', 'transfers'],
    
    // Business types allowed
    businessTypes: ['company', 'individual'],
  },
  
  // Webhook configuration
  webhooks: {
    // Webhook signing secret (should be stored in environment variables)
    signingSecret: env.STRIPE_WEBHOOK_SECRET,
    
    // Webhook events to listen for
    events: [
      'account.updated',
      'account.application.deauthorized',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'checkout.session.completed'
    ],
  }
};

/**
 * Generates a platform fee amount in cents based on the invoice amount
 * @param amount - The invoice amount in cents
 * @returns The platform fee amount in cents
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * stripeConnectConfig.platformFeePercentage);
}

/**
 * Formats a monetary value for display
 * @param amount - The amount in cents
 * @param currency - The currency code (default: 'usd')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Returns the Stripe dashboard URL for a connected account
 * @param accountId - The Stripe account ID
 * @returns The dashboard URL
 */
export function getConnectDashboardUrl(accountId: string): string {
  return `https://dashboard.stripe.com/${accountId}`;
}

/**
 * Returns the Express dashboard login URL (for logged-in access to connected account)
 * @param accountId - The Stripe account ID
 * @returns The Express dashboard login URL
 */
export function getExpressDashboardLoginUrl(accountId: string): string {
  return `/api/stripe/create-login-link?accountId=${accountId}`;
}
