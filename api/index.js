import 'dotenv/config';
import express from 'express';
import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './openapi.json' with { type: 'json' };

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// OAuth and QuickBooks SDK variables
let oauth2_token_json = null;
let qbo = null;

const oauthClient = new OAuthClient({
  clientId: process.env.QBO_SANDBOX_CLIENT_ID,
  clientSecret: process.env.QBO_SANDBOX_CLIENT_SECRET,
  environment: process.env.ENVIRONMENT,
  redirectUri: "http://localhost:3000/qbo/callback",
  logging: process.env.DEBUG === 'true'
});

/**
 * Initialize QuickBooks SDK client with OAuth tokens
 */
function initializeQBO() {
  if (!oauth2_token_json) return null;
  
  const realmId = oauth2_token_json.realmId;
  const useSandbox = process.env.ENVIRONMENT === 'sandbox';
  const enableDebug = process.env.DEBUG === 'true';
  
  return new QuickBooks(
    process.env.QBO_SANDBOX_CLIENT_ID,
    process.env.QBO_SANDBOX_CLIENT_SECRET,
    oauth2_token_json.access_token,
    false, // no token secret for OAuth 2.0
    realmId,
    useSandbox,
    enableDebug,
    null, // use latest minor version
    '2.0', // OAuth version
    oauth2_token_json.refresh_token
  );
}

/**
 * Error handler middleware
 */
const errorHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Auth check middleware
 */
const requireAuth = (req, res, next) => {
  if (!oauth2_token_json || !qbo) {
    return res.status(401).json({ error: 'Authentication required. Please authorize with QuickBooks first.' });
  } 
  next();
};


/**
 * OpenAPI UI (Swagger UI) configuration with custom theme
 */
const swaggerOptions = {
  customCssUrl: '/themes/theme-monokai.css', // Use Monokai theme CSS
  customCss: '.swagger-ui .topbar { display: none } .swagger-ui { background-color: #fafafa }',
  customSiteTitle: 'CNSTRCTR API',
  explorer: true,
  swaggerOptions: {
    tryItOutEnabled: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    deepLinking: true
  }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
app.use('/themes', express.static(path.join(process.cwd(), 'node_modules/swagger-ui-themes/themes/3.x')));

/**
 * Redirect to the QuickBooks OAuth2.0 Authorization URI
 */
app.get('/qbo/initiateAuth', (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId, OAuthClient.scopes.Profile, OAuthClient.scopes.Email],
    state: 'intuit-test',
  });
  res.redirect(authUri);
  res.json({ authUri });  
});

/**
 * OAuth Callback endpoint
 */
app.get('/qbo/callback', (req, res) => {
  oauthClient.createToken(req.url)
    .then((authResponse) => {
      oauth2_token_json = authResponse.json;
      qbo = initializeQBO();
      // res.redirect('/docs');
      res.json({ success: true, token: oauth2_token_json });
    })
    .catch((e) => {
      res.status(400).json({ error: e.message });
    });
});

/**
 * Retrieve Token endpoint
 */
app.get('/qbo/retrieveToken', (req, res) => {
  if (!oauth2_token_json) return res.status(404).json({ error: 'No token found.' });
  res.json(oauth2_token_json);
});

/**
 * Refresh Access Token endpoint
 */
app.get('/qbo/refreshAccessToken', (req, res) => {
  oauthClient
    .refresh()
    .then((authResponse) => {
      oauth2_token_json = authResponse.json;
      qbo = initializeQBO();
      res.json(oauth2_token_json);
    })
    .catch((e) => {
      res.status(400).json({ error: e.message });
    });
});

/**
 * Get Company Info endpoint
 */
app.get('/api/company', requireAuth, errorHandler(async (req, res) => {
  const companyID = oauth2_token_json.realmId;
  
  await new Promise((resolve, reject) => {
    qbo.getCompanyInfo(companyID, (err, companyInfo) => {
      if (err) reject(err);
      else resolve(res.json(companyInfo));
    });
  });
}));

/**
 * ACCOUNT ENDPOINTS
 */

// Get all accounts
app.get('/api/accounts', requireAuth, errorHandler(async (req, res) => {
  const query = req.query || {};
  
  await new Promise((resolve, reject) => {
    qbo.findAccounts(query, (err, accounts) => {
      if (err) reject(err);
      else resolve(res.json(accounts));
    });
  });
}));

