import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Handles Supabase API requests through the CORS proxy
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const handleSupabaseRequest = async (req, res) => {
  try {
    const { url, method, headers, data } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Missing method' });
    }

    console.log(`Supabase API request: ${method.toUpperCase()} ${url}`);

    // Make the request to Supabase
    try {
      const response = await axios({
        url,
        method,
        headers,
        data,
        // Disable SSL verification for local development
        httpsAgent: new (await import('https')).Agent({
          rejectUnauthorized: false
        })
      });

      return res.json(response.data);
    } catch (error) {
      console.error('Supabase API error:', error);
      return res.status(500).json({
        error: 'Supabase proxy error',
        message: error.message,
        details: error.response?.data || {}
      });
    }
  } catch (error) {
    console.error('Supabase proxy handler error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default handleSupabaseRequest;
