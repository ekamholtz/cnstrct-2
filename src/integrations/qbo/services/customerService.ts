
import { useCallback } from 'react';
import { QBOApiResponse, QBOCustomerData } from '../types/qboTypes';

/**
 * Service for QBO customer operations
 */
export const useCustomerService = () => {
  /**
   * Create a customer in QBO
   */
  const createCustomer = useCallback(async (customerData: QBOCustomerData): Promise<QBOApiResponse> => {
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

  return {
    createCustomer
  };
};