// Get a specific account
app.get('/api/accounts/:id', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.getAccount(req.params.id, (err, account) => {
      if (err) reject(err);
      else resolve(res.json(account));
    });
  });
}));

// Create a new account
app.post('/api/accounts', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.createAccount(req.body, (err, account) => {
      if (err) reject(err);
      else resolve(res.json(account));
    });
  });
}));

// Update an account
app.put('/api/accounts/:id', requireAuth, errorHandler(async (req, res) => {
  const accountData = { Id: req.params.id, ...req.body };
  
  await new Promise((resolve, reject) => {
    qbo.updateAccount(accountData, (err, account) => {
      if (err) reject(err);
      else resolve(res.json(account));
    });
  });
}));
``
/**
 * CUSTOMER ENDPOINTS
 */

// Get all customers
app.get('/api/customers', requireAuth, errorHandler(async (req, res) => {
  const query = req.query || {};
  
  await new Promise((resolve, reject) => {
    qbo.findCustomers(query, (err, customers) => {
      if (err) reject(err);
      else resolve(res.json(customers));
    });
  });
}));

// Get a specific customer
app.get('/api/customers/:id', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.getCustomer(req.params.id, (err, customer) => {
      if (err) reject(err);
      else resolve(res.json(customer));
    });
  });
}));

// Create a new customer
app.post('/api/customers', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.createCustomer(req.body, (err, customer) => {
      if (err) reject(err);
      else resolve(res.json(customer));
    });
  });
}));

// Update a customer
app.put('/api/customers/:id', requireAuth, errorHandler(async (req, res) => {
  const customerData = { Id: req.params.id, ...req.body };
  
  await new Promise((resolve, reject) => {
    qbo.updateCustomer(customerData, (err, customer) => {
      if (err) reject(err);
      else resolve(res.json(customer));
    });
  });
}));

/**
 * INVOICE ENDPOINTS
 */

// Get all invoices
app.get('/api/invoices', requireAuth, errorHandler(async (req, res) => {
  const query = req.query || {};
  
  await new Promise((resolve, reject) => {
    qbo.findInvoices(query, (err, invoices) => {
      if (err) reject(err);
      else resolve(res.json(invoices));
    });
  });
}));

// Get a specific invoice
app.get('/api/invoices/:id', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.getInvoice(req.params.id, (err, invoice) => {
      if (err) reject(err);
      else resolve(res.json(invoice));
    });
  });
}));

// Create a new invoice
app.post('/api/invoices', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.createInvoice(req.body, (err, invoice) => {
      if (err) reject(err);
      else resolve(res.json(invoice));
    });
  });
}));

// Update an invoice
app.put('/api/invoices/:id', requireAuth, errorHandler(async (req, res) => {
  const invoiceData = { Id: req.params.id, ...req.body };
  
  await new Promise((resolve, reject) => {
    qbo.updateInvoice(invoiceData, (err, invoice) => {
      if (err) reject(err);
      else resolve(res.json(invoice));
    });
  });
}));

// Send an invoice
app.post('/api/invoices/:id/send', requireAuth, errorHandler(async (req, res) => {
  const { email } = req.body;
  
  await new Promise((resolve, reject) => {
    qbo.sendInvoice(req.params.id, email, (err, result) => {
      if (err) reject(err);
      else resolve(res.json(result));
    });
  });
}));

/**
 * EXPENSE/PURCHASE ENDPOINTS
 */

// Get all expenses (purchases)
app.get('/api/expenses', requireAuth, errorHandler(async (req, res) => {
  const query = req.query || {};
  
  await new Promise((resolve, reject) => {
    qbo.findPurchases(query, (err, purchases) => {
      if (err) reject(err);
      else resolve(res.json(purchases));
    });
  });
}));

// Get a specific expense (purchase)
app.get('/api/expenses/:id', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.getPurchase(req.params.id, (err, purchase) => {
      if (err) reject(err);
      else resolve(res.json(purchase));
    });
  });
}));

// Create a new expense (purchase)
app.post('/api/expenses', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.createPurchase(req.body, (err, purchase) => {
      if (err) reject(err);
      else resolve(res.json(purchase));
    });
  });
}));

