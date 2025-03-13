import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define the QBO service interface
export interface QBOServiceInterface {
  createVendor: (vendorData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  createBill: (billData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  recordPayment: (paymentData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  recordBillPayment: (paymentData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  storeEntityReference: (entityType: string, entityId: string, qboId: string) => Promise<void>;
  getCustomerIdForClient: (clientId: string) => Promise<string | null>;
  getEntityReference: (entityType: string, entityId: string) => Promise<string | null>;
  getVendorIdForExpense: (vendorName: string) => Promise<string>;
  createCustomer: (customerData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  createInvoice: (invoiceData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

// Use QBOServiceInterface for the return type
export const useQBOService = (): QBOServiceInterface => {
  /**
   * Store a reference to a QBO entity
   */
  const storeEntityReference = useCallback(async (
    entityType: string, 
    entityId: string, 
    qboId: string
  ) => {
    // Check if reference already exists
    const { data: existingRef } = await supabase
      .from('qbo_references')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle();
    
    if (existingRef) {
      // Update existing reference
      await supabase
        .from('qbo_references')
        .update({ qbo_id: qboId, updated_at: new Date().toISOString() })
        .eq('id', existingRef.id);
    } else {
      // Create new reference
      await supabase
        .from('qbo_references')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          qbo_id: qboId
        });
    }
    
    // Log the sync
    await supabase
      .from('qbo_sync_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        qbo_id: qboId,
        sync_type: 'create',
        sync_status: 'success'
      });
  }, []);

  /**
   * Create a vendor in QBO
   */
  const createVendor = useCallback(async (vendorData: any) => {
    try {
      // For development/testing, simulate a successful response
      console.log('Creating vendor in QBO:', vendorData);
      
      // In a real implementation, this would make an API call to QBO
      // For now, we'll simulate a successful response
      const mockResponse = {
        Id: `V${Math.floor(Math.random() * 10000)}`,
        DisplayName: vendorData.DisplayName,
        SyncToken: '0'
      };
      
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('Error creating vendor in QBO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  /**
   * Create a bill in QBO
   */
  const createBill = useCallback(async (billData: any) => {
    try {
      // For development/testing, simulate a successful response
      console.log('Creating bill in QBO:', billData);
      
      // In a real implementation, this would make an API call to QBO
      // For now, we'll simulate a successful response
      const mockResponse = {
        Id: `B${Math.floor(Math.random() * 10000)}`,
        DocNumber: billData.DocNumber || `BILL-${Math.floor(Math.random() * 10000)}`,
        SyncToken: '0'
      };
      
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('Error creating bill in QBO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  /**
   * Record a payment in QBO
   */
  const recordPayment = useCallback(async (paymentData: any) => {
    try {
      // For development/testing, simulate a successful response
      console.log('Recording payment in QBO:', paymentData);
      
      // In a real implementation, this would make an API call to QBO
      // For now, we'll simulate a successful response
      const mockResponse = {
        Id: `P${Math.floor(Math.random() * 10000)}`,
        TotalAmt: paymentData.TotalAmt || paymentData.amount,
        SyncToken: '0'
      };
      
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('Error recording payment in QBO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  /**
   * Record a bill payment in QBO
   */
  const recordBillPayment = useCallback(async (paymentData: any) => {
    try {
      // For development/testing, simulate a successful response
      console.log('Recording bill payment in QBO:', paymentData);
      
      // In a real implementation, this would make an API call to QBO
      // For now, we'll simulate a successful response
      const mockResponse = {
        Id: `BP${Math.floor(Math.random() * 10000)}`,
        TotalAmt: paymentData.TotalAmt || paymentData.amount,
        SyncToken: '0'
      };
      
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('Error recording bill payment in QBO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  /**
   * Get customer ID for a client
   */
  const getCustomerIdForClient = useCallback(async (clientId: string): Promise<string | null> => {
    try {
      // Check if we have a reference to this client in QBO
      const { data } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', 'client')
        .eq('entity_id', clientId)
        .maybeSingle();
      
      return data?.qbo_id || null;
    } catch (error) {
      console.error('Error getting customer ID for client:', error);
      return null;
    }
  }, []);

  /**
   * Get entity reference from QBO
   */
  const getEntityReference = useCallback(async (entityType: string, entityId: string): Promise<string | null> => {
    try {
      // Check if we have a reference to this entity in QBO
      const { data } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();
      
      return data?.qbo_id || null;
    } catch (error) {
      console.error(`Error getting ${entityType} reference:`, error);
      return null;
    }
  }, []);

  /**
   * Get vendor ID for an expense
   */
  const getVendorIdForExpense = useCallback(async (vendorName: string): Promise<string> => {
    try {
      // In a real implementation, we would check if the vendor exists in QBO
      // For this mock implementation, we'll just return a mocked ID
      return `V${Math.floor(Math.random() * 10000)}`;
    } catch (error) {
      console.error('Error getting vendor ID for expense:', error);
      return 'V0'; // Default fallback
    }
  }, []);

  /**
   * Create a customer in QBO
   */
  const createCustomer = useCallback(async (customerData: any) => {
    try {
      // For development/testing, simulate a successful response
      console.log('Creating customer in QBO:', customerData);
      
      // In a real implementation, this would make an API call to QBO
      // For now, we'll simulate a successful response
      const mockResponse = {
        Id: `C${Math.floor(Math.random() * 10000)}`,
        DisplayName: customerData.DisplayName || customerData.FullyQualifiedName,
        SyncToken: '0'
      };
      
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('Error creating customer in QBO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  /**
   * Create an invoice in QBO
   */
  const createInvoice = useCallback(async (invoiceData: any) => {
    try {
      // For development/testing, simulate a successful response
      console.log('Creating invoice in QBO:', invoiceData);
      
      // In a real implementation, this would make an API call to QBO
      // For now, we'll simulate a successful response
      const mockResponse = {
        Id: `I${Math.floor(Math.random() * 10000)}`,
        DocNumber: invoiceData.DocNumber || `INV-${Math.floor(Math.random() * 10000)}`,
        SyncToken: '0'
      };
      
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('Error creating invoice in QBO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  return {
    createVendor,
    createBill,
    recordPayment,
    recordBillPayment,
    storeEntityReference,
    getCustomerIdForClient,
    getEntityReference,
    getVendorIdForExpense,
    createCustomer,
    createInvoice
  };
};

// Type alias for backward compatibility
export type QBOService = QBOServiceInterface;
