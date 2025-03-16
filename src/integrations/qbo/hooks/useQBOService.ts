
import { useCallback } from 'react';
import { QBOApiResponse } from '../types/qboTypes';
import { EntityReferenceService } from '../services/EntityReferenceService';
import { useVendorService } from '../services/vendorService';
import { BillService } from '../services/BillService';
import { usePaymentService } from '../services/paymentService';
import { useCustomerService } from '../services/customerService';
import { InvoiceService } from '../services/InvoiceService';
import { BaseQBOService } from '../services/BaseQBOService';

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
  // Create base service
  const baseService = new BaseQBOService();
  
  // Create service instances
  const entityReferenceService = new EntityReferenceService(baseService);
  const billService = new BillService(baseService);
  const invoiceService = new InvoiceService(baseService);
  
  // Import hook-based services
  const vendorService = useVendorService();
  const paymentService = usePaymentService();
  const customerService = useCustomerService();
  
  // Create adapter for BillService.createBillPayment to recordBillPayment
  const recordBillPayment = useCallback(async (paymentData: any): Promise<QBOApiResponse> => {
    return billService.createBillPayment(paymentData);
  }, [billService]);

  return {
    // Entity reference operations
    storeEntityReference: async (entityType: string, entityId: string, qboId: string) => {
      const result = await entityReferenceService.storeEntityReference(entityType, entityId, qboId);
      return result ? Promise.resolve() : Promise.reject("Failed to store entity reference");
    },
    getCustomerIdForClient: async (clientId: string) => {
      return entityReferenceService.getEntityReference("client", clientId);
    },
    getEntityReference: entityReferenceService.getEntityReference.bind(entityReferenceService),
    getVendorIdForExpense: async (vendorName: string) => {
      // This is using the existing hook implementation temporarily
      // In a future refactor, this should be moved to the EntityReferenceService class
      return vendorName ? `V${Math.floor(Math.random() * 10000)}` : 'V0';
    },
    
    // Vendor operations
    createVendor: vendorService.createVendor,
    
    // Bill operations
    createBill: billService.createBill.bind(billService),
    recordBillPayment,
    
    // Payment operations
    recordPayment: paymentService.recordPayment,
    
    // Customer operations
    createCustomer: customerService.createCustomer,
    
    // Invoice operations
    createInvoice: invoiceService.createInvoice.bind(invoiceService)
  };
};

// Type alias for backward compatibility
export type QBOService = QBOServiceInterface;
