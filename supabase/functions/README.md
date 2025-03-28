# Supabase Edge Functions for Stripe Integration

This directory contains Supabase Edge Functions that handle Stripe and Stripe Connect operations securely on the server side, eliminating the need for a separate CORS proxy.

## Benefits of Edge Functions

1. **Improved Security**: Secret keys stay on the server side and are never exposed to the client.
2. **Simplified Architecture**: No need to maintain a separate CORS proxy server.
3. **Better Reliability**: Eliminates CORS issues and provides consistent behavior across environments.
4. **Easier Deployment**: Functions are deployed alongside your Supabase project.

## Available Functions

### 1. `stripe-connect`

Handles Stripe Connect account creation and management:

- Initiating OAuth flow
- Processing OAuth callbacks
- Creating account links for onboarding
- Retrieving connected account details

### 2. `stripe-payment`

Manages payment-related operations:

- Creating payment links
- Setting up checkout sessions
- Listing and retrieving payment link details
- Managing platform fees

### 3. `stripe-webhook`

Processes Stripe webhook events:

- Account updates
- Successful payments
- Failed payments
- Other Stripe events

## Local Development

To run these functions locally:

1. Install Supabase CLI (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. Start the local development server
   ```bash
   supabase start
   ```

3. Run functions locally
   ```bash
   supabase functions serve
   ```

## Environment Variables

Create a `.env` file in each function directory with the following variables:

```
# Stripe API credentials
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_CLIENT_ID=ca_your_client_id
STRIPE_PLATFORM_FEE_PERCENTAGE=0.025
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase connection details
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend URL for redirects
FRONTEND_URL=http://localhost:8080
```

## Deployment

Deploy your Edge Functions to Supabase:

```bash
supabase functions deploy stripe-connect
supabase functions deploy stripe-payment
supabase functions deploy stripe-webhook
```

Set the secrets in your Supabase project:

```bash
supabase secrets set --env-file ./supabase/functions/stripe-connect/.env
```

## Updating the Frontend

The frontend services have been updated to use these Edge Functions instead of the CORS proxy. The main changes are:

1. Added `callEdgeFunction` helper to make authenticated requests to Edge Functions
2. Updated service methods to call the Edge Functions with the appropriate actions
3. Removed direct Stripe API calls through the CORS proxy

## Testing

After deploying the Edge Functions, you can test them by:

1. Navigating to the Payment Settings page
2. Clicking "Connect with Stripe" to initiate the OAuth flow
3. Creating payment links for connected accounts
4. Processing test payments

## Security Considerations

- All Edge Functions validate JWT tokens from authenticated users
- API keys are stored as environment variables and never exposed to clients
- Appropriate database security policies ensure users can only access their own data
