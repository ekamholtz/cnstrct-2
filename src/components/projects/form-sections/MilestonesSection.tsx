import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { ProjectFormValues } from "../types";
import { useEffect } from "react";

interface MilestonesSectionProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function MilestonesSection({ form }: MilestonesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  // Watch all milestone amounts for changes
  const milestoneAmounts = fields.map((_, index) => 
    form.watch(`milestones.${index}.amount`)
  );

  // Calculate total and update contract value whenever any milestone amount changes
  useEffect(() => {
    const total = milestoneAmounts.reduce((sum, amount) => 
      sum + (Number(amount) || 0), 0
    );
    
    form.setValue("totalContractValue", total.toString(), {
      shouldValidate: true
    });
  }, [milestoneAmounts, form]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Milestones</h3>
      
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

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => append({ name: "", description: "", amount: "" })}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Milestone
      </Button>
    </div>
  );
}