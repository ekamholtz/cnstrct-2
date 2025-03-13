// QBO Login Helper Script
// This script helps log in with test credentials to test the QBO connection

// Test user credentials from qbo-test-script.ts
const TEST_USER_EMAIL = "tgc1@email.com";
// For development environments, a simple password is often used
const TEST_USER_PASSWORD = "password123"; // Try this common test password

console.log("=== QBO Login Helper ===");
console.log(`Test User Email: ${TEST_USER_EMAIL}`);
console.log(`Test User Password: ${TEST_USER_PASSWORD} (try this or other common test passwords)`);

// Function to auto-fill login form if found on page
function autoFillLoginForm() {
  const emailInput = document.querySelector('input[type="email"]');
  const passwordInput = document.querySelector('input[type="password"]');
  const loginButton = document.querySelector('button[type="submit"]');
  
  if (emailInput && passwordInput) {
    console.log("Login form found! Auto-filling credentials...");
    emailInput.value = TEST_USER_EMAIL;
    passwordInput.value = TEST_USER_PASSWORD;
    
    console.log("Credentials filled. Click the Sign In button to continue.");
  } else {
    console.log("Login form not found on current page.");
  }
}

// Run the helper when the script is loaded
setTimeout(autoFillLoginForm, 1000);

// Add a global function that can be called from the console
window.fillLoginForm = autoFillLoginForm;
