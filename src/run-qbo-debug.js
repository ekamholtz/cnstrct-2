// Run QBO Debug Helper
// This script runs the QBO debug helper to test the connection

const { testQBOConnection } = require('./qbo-debug-helper');
const fs = require('fs');
const path = require('path');

// Function to read connection details from a file
async function readConnectionDetails() {
  try {
    // Try to read from a connection details file
    const filePath = path.join(__dirname, 'qbo-connection.json');
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    
    console.log('No connection details file found. Using hardcoded test values...');
    
    // Return hardcoded test values
    return {
      accessToken: process.env.QBO_ACCESS_TOKEN || "REPLACE_WITH_YOUR_ACCESS_TOKEN",
      refreshToken: process.env.QBO_REFRESH_TOKEN || "REPLACE_WITH_YOUR_REFRESH_TOKEN",
      realmId: process.env.QBO_REALM_ID || "9341454244823359" // Example realm ID
    };
  } catch (error) {
    console.error('Error reading connection details:', error);
    throw error;
  }
}

// Function to save updated connection details
function saveConnectionDetails(details) {
  try {
    const filePath = path.join(__dirname, 'qbo-connection.json');
    fs.writeFileSync(filePath, JSON.stringify(details, null, 2));
    console.log('Updated connection details saved to', filePath);
  } catch (error) {
    console.error('Error saving connection details:', error);
  }
}

// Main function to run the test
async function runTest() {
  try {
    console.log('Starting QBO connection test...');
    
    // Read connection details
    const connectionDetails = await readConnectionDetails();
    
    // Test the connection
    const result = await testQBOConnection(
      connectionDetails.accessToken,
      connectionDetails.refreshToken,
      connectionDetails.realmId
    );
    
    // Display the result
    if (result.success) {
      console.log('✅ QBO connection test successful!');
      
      // If we got new tokens, save them
      if (result.newAccessToken) {
        console.log('Saving new access token...');
        connectionDetails.accessToken = result.newAccessToken;
        connectionDetails.refreshToken = result.newRefreshToken || connectionDetails.refreshToken;
        saveConnectionDetails(connectionDetails);
      }
    } else {
      console.error('❌ QBO connection test failed:', result.error);
      console.error('Details:', result.details);
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
runTest();
