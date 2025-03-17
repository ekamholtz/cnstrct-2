import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get Stripe secret key from environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY is not defined in the .env file');
  process.exit(1);
}

console.log('Testing Stripe API connection...');
console.log(`Using key: ${STRIPE_SECRET_KEY.substring(0, 8)}...${STRIPE_SECRET_KEY.substring(STRIPE_SECRET_KEY.length - 4)}`);

// Initialize Stripe with the secret key
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Test the connection by listing accounts
async function testConnection() {
  try {
    // Try to list accounts
    console.log('Attempting to list Stripe accounts...');
    const accounts = await stripe.accounts.list({
      limit: 3
    });
    
    console.log('Connection successful!');
    console.log(`Found ${accounts.data.length} accounts`);
    
    // Try to create a payment intent
    console.log('\nAttempting to create a test payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      description: 'Test payment intent'
    });
    
    console.log('Payment intent created successfully!');
    console.log(`Payment Intent ID: ${paymentIntent.id}`);
    console.log(`Status: ${paymentIntent.status}`);
    
    console.log('\nAll tests passed! Your Stripe API key is working correctly.');
  } catch (error) {
    console.error('Error connecting to Stripe API:');
    console.error(`Type: ${error.type}`);
    console.error(`Message: ${error.message}`);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\nThis appears to be an authentication error. Please check that your Stripe secret key is correct.');
    } else if (error.type === 'StripeConnectionError') {
      console.error('\nThis appears to be a connection error. Please check your internet connection.');
    }
  }
}

testConnection();
