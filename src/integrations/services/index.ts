/**
 * Services Index
 * 
 * This file exports all service classes and interfaces for external use.
 * Import from this file instead of individual service files for a cleaner API.
 */

// Common types and base service
export { BaseApiService } from './BaseApiService';
export type { ApiResponse, ApiServiceConfig } from './BaseApiService';

// QBO Service
export { QboService } from './QboService';
export type { 
  QboServiceConfig, 
  QboTokenResponse, 
  QboCompanyInfo,
  QboCustomer,
  QboInvoice
} from './QboService';

// Stripe Service
export { StripeService } from './StripeService';
export type {
  StripeServiceConfig,
  StripeAccountInfo,
  StripePaymentIntent,
  StripePaymentLink,
  StripeCustomer,
  StripePaymentMethod
} from './StripeService';
