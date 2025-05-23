
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { profileSchema, type ProfileFormValues, type Profile } from "./types";
import { v4 as uuidv4 } from "uuid";
import { mapUserRoleToUIRole } from "@/hooks/useTeamMembers";
import { UserRole } from "@/components/admin/users/types";
import { useQuery } from "@tanstack/react-query";
import { BasicProfileFields } from "./components/BasicProfileFields";
import { GCProfileFields } from "./components/GCProfileFields";
import { ProfileDisplay } from "./components/ProfileDisplay";

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
      const uiRole = mapUserRoleToUIRole(userRole as UserRole);
      const isGCRole = uiRole === "project_manager";
      const updatedData = { ...data };

      console.log("Form submission - User role:", userRole);
      console.log("UI Role:", uiRole);
      console.log("Is GC Role:", isGCRole);
      console.log("Has company name:", !!data.company_name);
      console.log("Existing GC account ID:", profile.gc_account_id);

      if (isGCRole && data.company_name) {
        if (!profile.gc_account_id) {
          try {
            const gc_account_id = uuidv4();
            console.log("Generated new GC account ID:", gc_account_id);
            updatedData.gc_account_id = gc_account_id;
          } catch (gcError) {
            console.error("Error creating GC account:", gcError);
            throw new Error("Failed to create GC account. Please try again.");
          }
        } else {
          updatedData.gc_account_id = profile.gc_account_id;
          console.log("Preserving existing GC account ID:", profile.gc_account_id);
        }
      } else if (!isGCRole) {
        updatedData.gc_account_id = null;
        console.log("Setting gc_account_id to null for non-GC role");
      }

      console.log("Profile update data:", updatedData);

      const { error, data: updatedProfile } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", profile.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Profile update successful. Updated profile:", updatedProfile);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      onSave();
    } catch (error: any) {
      console.error("Profile update error:", error);
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

  const shouldShowGCFields = mapUserRoleToUIRole(userRole as UserRole) === "project_manager";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
        <BasicProfileFields form={form} email={profile.email || 'Email not available'} />
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
