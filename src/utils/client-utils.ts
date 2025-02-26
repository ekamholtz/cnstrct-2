
import type { UseFormReturn } from "react-hook-form";
import type { ProfileCompletionFormValues } from "@/hooks/profile/useProfileForm";
import { supabase } from "@/integrations/supabase/client";

export const linkClientToUser = async (
  userEmail: string, 
  userId: string,
  form: UseFormReturn<ProfileCompletionFormValues>
) => {
  const normalizedEmail = userEmail.toLowerCase();
  console.log("Attempting to link client for email:", normalizedEmail);
  
  let { data: existingClient, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!existingClient) {
    console.log("No exact match found, trying case-insensitive search");
    const { data: allClients, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .ilike('email', normalizedEmail);

    if (checkError) {
      console.error("Error in case-insensitive search:", checkError);
    } else if (allClients && allClients.length > 0) {
      console.log("Found clients with case-insensitive match:", allClients);
      existingClient = allClients[0];
    }
  }

  if (clientError) {
    console.error("Error checking existing client:", clientError);
    throw new Error("Failed to check client information");
  }

  if (!existingClient) {
    console.log("No existing client found, creating new client");
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        email: normalizedEmail,
        user_id: userId,
        name: form.getValues().fullName,
        address: form.getValues().address,
        phone_number: form.getValues().phoneNumber,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating new client:", createError);
      throw new Error("Failed to create new client");
    }

    return newClient;
  }

  if (existingClient.user_id === userId) {
    console.log("Client already linked to this user");
    return existingClient;
  }

  console.log("Found existing client, attempting to link:", existingClient);

  const { data: updatedClient, error: updateError } = await supabase
    .from('clients')
    .update({ 
      user_id: userId,
      email: normalizedEmail,
      name: form.getValues().fullName,
      address: form.getValues().address,
      phone_number: form.getValues().phoneNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingClient.id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating client:", updateError);
    throw new Error(`Failed to link client account: ${updateError.message}`);
  }

  console.log("Successfully linked client. Updated record:", updatedClient);
  return updatedClient;
};
