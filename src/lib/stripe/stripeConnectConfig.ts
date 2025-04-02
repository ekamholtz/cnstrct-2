
/**
 * Configuration for Stripe Connect integration
 */

export const stripeConnectConfig = {
  // Default account type for new Connect accounts
  defaultAccountType: 'standard',
  
  // Webhook endpoints
  webhookEndpoint: '/api/proxy/stripe/webhook',
  
  // OAuth redirect URI for authorization flow
  oauthRedirectUri: '/api/proxy/stripe/callback',
  
  // Default percentage for transactions
  defaultPlatformFeePercentage: 2.5,
  
  // Minimum fee amount in cents
  minPlatformFeeAmount: 50,
};

/**
 * Calculates the platform fee for a transaction
 * 
 * @param amount - The transaction amount in cents
 * @returns The platform fee in cents
 */
export function calculatePlatformFee(amount: number): number {
  const percentage = stripeConnectConfig.defaultPlatformFeePercentage;
  const calculatedFee = Math.round(amount * (percentage / 100));
  return Math.max(calculatedFee, stripeConnectConfig.minPlatformFeeAmount);
}
