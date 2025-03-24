# QuickBooks Online Integration Guide

## Overview

This integration allows CNSTRCT to connect with QuickBooks Online for financial data synchronization. The implementation uses OAuth 2.0 for authentication and a unified CORS proxy to handle token exchanges and API communications.

## Architecture

The QBO integration uses the following components:

1. **QboService** - A unified service that handles all QBO API operations
2. **Unified CORS Proxy** - Routes requests through a common proxy to avoid CORS issues
3. **Supabase Database** - Stores connection and financial data

## Setup Instructions

### 1. Start the Unified CORS Proxy

The integration now uses a unified CORS proxy that handles both QBO and Stripe API requests:

```bash
# Navigate to the proxy directory
cd src/integrations/proxy

# Install dependencies (first time only)
npm install

# Start the proxy
node unified-cors-proxy.js
```

The proxy will run on http://localhost:3030 and handle all external API requests.

### 2. QuickBooks Developer Settings

Ensure your QuickBooks Developer app settings match the following:

- **Redirect URI**: `http://localhost:8080/qbo/callback` (for local development)
- **OAuth Scopes**: `com.intuit.quickbooks.accounting`

### 3. Environment Variables

The integration uses the following credentials:

- **Client ID**: `AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j`
- **Client Secret**: `4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau`

## CORS Proxy Pattern

QBO API requests are now routed through these unified endpoints:

- **Token Exchange**: `http://localhost:3030/proxy/qbo/token`
- **Token Refresh**: `http://localhost:3030/proxy/qbo/refresh`
- **Data Operations**: `http://localhost:3030/proxy/qbo/data-operation`

Request structure for data operations:

```typescript
// Request body structure
{
  accessToken: string;   // QBO access token
  realmId: string;       // QBO company ID
  endpoint: string;      // QBO API endpoint
  method: string;        // HTTP method (get, post, put, delete)
  data?: any;            // Any data required for the request
}
```

## Service Layer

The new service layer provides a type-safe interface for QBO operations:

```typescript
import { QboService } from '@/integrations/services/QboService';

// Create service instance
const qboService = new QboService({
  clientId: process.env.QBO_CLIENT_ID || 'AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j',
  clientSecret: process.env.QBO_CLIENT_SECRET || '4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau'
});

// Use the service for token exchange
const { data, success, error } = await qboService.exchangeCodeForToken(
  authCode,
  redirectUri
);

if (success) {
  // Store tokens in database
  await saveTokensToDatabase(data.access_token, data.refresh_token, realmId);
} else {
  console.error(`Error: ${error.message}`);
}

// Query customers
const customersResponse = await qboService.queryCustomers(
  accessToken,
  realmId,
  "SELECT * FROM Customer WHERE Active = true MAXRESULTS 100"
);
```

## How It Works

1. **Authorization Flow**:
   - User initiates connection from Settings page
   - User is redirected to QuickBooks for authorization
   - After approval, QuickBooks redirects back to our callback URL
   - The callback component processes the authorization code
   - Tokens are exchanged via the unified CORS proxy and stored in the database

2. **Token Management**:
   - Access tokens expire after 1 hour
   - Refresh tokens are used to obtain new access tokens
   - The token manager handles automatic refreshing when needed

3. **Database Storage**:
   - Connection details are stored in the `qbo_connections` table
   - Each user can have one QuickBooks connection

## Troubleshooting

If you encounter issues with the QuickBooks integration:

1. **CORS Errors**: Make sure the unified CORS proxy is running
2. **Authorization Failures**: Verify that the redirect URI matches exactly
3. **Token Exchange Errors**: Check the browser console and proxy logs for details
4. **Session Issues**: The integration includes session restoration logic to handle lost sessions

## Production Deployment

For production, you'll need to:

1. Deploy a server-side proxy or API endpoint to handle token exchanges
2. Update the redirect URI in both the code and QuickBooks Developer Portal
3. Store credentials securely using environment variables

## Database Schema

The integration uses the following tables:

- `qbo_connections`: Stores connection details and tokens
- `qbo_references`: Maps CNSTRCT entities to QuickBooks entities
- `qbo_sync_logs`: Tracks synchronization activities and errors
