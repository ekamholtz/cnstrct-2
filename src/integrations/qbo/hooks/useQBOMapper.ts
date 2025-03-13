import { useCallback } from 'react';
import { InvoiceMapper } from '../mapping/InvoiceMapper';
import { CustomerVendorMapper } from '../mapping/CustomerVendorMapper';
import { BillMapper } from '../mapping/BillMapper';

/**
 * Hook to provide access to QBO mappers for various entities
 */
export const useQBOMapper = () => {
  // Create mappers
  const invoiceMapper = useCallback(() => new InvoiceMapper(), []);
  const customerVendorMapper = useCallback(() => new CustomerVendorMapper(), []);
  const billMapper = useCallback(() => new BillMapper(), []);
  
  // Return a combined mapper object with all mapping functions
  return {
    // Invoice mapping
    mapInvoiceToInvoice: (...args: Parameters<InvoiceMapper['mapInvoiceToInvoice']>) => 
      invoiceMapper().mapInvoiceToInvoice(...args),
    mapInvoicePaymentToPayment: (...args: Parameters<InvoiceMapper['mapInvoicePaymentToPayment']>) => 
      invoiceMapper().mapInvoicePaymentToPayment(...args),
      
    // Customer/Vendor mapping
    mapClientToCustomer: (...args: any[]) => 
      customerVendorMapper().mapClientToCustomer(...args),
    mapVendorToVendor: (...args: any[]) => 
      customerVendorMapper().mapVendorToVendor(...args),
      
    // Bill mapping
    mapExpenseToBill: (...args: any[]) => 
      billMapper().mapExpenseToBill(...args),
    mapExpensePaymentToBillPayment: (...args: any[]) => 
      billMapper().mapExpensePaymentToBillPayment(...args),
  };
};
