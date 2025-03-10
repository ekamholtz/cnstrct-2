
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { createQBOReference, findQBOReference, logQBOSync } from "@/services/qboService";
import { useQBOConnection } from "./useQBOConnection";

export const useQBOEntities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { qboConnection, isConnected } = useQBOConnection();

  // Map a local entity to a QBO entity
  const mapEntityToQBO = useMutation({
    mutationFn: async (mapData: {
      local_entity_id: string;
      local_entity_type: string;
      qbo_entity_id: string;
      qbo_entity_type: string;
    }) => {
      if (!qboConnection) throw new Error("Not connected to QBO");

      const reference = await createQBOReference({
        qbo_company_id: qboConnection.company_id,
        local_entity_id: mapData.local_entity_id,
        local_entity_type: mapData.local_entity_type,
        qbo_entity_id: mapData.qbo_entity_id,
        qbo_entity_type: mapData.qbo_entity_type
      });

      // Log the mapping action
      await logQBOSync({
        qbo_reference_id: reference.id,
        action: `map_${mapData.local_entity_type}_to_${mapData.qbo_entity_type}`,
        status: 'success',
        payload: mapData
      });

      return reference;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Entity Mapped",
        description: `Successfully mapped ${variables.local_entity_type} to QBO ${variables.qbo_entity_type}`,
      });
      queryClient.invalidateQueries({ 
        queryKey: ['qbo-reference', variables.local_entity_type, variables.local_entity_id] 
      });
    },
    onError: (error) => {
      console.error("Error mapping entity to QBO:", error);
      toast({
        variant: "destructive",
        title: "Mapping Failed",
        description: "Failed to map entity to QuickBooks Online",
      });
    }
  });

  // Fetch QBO reference for a local entity
  const useQBOReference = (local_entity_id?: string, local_entity_type?: string) => {
    return useQuery({
      queryKey: ['qbo-reference', local_entity_type, local_entity_id],
      queryFn: async () => {
        if (!local_entity_id || !local_entity_type || !isConnected) return null;
        
        try {
          return await findQBOReference({
            local_entity_id,
            local_entity_type
          });
        } catch (error) {
          console.error("Error fetching QBO reference:", error);
          return null;
        }
      },
      enabled: !!local_entity_id && !!local_entity_type && isConnected
    });
  };

  return {
    mapEntityToQBO: mapEntityToQBO.mutate,
    isMappingEntity: mapEntityToQBO.isPending,
    useQBOReference,
    isConnected
  };
};
