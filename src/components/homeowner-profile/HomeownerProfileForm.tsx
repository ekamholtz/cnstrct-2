
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CommonFormFields } from "./components/CommonFormFields";
import { ContractorFormFields } from "./components/ContractorFormFields";
import { profileSchema, type ProfileFormValues } from "./types";
import type { Homeowner } from "@/types/homeowner";
import type { Database } from "@/integrations/supabase/types";

interface HomeownerProfileFormProps {
  profile: any;
  userRole: string;
  onProfileUpdated: () => void;
}

export function HomeownerProfileForm({ profile, userRole, onProfileUpdated }: HomeownerProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      company_name: profile.company_name || "",
      license_number: profile.license_number || "",
      phone_number: "",
      address: "",
      website: profile.website || "",
      bio: profile.bio || "",
    },
  });

  // Fetch homeowner data if applicable
  const { data: homeownerData } = useQuery({
    queryKey: ['homeowner-profile', profile.id],
    queryFn: async () => {
      if (userRole !== 'homeowner') return null;

      const { data, error } = await supabase
        .from('homeowners')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as Homeowner | null;
    },
    enabled: userRole === 'homeowner'
  });

  // Update form when homeowner data is loaded
  useEffect(() => {
    if (homeownerData) {
      form.setValue("address", homeownerData.address || "");
      form.setValue("phone_number", homeownerData.phone || "");
    }
  }, [homeownerData, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          company_name: data.company_name,
          license_number: data.license_number,
          website: data.website,
          bio: data.bio,
          has_completed_profile: true,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update homeowner data if applicable
      if (userRole === 'homeowner') {
        const homeownerUpdate: Database['public']['Tables']['homeowners']['Insert'] = {
          address: data.address,
          phone: data.phone_number,
          profile_id: profile.id,
          user_id: profile.id
        };

        if (homeownerData) {
          const { error: homeownerError } = await supabase
            .from('homeowners')
            .update(homeownerUpdate)
            .eq('profile_id', profile.id);

          if (homeownerError) throw homeownerError;
        } else {
          const { error: homeownerError } = await supabase
            .from('homeowners')
            .insert([homeownerUpdate]);

          if (homeownerError) throw homeownerError;
        }
      }

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });

      onProfileUpdated();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <CommonFormFields form={form} />
        {userRole !== 'homeowner' && <ContractorFormFields form={form} />}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}
