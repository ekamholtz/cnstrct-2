const fs = require('fs');
const path = require('path');

// Path to the QBOConfig.ts file
const configPath = path.join(__dirname, 'src', 'integrations', 'qbo', 'config', 'qboConfig.ts');

// Read the current file content
let content = fs.readFileSync(configPath, 'utf8');

// Replace the redirect URI configuration
content = content.replace(
  /\/\/ Important: Using a clean domain format without port for QBO registration[\s\S]*?this\.redirectUri = `\${domain}\/qbo\/callback`;/,
  `// Use the exact redirect URI that matches what's registered in the Intuit developer portal
    // For local development on port 8081, use the specific URI registered
    this.redirectUri = this.isProduction
      ? \`\${window.location.origin}/qbo/callback\`
      : "http://localhost:8081/qbo/callback";`
);

// Write the updated content back to the file
fs.writeFileSync(configPath, content);

console.log('QBOConfig.ts has been updated successfully!');
