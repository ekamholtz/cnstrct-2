
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
      const { error } = await supabase
        .from("profiles")
        .update(data)
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
        <BasicProfileFields form={form} email={profile.email} />
        {userRole === "gc_admin" && <GCProfileFields form={form} />}
        
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
