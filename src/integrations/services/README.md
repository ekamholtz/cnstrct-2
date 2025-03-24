# CNSTRCT API Services

This directory contains unified service classes for interacting with external APIs in a consistent, type-safe manner.

## Architecture

The service architecture follows a layered approach:

1. **BaseApiService** - Foundation class with common functionality
2. **Specialized Services** - Implementation for each external API
3. **Unified Error Handling** - Consistent error formatting and reporting
4. **Type Safety** - Full TypeScript definitions for all operations

## Available Services

- **StripeService** - Handles Stripe payments, Connect platform, and financial operations
- **QboService** - Manages QuickBooks Online integration for accounting data

## BaseApiService

The `BaseApiService` provides:

- Unified request handling
- Consistent error reporting
- Required parameter validation
- Configuration management

### Interface

```typescript
interface ApiResponse<T> {
  data: T;          // Response data of the specified type
  success: boolean; // Whether the operation succeeded
  error?: Error;    // Error object if success is false
}
```

## Example Usage

### Stripe Operations

```typescript
import { StripeService } from './StripeService';

// Create instance
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
});

// Create a payment link
const { data, success, error } = await stripeService.createPaymentLink(
  10000, // $100.00
  'usd',
  'Project Payment'
);

if (success) {
  console.log(`Payment link created: ${data.url}`);
} else {
  console.error(`Error: ${error.message}`);
}
```

### QuickBooks Operations

```typescript
import { QboService } from './QboService';

// Create instance
const qboService = new QboService({
  clientId: process.env.QBO_CLIENT_ID || '',
  clientSecret: process.env.QBO_CLIENT_SECRET || ''
});

// Query customers
const { data, success, error } = await qboService.queryCustomers(
  accessToken,
  realmId,
  "SELECT * FROM Customer WHERE Active = true MAXRESULTS 100"
);

if (success) {
  console.log(`Found ${data.QueryResponse.totalCount} customers`);
  // Process customers...
} else {
  console.error(`Error: ${error.message}`);
}
```

## Error Handling

All services provide consistent error handling:

1. API-specific errors are normalized into a standard format
2. Detailed error messages include the original API error
3. Type safety ensures proper error handling in the UI layer
4. Error logging is built in for debugging

## Implementation Guidelines

When extending or modifying these services:

1. Always maintain the `ApiResponse<T>` interface for consistency
2. Validate required parameters using `validateRequiredParams`
3. Use meaningful TypeScript interfaces for all data structures
4. Add JSDoc comments for all public methods
5. Keep configuration and API keys in environment variables

## Integration with React

These services integrate with React components through custom hooks:

```typescript
// Example: Hook for using Stripe payments
function useStripePaymentLink(amount: number, productName: string) {
  const { data, isLoading, error } = useDataFetching(
    ['stripe', 'paymentLink', amount, productName],
    async () => {
      const stripeService = new StripeService({
        secretKey: process.env.STRIPE_SECRET_KEY || '',
      });
      
      const response = await stripeService.createPaymentLink(
        amount,
        'usd',
        productName
      );
      
      if (!response.success) {
        throw response.error;
      }
      
      return response.data;
    }
  );
  
  return { paymentLink: data, isLoading, error };
}
```

This architecture ensures separation of concerns, with API logic isolated from UI components.
