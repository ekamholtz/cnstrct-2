
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ExpenseFormData } from "../types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseProjectFieldProps {
  form: UseFormReturn<ExpenseFormData>;
}

export function ExpenseProjectField({ form }: ExpenseProjectFieldProps) {
  const { data: projects = [] } = useQuery({
    queryKey: ['contractor-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('contractor_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  return (
    <FormField
      control={form.control}
      name="project_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
