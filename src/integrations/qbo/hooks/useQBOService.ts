
import { useState, useCallback } from 'react';
import { QBOConnection } from '../types/qboTypes';
import { useQBOConnectionManager } from './useQBOConnectionManager';
import { useQBOTokenManager } from './useQBOTokenManager';
import { BaseQBOService } from '../services/BaseQBOService';
import { useEntityReferenceService } from '../services/EntityReferenceService';
import { useBillService } from '../services/BillService';
import { useCustomerVendorService } from '../services/CustomerVendorService';
import { useInvoiceService } from '../services/InvoiceService';

/**
 * Hook for using QBO services
 */
export const useQBOService = () => {
  const [error, setError] = useState<Error | null>(null);
  const { getConnection } = useQBOConnectionManager();
  const { getAccessToken, refreshAccessToken } = useQBOTokenManager();
  
  const createServiceInstance = useCallback(
    async <T extends BaseQBOService>(
      ServiceClass: new (connection: QBOConnection) => T
    ): Promise<T | null> => {
      try {
        const connection = await getConnection();
        if (!connection) {
          throw new Error('QBO connection not found');
        }
        
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('QBO access token not found');
        }
        
        return new ServiceClass(connection);
      } catch (err: any) {
        setError(err);
        return null;
      }
    },
    [getConnection, getAccessToken]
  );
  
  return {
    createServiceInstance,
    error,
    refreshAccessToken
  };
};

/**
 * Hook for QBO entity reference services
 */
export const useQBOEntityReferenceService = () => {
  const { createServiceInstance, error } = useQBOService();
  const entityReferenceService = useEntityReferenceService();
  
  const getService = async () => {
    try {
      return await createServiceInstance(entityReferenceService);
    } catch (err) {
      console.error('Failed to get entity reference service', err);
      return null;
    }
  };
  
  return { getService, error };
};

// Add the rest of the service hooks as needed
