/**
 * Mapper for converting between CNSTRCT clients/vendors and QuickBooks customers/vendors
 */
export class CustomerVendorMapper {
  /**
   * Maps a CNSTRCT client to a QuickBooks customer
   * @param client The client to map
   * @returns A QuickBooks customer object
   */
  mapClientToCustomer(client: any): any {
    if (!client) return null;
    
    return {
      DisplayName: client.name || 'Unknown Client',
      PrimaryEmailAddr: client.email ? { Address: client.email } : undefined,
      PrimaryPhone: client.phone ? { FreeFormNumber: client.phone } : undefined,
      BillAddr: client.address ? {
        Line1: client.address.line1,
        Line2: client.address.line2,
        City: client.address.city,
        CountrySubDivisionCode: client.address.state,
        PostalCode: client.address.zip,
        Country: client.address.country
      } : undefined
    };
  }

  /**
   * Maps a CNSTRCT vendor to a QuickBooks vendor
   * @param vendor The vendor to map
   * @returns A QuickBooks vendor object
   */
  mapVendorToVendor(vendor: any): any {
    if (!vendor) return null;
    
    return {
      DisplayName: vendor.name || 'Unknown Vendor',
      PrimaryEmailAddr: vendor.email ? { Address: vendor.email } : undefined,
      PrimaryPhone: vendor.phone ? { FreeFormNumber: vendor.phone } : undefined,
      BillAddr: vendor.address ? {
        Line1: vendor.address.line1,
        Line2: vendor.address.line2,
        City: vendor.address.city,
        CountrySubDivisionCode: vendor.address.state,
        PostalCode: vendor.address.zip,
        Country: vendor.address.country
      } : undefined
    };
  }
}
