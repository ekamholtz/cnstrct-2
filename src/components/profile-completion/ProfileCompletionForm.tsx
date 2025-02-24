
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { profileCompletionSchema } from "@/lib/validations/profile";
import type { ProfileCompletionFormData } from "@/lib/validations/profile";
import { ContractorFormFields } from "./ContractorFormFields";
import { HomeownerFormFields } from "./HomeownerFormFields";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface ProfileCompletionFormProps {
  userRole: UserRole;
  isSubmitting: boolean;
  onSubmit: (data: ProfileCompletionFormData) => void;
}

export const ProfileCompletionForm = ({
  userRole,
  isSubmitting,
  onSubmit
}: ProfileCompletionFormProps) => {
  const form = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      company_name: "",
      address: "",
      license_number: "",
      phone_number: "",
      website: "",
      full_name: "",
    },
    mode: "all"
  });

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {userRole === "gc_admin" || userRole === "project_manager" ? (
          <ContractorFormFields form={form} />
        ) : (
          <HomeownerFormFields form={form} />
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save and Continue"}
        </Button>
      </form>
    </Form>
  );
};
