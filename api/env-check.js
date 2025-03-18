// Environment Variable Check for Vercel
// This endpoint will safely check if environment variables are set without exposing their values

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    QBO_PROD_CLIENT_ID: process.env.QBO_PROD_CLIENT_ID ? 'set' : 'not set',
    QBO_PROD_CLIENT_SECRET: process.env.QBO_PROD_CLIENT_SECRET ? 'set' : 'not set',
    QBO_SANDBOX_CLIENT_ID: process.env.QBO_SANDBOX_CLIENT_ID ? 'set' : 'not set',
    QBO_SANDBOX_CLIENT_SECRET: process.env.QBO_SANDBOX_CLIENT_SECRET ? 'set' : 'not set'
  };

  // Return the environment status
  return res.status(200).json({
    message: 'Environment variable status',
    status: envStatus
  });
}
