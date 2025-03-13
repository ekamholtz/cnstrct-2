
import { useCallback } from 'react';
import { QBOApiResponse, QBOInvoiceData } from '../types/qboTypes';

/**
 * Service for QBO invoice operations
 */
export const useInvoiceService = () => {
  /**
   * Create an invoice in QBO
   */
  const createInvoice = useCallback(async (invoiceData: QBOInvoiceData): Promise<QBOApiResponse> => {
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
    createInvoice
  };
};
