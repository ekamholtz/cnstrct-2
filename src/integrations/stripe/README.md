# Stripe Integration

This directory contains the Stripe payment processing integration for the CNSTRCT application.

## Architecture

The Stripe integration uses the following components:

1. **StripeService** - A unified service that handles all Stripe API operations
2. **CORS Proxy** - Routes requests through a proxy to avoid CORS issues
3. **Supabase Database** - Stores account and payment data

### Core Services

As documented in the codebase, the Stripe integration is built around three core services:

1. **StripeConnectService** - Account creation and management for general contractors
2. **StripePaymentService** - Payment intents and payment links generation
3. **StripeWebhookService** - Processing webhook events from Stripe

These service classes are now unified under a common `StripeService` class using the BaseApiService pattern for consistent error handling and request processing.

### Database Structure

The Stripe data is stored in Supabase with the following tables:

- **stripe_connect_accounts** - Stores connected account information
- **payment_links** - Stores payment link details
- **payment_records** - Stores payment transaction records

### UI Components

Key React components for Stripe integration:

- **StripeConnectOnboarding.tsx** - Onboarding flow for general contractors
- **CreatePaymentLink.tsx** - Interface for creating payment links
- **PaymentHistory.tsx** - Displays payment history
- **PaymentSettings.tsx** - Central hub for Stripe settings

## CORS Proxy Pattern

All Stripe API requests go through the CORS proxy at `http://localhost:3030/proxy/stripe` with the following structure:

```typescript
// Request body structure
{
  accessToken: string; // The Stripe secret key
  endpoint: string;    // The Stripe API endpoint (e.g., "customers", "accounts")
  method: string;      // The HTTP method (e.g., "get", "post")
  data?: any;          // Any data required for the request
  accountId?: string;  // Optional Stripe Connect account ID
}
```

This ensures consistent API access across the application while avoiding CORS issues.

## Environment Variables

Required environment variables:

```
# Stripe variables
STRIPE_SECRET_KEY=sk_test_... # Platform's secret API key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Platform's publishable key
STRIPE_PLATFORM_FEE_PERCENTAGE=2.5 # Fee percentage (default 2.5%)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret for verifying webhook events
```

## Integration Features

The Stripe integration supports:

1. **Stripe Connect** - For general contractors to receive payments
2. **Payment Links** - Generate shareable payment links
3. **Payment Intents** - Direct payment processing
4. **Webhooks** - Real-time event handling

### Stripe Connect

The application uses Stripe Connect Express accounts for general contractors. This provides:

- Simplified onboarding process
- Control over the payment experience
- Platform fee capability (default 2.5%)

### Example Usage

```typescript
import { StripeService } from '@/integrations/services/StripeService';

// Create service instance
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
});

// Create a Connect account
const { data: account } = await stripeService.createConnectAccount(
  'contractor@example.com',
  'US',
  'individual'
);

// Create an account link for onboarding
const { data: link } = await stripeService.createAccountLink(
  account.id,
  'https://cnstrct.app/onboarding/refresh',
  'https://cnstrct.app/onboarding/complete'
);

// Create a payment link for the Connect account
const { data: paymentLink } = await stripeService.createPaymentLink(
  10000, // $100.00
  'usd',
  'Project Payment',
  account.id,
  { project_id: 'proj_123' }
);
```
