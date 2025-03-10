
import { supabase } from "@/integrations/supabase/client";

export interface QBOConnection {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface QBOReference {
  id: string;
  user_id: string;
  qbo_company_id: string;
  local_entity_id: string;
  local_entity_type: string;
  qbo_entity_id: string;
  qbo_entity_type: string;
  sync_status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface QBOSyncLog {
  id: string;
  user_id: string;
  qbo_reference_id?: string;
  action: string;
  status: string;
  payload?: any;
  response?: any;
  error_message?: string;
  created_at: string;
}

/**
 * Stores a QBO connection for the authenticated user
 */
export const storeQBOConnection = async (connectionData: {
  company_id: string;
  company_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('qbo_connections')
    .upsert({
      user_id: user.id,
      company_id: connectionData.company_id,
      company_name: connectionData.company_name,
      access_token: connectionData.access_token,
      refresh_token: connectionData.refresh_token,
      expires_at: connectionData.expires_at.toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select();

  if (error) throw error;
  return data;
};

/**
 * Retrieves the user's QBO connection
 */
export const getUserQBOConnection = async (): Promise<QBOConnection | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('qbo_connections')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Creates an entity reference between a local entity and a QBO entity
 */
export const createQBOReference = async (referenceData: {
  qbo_company_id: string;
  local_entity_id: string;
  local_entity_type: string;
  qbo_entity_id: string;
  qbo_entity_type: string;
  sync_status?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('qbo_references')
    .insert({
      user_id: user.id,
      qbo_company_id: referenceData.qbo_company_id,
      local_entity_id: referenceData.local_entity_id,
      local_entity_type: referenceData.local_entity_type,
      qbo_entity_id: referenceData.qbo_entity_id,
      qbo_entity_type: referenceData.qbo_entity_type,
      sync_status: referenceData.sync_status || 'synced'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Finds a QBO reference for a local entity
 */
export const findQBOReference = async (params: {
  local_entity_id: string;
  local_entity_type: string;
}): Promise<QBOReference | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('qbo_references')
    .select('*')
    .eq('user_id', user.id)
    .eq('local_entity_id', params.local_entity_id)
    .eq('local_entity_type', params.local_entity_type)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Log a QBO sync action
 */
export const logQBOSync = async (logData: {
  qbo_reference_id?: string;
  action: string;
  status: string;
  payload?: any;
  response?: any;
  error_message?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('qbo_sync_logs')
    .insert({
      user_id: user.id,
      qbo_reference_id: logData.qbo_reference_id,
      action: logData.action,
      status: logData.status,
      payload: logData.payload,
      response: logData.response,
      error_message: logData.error_message
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
