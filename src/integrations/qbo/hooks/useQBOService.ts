
import { useState, useEffect } from 'react';
import { useQBOConnection } from '@/hooks/useQBOConnection';
import { BaseQBOService } from '../services/BaseQBOService';
import { AccountService } from '../services/AccountService';
import { EntityReferenceService } from '../services/EntityReferenceService';
import { BillService } from '../services/BillService';
import { CustomerVendorService } from '../services/CustomerVendorService';
import { InvoiceService } from '../services/InvoiceService';

export const useQBOService = <T>(serviceType: string) => {
  const [service, setService] = useState<BaseQBOService | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { connection } = useQBOConnection();

  useEffect(() => {
    if (!connection || !connection.company_id) {
      setService(null);
      return;
    }

    try {
      // Create the appropriate service based on serviceType
      let newService: BaseQBOService;

      switch (serviceType) {
        case 'account':
          newService = new AccountService(connection.company_id);
          break;
        case 'entityReference':
          newService = new EntityReferenceService(connection.company_id);
          break;
        case 'bill':
          newService = new BillService(connection.company_id);
          break;
        case 'customer':
        case 'vendor':
          newService = new CustomerVendorService(connection.company_id);
          break;
        case 'invoice':
          newService = new InvoiceService(connection.company_id);
          break;
        default:
          throw new Error(`Unknown QBO service type: ${serviceType}`);
      }

      setService(newService);
    } catch (err) {
      console.error('Error creating QBO service:', err);
      setError(err instanceof Error ? err : new Error('Unknown error creating QBO service'));
    }
  }, [connection, serviceType]);

  return { service, error };
};
