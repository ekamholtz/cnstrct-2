
import { useQuery } from "@tanstack/react-query";
import { QBOService } from "@/integrations/qbo/qboService";
import { QBOMappingService } from "@/integrations/qbo/mapping";

export function useQBOAccounts(accountType?: string) {
  const qboService = new QBOService();
  const mappingService = new QBOMappingService();
  
  return useQuery({
    queryKey: ['qbo-accounts', accountType],
    queryFn: async () => {
      try {
        const accounts = await qboService.getAccounts(accountType);
        return mappingService.mapAccountsToSelectOptions(accounts);
      } catch (error) {
        console.error("Error fetching QBO accounts:", error);
        throw error;
      }
    },
    enabled: !!accountType,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
