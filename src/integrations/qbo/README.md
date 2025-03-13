# QuickBooks Online Integration Guide

## Overview

This integration allows CNSTRCT to connect with QuickBooks Online for financial data synchronization. The implementation uses OAuth 2.0 for authentication and a local CORS proxy to handle token exchanges during development.

## Setup Instructions

### 1. Start the CORS Proxy

The integration uses a local CORS proxy to bypass browser CORS restrictions when exchanging tokens with QuickBooks API:

```bash
# Navigate to the proxy directory
cd src/integrations/qbo/proxy

# Install dependencies (first time only)
npm install

# Start the proxy
npm start
```

The proxy will run on http://localhost:3031 and handle token exchanges and refreshes.

### 2. QuickBooks Developer Settings

Ensure your QuickBooks Developer app settings match the following:

- **Redirect URI**: `http://localhost:8080/qbo/callback` (for local development)
- **OAuth Scopes**: `com.intuit.quickbooks.accounting`

### 3. Environment Variables

The integration uses the following credentials:

- **Client ID**: `AB6pN0pnXfsEqiCl1S03SYSdoRISCVD2ZQDxDgR4yYvbDdEx4j`
- **Client Secret**: `4zjveAX4tFhuxWx1sfgN3bE4zRVUquuFun3YqVau`

## How It Works

1. **Authorization Flow**:
   - User initiates connection from Settings page
   - User is redirected to QuickBooks for authorization
   - After approval, QuickBooks redirects back to our callback URL
   - The callback component processes the authorization code
   - Tokens are exchanged via CORS proxy and stored in the database

2. **Token Management**:
   - Access tokens expire after 1 hour
   - Refresh tokens are used to obtain new access tokens
   - The token manager handles automatic refreshing when needed

3. **Database Storage**:
   - Connection details are stored in the `qbo_connections` table
   - Each user can have one QuickBooks connection

## Troubleshooting

If you encounter issues with the QuickBooks integration:

1. **CORS Errors**: Make sure the CORS proxy is running
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
