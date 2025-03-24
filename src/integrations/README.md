# CNSTRCT External Integrations

This directory contains integrations with third-party services and APIs used by the CNSTRCT application.

## Overview

The integration system follows a layered architecture:

1. **Services Layer** - Typed API clients for each external service
2. **Unified CORS Proxy** - Handles CORS issues and provides consistent error handling
3. **Authentication** - Token management for each integration
4. **Config** - Environment-specific configuration

## Integration Services

- **Stripe** - Payment processing and Connect platform for general contractors
- **QuickBooks Online (QBO)** - Accounting and financial data integration

## Unified CORS Proxy

All API requests are routed through a unified CORS proxy to avoid CORS issues during local development:

- Located at: `/src/integrations/proxy/unified-cors-proxy.js`
- Handles both Stripe and QBO requests
- Provides consistent error handling
- Simplifies request/response processing

## Common Architecture

All integrations follow the same pattern:

1. **Service Classes** - Typed TypeScript classes with methods for API operations
2. **Base API Service** - Foundation class for common functionality
3. **Auth Management** - Consistent token handling and refresh logic
4. **Error Handling** - Standardized error formats

### Service Structure

```
/integrations
  /services
    BaseApiService.ts           # Foundation service class
    StripeService.ts            # Stripe API operations
    QboService.ts               # QuickBooks Online operations
  /proxy
    unified-cors-proxy.js       # CORS proxy for all services
  /stripe                       # Stripe-specific components
  /qbo                          # QBO-specific components
  README.md                     # This documentation
```

## Getting Started

To use these integrations:

1. Start the CORS proxy: `node src/integrations/proxy/unified-cors-proxy.js`
2. Import the service you need: `import { StripeService } from '@/integrations/services/StripeService'`
3. Create an instance with your configuration
4. Call the appropriate methods

**Example:**

```typescript
import { StripeService } from '@/integrations/services/StripeService';

// Create service instance
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
});

// Use the service
const { data, success, error } = await stripeService.createPaymentLink(
  5000, // $50.00
  'usd',
  'Project Payment',
  connectedAccountId // optional
);

if (success) {
  console.log(`Payment link created: ${data.url}`);
} else {
  console.error(`Error: ${error.message}`);
}
```

## Environment Variables

Required environment variables:

```
# Stripe variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PLATFORM_FEE_PERCENTAGE=2.5
STRIPE_WEBHOOK_SECRET=whsec_...

# QBO variables
QBO_CLIENT_ID=AB...
QBO_CLIENT_SECRET=4z...
```

See service-specific README files for more details on each integration.
