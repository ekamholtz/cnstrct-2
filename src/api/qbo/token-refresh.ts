
import axios from 'axios';

/**
 * Handler for QuickBooks Online token refresh
 * This avoids CORS issues that might occur with client-side requests
 */
export async function handleTokenRefresh(req: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  try {
    const { refreshToken, clientId, clientSecret } = req;

    // Validate required parameters
    if (!refreshToken || !clientId || !clientSecret) {
      return { 
        error: 'Missing required parameters',
        missingParams: Object.entries({ refreshToken, clientId, clientSecret })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      };
    }

    // Prepare the request to QuickBooks
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    // Create the authorization header
    const authString = `${clientId}:${clientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    // Make the token refresh request to QuickBooks
    const tokenResponse = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    // Return the token response
    return tokenResponse.data;
  } catch (error: any) {
    console.error('Error in QBO token refresh:', error);
    
    // Provide detailed error information
    if (error.response) {
      return {
        error: 'QuickBooks API error',
        details: error.response.data,
        status: error.response.status
      };
    }
    
    return {
      error: 'Internal server error',
      message: error.message
    };
  }
}
