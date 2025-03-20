/**
 * Stripe Connect General API Request Proxy
 * Serverless function to make any Stripe API request with proper authentication
 */

import Stripe from 'stripe';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { endpoint, method, accountId, accessToken, data } = req.body;
    
    console.log(`Stripe API request: ${method} ${endpoint}`);
    
    // Validate required parameters
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing required parameter: endpoint' });
    }
    
    if (!method) {
      return res.status(400).json({ error: 'Missing required parameter: method' });
    }
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Missing required parameter: accessToken' });
    }
    
    // Initialize Stripe with the access token
    const stripe = new Stripe(accessToken, {
      apiVersion: '2023-10-16',
    });
    
    // Set the Stripe-Account header for Connect
    const requestOptions = accountId ? { stripeAccount: accountId } : undefined;
    
    // Parse the endpoint to determine which Stripe API resource to use
    const [resource, ...pathParts] = endpoint.split('/');
    const resourceId = pathParts.length > 0 ? pathParts[0] : undefined;
    const nestedResource = pathParts.length > 1 ? pathParts[1] : undefined;
    
    console.log(`Resource: ${resource}, ID: ${resourceId || 'none'}, Nested: ${nestedResource || 'none'}`);
    
    // Handle the request based on the method and resource
    let result;
    
    // Make sure the resource exists on the Stripe object
    if (!stripe[resource]) {
      return res.status(400).json({ error: `Invalid Stripe resource: ${resource}` });
    }
    
    switch (method.toLowerCase()) {
      case 'get':
        if (resourceId) {
          if (nestedResource && stripe[resource][nestedResource]) {
            // GET /resource/:id/nested
            result = await stripe[resource][nestedResource].list(resourceId, data, requestOptions);
          } else {
            // GET /resource/:id
            result = await stripe[resource].retrieve(resourceId, requestOptions);
          }
        } else {
          // GET /resource
          result = await stripe[resource].list(data, requestOptions);
        }
        break;
        
      case 'post':
        if (resourceId) {
          if (nestedResource && stripe[resource][nestedResource]) {
            // POST /resource/:id/nested
            result = await stripe[resource][nestedResource].create(resourceId, data, requestOptions);
          } else {
            // POST /resource/:id (update)
            result = await stripe[resource].update(resourceId, data, requestOptions);
          }
        } else {
          // POST /resource (create)
          result = await stripe[resource].create(data, requestOptions);
        }
        break;
        
      case 'put':
        // PUT is treated as update in Stripe API
        if (!resourceId) {
          return res.status(400).json({ error: 'Resource ID is required for PUT requests' });
        }
        
        result = await stripe[resource].update(resourceId, data, requestOptions);
        break;
        
      case 'delete':
        if (!resourceId) {
          return res.status(400).json({ error: 'Resource ID is required for DELETE requests' });
        }
        
        result = await stripe[resource].del(resourceId, requestOptions);
        break;
        
      default:
        return res.status(400).json({ error: `Unsupported method: ${method}` });
    }
    
    console.log(`Stripe API request successful: ${method} ${endpoint}`);
    
    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error making Stripe API request:', error);
    
    // Format the error response
    const errorMessage = error.message || 'Unknown error';
    const errorResponse = {
      error: errorMessage,
      error_description: error.type || 'server_error',
      code: error.code || 'unknown',
      statusCode: error.statusCode || 500
    };
    
    return res.status(error.statusCode || 500).json(errorResponse);
  }
}
