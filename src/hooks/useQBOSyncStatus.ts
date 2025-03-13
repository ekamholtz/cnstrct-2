import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if an entity has been synced to QuickBooks Online
 */
export const useQBOSyncStatus = (entityType: string, entityId: string | null) => {
  const [isSynced, setIsSynced] = useState(false);
  const [qboId, setQboId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkSyncStatus = async () => {
      if (!entityId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('qbo_references')
          .select('qbo_id')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .single();
        
        if (error) {
          // If the error is a 'not found' error, it means the entity is not synced
          if (error.code === 'PGRST116') {
            setIsSynced(false);
            setQboId(null);
          } else {
            throw error;
          }
        } else {
          setIsSynced(!!data?.qbo_id);
          setQboId(data?.qbo_id || null);
        }
      } catch (err) {
        console.error('Error checking QBO sync status:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsSynced(false);
        setQboId(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSyncStatus();
  }, [entityType, entityId]);

  return { isSynced, qboId, isLoading, error };
};
