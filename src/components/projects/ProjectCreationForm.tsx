import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save } from "lucide-react";
import { useState } from "react";
import { ProjectFormValues, projectSchema } from "./types";
import { ClientInformationSection } from "./form-sections/ClientInformationSection";
import { ProjectDetailsSection } from "./form-sections/ProjectDetailsSection";
import { MilestonesSection } from "./form-sections/MilestonesSection";
import { ContractValueSection } from "./form-sections/ContractValueSection";
import { DialogClose } from "@/components/ui/dialog";
import { useProjectCreation } from "@/hooks/useProjectCreation";

export default function ProjectCreationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject } = useProjectCreation(onSuccess);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientName: "",
      clientAddress: "",
      clientEmail: "",
      clientPhone: "",
      projectName: "",
      projectDescription: "",
      totalContractValue: "",
      milestones: [{ name: "", description: "", amount: "" }],
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    const success = await createProject(data);
    setIsSubmitting(false);
    
    if (success) {
      // Trigger dialog close
      const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ClientInformationSection form={form} />
        <ProjectDetailsSection form={form} />
        <MilestonesSection form={form} />
        <ContractValueSection form={form} />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Create Project
        </Button>
        <DialogClose className="hidden" />
      </form>
    </Form>
  );
}