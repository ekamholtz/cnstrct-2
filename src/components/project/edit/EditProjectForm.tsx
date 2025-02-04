import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ProjectFormValues, projectSchema } from "../../projects/types";
import { ClientInformationSection } from "../../projects/form-sections/ClientInformationSection";
import { ProjectDetailsSection } from "../../projects/form-sections/ProjectDetailsSection";
import { MilestonesSection } from "../../projects/form-sections/MilestonesSection";
import { ContractValueSection } from "../../projects/form-sections/ContractValueSection";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface EditProjectFormProps {
  projectId: string;
  initialData: {
    name: string;
    address: string;
    milestones: Array<{
      id: string;
      name: string;
      description: string | null;
      amount: number | null;
    }>;
  };
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectForm({ projectId, initialData, open, onClose, onSuccess }: EditProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Transform initial data to match form structure
  const defaultValues: ProjectFormValues = {
    clientName: "",
    clientAddress: initialData.address,
    clientEmail: "",
    clientPhone: "",
    projectName: initialData.name,
    projectDescription: "",
    totalContractValue: String(initialData.milestones.reduce((sum, m) => sum + (m.amount || 0), 0)),
    milestones: initialData.milestones.map(m => ({
      name: m.name,
      description: m.description || "",
      amount: String(m.amount || 0)
    }))
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Updating project:", projectId, data);

      // Update project details
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          name: data.projectName,
          address: data.clientAddress,
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Delete existing milestones
      const { error: deleteError } = await supabase
        .from("milestones")
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Create new milestones
      const milestonesData = data.milestones.map(milestone => ({
        project_id: projectId,
        name: milestone.name,
        description: milestone.description,
        amount: Number(milestone.amount),
        status: "pending" as const
      }));

      const { error: milestonesError } = await supabase
        .from("milestones")
        .insert(milestonesData);

      if (milestonesError) throw milestonesError;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Edit Project</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <ProjectDetailsSection form={form} />
              <MilestonesSection form={form} />
              <ContractValueSection form={form} />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}