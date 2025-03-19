# QuickBooks Online Integration

This document provides an overview of the QuickBooks Online (QBO) integration in the CNSTRCT project, explaining key concepts, design decisions, and implementation details.

## Architecture Overview

The QBO integration uses a CORS proxy approach to overcome cross-origin restrictions when working with the QuickBooks API. This approach involves:

1. A client-side component that handles user interactions and API requests
2. A proxy layer that handles all communication with QuickBooks Online APIs
3. A database layer (Supabase) that stores connection information and tokens

### Key Components

- **Configuration (`qboConfig.ts`)**: Singleton that provides consistent configuration across the application
- **Token Manager (`qboTokenManager.ts`)**: Handles token exchange, refresh, and storage
- **Authorization Service (`AuthorizationService.ts`)**: Manages the OAuth flow and authorization process
- **Base Service Proxy (`BaseQBOServiceProxy.ts`)**: Base class for all QBO service proxies
- **API Client Factory (`APIClientFactory.ts`)**: Creates authenticated API clients for QBO
- **Connection Service (`qboConnectionService.ts`)**: Manages QBO connections in the database
- **Serverless Functions (`/api/proxy/`)**: Handle token exchange, refresh, and data operations in production

## Authentication Flow

1. User initiates QBO authorization via `AuthorizationService.initiateAuth()`
2. User is redirected to Intuit's authorization page
3. After authorization, Intuit redirects back to the application with an authorization code
4. The application exchanges the code for tokens using `QBOTokenManager.exchangeCodeForTokens()`
5. Tokens are stored in the database with company information
6. Subsequent API requests use the stored tokens, refreshing them when necessary

## CORS Proxy Approach

Due to CORS restrictions, the application cannot directly call the QuickBooks API from the browser. Instead:

- In development: Requests go through a local CORS proxy server at http://localhost:3030/proxy
- In production: Requests go through Vercel serverless functions at /api/proxy/*

The proxy handles:
- Token exchange
- Token refresh
- Data operations

## Environment Detection

The application detects the environment to determine which configuration to use:

```typescript
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isProduction = hostname !== 'localhost' && !hostname.includes('127.0.0.1');
```

## Making API Requests

All API requests follow this pattern:

```typescript
const response = await axios.post(`${proxyUrl}/data-operation`, {
  accessToken: connection.access_token,
  realmId: connection.company_id,
  endpoint: "customer", // or other entity type
  method: "post", // or get, patch, etc.
  data: entityData
});
```

## Security Considerations

- Client secrets are never exposed in the client-side code
- SSL verification is only disabled in local development
- CSRF protection is implemented in the OAuth flow using a state parameter
- All sensitive operations are handled by the proxy layer

## Connection Management

Connections are stored in the `qbo_connections` table with the following information:
- User ID
- Company ID
- Access token
- Refresh token
- Expiration times
- Company information

## Troubleshooting

### Common Issues:

1. **Invalid Grant Error**: Usually caused by a mismatch between the redirect URI used in the authorization flow and the one registered in the Intuit Developer Portal.

2. **Token Refresh Failures**: Check if refresh tokens have expired (they last for 100 days). If so, the user needs to re-authenticate.

3. **CORS Issues**: Ensure all requests go through the appropriate proxy URL based on the environment.

4. **API Call Failures**: Verify the correct formatting of API requests through the proxy, ensuring all required parameters are provided.

## Development Guidelines

1. Always use the singleton instance of `QBOConfig` for consistent configuration
2. Route all API requests through the proxy layer to avoid CORS issues
3. Implement proper error handling and logging
4. Use the dynamic proxy URL selection logic to support both development and production environments
5. Ensure sensitive credentials are only handled server-side

## Production Deployment

The production environment uses Vercel serverless functions to handle proxy operations. The functions are configured in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/proxy/token",
      "destination": "/api/proxy/token.js"
    },
    {
      "source": "/api/proxy/refresh",
      "destination": "/api/proxy/refresh.js"
    },
    {
      "source": "/api/proxy/data-operation",
      "destination": "/api/proxy/data-operation.js"
    },
    {
      "source": "/api/proxy/test-connection",
      "destination": "/api/proxy/test-connection.js"
    }
  ]
}
```
