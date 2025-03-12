
import type { Client } from "@/types/client-types";
import { QBOCustomer } from "./types";

export class CustomerMapper {
  /**
   * Map a client from our platform to a QBO customer
   */
  mapClientToCustomer(client: Client): QBOCustomer {
    // Create a display name for the customer
    const displayName = client.company_name || 
      (client.first_name && client.last_name 
        ? `${client.first_name} ${client.last_name}`
        : client.email);

    // Basic customer data mapping
    const customer: QBOCustomer = {
      DisplayName: displayName
    };

    // Add email if available
    if (client.email) {
      customer.PrimaryEmailAddr = {
        Address: client.email
      };
    }

    // Add address if available
    if (client.address) {
      customer.BillAddr = {
        Line1: client.address.line1,
        Line2: client.address.line2,
        City: client.address.city,
        CountrySubDivisionCode: client.address.state,
        PostalCode: client.address.postal_code,
        Country: client.address.country
      };
    }

    // Add any notes
    if (client.notes) {
      customer.Notes = client.notes;
    }

    return customer;
  }
}
