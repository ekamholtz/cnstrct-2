/**
 * @deprecated Use CustomerVendorServiceProxy instead
 * This class is kept for backward compatibility but should not be used for new code
 * All API calls should go through the CORS proxy to avoid CORS issues
 */
import { BaseQBOService } from "./BaseQBOService";
import axios from "axios";

export class CustomerVendorService {
  private baseService: BaseQBOService;
  private proxyUrl: string;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
    this.proxyUrl = "http://localhost:3030/proxy";
    console.log("CustomerVendorService initialized with proxy URL:", this.proxyUrl);
    console.warn("WARNING: Using deprecated CustomerVendorService. Please use CustomerVendorServiceProxy instead.");
  }

  /**
   * Find a vendor by name in QBO
   */
  async getVendorIdForExpense(vendorName: string) {
    console.warn("DEPRECATED: Using CustomerVendorService.getVendorIdForExpense - This should use the proxy version instead");
    try {
      console.log("Looking up vendor in QBO:", vendorName);
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Use the proxy for the query operation - FIXED to prevent CORS errors
      const response = await axios.post(`${this.proxyUrl}/company-info`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        params: {
          query: `SELECT * FROM Vendor WHERE DisplayName = '${vendorName}'`
        }
      });
      
      const vendors = response.data.QueryResponse?.Vendor || [];
      
      if (vendors.length > 0) {
        console.log("Found existing vendor in QBO:", vendors[0].Id);
        return {
          success: true,
          data: vendors[0]
        };
      }
      
      // Vendor doesn't exist, create a new one
      console.log("Vendor not found, creating new vendor:", vendorName);
      
      const vendorData = {
        DisplayName: vendorName,
        CompanyName: vendorName,
        PrintOnCheckName: vendorName,
        Active: true
      };
      
      // Use the proxy for the create operation - FIXED to prevent CORS errors
      const createResponse = await axios.post(`${this.proxyUrl}/data-operation`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "vendor",
        method: "post",
        data: vendorData
      });
      
      console.log("Vendor created successfully:", createResponse.data);
      
      return {
        success: true,
        data: createResponse.data.Vendor
      };
    } catch (error) {
      console.error("Error getting/creating QBO vendor:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find a customer by email
   */
  async findCustomerByEmail(email: string) {
    console.warn("DEPRECATED: Using CustomerVendorService.findCustomerByEmail - This should use the proxy version instead");
    try {
      console.log("Looking up customer in QBO by email:", email);
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Use the proxy for the query operation - FIXED to prevent CORS errors
      const response = await axios.post(`${this.proxyUrl}/company-info`, {
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        params: {
          query: `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
        }
      });
      
      const customer = response.data.QueryResponse?.Customer?.[0] || null;
      console.log("Customer lookup result:", customer ? `Found (ID: ${customer.Id})` : "Not found");
      
      return {
        success: true,
        data: customer
      };
    } catch (error) {
      console.error("Error finding QBO customer by email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a customer in QBO
   */
  async createCustomer(customerData: any) {
    console.warn("DEPRECATED: Using CustomerVendorService.createCustomer - This should use the proxy version instead");
    try {
      console.log("Creating customer in QBO using proxy...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Using connection:", connection.id, "company:", connection.company_id);
      console.log("Customer data:", JSON.stringify(customerData));
      
      // FIXED: Always use the proxy to avoid CORS errors - critical fix
      // This was causing direct API calls to QBO which get blocked by CORS
      try {
        // Make direct call through the proxy
        const response = await axios.post(`${this.proxyUrl}/data-operation`, {
          accessToken: connection.access_token,
          realmId: connection.company_id,
          endpoint: "customer",
          method: "post",
          data: customerData
        });
        
        console.log("Customer created successfully:", response.data);
        
        return {
          success: true,
          data: response.data.Customer
        };
      } catch (proxyError) {
        console.error("Failed to create customer through proxy, error:", proxyError);
        throw proxyError;
      }
    } catch (error) {
      console.error("Error creating QBO customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
