
import { BaseQBOService } from "./BaseQBOService";

export class CustomerVendorService extends BaseQBOService {
  /**
   * Check if a customer exists in QBO by email
   */
  async findCustomerByEmail(email: string): Promise<any | null> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Query for customer with matching email
      const response = await client.get('/query', {
        params: {
          query: `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
        }
      });
      
      const customers = response.data.QueryResponse.Customer;
      if (!customers || customers.length === 0) {
        return null;
      }
      
      return customers[0];
    } catch (error) {
      console.error("Error finding customer by email:", error);
      throw error;
    }
  }
  
  /**
   * Create a new customer in QBO
   */
  async createCustomer(customerData: any): Promise<any> {
    try {
      const connection = await this.getUserConnection();
      if (!connection) {
        throw new Error("No QBO connection found");
      }
      
      const client = await this.getClient(connection.id, connection.company_id);
      
      // Create the customer
      const response = await client.post('/customer', customerData);
      
      return response.data.Customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }
}
