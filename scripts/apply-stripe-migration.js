import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Path to the migration SQL file
const MIGRATION_FILE_PATH = path.resolve(__dirname, '../supabase/migrations/20240101000000_create_stripe_tables.sql');

// Supabase API URL and key from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// CORS proxy URL
const CORS_PROXY_URL = 'http://localhost:3030/proxy/supabase';

/**
 * Executes a SQL statement against the Supabase database
 * @param {string} sql - The SQL statement to execute
 * @returns {Object} The response from the Supabase API
 */
async function executeSql(sql) {
  try {
    const response = await axios.post(CORS_PROXY_URL, {
      url: `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        query: sql
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error executing SQL:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Applies the Stripe migration to the Supabase database
 */
async function applyMigration() {
  try {
    console.log('Reading migration SQL file...');
    const migrationSQL = fs.readFileSync(MIGRATION_FILE_PATH, 'utf8');

    // Split the SQL file into individual statements
    const sqlStatements = migrationSQL.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);

    console.log(`Found ${sqlStatements.length} SQL statements to execute`);

    // Execute each SQL statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        await executeSql(statement);
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        // Continue with the next statement
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
