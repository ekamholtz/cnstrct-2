
import { useState, useCallback } from 'react';
import { QBOConnection, QBOServiceConfig } from '../types/qboTypes';
import { BaseQBOService } from '../services/BaseQBOService';

// Mock token manager and connection manager until they're properly implemented
const useQBOTokenManager = () => {
  return {
    getAccessToken: async () => 'mock-token',
    refreshAccessToken: async () => 'refreshed-mock-token'
  };
};

const useQBOConnectionManager = () => {
  return {
    getConnection: async (): Promise<QBOConnection | null> => ({
      id: 'mock-id',
      realmId: 'mock-realm'
    })
  };
};

/**
 * Hook for using QBO services
 */
export const useQBOService = (serviceType?: QBOServiceConfig['type']) => {
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
