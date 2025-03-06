
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
import { useProjectCreation } from "@/hooks/useProjectCreation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { useUserRole } from "@/hooks/profile/useUserRole";

export default function ProjectCreationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { createProject } = useProjectCreation();
  const userRole = useUserRole();

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
      setOpen(false);
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details below to create a new project.
            {userRole && (
              <div className="mt-2 text-yellow-600">
                Note: You will be automatically assigned as the Project Manager.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-180px)]">
          <div className="pr-6">
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
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
