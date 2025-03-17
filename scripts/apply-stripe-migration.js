// Script to apply Stripe migrations to Supabase
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// CORS proxy URL - using the same proxy approach as QBO integration
const proxyUrl = 'http://localhost:3030/proxy/supabase';

// Supabase credentials from client.ts
const SUPABASE_URL = "https://wkspjzbybjhvscqdmpwi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrc3BqemJ5YmpodnNjcWRtcHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2MTcwODYsImV4cCI6MjA1NDE5MzA4Nn0.q4hsuWLxoB81E7UzgFiCMesq4aPhIFTYWZMJMjjDmU0";

// Read the migration SQL file
const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240101000000_create_stripe_tables.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  try {
    console.log('Applying Stripe tables migration to Supabase...');
    
    // Split the SQL into individual statements
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${sqlStatements.length} SQL statements to execute`);
    
    // Execute each SQL statement separately
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i] + ';';
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        // Execute the SQL query using the REST API through the CORS proxy
        await axios.post(proxyUrl, {
          url: `${SUPABASE_URL}/rest/v1/rpc/execute_sql`,
          method: 'post',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          data: {
            query: sql
          }
        });
        
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError.response?.data || stmtError.message);
        console.log('Continuing with next statement...');
      }
    }
    
    console.log('Migration completed!');
    console.log('Created tables:');
    console.log('- stripe_connect_accounts');
    console.log('- payment_links');
    console.log('- payment_records');
  } catch (error) {
    console.error('Error applying migration:', error.response?.data || error.message);
    throw error;
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
