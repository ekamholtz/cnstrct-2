
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const profileCompletionSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  phoneNumber: z.string().min(5, {
    message: "Please enter a valid phone number.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
});

export type ProfileCompletionFormValues = z.infer<typeof profileCompletionSchema>;

export const useProfileCompletion = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ProfileCompletionFormValues>({
    resolver: zodResolver(profileCompletionSchema),
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        setUserRole(data?.role);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const linkClientToUser = async (userEmail: string, userId: string) => {
    const normalizedEmail = userEmail.toLowerCase();
    console.log("Attempting to link client for email:", normalizedEmail);
    
    // Try case-sensitive first
    let { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    // If no match, try case-insensitive
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
      console.log("No existing client found for email:", normalizedEmail);
      return null;
    }

    if (existingClient.user_id === userId) {
      console.log("Client already linked to this user");
      return existingClient;
    }

    console.log("Found existing client, attempting to link:", existingClient);

    // Update both the user_id and normalize the email while we're at it
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({ 
        user_id: userId,
        email: normalizedEmail,
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

  const onSubmit = async (formData: ProfileCompletionFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found");
        navigate('/auth');
        return;
      }

      console.log("Starting profile completion for user:", user.email);

      // First try to link the client
      try {
        const linkedClient = await linkClientToUser(user.email!, user.id);
        console.log("Client linking result:", linkedClient);
      } catch (error) {
        console.error("Error in client linking:", error);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Could not link existing client account. Please contact support.",
        });
      }

      // Transform form data to match database schema
      const profileData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        address: formData.address,
        has_completed_profile: true,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile. Please try again.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Route based on user role
      if (userRole === 'homeowner') {
        navigate('/client-dashboard');
      } else if (userRole === 'general_contractor' || userRole === 'gc_admin') {
        navigate('/dashboard');
      } else {
        navigate('/client-dashboard');
      }

    } catch (error) {
      console.error("Error during form submission:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return {
    form,
    userRole,
    onSubmit,
  };
};
