import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { ProjectFormValues } from "../types";

interface ProjectDetailsSectionProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function ProjectDetailsSection({ form }: ProjectDetailsSectionProps) {
  return (
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
  );
}