
import { useCallback } from 'react';
import { QBOApiResponse, QBOBillData, QBOBillPaymentData } from '../types/qboTypes';

/**
 * Service for QBO bill operations
 */
export const useBillService = () => {
  /**
   * Create a bill in QBO
   */
  const createBill = useCallback(async (billData: QBOBillData): Promise<QBOApiResponse> => {
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
   * Record a bill payment in QBO
   */
  const recordBillPayment = useCallback(async (paymentData: QBOBillPaymentData): Promise<QBOApiResponse> => {
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

  return {
    createBill,
    recordBillPayment
  };
};
