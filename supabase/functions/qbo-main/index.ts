// supabase/functions/qbo-integration/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import QuickBooks from "npm:node-quickbooks";
import OAuthClient from "npm:intuit-oauth";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Initialize QBO environment variables
const CLIENT_ID = Deno.env.get("QBO_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("QBO_CLIENT_SECRET")!;
const REDIRECT_URI = supabaseUrl + "/auth/callback" ;
const ENVIRONMENT = Deno.env.get("QBO_ENVIRONMENT") || "sandbox";
const DEBUG = Deno.env.get("QBO_DEBUG") === "true";

// Initialize OAuth client
const oauthClient = new OAuthClient({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  environment: ENVIRONMENT,
  redirectUri: REDIRECT_URI,
  logging: DEBUG,
});

/**
 * Initialize QuickBooks SDK client with OAuth tokens
 */
function initializeQBO(tokenData: any) {
  if (!tokenData) return null;
  
  const realmId = tokenData.realmId;
  const useSandbox = ENVIRONMENT === "sandbox";
  
  return new QuickBooks(
    CLIENT_ID,
    CLIENT_SECRET,
    tokenData.access_token,
    false, // no token secret for OAuth 2.0
    realmId,
    useSandbox,
    DEBUG,
    null, // use latest minor version
    "2.0", // OAuth version
    tokenData.refresh_token
  );
}

/**
 * Get token from database for a specific user
 */
async function getTokenForUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from("qbo_tokens")
      .select("token_data")
      .eq("user_id", userId)
      .single();
    
    if (error) throw error;
    return data?.token_data || null;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
}

/**
 * Save token to database for a specific user
 */
async function saveTokenForUser(userId: string, tokenData: any) {
  try {
    const { data, error } = await supabase
      .from("qbo_tokens")
      .upsert(
        { user_id: userId, token_data: tokenData },
        { onConflict: "user_id" }
      );
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving token:", error);
    return null;
  }
}

/**
 * Process promisified QuickBooks API calls
 */
