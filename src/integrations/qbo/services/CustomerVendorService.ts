
import { BaseQBOService } from "./BaseQBOService";

export class CustomerVendorService {
  private baseService: BaseQBOService;
  
  constructor(baseService: BaseQBOService) {
    this.baseService = baseService;
  }

  /**
   * Find a vendor by name in QBO
   */
  async getVendorIdForExpense(vendorName: string) {
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      // Try to find the vendor by name
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Vendor WHERE DisplayName = '${vendorName}'`
        }
      });
      
      const vendors = response.data.QueryResponse.Vendor || [];
      
      if (vendors.length > 0) {
        return vendors[0].Id;
      }
      
      // If vendor not found, create a new one
      const vendorData = {
        DisplayName: vendorName,
        PrintOnCheckName: vendorName,
        Active: true
      };
      
      const createResponse = await client.post('/vendor', vendorData);
      
      return createResponse.data.Vendor.Id;
    } catch (error) {
      console.error("Error getting/creating vendor in QBO:", error);
      throw new Error("Failed to get or create vendor in QuickBooks");
    }
  }

  /**
   * Find a customer by email
   */
  async findCustomerByEmail(email: string) {
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      // Try to find the customer by email
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
        }
      });
      
      return {
        success: true,
        data: response.data.QueryResponse.Customer?.[0] || null
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
    try {
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.baseService.getClient(connection.id, connection.company_id);
      
      const response = await client.post('/customer', customerData);
      
      return {
        success: true,
        data: response.data.Customer
      };
    } catch (error) {
      console.error("Error creating QBO customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
