
import type { UseFormReturn } from "react-hook-form";
import type { ProfileCompletionFormValues } from "@/hooks/profile/useProfileForm";
import { supabase as defaultSupabase } from "@/integrations/supabase/client";
import { findClientByEmail } from "@/services/clientService";

// Define a type for the client data to help with TypeScript
interface Client {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  address?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Type for Supabase response
interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

/**
 * Links a client to a user based on email address
 * Prevents duplicate clients by checking for existing email addresses
 * Updates existing clients instead of creating new ones when the email already exists
 * 
 * @param userId - The user ID to link the client to
 * @param userEmail - The email address to search for
 * @param supabaseClient - Optional supabase client instance (uses default if not provided)
 */
export const linkClientToUser = async (
  userId: string,
  userEmail: string,
  supabaseClient = defaultSupabase
) => {
  // Normalize email to lowercase and trim whitespace to ensure consistent matching
  const normalizedEmail = userEmail.toLowerCase().trim();
  console.log("Attempting to link client for email:", normalizedEmail, "to user:", userId);
  
  try {
    // Use the service method to find an existing client
    const existingClient = await findClientByEmail(normalizedEmail);

    // If we found any clients with this email
    if (existingClient) {
      console.log("Found existing client with this email:", existingClient.id);
      
      // Check if the client is already linked to this user
      if (existingClient.user_id === userId) {
        console.log("Client is already linked to this user");
        return existingClient;
      }
      
      // Update the existing client to link it to this user
      const { data: updatedClient, error: updateError } = await supabaseClient
        .from('clients')
        .update({ user_id: userId })
        .eq('id', existingClient.id)
        .select().single();
        
      if (updateError) {
        console.error("Error updating client:", updateError);
        throw new Error("Failed to link client to your account");
      }
      
      console.log("Successfully linked existing client to user");
      return updatedClient;
    }
    
    // No existing client found, create a new one
    console.log("No existing client found, creating new client record");
    
    // Get user's profile for additional information
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, phone_number, address')
      .eq('id', userId)
      .single();
    
    // Create a new client record
    const { data: newClient, error: createError } = await supabaseClient
      .from('clients')
      .insert([
        { 
          email: normalizedEmail,
          user_id: userId,
          name: userProfile?.full_name || normalizedEmail.split('@')[0],
          phone_number: userProfile?.phone_number,
          address: userProfile?.address
        }
      ])
      .select()
      .single();
      
    if (createError) {
      console.error("Error creating client:", createError);
      throw new Error("Failed to create client record");
    }
    
    console.log("Successfully created new client:", newClient.id);
    return newClient;
    
  } catch (error) {
    console.error("Error in linkClientToUser:", error);
    throw error;
  }
};

/**
 * Original function kept for backward compatibility
 * @deprecated Use the new linkClientToUser function instead
 */
export const linkClientToUserOld = async (
  userEmail: string, 
  userId: string,
  form: UseFormReturn<ProfileCompletionFormValues>
) => {
  // Call the new function with the parameters rearranged
  return linkClientToUser(userId, userEmail);
};
