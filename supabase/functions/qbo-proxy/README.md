# QBO Proxy Edge Function

This Supabase Edge Function provides a secure server-side proxy for QuickBooks Online (QBO) API interactions, replacing the previous CORS proxy approach.

## Features

- **OAuth Flow**: Handles the complete OAuth 2.0 flow for QBO integration
- **Token Management**: Securely stores and refreshes access tokens
- **API Proxying**: Proxies API requests to QBO with proper authentication
- **Security**: Keeps sensitive credentials server-side

## Endpoints

The Edge Function exposes several endpoints:

- `/qbo-proxy/ping`: Test endpoint to verify the function is running
- `/qbo-proxy/auth`: Generate an authorization URL for QBO OAuth flow
- `/qbo-proxy/token`: Exchange authorization code for tokens
- `/qbo-proxy/refresh`: Refresh an expired access token
- `/qbo-proxy/test-connection`: Test the connection to QBO
- `/qbo-proxy/proxy`: Proxy API requests to QBO
- `/qbo-proxy/disconnect`: Disconnect from QBO

## Required Environment Variables

The following environment variables must be set in your Supabase project:

- `QBO_CLIENT_ID`: Your QuickBooks Online client ID
- `QBO_CLIENT_SECRET`: Your QuickBooks Online client secret
- `SUPABASE_URL`: Your Supabase project URL (set automatically)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (set automatically)

## Required Database Tables

The function requires the following database tables:

1. `qbo_connections`: Stores QBO connection details
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `company_id`: TEXT (QBO company ID)
   - `company_name`: TEXT
   - `access_token`: TEXT
   - `refresh_token`: TEXT
   - `expires_at`: TIMESTAMP WITH TIME ZONE
   - `refresh_token_expires_at`: TIMESTAMP WITH TIME ZONE
   - `created_at`: TIMESTAMP WITH TIME ZONE
   - `updated_at`: TIMESTAMP WITH TIME ZONE

2. `qbo_auth_states`: Stores OAuth state parameters
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `state`: TEXT (unique)
   - `expires_at`: TIMESTAMP WITH TIME ZONE
   - `created_at`: TIMESTAMP WITH TIME ZONE

## Deployment

Deploy this function to your Supabase project using the Supabase CLI:

```bash
supabase functions deploy qbo-proxy
```

## Local Development

For local development, you can run the function using the Supabase CLI:

```bash
supabase start
supabase functions serve qbo-proxy
```

Make sure to set the required environment variables in your local `.env` file.
