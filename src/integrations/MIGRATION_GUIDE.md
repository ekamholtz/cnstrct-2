# Migration Guide: Legacy to Unified API Services

This guide provides step-by-step instructions for migrating from the legacy service implementations to the new unified API service architecture for both QuickBooks Online (QBO) and Stripe integrations.

## Overview of Changes

| Legacy Component | New Component | Notes |
|-----------------|---------------|-------|
| `qbo/proxy/cors-proxy.js` | `proxy/unified-cors-proxy.js` | Combined proxy for all external services |
| QBO direct API calls | `QboService` | Centralized service with error handling |
| Stripe direct API calls | `StripeService` | Centralized service with error handling |
| Direct axios calls | `useDataFetching` hook | React Query-based data fetching |

## Migration Steps

### 1. Update Proxy URLs

**Legacy:**
```javascript
const proxyUrl = 'http://localhost:3031/proxy/token';
```

**New:**
```javascript
const proxyUrl = 'http://localhost:3030/proxy/qbo/token';
```

For Stripe:
```javascript
const proxyUrl = 'http://localhost:3030/proxy/stripe';
```

### 2. Replace Direct API Calls

#### QBO Integration

**Legacy:**
```typescript
const response = await axios.post(`${proxyUrl}/company-info`, {
  accessToken,
  realmId,
  endpoint: 'customer'
});
```

**New:**
```typescript
import { QboService } from '@/integrations/services/QboService';

const qboService = new QboService({
  clientId: process.env.QBO_CLIENT_ID || '',
  clientSecret: process.env.QBO_CLIENT_SECRET || ''
});

const { data, success, error } = await qboService.queryCustomers(
  accessToken,
  realmId,
  "SELECT * FROM Customer WHERE Active = true MAXRESULTS 100"
);

if (success) {
  // Process data
} else {
  // Handle error
}
```

#### Stripe Integration

**Legacy:**
```typescript
const response = await axios.post(`${proxyUrl}/request`, {
  accessToken: secretKey,
  endpoint: 'payment_intents',
  method: 'post',
  data: {
    amount,
    currency
  }
});
```

**New:**
```typescript
import { StripeService } from '@/integrations/services/StripeService';

const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY || ''
});

const { data, success, error } = await stripeService.createPaymentIntent(
  amount,
  currency
);

if (success) {
  // Process data
} else {
  // Handle error
}
```

### 3. React Component Integration

**Legacy:**
```typescript
// Using local state and direct API calls
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('...');
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchData();
}, []);
```

**New:**
```typescript
// Using the useDataFetching hook
import { useDataFetching } from '@/hooks/useDataFetching';
import { StripeService } from '@/integrations/services/StripeService';

const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY || ''
});

const { data, isLoading, error } = useDataFetching(
  ['payments'],
  async () => {
    const response = await stripeService.listPaymentIntents();
    if (!response.success) {
      throw response.error;
    }
    return response.data;
  }
);
```

## Testing the Migration

1. Start the unified proxy in a terminal:
   ```
   cd src/integrations/proxy
   node unified-cors-proxy.js
   ```

2. Test each migrated component/feature directly in the browser

3. Verify logs in the proxy terminal to ensure requests are being processed correctly

## Common Migration Issues

### 1. Authentication Issues

If you encounter authentication errors:
- Verify you're passing the correct access token
- Check that token refresh is working with the new proxy

### 2. Missing Response Data

If response data doesn't match expectations:
- Check the service method implementation in the respective service class
- Verify the response structure matches what the component expects

### 3. Error Handling Differences

The new architecture uses a standardized response format:
```typescript
{
  data: T;        // The actual response data
  success: true;  // Always true for successful responses
}

// Or for errors:
{
  error: Error;   // Error object with message property
  success: false; // Always false for error responses
}
```

If your component assumes a different error format, it will need to be updated.

## Verifying the Migration

After migrating a component:

1. Test all functionality thoroughly
2. Check for any console errors
3. Verify that requests appear in the unified proxy logs
4. Test error scenarios by temporarily:
   - Disconnecting from the internet
   - Using invalid credentials
   - Using an invalid endpoint

## Legacy Code Removal Plan

Once all components have been migrated, the following files can be safely removed:

- `src/integrations/qbo/proxy/cors-proxy.js`
- Legacy service proxy implementations in `src/integrations/qbo/services/*ServiceProxy.ts` 
- Legacy service proxy implementations in `src/integrations/stripe/services/*ServiceProxy.ts`
- Direct API call implementations that have been replaced by the unified services

## Need Help?

Refer to the README files in each integration directory for detailed information:

- `src/integrations/README.md` - Overview of the integration architecture
- `src/integrations/qbo/README.md` - QBO-specific information
- `src/integrations/stripe/README.md` - Stripe-specific information
- `src/integrations/services/README.md` - Service layer documentation
