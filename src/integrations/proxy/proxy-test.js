/**
 * Unified CORS Proxy Test Script
 * 
 * This script allows you to test the unified CORS proxy endpoints
 * for both QBO and Stripe integrations.
 * 
 * Usage:
 * 1. Start the proxy server: npm run proxy
 * 2. Run this test script: node src/integrations/proxy/proxy-test.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Proxy URL
const PROXY_URL = 'http://localhost:3030';

// Helper function to make API requests
async function makeRequest(endpoint, method, data) {
  try {
    const response = await axios({
      method: 'post',
      url: endpoint,
      data,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error('Request error:', error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test QBO token exchange
async function testQboTokenExchange() {
  console.log('\n=== Testing QBO Token Exchange ===');
  
  // This test requires valid OAuth code which is only available during OAuth flow
  console.log('Note: This test cannot be fully automated as it requires a valid OAuth code');
  console.log('Manual testing required during QBO OAuth flow');
  
  // Mock test to verify endpoint is available
  const response = await makeRequest(`${PROXY_URL}/proxy/qbo/token`, 'post', {
    code: 'mock_code',
    redirectUri: 'http://localhost:5173/qbo-callback',
    clientId: process.env.QBO_CLIENT_ID || 'missing_client_id',
    clientSecret: process.env.QBO_CLIENT_SECRET || 'missing_client_secret'
  });
  
  console.log('Endpoint available:', response.status !== undefined);
  console.log('Status:', response.status);
}

// Test QBO data operation
async function testQboDataOperation() {
  console.log('\n=== Testing QBO Data Operation ===');
  
  // This test requires a valid access token
  const accessToken = process.env.QBO_TEST_ACCESS_TOKEN || 'missing_access_token';
  const realmId = process.env.QBO_TEST_REALM_ID || 'missing_realm_id';
  
  if (accessToken === 'missing_access_token' || realmId === 'missing_realm_id') {
    console.log('Missing access token or realm ID in environment variables');
    console.log('Skipping data operation test');
    return;
  }
  
  const response = await makeRequest(`${PROXY_URL}/proxy/qbo/data-operation`, 'post', {
    accessToken,
    realmId,
    endpoint: 'query',
    method: 'get',
    data: {
      query: 'SELECT COUNT(*) FROM CompanyInfo'
    }
  });
  
  console.log('Success:', response.success);
  console.log('Status:', response.status);
  console.log('Response data:', JSON.stringify(response.data, null, 2).substring(0, 150) + '...');
}

// Test Stripe operation
async function testStripeOperation() {
  console.log('\n=== Testing Stripe Operation ===');
  
  const secretKey = process.env.STRIPE_SECRET_KEY || 'missing_secret_key';
  
  if (secretKey === 'missing_secret_key') {
    console.log('Missing Stripe secret key in environment variables');
    console.log('Skipping Stripe operation test');
    return;
  }
  
  const response = await makeRequest(`${PROXY_URL}/proxy/stripe`, 'post', {
    endpoint: 'customers',
    method: 'get',
    data: {
      limit: 3
    },
    secretKey
  });
  
  console.log('Success:', response.success);
  console.log('Status:', response.status);
  console.log('Response data:', JSON.stringify(response.data, null, 2).substring(0, 150) + '...');
}

// Run all tests
async function runTests() {
  console.log('=== Starting Unified CORS Proxy Tests ===');
  console.log('Proxy URL:', PROXY_URL);
  
  try {
    // Test proxy server availability
    console.log('\n=== Testing Proxy Server Availability ===');
    try {
      await axios.get(`${PROXY_URL}/health`);
      console.log('Proxy server is available');
    } catch (error) {
      console.error('Proxy server is not running or not available');
      console.error('Start the proxy server with: npm run proxy');
      return;
    }
    
    // Run specific tests
    await testQboTokenExchange();
    await testQboDataOperation();
    await testStripeOperation();
    
    console.log('\n=== Tests Completed ===');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the tests
runTests();
