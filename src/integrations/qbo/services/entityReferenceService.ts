
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for managing QBO entity references
 */
export const useEntityReferenceService = () => {
  /**
   * Store a reference to a QBO entity
   */
  const storeEntityReference = useCallback(async (
    entityType: string, 
    entityId: string, 
    qboId: string
  ) => {
    // Check if reference already exists
    const { data: existingRef } = await supabase
      .from('qbo_references')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle();
    
    if (existingRef) {
      // Update existing reference
      await supabase
        .from('qbo_references')
        .update({ qbo_id: qboId, updated_at: new Date().toISOString() })
        .eq('id', existingRef.id);
    } else {
      // Create new reference
      await supabase
        .from('qbo_references')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          qbo_id: qboId
        });
    }
    
    // Log the sync
    await supabase
      .from('qbo_sync_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        qbo_id: qboId,
        sync_type: 'create',
        sync_status: 'success'
      });
  }, []);

  /**
   * Get customer ID for a client
   */
  const getCustomerIdForClient = useCallback(async (clientId: string): Promise<string | null> => {
    try {
      // Check if we have a reference to this client in QBO
      const { data } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', 'client')
        .eq('entity_id', clientId)
        .maybeSingle();
      
      return data?.qbo_id || null;
    } catch (error) {
      console.error('Error getting customer ID for client:', error);
      return null;
    }
  }, []);

  /**
   * Get entity reference from QBO
   */
  const getEntityReference = useCallback(async (entityType: string, entityId: string): Promise<string | null> => {
    try {
      // Check if we have a reference to this entity in QBO
      const { data } = await supabase
        .from('qbo_references')
        .select('qbo_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();
      
      return data?.qbo_id || null;
    } catch (error) {
      console.error(`Error getting ${entityType} reference:`, error);
      return null;
    }
  }, []);

  /**
   * Get vendor ID for an expense
   */
  const getVendorIdForExpense = useCallback(async (vendorName: string): Promise<string> => {
    try {
      // In a real implementation, we would check if the vendor exists in QBO
      // For this mock implementation, we'll just return a mocked ID
      return `V${Math.floor(Math.random() * 10000)}`;
    } catch (error) {
      console.error('Error getting vendor ID for expense:', error);
      return 'V0'; // Default fallback
    }
  }, []);

  return {
    storeEntityReference,
    getCustomerIdForClient,
    getEntityReference,
    getVendorIdForExpense
  };
};