function qboPromise(qbo: any, method: string, ...args: any[]) {
  return new Promise((resolve, reject) => {
    qbo[method](...args, (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * Handle router requests
 */
async function handleRequest(req: Request, url: URL): Promise<Response> {
  // Get user ID from auth header or query param
  let userId = "";
  const authHeader = req.headers.get("authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Get user ID from JWT
    const token = authHeader.substring(7);
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || "";
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid authorization token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else {
    // For auth endpoints, use query param for user ID
    userId = url.searchParams.get("userId") || "111";
  }
  
  // Handle authentication endpoints without requiring token
  if (url.pathname === "/auth/uri") {
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: userId, // Store userId in state param
    });
    
    return new Response(JSON.stringify({ authUri }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  if (url.pathname === "/auth/callback") {
    try {
      const authResponse = await oauthClient.createToken(url.href);
      const tokenData = authResponse.getJson();
      const state = authResponse.getJson().state; // Get userId from state
      
      // Save token to database
      await saveTokenForUser(state, tokenData);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("OAuth callback error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  
  // For all other endpoints, require authentication
  // if (!userId) {
  //   return new Response(JSON.stringify({ error: "Authentication required" }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" }
  //   });
  // }
  
  // Get token from database
  const tokenData = await getTokenForUser(userId);
  if (!tokenData) {
    return new Response(JSON.stringify({ error: "No QBO token found for user. Please authorize with QuickBooks first." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Check token expiration and refresh if needed
  if (new Date() > new Date(tokenData.expires_at)) {
    try {
      oauthClient.setToken(tokenData);
      const refreshResponse = await oauthClient.refresh();
      const newTokenData = refreshResponse.getJson();
      
      // Save refreshed token
      await saveTokenForUser(userId, newTokenData);
      
      // Update token data for this request
      tokenData = newTokenData;
    } catch (error) {
      console.error("Token refresh error:", error);
      return new Response(JSON.stringify({ error: "Failed to refresh QuickBooks token. Please reauthorize." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  
  // Initialize QBO client with token
  const qbo = initializeQBO(tokenData);
  if (!qbo) {
    return new Response(JSON.stringify({ error: "Failed to initialize QuickBooks client" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Handle API routes
  try {
    const method = req.method;
    let responseData = null;
    let requestBody = {};
    
    // Parse request body for POST/PUT requests
    if (method === "POST" || method === "PUT") {
      requestBody = await req.json();
    }
    
    // COMPANY INFO
    if (url.pathname === "/company" && method === "GET") {
      responseData = await qboPromise(qbo, "getCompanyInfo", tokenData.realmId);
    }
    
    // ACCOUNTS
    else if (url.pathname === "/accounts" && method === "GET") {
      const query = Object.fromEntries(url.searchParams);
      responseData = await qboPromise(qbo, "findAccounts", query);
    }
    else if (url.pathname === "/accounts" && method === "POST") {
      responseData = await qboPromise(qbo, "createAccount", requestBody);
    }
    else if (url.pathname.startsWith("/accounts/") && method === "GET") {
      const accountId = url.pathname.split("/").pop();
      responseData = await qboPromise(qbo, "getAccount", accountId);
    }
    else if (url.pathname.startsWith("/accounts/") && method === "PUT") {
      const accountId = url.pathname.split("/").pop();
      const accountData = { Id: accountId, ...requestBody };
      responseData = await qboPromise(qbo, "updateAccount", accountData);
    }
    
    // CUSTOMERS
    else if (url.pathname === "/customers" && method === "GET") {
      const query = Object.fromEntries(url.searchParams);
      responseData = await qboPromise(qbo, "findCustomers", query);
    }
    else if (url.pathname === "/customers" && method === "POST") {
      responseData = await qboPromise(qbo, "createCustomer", requestBody);
    }
    else if (url.pathname.startsWith("/customers/") && method === "GET") {
      const customerId = url.pathname.split("/").pop();
      responseData = await qboPromise(qbo, "getCustomer", customerId);
    }
    else if (url.pathname.startsWith("/customers/") && method === "PUT") {
      const customerId = url.pathname.split("/").pop();
      const customerData = { Id: customerId, ...requestBody };
      responseData = await qboPromise(qbo, "updateCustomer", customerData);
    }
    
    // INVOICES
    else if (url.pathname === "/invoices" && method === "GET") {
      const query = Object.fromEntries(url.searchParams);
      responseData = await qboPromise(qbo, "findInvoices", query);
    }
    else if (url.pathname === "/invoices" && method === "POST") {
      responseData = await qboPromise(qbo, "createInvoice", requestBody);
    }
    else if (url.pathname.startsWith("/invoices/") && method === "GET") {
      const invoiceId = url.pathname.split("/").pop();
      responseData = await qboPromise(qbo, "getInvoice", invoiceId);
    }
    else if (url.pathname.startsWith("/invoices/") && method === "PUT") {
      const invoiceId = url.pathname.split("/").pop();
      const invoiceData = { Id: invoiceId, ...requestBody };
      responseData = await qboPromise(qbo, "updateInvoice", invoiceData);
    }
    else if (url.pathname.match(/\/invoices\/\d+\/send/) && method === "POST") {
      const invoiceId = url.pathname.split("/")[2];
      const { email } = requestBody;
      responseData = await qboPromise(qbo, "sendInvoice", invoiceId, email);
    }
    
    // EXPENSES/PURCHASES
    else if (url.pathname === "/expenses" && method === "GET") {
      const query = Object.fromEntries(url.searchParams);
      responseData = await qboPromise(qbo, "findPurchases", query);
    }
    else if (url.pathname === "/expenses" && method === "POST") {
      responseData = await qboPromise(qbo, "createPurchase", requestBody);
    }
    else if (url.pathname.startsWith("/expenses/") && method === "GET") {
      const expenseId = url.pathname.split("/").pop();
      responseData = await qboPromise(qbo, "getPurchase", expenseId);
    }
    else if (url.pathname.startsWith("/expenses/") && method === "PUT") {
      const expenseId = url.pathname.split("/").pop();
      const expenseData = { Id: expenseId, ...requestBody };
      responseData = await qboPromise(qbo, "updatePurchase", expenseData);
    }
    
    // VENDORS
    else if (url.pathname === "/vendors" && method === "GET") {
      const query = Object.fromEntries(url.searchParams);
      responseData = await qboPromise(qbo, "findVendors", query);
    }
    else if (url.pathname === "/vendors" && method === "POST") {
      responseData = await qboPromise(qbo, "createVendor", requestBody);
    }
    else if (url.pathname.startsWith("/vendors/") && method === "GET") {
      const vendorId = url.pathname.split("/").pop();
      responseData = await qboPromise(qbo, "getVendor", vendorId);
    }
    else if (url.pathname.startsWith("/vendors/") && method === "PUT") {
      const vendorId = url.pathname.split("/").pop();
      const vendorData = { Id: vendorId, ...requestBody };
      responseData = await qboPromise(qbo, "updateVendor", vendorData);
    }
    
    // TRANSACTIONS SYNC
    else if (url.pathname === "/sync/transactions" && method === "GET") {
      const { startDate, endDate } = Object.fromEntries(url.searchParams);
      
      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "startDate and endDate are required query parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      responseData = await qboPromise(
        qbo, 
        "changeDataCapture",
        ["Invoice", "Payment", "Purchase", "Bill", "BillPayment", "JournalEntry", "Deposit"],
        startDate,
        endDate
      );
    }
    else if (url.pathname === "/sync/invoices" && method === "GET") {
      const { startDate, endDate } = Object.fromEntries(url.searchParams);
      
      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "startDate and endDate are required query parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      responseData = await qboPromise(qbo, "findInvoices", [
        { field: "TxnDate", value: startDate, operator: ">=" },
        { field: "TxnDate", value: endDate, operator: "<=" },
        { field: "fetchAll", value: true }
      ]);
    }
    else if (url.pathname === "/sync/expenses" && method === "GET") {
      const { startDate, endDate } = Object.fromEntries(url.searchParams);
      
      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "startDate and endDate are required query parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      responseData = await qboPromise(qbo, "findPurchases", [
        { field: "TxnDate", value: startDate, operator: ">=" },
        { field: "TxnDate", value: endDate, operator: "<=" },
        { field: "fetchAll", value: true }
      ]);
    }
    else if (url.pathname === "/sync/full" && method === "GET") {
      const { startDate, endDate } = Object.fromEntries(url.searchParams);
      
      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "startDate and endDate are required query parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Using Promise.all to run multiple queries in parallel
      const [invoices, expenses, payments, bills, vendors, customers] = await Promise.all([
        qboPromise(qbo, "findInvoices", [
          { field: "TxnDate", value: startDate, operator: ">=" },
          { field: "TxnDate", value: endDate, operator: "<=" },
          { field: "fetchAll", value: true }
        ]),
        qboPromise(qbo, "findPurchases", [
          { field: "TxnDate", value: startDate, operator: ">=" },
          { field: "TxnDate", value: endDate, operator: "<=" },
          { field: "fetchAll", value: true }
        ]),
        qboPromise(qbo, "findPayments", [
          { field: "TxnDate", value: startDate, operator: ">=" },
          { field: "TxnDate", value: endDate, operator: "<=" },
          { field: "fetchAll", value: true }
        ]),
        qboPromise(qbo, "findBills", [
          { field: "TxnDate", value: startDate, operator: ">=" },
          { field: "TxnDate", value: endDate, operator: "<=" },
          { field: "fetchAll", value: true }
        ]),
        qboPromise(qbo, "findVendors", { fetchAll: true }),
        qboPromise(qbo, "findCustomers", { fetchAll: true })
      ]);
      
      responseData = {
        invoices,
        expenses,
        payments,
        bills,
        vendors,
        customers
      };
    }
    
    // REPORTS
    else if (url.pathname === "/reports/profit-loss" && method === "GET") {
      const { startDate, endDate, departments } = Object.fromEntries(url.searchParams);
      const reportParams = {};
      
      if (startDate) reportParams.start_date = startDate;
      if (endDate) reportParams.end_date = endDate;
      if (departments) reportParams.department = departments;
      
      responseData = await qboPromise(qbo, "reportProfitAndLoss", reportParams);
    }
    else if (url.pathname === "/reports/balance-sheet" && method === "GET") {
      const { date, departments } = Object.fromEntries(url.searchParams);
      const reportParams = {};
      
      if (date) reportParams.as_of = date;
      if (departments) reportParams.department = departments;
      
      responseData = await qboPromise(qbo, "reportBalanceSheet", reportParams);
    }
    else if (url.pathname === "/reports/ar-aging" && method === "GET") {
      const { date } = Object.fromEntries(url.searchParams);
      const reportParams = {};
      
      if (date) reportParams.report_date = date;
      
      responseData = await qboPromise(qbo, "reportAgedReceivables", reportParams);
    }
    else if (url.pathname === "/reports/ap-aging" && method === "GET") {
      const { date } = Object.fromEntries(url.searchParams);
      const reportParams = {};
      
      if (date) reportParams.report_date = date;
      
      responseData = await qboPromise(qbo, "reportAgedPayables", reportParams);
    }
    else {
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/qbo-integration/, "");
  url.pathname = path;
  
  try {
    return await handleRequest(req, url);
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});