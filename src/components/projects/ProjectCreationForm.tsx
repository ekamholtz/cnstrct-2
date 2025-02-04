import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const milestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().min(1, "Milestone description is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
});

const projectSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().optional(),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  totalContractValue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Total contract value must be a positive number",
  }),
  milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
}).refine((data) => {
  const totalMilestones = data.milestones.reduce((sum, milestone) => 
    sum + Number(milestone.amount), 0
  );
  return Math.abs(Number(data.totalContractValue) - totalMilestones) < 0.01;
}, {
  message: "Total contract value must equal the sum of milestone amounts",
  path: ["totalContractValue"],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsSubmitting(true);

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([{
          name: data.projectName,
          address: data.clientAddress,
          status: "active",
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Create milestones
      const milestonesData = data.milestones.map(milestone => ({
        project_id: project.id,
        name: milestone.name,
        description: milestone.description,
        amount: Number(milestone.amount),
        status: "pending",
      }));

      const { error: milestonesError } = await supabase
        .from("milestones")
        .insert(milestonesData);

      if (milestonesError) throw milestonesError;

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
        {/* Client Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 555-5555" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Project Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Project Details</h3>
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter project description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Milestones Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Milestones</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", description: "", amount: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Milestone {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`milestones.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Milestone Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter milestone name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`milestones.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter milestone description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Contract Value Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contract Value</h3>
          <FormField
            control={form.control}
            name="totalContractValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Contract Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter total contract value"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </form>
    </Form>
  );
}