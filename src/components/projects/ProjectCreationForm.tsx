import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ProjectFormValues, projectSchema } from "./types";
import { ClientInformationSection } from "./form-sections/ClientInformationSection";
import { ProjectDetailsSection } from "./form-sections/ProjectDetailsSection";
import { MilestonesSection } from "./form-sections/MilestonesSection";
import { ContractValueSection } from "./form-sections/ContractValueSection";

export default function ProjectCreationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
    try {
      setIsSubmitting(true);
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      console.log("Creating project for contractor:", user.id);

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: data.projectName,
          address: data.clientAddress,
          status: "active",
          contractor_id: user.id
        })
        .select()
        .single();

      if (projectError) throw projectError;

      console.log("Project created:", project);

      // Create milestones
      const milestonesData = data.milestones.map(milestone => ({
        project_id: project.id,
        name: milestone.name,
        description: milestone.description,
        amount: Number(milestone.amount),
        status: "pending" as const
      }));

      const { error: milestonesError } = await supabase
        .from("milestones")
        .insert(milestonesData);

      if (milestonesError) throw milestonesError;

      console.log("Milestones created for project:", project.id);

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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
      </form>
    </Form>
  );
}