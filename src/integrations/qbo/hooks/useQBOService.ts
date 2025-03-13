
import { useCallback } from 'react';
import { QBOService } from '../qboServiceProxy'; // Import from proxy version explicitly

// Safeguard to prevent imports from wrong module
// Importing the incorrect module would cause CORS errors
const useCorrectImportGuard = () => {
  if (!QBOService.prototype) {
    throw new Error(
      "Critical Error: QBOService is not properly imported. " +
      "Make sure you're importing from qboServiceProxy.ts and not qboService.ts!"
    );
  }
};

/**
 * Hook to provide access to the QBO service
 * This hook ensures all QBO API calls go through the CORS proxy
 */
export const useQBOService = () => {
  useCorrectImportGuard();
  
  // Create a new instance of the QBO service
  const getQBOService = useCallback(() => {
    console.log("Creating new QBOService instance with CORS proxy support");
    return new QBOService();
  }, []);

  // Return a proxy that creates a new instance for each method call
  return new Proxy({} as QBOService, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return (...args: any[]) => {
          const service = getQBOService();
          console.log(`Calling QBO method via proxy: ${String(prop)} with args:`, JSON.stringify(args));
          const method = service[prop as keyof QBOService] as any;
          if (typeof method === 'function') {
            return method.apply(service, args);
          }
          return method;
        };
      }
      return undefined;
    }
  });
};

// Define the complete QBO service interface
export interface QBOService {
  createVendor: (vendorData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  createBill: (billData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  createCustomer: (customerData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  createInvoice: (invoiceData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  recordPayment: (paymentData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  recordBillPayment: (paymentData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  getAccounts: (accountType?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getVendorIdForExpense: (vendorName: string) => Promise<string>;
  getEntityReference: (entityType: string, entityId: string) => Promise<string | null>;
  storeEntityReference: (entityType: string, entityId: string, qboId: string) => Promise<void>;
  getCustomerIdForClient: (clientId: string) => Promise<string | null>;
}
