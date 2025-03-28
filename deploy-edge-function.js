// Script to deploy a Supabase Edge Function using the API
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration - update these values
const PROJECT_REF = 'wkspjzbybjhvscqdmpwi'; 
const FUNCTION_NAME = process.argv[2]; // Get function name from command line arg
const SERVICE_ROLE_KEY = process.argv[3]; // Get service role key from command line arg

if (!FUNCTION_NAME) {
  console.error('Please provide function name as first argument: node deploy-edge-function.js stripe-connect your_service_role_key');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('Please provide service role key as second argument');
  process.exit(1);
}

async function deployFunction() {
  try {
    // Read the function code from the local file
    const functionPath = path.join(__dirname, 'supabase', 'functions', FUNCTION_NAME, 'index.ts');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    console.log(`Deploying ${FUNCTION_NAME}...`);
    
    // Make the API request to deploy the function
    const url = `https://${PROJECT_REF}.supabase.co/functions/v1/meta`;
    
    const response = await axios.post(url, {
      name: FUNCTION_NAME,
      slug: FUNCTION_NAME,
      verify_jwt: false,
      body: functionCode
    }, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Function ${FUNCTION_NAME} deployed successfully!`);
    console.log(`URL: https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`);
  } catch (error) {
    console.error('Error deploying function:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

deployFunction();
