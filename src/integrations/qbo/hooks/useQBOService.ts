
import { QBOApiResponse } from '../types/qboTypes';
import { useEntityReferenceService } from '../services/EntityReferenceService';
import { useVendorService } from '../services/vendorService';
import { useBillService } from '../services/BillService';
import { usePaymentService } from '../services/paymentService';
import { useCustomerService } from '../services/customerService';
import { useInvoiceService } from '../services/InvoiceService';

// Define the QBO service interface
export interface QBOServiceInterface {
  createVendor: (vendorData: any) => Promise<QBOApiResponse>;
  createBill: (billData: any) => Promise<QBOApiResponse>;
  recordPayment: (paymentData: any) => Promise<QBOApiResponse>;
  recordBillPayment: (paymentData: any) => Promise<QBOApiResponse>;
  storeEntityReference: (entityType: string, entityId: string, qboId: string) => Promise<void>;
  getCustomerIdForClient: (clientId: string) => Promise<string | null>;
  getEntityReference: (entityType: string, entityId: string) => Promise<string | null>;
  getVendorIdForExpense: (vendorName: string) => Promise<string>;
  createCustomer: (customerData: any) => Promise<QBOApiResponse>;
  createInvoice: (invoiceData: any) => Promise<QBOApiResponse>;
}

/**
 * Hook that combines all QBO services
 */
export const useQBOService = (): QBOServiceInterface => {
  // Import all services
  const entityReferenceService = useEntityReferenceService();
  const vendorService = useVendorService();
  const billService = useBillService();
  const paymentService = usePaymentService();
  const customerService = useCustomerService();
  const invoiceService = useInvoiceService();

  return {
    // Entity reference operations
    storeEntityReference: entityReferenceService.storeEntityReference,
    getCustomerIdForClient: entityReferenceService.getCustomerIdForClient,
    getEntityReference: entityReferenceService.getEntityReference,
    getVendorIdForExpense: entityReferenceService.getVendorIdForExpense,
    
    // Vendor operations
    createVendor: vendorService.createVendor,
    
    // Bill operations
    createBill: billService.createBill,
    recordBillPayment: billService.recordBillPayment,
    
    // Payment operations
    recordPayment: paymentService.recordPayment,
    
    // Customer operations
    createCustomer: customerService.createCustomer,
    
    // Invoice operations
    createInvoice: invoiceService.createInvoice
  };
};

// Type alias for backward compatibility
export type QBOService = QBOServiceInterface;
