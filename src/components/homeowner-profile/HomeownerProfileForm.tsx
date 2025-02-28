
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BasicProfileFields } from "./components/BasicProfileFields";
import { GCProfileFields } from "./components/GCProfileFields";
import { ProfileDisplay } from "./components/ProfileDisplay";
import { profileSchema, type ProfileFormValues, type Profile } from "./types";
import { v4 as uuidv4 } from "uuid";

interface HomeownerProfileFormProps {
  profile: Profile;
  isEditing: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function HomeownerProfileForm({ profile, isEditing, onCancel, onSave }: HomeownerProfileFormProps) {
  const { toast } = useToast();
  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data.role;
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      address: profile.address || "",
      phone_number: profile.phone_number || "",
      bio: profile.bio || "",
      company_name: profile.company_name || "",
      license_number: profile.license_number || "",
      website: profile.website || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Only GC roles (gc_admin or project_manager) need GC account IDs
      // platform_admin users don't need GC account IDs as they're company employees
      const isGCRole = userRole === "gc_admin" || userRole === "project_manager";
      const updatedData = { ...data };

      // Generate a GC account ID if a company name is provided and user is in a GC role
      if (isGCRole && data.company_name && !profile.gc_account_id) {
        // Generate a unique ID for the GC account
        const gc_account_id = `gc_${uuidv4().substring(0, 8)}`;
        updatedData.gc_account_id = gc_account_id;
        
        console.log("Generated new GC account ID:", gc_account_id);
      }

      // Update the profile with the new data
      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", profile.id);

      if (error) throw error;

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
    return <ProfileDisplay profile={profile} userRole={userRole} />;
  }

  // Show GCProfileFields for GC roles only (not for platform_admin or homeowner)
  const shouldShowGCFields = userRole === "gc_admin" || userRole === "project_manager";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
        <BasicProfileFields form={form} email={profile.email} />
        {shouldShowGCFields && <GCProfileFields form={form} />}
        
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
