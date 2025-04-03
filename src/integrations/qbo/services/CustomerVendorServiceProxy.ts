import { BaseQBOEdgeFunction } from "./BaseQBOEdgeFunction";

export class CustomerVendorServiceProxy {
  private baseService: BaseQBOEdgeFunction;
  
  constructor(baseService: BaseQBOEdgeFunction) {
    this.baseService = baseService;
    console.log("CustomerVendorServiceProxy initialized with Edge Function support");
  }

  /**
   * Find a vendor in QBO by name, or create one if it doesn't exist
   */
  async getVendorIdForExpense(vendorName: string) {
    try {
      console.log("Looking up vendor in QBO:", vendorName);
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // First, check if we already have a reference to this vendor
      const vendorRef = await this.baseService.getEntityReference('vendor', vendorName);
      if (vendorRef && vendorRef.qbo_entity_id) {
        console.log("Found existing vendor reference:", vendorRef.qbo_entity_id);
        return {
          success: true,
          data: { Id: vendorRef.qbo_entity_id, DisplayName: vendorName }
        };
      }
      
      // Use the Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: {
          query: `SELECT * FROM Vendor WHERE DisplayName = '${vendorName}'`
        }
      });
      
      const vendors = response.QueryResponse?.Vendor || [];
      
      if (vendors.length > 0) {
        console.log("Found existing vendor in QBO:", vendors[0].Id);
        
        // Store the reference for future use
        await this.baseService.storeEntityReference('vendor', vendorName, vendors[0].Id);
        
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
      
      // Use the Edge Function for the create operation
      const createResponse = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "vendor",
        method: "post",
        data: vendorData
      });
      
      console.log("Vendor created successfully:", createResponse.Vendor);
      
      // Store the reference for future use
      await this.baseService.storeEntityReference('vendor', vendorName, createResponse.Vendor.Id);
      
      return {
        success: true,
        data: createResponse.Vendor
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
   * Find a vendor in QBO by name
   */
  async findVendor(vendorName: string) {
    try {
      console.log("Looking up vendor in QBO by name:", vendorName);
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // First, check if we already have a reference to this vendor
      const vendorRef = await this.baseService.getEntityReference('vendor', vendorName);
      if (vendorRef && vendorRef.qbo_entity_id) {
        console.log("Found existing vendor reference:", vendorRef.qbo_entity_id);
        
        // Get the vendor details from QBO
        const response = await this.baseService.makeDataOperation({
          accessToken: connection.access_token,
          realmId: connection.company_id,
          endpoint: `vendor/${vendorRef.qbo_entity_id}`,
          method: "get"
        });
        
        return {
          success: true,
          data: response.Vendor
        };
      }
      
      // Use the Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: {
          query: `SELECT * FROM Vendor WHERE DisplayName = '${vendorName}'`
        }
      });
      
      const vendors = response.QueryResponse?.Vendor || [];
      
      if (vendors.length > 0) {
        console.log("Found existing vendor in QBO:", vendors[0].Id);
        
        // Store the reference for future use
        await this.baseService.storeEntityReference('vendor', vendorName, vendors[0].Id);
        
        return {
          success: true,
          data: vendors[0]
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error("Error finding QBO vendor:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a vendor in QBO
   */
  async createVendor(vendorData: any) {
    try {
      console.log("Creating vendor in QBO using Edge Function...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Using connection:", connection.id, "company:", connection.company_id);
      
      // Use the Edge Function for the create operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "vendor",
        method: "post",
        data: vendorData
      });
      
      console.log("Vendor created successfully:", response.Vendor);
      
      return {
        success: true,
        data: response.Vendor
      };
    } catch (error) {
      console.error("Error creating QBO vendor:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find a customer in QBO by name
   */
  async findCustomer(customerName: string) {
    try {
      console.log("Looking up customer in QBO by name:", customerName);
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // First, check if we already have a reference to this customer
      const customerRef = await this.baseService.getEntityReference('customer', customerName);
      if (customerRef && customerRef.qbo_entity_id) {
        console.log("Found existing customer reference:", customerRef.qbo_entity_id);
        
        // Get the customer details from QBO
        const response = await this.baseService.makeDataOperation({
          accessToken: connection.access_token,
          realmId: connection.company_id,
          endpoint: `customer/${customerRef.qbo_entity_id}`,
          method: "get"
        });
        
        return {
          success: true,
          data: response.Customer
        };
      }
      
      // Use the Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: {
          query: `SELECT * FROM Customer WHERE DisplayName = '${customerName}'`
        }
      });
      
      const customers = response.QueryResponse?.Customer || [];
      
      if (customers.length > 0) {
        console.log("Found existing customer in QBO:", customers[0].Id);
        
        // Store the reference for future use
        await this.baseService.storeEntityReference('customer', customerName, customers[0].Id);
        
        return {
          success: true,
          data: customers[0]
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error("Error finding QBO customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find a customer in QBO by email
   */
  async findCustomerByEmail(email: string) {
    try {
      console.log("Looking up customer by email in QBO:", email);
      
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      // Use the Edge Function for the query operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "query",
        method: "get",
        data: {
          query: `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
        }
      });
      
      const customers = response.QueryResponse?.Customer || [];
      
      if (customers.length > 0) {
        console.log("Found existing customer in QBO:", customers[0].Id);
        return {
          success: true,
          data: customers[0]
        };
      }
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error("Error finding QBO customer:", error);
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
      console.log("Creating customer in QBO using Edge Function...");
      const connection = await this.baseService.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      console.log("Using connection:", connection.id, "company:", connection.company_id);
      
      // Use the Edge Function for the create operation
      const response = await this.baseService.makeDataOperation({
        accessToken: connection.access_token,
        realmId: connection.company_id,
        endpoint: "customer",
        method: "post",
        data: customerData
      });
      
      console.log("Customer created successfully:", response.Customer);
      
      return {
        success: true,
        data: response.Customer
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
