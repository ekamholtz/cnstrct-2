import { useState, useEffect } from "react";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mappingService";

interface QBOAccountOption {
  label: string;
  value: string;
  type: string;
  subType: string;
}

interface UseQBOAccountsResult {
  accounts: QBOAccountOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useQBOAccounts(accountType?: string): UseQBOAccountsResult {
  const [accounts, setAccounts] = useState<QBOAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const rawAccounts = await qboService.getAccounts(accountType);
      const mappedAccounts = mappingService.mapAccountsToSelectOptions(rawAccounts);
      
      setAccounts(mappedAccounts);
    } catch (err) {
      console.error("Error fetching QBO accounts:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch QBO accounts'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAccounts();
  }, [accountType]);
  
  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts
  };
}
