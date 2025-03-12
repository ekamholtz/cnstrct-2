
import { useQuery } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";

export function useQBOAccounts(accountType?: string) {
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  const queryResult = useQuery({
    queryKey: ['qbo-accounts', accountType],
    queryFn: async () => {
      try {
        const response = await qboService.getAccounts(accountType || 'Expense');
        if (!response.success) {
          throw new Error(response.error);
        }
        return mappingService.mapAccountsToSelectOptions(response.data);
      } catch (error) {
        console.error("Error fetching QBO accounts:", error);
        throw error;
      }
    },
    enabled: !!accountType,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Add the accounts property to the query result for easier access
  return {
    ...queryResult,
    accounts: queryResult.data || []
  };
}
