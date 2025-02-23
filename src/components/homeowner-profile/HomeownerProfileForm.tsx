
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ProfileViewMode } from "./components/ProfileViewMode";
import { CommonFormFields } from "./components/CommonFormFields";
import { ContractorFormFields } from "./components/ContractorFormFields";
import { profileSchema, type ProfileFormValues } from "./types";

interface HomeownerProfileFormProps {
  profile: any;
  isEditing: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function HomeownerProfileForm({
  profile,
  isEditing,
  onCancel,
  onSave,
}: HomeownerProfileFormProps) {
  const { toast } = useToast();
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data.role;
    },
  });

  // Fetch homeowner data if the user is a homeowner
  const { data: homeownerData } = useQuery({
    queryKey: ["homeowner-data", profile.id],
    queryFn: async () => {
      if (userRole !== 'homeowner') return null;

      const { data, error } = await supabase
        .from("homeowners")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: userRole === 'homeowner'
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      address: homeownerData?.address || "",
      phone_number: homeownerData?.phone || "",
      bio: profile.bio || "",
      company_name: profile.company_name || "",
      license_number: profile.license_number || "",
      website: profile.website || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Update profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          bio: data.bio,
          ...(userRole === 'gc_admin' ? {
            company_name: data.company_name,
            license_number: data.license_number,
            website: data.website,
          } : {})
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update homeowner data if applicable
      if (userRole === 'homeowner') {
        const homeownerUpdate = {
          address: data.address,
          phone: data.phone_number,
          profile_id: profile.id,
          user_id: profile.id // Since profile.id is the user's id
        };

        const { error: homeownerError } = homeownerData
          ? await supabase
              .from("homeowners")
              .update(homeownerUpdate)
              .eq("profile_id", profile.id)
          : await supabase
              .from("homeowners")
              .insert([homeownerUpdate]);

        if (homeownerError) throw homeownerError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      onSave();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    }
  };

  if (!isEditing) {
    return <ProfileViewMode profile={profile} userRole={userRole} homeownerData={homeownerData} />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-white shadow rounded-lg p-6 space-y-6"
      >
        <CommonFormFields form={form} profile={profile} />

        {userRole === "gc_admin" && <ContractorFormFields form={form} />}

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
