
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

  const onSubmit = async (formData: ProfileCompletionFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // First, check if there's an existing client with this email
      const { data: existingClient, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (clientError) {
        console.error("Error checking existing client:", clientError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check client information. Please try again.",
        });
        return;
      }

      // If we found a matching client, update their user_id
      if (existingClient) {
        const { error: updateClientError } = await supabase
          .from('clients')
          .update({ user_id: user.id })
          .eq('id', existingClient.id);

        if (updateClientError) {
          console.error("Error linking client:", updateClientError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to link client account. Please try again.",
          });
          return;
        }
      }

      // Transform form data to match database schema
      const profileData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        address: formData.address,
        has_completed_profile: true
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        console.error("Error updating profile:", error);
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

      // Immediately route to the appropriate dashboard based on user role
      if (userRole === 'homeowner') {
        navigate('/client-dashboard');
      } else if (userRole === 'general_contractor' || userRole === 'gc_admin') {
        navigate('/dashboard');
      } else {
        // Default to client dashboard if role is unclear
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
