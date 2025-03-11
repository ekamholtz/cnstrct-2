
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a client in the database or returns an existing one with matching email
 */
export const createClient = async (clientData: {
  name: string;
  address: string;
  email: string;
  phone_number?: string;
}) => {
  // Normalize email for consistent matching
  const normalizedEmail = clientData.email.toLowerCase().trim();
  
  // First, check if client already exists with this email
  const { data: existingClients, error: searchError } = await supabase
    .from('clients')
    .select('*')
    .ilike('email', normalizedEmail)
    .limit(1);
    
  if (searchError) throw searchError;
  
  // If client exists, return it
  if (existingClients && existingClients.length > 0) {
    console.log('Found existing client with email:', normalizedEmail);
    return existingClients[0];
  }
  
  // No existing client found, create new one
  console.log('Creating new client with email:', normalizedEmail);
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      email: normalizedEmail
    })
    .select()
    .single();

  if (clientError) throw clientError;
  return client;
};

/**
 * Searches for clients by email
 */
export const findClientByEmail = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .ilike('email', normalizedEmail)
    .limit(1);
    
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};