// Update an expense (purchase)
app.put('/api/expenses/:id', requireAuth, errorHandler(async (req, res) => {
  const purchaseData = { Id: req.params.id, ...req.body };
  
  await new Promise((resolve, reject) => {
    qbo.updatePurchase(purchaseData, (err, purchase) => {
      if (err) reject(err);
      else resolve(res.json(purchase));
    });
  });
}));

/**
 * VENDOR ENDPOINTS
 */

// Get all vendors
app.get('/api/vendors', requireAuth, errorHandler(async (req, res) => {
  const query = req.query || {};
  
  await new Promise((resolve, reject) => {
    qbo.findVendors(query, (err, vendors) => {
      if (err) reject(err);
      else resolve(res.json(vendors));
    });
  });
}));

// Get a specific vendor
app.get('/api/vendors/:id', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.getVendor(req.params.id, (err, vendor) => {
      if (err) reject(err);
      else resolve(res.json(vendor));
    });
  });
}));

// Create a new vendor
app.post('/api/vendors', requireAuth, errorHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    qbo.createVendor(req.body, (err, vendor) => {
      if (err) reject(err);
      else resolve(res.json(vendor));
    });
  });
}));

// Update a vendor
app.put('/api/vendors/:id', requireAuth, errorHandler(async (req, res) => {
  const vendorData = { Id: req.params.id, ...req.body };
  
  await new Promise((resolve, reject) => {
    qbo.updateVendor(vendorData, (err, vendor) => {
      if (err) reject(err);
      else resolve(res.json(vendor));
    });
  });
}));

/**
 * TRANSACTION SYNC ENDPOINTS
 */

// Get all transactions within a date range
app.get('/api/transactions', requireAuth, errorHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required query parameters' });
  }
  
  await new Promise((resolve, reject) => {
    // Using the CDCQuery (Change Data Capture) to get all transaction types
    qbo.changeDataCapture(
      ['Invoice', 'Payment', 'Purchase', 'Bill', 'BillPayment', 'JournalEntry', 'Deposit'],
      startDate,
      endDate,
      (err, data) => {
        if (err) reject(err);
        else resolve(res.json(data));
      }
    );
  });
}));

// Sync invoices within a date range
app.get('/api/sync/invoices', requireAuth, errorHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required query parameters' });
  }
  
  await new Promise((resolve, reject) => {
    qbo.findInvoices([
      { field: 'TxnDate', value: startDate, operator: '>=' },
      { field: 'TxnDate', value: endDate, operator: '<=' },
      { field: 'fetchAll', value: true }
    ], (err, invoices) => {
      if (err) reject(err);
      else resolve(res.json(invoices));
    });
  });
}));

// Sync expenses within a date range
app.get('/api/sync/expenses', requireAuth, errorHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required query parameters' });
  }
  
  await new Promise((resolve, reject) => {
    qbo.findPurchases([
      { field: 'TxnDate', value: startDate, operator: '>=' },
      { field: 'TxnDate', value: endDate, operator: '<=' },
      { field: 'fetchAll', value: true }
    ], (err, expenses) => {
      if (err) reject(err);
      else resolve(res.json(expenses));
    });
  });
}));

// Full sync endpoint - syncs multiple entity types in one request
app.get('/api/sync/full', requireAuth, errorHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required query parameters' });
  }
  
  // Using Promise.all to run multiple queries in parallel
  try {
    const [invoices, expenses, payments, bills, vendors, customers] = await Promise.all([
      new Promise((resolve, reject) => {
        qbo.findInvoices([
          { field: 'TxnDate', value: startDate, operator: '>=' },
          { field: 'TxnDate', value: endDate, operator: '<=' },
          { field: 'fetchAll', value: true }
        ], (err, data) => err ? reject(err) : resolve(data));
      }),
      new Promise((resolve, reject) => {
        qbo.findPurchases([
          { field: 'TxnDate', value: startDate, operator: '>=' },
          { field: 'TxnDate', value: endDate, operator: '<=' },
          { field: 'fetchAll', value: true }
        ], (err, data) => err ? reject(err) : resolve(data));
      }),
      new Promise((resolve, reject) => {
        qbo.findPayments([
          { field: 'TxnDate', value: startDate, operator: '>=' },
          { field: 'TxnDate', value: endDate, operator: '<=' },
          { field: 'fetchAll', value: true }
        ], (err, data) => err ? reject(err) : resolve(data));
      }),
      new Promise((resolve, reject) => {
        qbo.findBills([
          { field: 'TxnDate', value: startDate, operator: '>=' },
          { field: 'TxnDate', value: endDate, operator: '<=' },
          { field: 'fetchAll', value: true }
        ], (err, data) => err ? reject(err) : resolve(data));
      }),
      new Promise((resolve, reject) => {
        qbo.findVendors({ fetchAll: true }, (err, data) => err ? reject(err) : resolve(data));
      }),
      new Promise((resolve, reject) => {
        qbo.findCustomers({ fetchAll: true }, (err, data) => err ? reject(err) : resolve(data));
      })
    ]);

    res.json({
      invoices,
      expenses,
      payments,
      bills,
      vendors,
      customers
    });
  } catch (error) {
    throw error;
  }
}));

