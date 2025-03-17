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
      return res.status(400).json({ error: 'Missing Supabase URL' });
    }

    console.log(`Supabase API request: ${method?.toUpperCase() || 'POST'} ${url}`);

    // Make the request to Supabase
    const response = await axios({
      url,
      method: method || 'post',
      headers: headers || {},
      data: data || {},
      validateStatus: () => true // Don't throw on error status codes
    });

    // Return the response from Supabase
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error in Supabase proxy:', error.message);
    
    // Return error details
    return res.status(500).json({
      error: 'Supabase proxy error',
      message: error.message,
      details: error.response?.data || {}
    });
  }
};

// Export the handler function
export { handleSupabaseRequest };