/**
 * REPORT ENDPOINTS
 */

// Profit and Loss report
app.get('/api/reports/profit-loss', requireAuth, errorHandler(async (req, res) => {
  const { startDate, endDate, departments } = req.query;
  const reportParams = {};
  
  if (startDate) reportParams.start_date = startDate;
  if (endDate) reportParams.end_date = endDate;
  if (departments) reportParams.department = departments;
  
  await new Promise((resolve, reject) => {
    qbo.reportProfitAndLoss(reportParams, (err, report) => {
      if (err) reject(err);
      else resolve(res.json(report));
    });
  });
}));

// Balance Sheet report
app.get('/api/reports/balance-sheet', requireAuth, errorHandler(async (req, res) => {
  const { date, departments } = req.query;
  const reportParams = {};
  
  if (date) reportParams.as_of = date;
  if (departments) reportParams.department = departments;
  
  await new Promise((resolve, reject) => {
    qbo.reportBalanceSheet(reportParams, (err, report) => {
      if (err) reject(err);
      else resolve(res.json(report));
    });
  });
}));

// Accounts Receivable Aging report
app.get('/api/reports/ar-aging', requireAuth, errorHandler(async (req, res) => {
  const { date } = req.query;
  const reportParams = {};
  
  if (date) reportParams.report_date = date;
  
  await new Promise((resolve, reject) => {
    qbo.reportAgedReceivables(reportParams, (err, report) => {
      if (err) reject(err);
      else resolve(res.json(report));
    });
  });
}));

// Accounts Payable Aging report
app.get('/api/reports/ap-aging', requireAuth, errorHandler(async (req, res) => {
  const { date } = req.query;
  const reportParams = {};
  
  if (date) reportParams.report_date = date;
  
  await new Promise((resolve, reject) => {
    qbo.reportAgedPayables(reportParams, (err, report) => {
      if (err) reject(err);
      else resolve(res.json(report));
    });
  });
}));

/**
 * ATTACHMENT ENDPOINTS
 */

// Upload attachment to entity
app.post('/api/attachments/upload', requireAuth, errorHandler(async (req, res) => {
  const { entityType, entityId, fileName, filePath, contentType } = req.body;
  
  if (!entityType || !entityId || !fileName || !filePath || !contentType) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  await new Promise((resolve, reject) => {
    qbo.upload(
      fileName,
      contentType,
      fs.createReadStream(filePath),
      entityType,
      entityId,
      (err, result) => {
        if (err) reject(err);
        else resolve(res.json(result));
      }
    );
  });
}));

// Get attachments for entity
app.get('/api/attachments/:entityType/:entityId', requireAuth, errorHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  
  await new Promise((resolve, reject) => {
    qbo.findAttachables([
      { field: 'EntityType', value: entityType },
      { field: 'EntityId', value: entityId }
    ], (err, attachments) => {
      if (err) reject(err);
      else resolve(res.json(attachments));
    });
  });
}));

/**
 * WEBHOOK ENDPOINTS
 */

// Handle QuickBooks webhooks
app.post('/webhook/quickbooks', (req, res) => {
  const webhookPayload = req.body;
  
  // Log the webhook event
  console.log('QuickBooks Webhook Event Received:', JSON.stringify(webhookPayload, null, 2));
  
  // Process the webhook event based on its type
  // Implement your business logic here
  
  // Return a 200 response to acknowledge receipt
  res.status(200).send('Webhook received');
});

/**
 * Serve frontend
//  */
// app.get('/', (req, res) => {
//   res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
// });


export default app;